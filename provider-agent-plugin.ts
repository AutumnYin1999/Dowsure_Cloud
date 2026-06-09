import { loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * 服务商 TermPay（豆分期）成交诊断 Agent 的后端插件。
 *
 * 两个接口：
 *  - /api/provider-agent/diagnose ：意图收集大脑（递进追问 + 槽位收集；字段对齐问卷 schema 枚举）
 *  - /api/provider-agent/report   ：诊断叙事 + TermPay 方案问答（只引用前端引擎算好的金额，AI 不编数字）
 *
 * 规则集中在 PROVIDER_DIAGNOSE_SYSTEM_PROMPT / buildProviderReportMessages 两处。
 * 金额红线：数字只由 src/core/providerEconomics.ts 算，AI 永远不碰数字。
 */
export function providerAgentPlugin(): Plugin {
  return {
    name: "dowsure-deepseek-provider-agent-api",
    configureServer(server) {
      // ── 意图收集大脑 ──
      server.middlewares.use("/api/provider-agent/diagnose", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const apiKey = env.DEEPSEEK_API_KEY;
        if (!apiKey) {
          sendJson(res, 500, { error: "DEEPSEEK_API_KEY is not configured" });
          return;
        }
        try {
          const payload = (await readJsonBody(req)) as DiagnoseRequest;
          const model = env.DEEPSEEK_DIAGNOSE_MODEL || "deepseek-v4-pro";
          const MAX_ATTEMPTS = 3;
          let content: unknown = null;
          let lastError: { status: number; detail: string } | null = null;

          for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const messages = buildProviderDiagnosticMessages(payload);
            if (attempt > 1) {
              messages.push({
                role: "system",
                content:
                  "上一次你没有输出有效内容。请务必只输出一个合法 JSON 对象（以 { 开头、} 结尾），绝不要输出空白、解释或多余文字。",
              });
            }
            const body = JSON.stringify({
              model,
              messages,
              response_format: { type: "json_object" },
              stream: false,
              temperature: attempt === 1 ? 0.6 : 0.9,
              // 提到 1400：facts 对象 + reply 一长，900 容易把 JSON 截断成不可解析。
              // 注意：实测 thinking:{type:"disabled"} 会让 v4-pro 几乎必吐空白（与 flash 相反），故不禁 thinking。
              max_tokens: 1400,
            });

            let response: Response;
            try {
              response = await deepseekFetch(apiKey, body);
            } catch (netErr) {
              lastError = { status: 502, detail: netErr instanceof Error ? netErr.message : String(netErr) };
              if (attempt < MAX_ATTEMPTS) continue;
              break;
            }
            if (!response.ok) {
              lastError = { status: response.status, detail: (await response.text()).slice(0, 500) };
              if (attempt < MAX_ATTEMPTS) continue;
              break;
            }
            const data = await response.json();
            content = data?.choices?.[0]?.message?.content;
            if (extractJsonObject(content)) {
              lastError = null;
              break;
            }
            server.config.logger.warn(
              `[provider-diagnose] 模型返回非 JSON（attempt ${attempt}/${MAX_ATTEMPTS}），${
                attempt < MAX_ATTEMPTS ? "升温重试" : "走脚本兜底"
              }`
            );
          }

          if (lastError && !extractJsonObject(content)) {
            sendJson(res, lastError.status, { error: "DeepSeek request failed", detail: lastError.detail });
            return;
          }
          sendJson(res, 200, safeParseProviderDiagnosis(content, payload));
        } catch (error) {
          sendJson(res, 500, {
            error: "Provider diagnose agent failed",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // ── 诊断叙事 + TermPay 问答 ──
      server.middlewares.use("/api/provider-agent/report", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const apiKey = env.DEEPSEEK_API_KEY;
        if (!apiKey) {
          sendJson(res, 500, { error: "DEEPSEEK_API_KEY is not configured" });
          return;
        }
        try {
          const payload = (await readJsonBody(req)) as ReportRequest;
          const model = env.DEEPSEEK_DIAGNOSE_MODEL || "deepseek-v4-pro";
          const parsed = await requestModelJSON(apiKey, model, buildProviderReportMessages(payload));
          const fb = providerReportFallback(payload);
          if (!parsed) {
            server.config.logger.warn("[provider-report] 模型多次非 JSON，走脚本兜底");
            sendJson(res, 200, fb);
            return;
          }
          sendJson(res, 200, {
            reply:
              typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : fb.reply,
            suggestedReplies: Array.isArray(parsed.suggestedReplies)
              ? parsed.suggestedReplies.slice(0, 4).map((s) => String(s))
              : fb.suggestedReplies,
          });
        } catch (error) {
          sendJson(res, 500, {
            error: "Provider report agent failed",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      });
    },
  };
}

// ──────────────────────── 意图收集大脑 ────────────────────────

interface DiagnoseTurn {
  role: "agent" | "user";
  content: string;
}
interface DiagnoseRequest {
  messages?: DiagnoseTurn[];
  facts?: Record<string, unknown>;
}

/**
 * 服务商 TermPay 诊断 Agent 的系统提示 —— 整个 agent 的灵魂。
 * 字段枚举与 src/schema/questionnaireSchema.ts 对齐；金额由前端引擎算，AI 只收集。
 */
const PROVIDER_DIAGNOSE_SYSTEM_PROMPT = `你是「豆服云」的资深服务商顾问，正在和一位跨境电商服务商聊经营现状。目的：摸清他在「获客 / 回款账期 / 资金融资 / 利润内卷 / 品牌 / 财税合规」哪块最卡，帮他算清现金流，后续看豆服云权益包（含 TermPay 豆分期、AI 智能拓客、品牌营销、融资财税等）能怎么帮他。

# 身份口径
- 自称「豆服云顾问」即可，绝不编人名 / 履历 / 虚构故事。
- 始终是专业、懂行的服务商顾问口吻：称呼对方用「你」或「您」。可以亲和、有温度，但**绝不用「兄弟 / 老铁 / 哥们 / 咱 / 老板」这类称兄道弟、套近乎的字眼**，也不油腻、不卖力讨好。

# 严格要求（很重要）
- 收集阶段只问客观经营信息，语气像懂行的顾问、有温度、不推销；这个阶段**不要**大段介绍 TermPay 或豆服云权益。
- 递进式：一次只聚焦一件事，先问无痛的，回复 1-3 句，口语、不压迫、不念选项清单。
- 用户输入听不懂时，靠 suggestedReplies 给选项。

# 诊断主轴 = primaryPain。先弄清他最想解决哪块，再决定往哪聊——不要默认往账期 / TermPay 上引。
# 必填槽位（先齐这三个就能开始诊断）
1. providerType（服务商类型 / 主营服务类别）。直接填用户选的中文类别原话，例如：海外仓储 / 物流服务 / 供应链全托管 / 跨境收款 / 财税合规 / 海外营销 / 选品工具 / 软件工具 / 全球开店 / 知识产权 / 申诉服务 / 其他
2. primaryPain（他现在最想解决哪块，这是主轴，必须先弄清）。枚举之一：
   - acquisition（获客难 / 客户不精准 / 想要平台背书）
   - receivables（回款慢 / 账期压力 / 坏账风险）
   - cashflow（资金周转紧 / 想融资 / 资本对接）
   - margin（利润薄 / 价格内卷）
   - brand（品牌曝光 / 想做大 / 行业圈层）
   - compliance（财税合规 / 政策红利 / 平台资源对接）
   问这个问题时，suggestedReplies 给 5-6 个覆盖上面主要痛点的中文选项（如「获客太难」「回款账期压力」「资金周转紧」「利润薄内卷」「品牌想做大」「财税 / 合规」）。
3. 月营收量级。优先 monthlyRevenue（原话，如「500万」「年营收6000万」）；否则 companyScale 枚举之一：micro（10人内/营收千万内）/ small（10-50人/千万级）/ medium（50-200人/亿级）/ large（200人+/数亿+）

# 条件槽位 —— 仅当 primaryPain 是 receivables 或 cashflow 时，才追加问这两个（用来算账期压了多少现金）：
4. settlementMode 枚举之一：prepay-full（先款后服务）/ prepay-part（预付部分）/ monthly（月结）/ credit（给账期）
5. creditTerm 枚举之一：none / lte-15 / 30 / 60 / gte-90（先款后服务则填 none）
若 primaryPain 是 acquisition 或 brand，就**不要追问账期**，齐了前三个直接进诊断（那条线不需要账期数字）。

# 可选补充（问到就填，别硬凑）
termDays（账期天数原话）、badDebt（none/few/many/unknown）、cashTightness（easy/normal/tight）、financingPlan（none/debt/equity/exploring）

# 输出规则
- facts 里的字段**必须用上面的英文枚举值**，不要填中文标签；monthlyRevenue / termDays 填用户原话。
- suggestedReplies 用**中文标签**给 2-3 个按钮（例如「给账期」「月结」「先款后服务」），不要读出来。
- 绝不编造任何金额 / 额度 / 价格 / 百分比 / 系数。收集阶段本就不该报数字，需要量化的一律留给后面的诊断引擎。

# 只输出 JSON（不要 Markdown、不要解释）：
{
  "phase": "intake" | "ready_to_diagnose",
  "reply": "你这一轮要对服务商说的话（1-3句中文）",
  "facts": { "providerType": "...", "primaryPain": "...", "companyScale": "...", "monthlyRevenue": "...", "settlementMode": "...", "creditTerm": "...", "termDays": "...", "badDebt": "...", "cashTightness": "...", "financingPlan": "..." },
  "missing": ["还缺哪些必填槽位"],
  "suggestedReplies": ["中文选项1", "中文选项2"]
}
进入 ready_to_diagnose 的条件：providerType、primaryPain、(companyScale 或 monthlyRevenue) 都已知；并且——仅当 primaryPain 是 receivables/cashflow 时——settlementMode 与 creditTerm 也已知。满足后 phase 置为 "ready_to_diagnose"，reply 按主诉求自然过渡（获客→「了解了，我来帮你理理获客这块」；回款/资金→「信息够了，我来帮你算算账期压了多少现金」；品牌→「明白，我来看看品牌增长这块」）。否则 phase 保持 "intake" 继续追问。facts 只填已确认字段，未知的省略。`;

function buildProviderDiagnosticMessages(payload: DiagnoseRequest) {
  const history = Array.isArray(payload?.messages) ? payload.messages : [];
  const facts = payload?.facts ?? {};
  const turns = history.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content ?? ""),
  }));
  return [
    { role: "system", content: PROVIDER_DIAGNOSE_SYSTEM_PROMPT },
    {
      role: "system",
      content: `当前已知事实（facts）：${JSON.stringify(facts)}。请在此基础上增量更新。`,
    },
    ...(turns.length ? turns : [{ role: "user", content: "（服务商刚进来，还没说话，请开场。）" }]),
  ];
}

/** 从模型返回里尽量抠出 JSON 对象。 */
function extractJsonObject(content: unknown): Record<string, unknown> | null {
  if (typeof content !== "string") return null;
  let s = content.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * 确定性文本解析兜底 —— 从用户最新一句话里尽量抠出槽位，不依赖 DeepSeek。
 *
 * 为什么需要它：fact 抽取本来 100% 押在大脑（DeepSeek）身上，大脑偶发空白/截断时会落到
 * scriptedProviderNextStep，而那层只读已有 facts、不解析用户刚说的话 —— 于是「800万」这种
 * 清晰回答被直接丢掉、原样重问。这层保证即使大脑挂了，用户的明确回答也能被接住。
 *
 * 定位：安全网。能稳抠的（数字/枚举关键词）才填，抠不准的不硬猜；大脑成功时大脑的 facts 覆盖它。
 * 字段值对齐 src/core/providerEconomics.ts 的枚举。
 */
function parseProviderFactsFromText(text?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!text) return out;
  const t = text.trim();

  // 月营收 / 年营收：数字 + 货币量级（万 / 百万 / 千万 / 亿）。原话回填，引擎按原话精算。
  // 货币量级（万/亿）与时长单位（天/月/周）不冲突，故「800万」=营收、「3个月」=账期不会混。
  if (/\d+(?:\.\d+)?\s*(亿|千万|百万|万)/.test(t)) {
    out.monthlyRevenue = t;
  }

  // 账期天数：数字 + 天 / 个月 / 周（如「60天」「3个月」）。原话回填，引擎解析成天数。
  if (/\d+(?:\.\d+)?\s*(天|个月|周)/.test(t) || /\d+\s*月(?!营|流)/.test(t)) {
    out.termDays = t;
  }

  // 结算方式（settlementMode 枚举）。给账期类放宽到「给…账期」，覆盖"给客户账期/给他们账期"等。
  if (/先款后服务|先付款|先收钱|款到发货|预付全款|不给账期|不敢给账期/.test(t))
    out.settlementMode = "prepay-full";
  else if (/预付.*部分|部分预付|定金|首付/.test(t)) out.settlementMode = "prepay-part";
  else if (/月结/.test(t)) out.settlementMode = "monthly";
  else if (/给.{0,4}账期|有账期|账期结算|赊账|赊销|放账期/.test(t)) out.settlementMode = "credit";

  // 账期档位（creditTerm 枚举）
  if (/不给账期|先款后服务|没有账期|无账期/.test(t)) out.creditTerm = "none";
  else if (/(90|九十)\s*天?\s*(以上|\+|多)|超过\s*90|大于\s*90|三个月以上/.test(t))
    out.creditTerm = "gte-90";
  else if (/60\s*天|六十天|两个月/.test(t)) out.creditTerm = "60";
  else if (/30\s*天|三十天|一个月/.test(t)) out.creditTerm = "30";
  else if (/15\s*天|十五天|半个月|两周|两个星期/.test(t)) out.creditTerm = "lte-15";

  // 服务商类型（providerType，映射回中文类别原话；只在能明确命中时填）
  const typeMap: [RegExp, string][] = [
    [/海外仓/, "海外仓储"],
    [/头程|物流|货代|运输/, "物流服务"],
    [/全托管|供应链/, "供应链全托管"],
    [/收款|结汇|跨境支付/, "跨境收款"],
    [/财税|税务|合规|vat|epr/i, "财税合规"],
    [/营销|红人|投放|广告|推广/, "海外营销"],
    [/选品|软件|erp|saas/i, "选品 / 软件工具"],
    [/全球开店|代开店/, "全球开店"],
    [/知识产权|商标|专利/, "知识产权"],
    [/申诉|封号|解封/, "申诉服务"],
  ];
  for (const [re, label] of typeMap) {
    if (re.test(t)) {
      out.providerType = label;
      break;
    }
  }

  // 主诉求（primaryPain 枚举）
  if (/获客|拓客|客户不精准|找客户|没客户|线索|引流/.test(t)) out.primaryPain = "acquisition";
  else if (/回款|账期|坏账|逾期|压款|压钱|垫资/.test(t)) out.primaryPain = "receivables";
  else if (/资金周转|周转紧|融资|现金流紧|缺钱|资本对接/.test(t)) out.primaryPain = "cashflow";
  else if (/利润薄|内卷|价格战|毛利低/.test(t)) out.primaryPain = "margin";
  else if (/品牌|曝光|做大|圈层/.test(t)) out.primaryPain = "brand";
  else if (/财税指导|政策红利|平台资源对接/.test(t)) out.primaryPain = "compliance";

  return out;
}

/** 取最近一条用户消息的文本（确定性兜底解析它）。 */
function lastUserText(payload: DiagnoseRequest): string {
  const msgs = Array.isArray(payload?.messages) ? payload.messages : [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i]?.role === "user") return String(msgs[i]?.content ?? "");
  }
  return "";
}

/** 模型失灵时的脚本化兜底：按还缺哪个必填槽位，问下一题。 */
function scriptedProviderNextStep(payload: DiagnoseRequest) {
  const facts = (payload?.facts ?? {}) as Record<string, unknown>;
  const has = (k: string) => typeof facts[k] === "string" && (facts[k] as string).trim();
  const hasRevenue = has("monthlyRevenue") || has("companyScale");
  const pain = has("primaryPain") ? String(facts.primaryPain) : "";
  const needsReceivables = pain === "receivables" || pain === "cashflow";

  if (!has("providerType")) {
    return mk("intake", "先认识一下你的生意——你主要做哪类跨境服务？", facts, [
      "海外仓储",
      "物流服务",
      "跨境收款",
      "海外营销",
      "其他",
    ]);
  }
  if (!pain) {
    return mk(
      "intake",
      "了解。你现在经营上最想解决哪块？获客、回款账期、资金/融资、利润内卷、品牌，还是财税合规？",
      facts,
      ["获客太难", "回款账期压力", "资金周转紧", "利润薄内卷", "品牌想做大", "财税 / 合规"]
    );
  }
  if (!hasRevenue) {
    return mk("intake", "方便的话说个大概体量，比如月营收 500 万——好帮你估得准一点。", facts, [
      "营收千万内",
      "千万级",
      "亿级",
    ]);
  }
  if (needsReceivables && !has("settlementMode")) {
    return mk("intake", "你跟卖家客户一般怎么结算？先款后服务、月结，还是给账期？", facts, [
      "给账期",
      "月结",
      "先款后服务",
    ]);
  }
  if (needsReceivables && !has("creditTerm")) {
    return mk("intake", "给账期的话，一般给多久？", facts, ["30 天", "60 天", "90 天以上"]);
  }
  return mk("ready_to_diagnose", "好，信息够了，我来帮你理一理。", facts, []);
}

function mk(
  phase: "intake" | "ready_to_diagnose",
  reply: string,
  facts: Record<string, unknown>,
  suggestedReplies: string[]
) {
  return { phase, reply, facts, missing: [], suggestedReplies };
}

/** 解析 Agent 返回的结构化 JSON；失败时温和兜底，保证对话不卡死。 */
function safeParseProviderDiagnosis(content: unknown, payload: DiagnoseRequest) {
  const hasUserTurn =
    Array.isArray(payload?.messages) && payload.messages.some((m) => m?.role === "user");
  const parsed = extractJsonObject(content);

  // 确定性兜底：先从用户最新一句话抠出能抠的槽位（安全网，大脑的 facts 优先覆盖它）。
  const parsedFacts = parseProviderFactsFromText(lastUserText(payload));

  if (!parsed) {
    if (hasUserTurn) {
      // 关键修复：把确定性解析到的槽位 merge 进 facts 再走脚本兜底，
      // 这样大脑挂掉时「800万」这类清晰回答也能被接住、推进对话，而不是被丢掉重问。
      const augmented: DiagnoseRequest = {
        ...payload,
        facts: { ...(payload?.facts ?? {}), ...parsedFacts },
      };
      return scriptedProviderNextStep(augmented);
    }
    return mk(
      "intake",
      "先别急着填表——你主要做哪块服务的？海外仓、头程物流，还是别的？",
      payload?.facts ?? {},
      ["海外仓", "头程物流", "其他"]
    );
  }

  return {
    phase: parsed.phase === "ready_to_diagnose" ? "ready_to_diagnose" : "intake",
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "嗯，我在听——再多说一点你的情况？",
    // 合并顺序：旧 facts → 确定性解析（补大脑漏掉的）→ 大脑 facts（最高优先级）。
    facts: {
      ...(payload?.facts ?? {}),
      ...parsedFacts,
      ...(typeof parsed.facts === "object" && parsed.facts ? parsed.facts : {}),
    },
    missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    suggestedReplies: Array.isArray(parsed.suggestedReplies)
      ? parsed.suggestedReplies.slice(0, 6).map((s) => String(s))
      : [],
  };
}

// ──────────────────────── 诊断叙事 + TermPay 问答 ────────────────────────

interface ProviderNumbers {
  rep?: number;
  exactRevenue?: boolean;
  days?: number;
  creditRatio?: number;
  scenario?: "gives-credit" | "no-credit" | "unknown";
  hasReceivablesData?: boolean;
  cashLocked?: number;
  termpayRelease?: number;
  annualCreditVolume?: number;
  badDebtExposure?: number;
  termpayCapCny?: number;
}
interface ReportRequest {
  facts?: Record<string, unknown>;
  numbers?: ProviderNumbers;
  /**
   * teaser   ：软提示——一句话 + 一个粗数 + 邀约（先不糊一大段）。
   * fullReport：用户主动要的详细长报告（每个数讲清来历 + 系数出处 + 空行 + 软化）。
   * followup ：详细报告后的自由问答。
   * diagnosis：旧值，等价 fullReport（向后兼容）。
   */
  task?: "teaser" | "fullReport" | "followup" | "diagnosis";
  messages?: { role: "agent" | "user"; content: string }[];
}

function fmtCNYServer(n: number): string {
  if (n >= 100_000_000) {
    const yi = n / 100_000_000;
    return `¥${Number.isInteger(yi) ? yi : yi.toFixed(2)} 亿`;
  }
  if (n >= 10_000) {
    const w = n / 10_000;
    return `¥${Number.isInteger(w) ? w : w.toFixed(1)} 万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

/** 通用：调模型并要求 JSON，最多 3 次（重试升温 + 纠正），返回解析对象或 null。 */
async function requestModelJSON(
  apiKey: string,
  model: string,
  baseMessages: { role: string; content: string }[]
): Promise<Record<string, unknown> | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const messages =
      attempt > 1
        ? [
            ...baseMessages,
            {
              role: "system",
              content:
                "上一次你没有输出有效内容。请务必只输出一个合法 JSON 对象，绝不要输出空白、解释或多余文字。",
            },
          ]
        : baseMessages;
    let response: Response;
    try {
      response = await deepseekFetch(
        apiKey,
        JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          stream: false,
          temperature: attempt === 1 ? 0.6 : 0.9,
          max_tokens: 1400,
        })
      );
    } catch {
      continue;
    }
    if (!response.ok) continue;
    const data = await response.json();
    const parsed = extractJsonObject(data?.choices?.[0]?.message?.content);
    if (parsed) return parsed;
  }
  return null;
}

function buildProviderReportMessages(payload: ReportRequest) {
  const f = payload.facts ?? {};
  const n = payload.numbers ?? {};
  const task: "teaser" | "fullReport" | "followup" =
    payload.task === "teaser"
      ? "teaser"
      : payload.task === "followup"
      ? "followup"
      : "fullReport"; // diagnosis（旧）/ fullReport 都走详细
  const providerType = (f.providerType as string) || "你这类服务商";
  const revenueMode = n.exactRevenue ? "服务商自报" : "按规模估算";
  const scenario = n.scenario || "unknown";
  const primaryPain = (f.primaryPain as string) || "（未明确，自己从对话判断）";

  // —— 推导/软化所需的口径信息 ——
  const ratioPct = Math.round((n.creditRatio ?? 0) * 100);
  // 占比是不是用户在精算环节自报的真实值？是→硬数；否→按结算方式套的行业假设，必须软化。
  const ratioFromUser = typeof (f as Record<string, unknown>).creditRatioOverride === "number";
  const SETTLE_LABEL: Record<string, string> = {
    "prepay-full": "先款后服务",
    "prepay-part": "预付部分",
    monthly: "月结",
    credit: "给账期",
  };
  const settleLabel = SETTLE_LABEL[(f.settlementMode as string) || ""] || "你的结算方式";
  const revenueRaw = (f.monthlyRevenue as string) || "";
  // 营收是否是"区间/上限/约数"措辞（如「500万以内」）——是则讲解时要诚实说是估算/上限。
  const revenueIsRange = /以内|以下|左右|多|约|大概|上下|区间|-|—|~/.test(revenueRaw);
  // 只有采集了账期信息才给金额；否则明确告诉模型"别讲账期数字"，避免又把人往 TermPay 上引。
  const receivablesBlock = n.hasReceivablesData
    ? `- 给卖家账期：约 ${n.days ?? 0} 天，给账期客户占比约 ${Math.round(
        (n.creditRatio ?? 0) * 100
      )}%（场景：${scenario === "no-credit" ? "坚持先款后服务、基本不给账期" : "已给卖家账期"}）
- 被账期压住的现金（账压）：约 ${fmtCNYServer(n.cashLocked ?? 0)}
- TermPay 可提前回收：约 ${fmtCNYServer(n.termpayRelease ?? 0)}
- 年坏账敞口（按行业 2–5% 坏账率）：约 ${fmtCNYServer(n.badDebtExposure ?? 0)}
- TermPay 单卖家额度上限：最高约 ${fmtCNYServer(n.termpayCapCny ?? 0)}（官方 $100 万美元）`
    : "- （本次没采集账期信息，诊断**不要**出现任何账期 / 账压 / 坏账金额，聚焦他的主诉求）";

  // fullReport 专用：每个数怎么来的 + 系数依据 + 哪些是硬数 / 哪些是行业估算（要软化）。
  const derivationBlock = n.hasReceivablesData
    ? `# 这几个数到底怎么来的（讲解必须照这个口径；只能用这里给定的数和系数，不要自己再乘除出新数）
1) 账压（被账期压住的现金）≈ ${fmtCNYServer(n.cashLocked ?? 0)}
   公式：月营收 ×（账期 ÷ 30）× 给账期客户占比
   · 月营收 ≈ ${fmtCNYServer(n.rep ?? 0)}（${revenueMode}${revenueRaw ? `，用户原话「${revenueRaw}」` : ""}）${
        !n.exactRevenue || revenueIsRange
          ? " —— 这是估算/区间上限，讲的时候要诚实说「按上限粗算」"
          : "（用户自报，较硬）"
      }
   · 账期 ${n.days ?? 0} 天（用户自报，硬）
   · 给账期客户占比 ≈ ${ratioPct}%（约 ${(ratioPct / 10).toFixed(0)} 成）${
        ratioFromUser
          ? "（用户自报，硬）"
          : ` —— ⚠️这是按「${settleLabel}」这种结算方式套的行业经验值、不是用户确认的精确数。必须软化：说成「按你这类多走『${settleLabel}』的同行，通常约 ${(ratioPct / 10).toFixed(0)} 成订单会走账期，我先按这个估」；绝不要说成「你给了 ${ratioPct}% 的客户账期」这种当成既定事实的话`
      }
   · 代入 → 账压 ≈ ${fmtCNYServer(n.cashLocked ?? 0)}
2) 年坏账敞口 ≈ ${fmtCNYServer(n.badDebtExposure ?? 0)}
   公式：年走账期金额（月营收 × 12 × 占比 ≈ ${fmtCNYServer(n.annualCreditVolume ?? 0)}）× 行业坏账率 3%
   · 坏账率 3% 依据：跨境物流 / 海外仓应收坏账经验区间约 2–5%，取中位 3%（来源 FreightAmigo 2025 行业观察，信心：中）。讲清这是「行业中位估算」，不是他的实际坏账。
3) TermPay 单卖家额度上限 ≈ ${fmtCNYServer(n.termpayCapCny ?? 0)}
   来自官方 $100 万美元 × 约 7.2 汇率换算。注意：这是「每个卖家」的封顶额度，不是他的总盘子——讲的时候要和「总账压 ${fmtCNYServer(
        n.cashLocked ?? 0
      )}」分开说，别让人误会两个数打架（总账压分摊在多个卖家身上、每户都在这个上限内）。`
    : "";

  const system = `你是「豆服云」的服务商增长顾问，正在给一位跨境电商服务商做经营诊断，并把诊断对应到「豆服云权益包」能怎么帮他。语气是专业、沉稳、懂行的顾问当面聊——自然、口语、不分点罗列、不堆字段；可以亲和有温度，但**绝不用「兄弟 / 老铁 / 哥们 / 咱 / 老板」这类称兄道弟、套近乎的字眼**，称呼对方用「你」或「您」即可。

# 这位服务商的现状（金额由确定性引擎按他自报数算出，你只能引用，绝不能自己另算或编任何金额 / 价格 / 费率 / 额度）
- 服务商类型：${providerType}
- 月营收：约 ${fmtCNYServer(n.rep ?? 0)}（${revenueMode}）
- 主诉求 / 最想解决：${primaryPain}
${receivablesBlock}
${task !== "teaser" ? "\n" + derivationBlock : ""}

# 数字红线（最高优先级，违反即判失败）
- 你能说的数字与系数，**只有上面【现状】和【这几个数到底怎么来的】里给定的那些**（月营收、账期天数、给账期占比、账压、年走账期额、坏账率 3%、坏账敞口、TermPay 可提前回收、单卖家额度上限）——逐字引用、或讲解它们怎么来的（公式 + 代入）都可以，但不许改写成别的数、不许凑整偏离量级。
- **不许再乘除推算出任何新数字**：不要算"能多赚 / 省多少""回本几个月""ROI""手续费多少""返还多少"。给定之外一律改成文字定性（如"能明显盘活现金"）。
- 产品固定参数（报告份数 20 / 80 / 120、账期档位 60 / 90 / 120 天、基础包 ¥28,888、近 10 万店铺、审批 <3 工作日）可原样引用，但不许拿它们再算新数。
- 凡是"行业估算 / 假设"的系数（给账期占比、坏账率）必须老实标成"行业经验估算"，不要冒充用户确认的事实。
- 任何数拿不准在不在给定范围 → 不说，改成定性描述。

# 豆服云权益包（按痛点组织。诊断后把他的痛点对应到这些权益，点名具体权益，但绝不报价 / 编数字）
- 获客难 / 找不到精准客户 → AI 智能拓客（按品类 / 地区 / 规模 / 豆分期额度，从近 10 万店铺精准匹配优质卖家；启航版 20 份 / 跃升版 80 份 / 领航版 120+ 份分析报告）；平台首页 Banner；平台基础展示位
- 回款慢 / 给卖家账期 / 坏账 / 资金紧 → 【TermPay 豆分期】卖家先用后付付你账单、你提前收款零坏账（这块有上面算好的金额，重点讲）；嵌入式金融跳转端口（把 TermPay 接进你官网 / ERP / 客户后台，约一周上线）；账期优化风控模型（评估给哪个客户多少额度 / 账期）
- 利润薄 / 内卷 / 品牌弱 → AI 品牌营销赋能；大卖有约 & 游学考察
- 融资 / 财税 / 合规 / 出海 → 债权 / 股权融资咨询；公司财务诊断报告；财税指导；香港跨境电商加速器
- 想对接平台资源 → 平台政策同步 + 1v1 商务对接；平台资源对接私享会
- 统一开户动作（不论主诉求，收尾都落到这里）：豆服云基础包 ¥28,888，含 基础展示位 + AI 拓客启航版(20份) + 100 万提现券 + 豆分期服务。它不是加购套餐、是「开户」——开通 = 把豆分期收款通道打开。几乎零成本：服务商通过豆服云通道收卖家的钱、提现手续费用提现券抵扣，走收款流水即原路返还，相当于零成本开通（绝不报具体费率/天数/返还金额，也不承诺多快返完）。若他说「已经有收款渠道了」→ 豆分期收款是多一条「卖家先用后付」的通道（卖家更敢下单），不替换他现有渠道，这笔手续费还正好把基础包的钱返了。

# TermPay（豆分期）对服务商是什么（讲到金融这块时用）
卖家用 TermPay「先用后付」额度支付你的物流 / 仓储账单；TermPay 受托支付、直接放款到你账户——你提前收款、零账期损失、零坏账。账期 60 / 90 / 120 天由 TermPay 承担；息费免息（服务商贴息）或卖家付固定手续费、透明无隐藏。卖家有账期反而更敢下单。它不是贷款，是把你给卖家的账期资金和风险转出；额度由豆沙包风控自动评估（审批 <3 工作日）。

# 你的任务
${
  task === "teaser"
    ? `给一句"软提示 + 一个粗数 + 邀约"，**非常短**（最多 2–3 句、一个段落、不要分点、不要 Markdown）：
${
  n.hasReceivablesData
    ? `- 用"粗算 / 大概"的口吻，**只抛【账压】这一个数**（约 ${fmtCNYServer(
        n.cashLocked ?? 0
      )}，可口语取整但别偏离量级），点出"这笔现金被账期压着、还没算坏账"，制造一点痛感，但别长篇、别展开公式。
- 然后邀约一句："要不要我按你的实际数据，帮你拉一份详细测算？每个数都讲清怎么来的。"
- ⚠️这一层**绝不要**报坏账、占比、额度上限等其它数字，全留给详细报告。`
    : `- 用一句话点出他主诉求（${primaryPain}）那块"看起来有提升空间、值得好好理一理"，**不要报任何金额**。
- 然后邀约："要不要我给你拉一份详细的权益匹配方案？"`
}
suggestedReplies 固定给两个：["${
        n.hasReceivablesData ? "要，帮我精算一份明细" : "要，给我详细方案"
      }", "够了，直接看权益方案"]。`
    : task === "fullReport"
    ? `给一份**详细**的经营诊断 + 权益方案，要"讲得透、看得懂"。

【硬性格式（务必遵守）】
- 分 4–6 段，**段与段之间空一行**（用两个换行 \n\n 分隔），不要糊成一大坨。
- **不要用任何 Markdown 符号**（**、##、- 、> 等都不要）——气泡按纯文本 + 换行渲染，写了符号会原样露出来；分段就用换行。
- 每个金额都"**先讲怎么来的、再亮数**"：按上面【这几个数到底怎么来的】把公式、代入的数、系数依据讲清楚，别让数字凭空蹦出来。
- 行业估算 / 假设的系数（给账期占比、坏账率）必须**软化成"行业经验估算"**；用户自报的硬数（账期天数、自报营收）才说"按你给的"。

【主轴按主诉求 ${primaryPain} 走，绝不要默认往账期 / TermPay 上引】
- acquisition（获客）：主讲「AI 智能拓客」（按品类 / 地区 / 规模 / 豆分期额度，从近 10 万店铺精准匹配；启航 20 / 跃升 80 / 领航 120+ 份报告），可带 平台 Banner、平台基础展示位、大卖有约。全程不要出现账期 / 账压 / 坏账金额。
- brand（品牌）：主讲「AI 品牌营销赋能」「大卖有约 & 游学考察」、平台 Banner、平台资源对接私享会。不讲账期。
- margin（利润薄 / 内卷）：主讲用「AI 智能拓客」做规模、「AI 品牌营销 / 大卖有约」做溢价；可一句带过 TermPay 盘活现金。没有账期数据别硬塞账期金额。
- compliance（财税 / 合规）：主讲「财税指导」「香港跨境电商加速器」「平台政策同步 + 1v1 商务对接」，需要资金再带融资咨询 / 财务诊断。不讲账期。
- receivables / cashflow（回款 / 账期 / 资金）：按下面的段落结构展开。

【receivables / cashflow 段落结构（每段之间空一行）】
段1：一句话结论——现金被账期压住、还担着坏账。
段2：账压怎么来的——亮公式「月营收 ×（账期÷30）× 给账期占比」，代入那三个数；占比按要求软化成"行业估算"。
段3：坏账敞口怎么来的——亮「年走账期额 × 3%」，讲清 3% 是行业 2–5% 取中、信心中等的估算。
段4：TermPay 怎么破局——能提前回收约 ${fmtCNYServer(
        n.termpayRelease ?? 0
      )}、把账期和坏账一并转出；讲清单卖家上限 ${fmtCNYServer(
        n.termpayCapCny ?? 0
      )} 是"每户封顶"、和总账压不是一个口径；可带 嵌入式端口、账期风控模型。
段5：收尾落到"先开通基础包"这个开户动作——零成本、走收款流水用提现券返还（不报费率 / 天数 / 金额、不承诺多快返完）。

最后 suggestedReplies 给 3–4 个，例如 ["这个数怎么进一步算准？","TermPay 额度怎么评估？","基础包怎么零成本开通？","看看适合我的权益方案"]。`
    : `服务商在追问豆服云某个权益（AI 拓客 / TermPay / 融资财税 / 品牌曝光等），或追问"某个数怎么来的"。用上面的权益包信息 +【这几个数到底怎么来的】准确、口语地回答（2–4 句），尽量回扣他的现状；被问"这个数怎么算的"就照口径讲公式 + 依据，但不要报新数字。suggestedReplies 给 2–3 个相关后续问题。`
}

# 只输出 JSON：{"reply":"...","suggestedReplies":["...","..."]}
除上面明确给你的金额外，绝不要在回答里出现任何其它具体数字 / 价格 / 费率 / 额度；提到额度时须说"预估，实际以豆沙包风控审批为准"。`;

  const messages: { role: string; content: string }[] = [{ role: "system", content: system }];
  if (task !== "followup") {
    // teaser / fullReport：一次性生成，给个通用触发 prompt。
    messages.push({
      role: "user",
      content:
        task === "teaser"
          ? "（请基于以上现状，给我一句软提示 + 粗数 + 邀约。）"
          : "（请基于以上现状和金额，给我详细诊断和 TermPay 方案。）",
    });
  } else {
    for (const m of payload.messages ?? []) {
      messages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.content ?? ""),
      });
    }
  }
  return messages;
}

/** 模型失灵时的脚本兜底：用引擎数字拼一段自然语言诊断（仍只用引擎给的数）。 */
function providerReportFallback(payload: ReportRequest) {
  const n = payload.numbers ?? {};

  // teaser 兜底：短软提示 + 一个粗数 + 邀约（不展开）。
  if (payload.task === "teaser") {
    if (n.hasReceivablesData) {
      return {
        reply: `粗算了一下，按你这个体量和账期，大概有 ${fmtCNYServer(
          n.cashLocked ?? 0
        )} 左右的现金被账期压着、动不了——这还没算坏账。要不要我按你的实际数据，帮你拉一份详细测算，把每个数都讲清楚怎么来的？`,
        suggestedReplies: ["要，帮我精算一份明细", "够了，直接看权益方案"],
      };
    }
    return {
      reply:
        "看下来你这块还有不少能优化的空间。要不要我给你拉一份详细的权益匹配方案，看看豆服云具体能怎么帮你？",
      suggestedReplies: ["要，给我详细方案", "够了，直接看权益方案"],
    };
  }

  // 没采集账期（获客 / 品牌线）→ 不讲账期，给权益包导向的兜底。
  if (!n.hasReceivablesData) {
    return {
      reply:
        "从你说的看，获客这块是当前最该解决的。豆服云的 AI 智能拓客能按品类、地区、规模从近 10 万跨境店铺里帮你筛精准卖家，把匹配的客户直接推到你面前；再配上平台 Banner 曝光、大卖有约这些资源，相当于给你配了一整套找客户、立口碑的增长系统。落地第一步很轻——先开通基础包（含展示位 + 20 份拓客线索 + 豆分期），它几乎零成本：通过豆服云通道收款、手续费用提现券走流水抵扣返还，相当于零成本开通。要不要我帮你看看怎么开起来？",
      suggestedReplies: [
        "基础包怎么返还？",
        "AI 拓客怎么帮我找客户？",
        "大卖有约是什么？",
        "看看适合我的权益包",
      ],
    };
  }
  const scenario = n.scenario || "gives-credit";
  if (scenario === "no-credit") {
    return {
      reply:
        "你坚持先款后服务，好处是基本没坏账，但跨境大卖普遍要账期——这意味着你可能正因为「不敢给账期」在丢一些大单。其实可以让卖家用 TermPay（先用后付）来付你的账单：钱由 TermPay 受托支付、直接打到你账户，你照样先收款、零坏账风险，相当于「敢给账期」又不用自己担风险，多一个抢大卖的武器。落地第一步是开通基础包、把豆分期通道打开——这步几乎零成本，用提现券走收款流水抵扣返还，相当于零成本开通。要不要我帮你看看怎么开起来？",
      suggestedReplies: ["基础包怎么返还？", "TermPay 怎么接入？", "息费谁付？", "看看适合我的权益包"],
    };
  }
  return {
    reply: `先说结论：你的现金被账期压得不轻，还自己扛着坏账风险。

账压是这么来的——按「月营收 ×（账期÷30）× 给账期客户占比」估，大约有 ${fmtCNYServer(
      n.cashLocked ?? 0
    )} 现金被压在给卖家的账期里、动不了。这里的"占比"是按你这类结算方式的行业经验估的，不是你确认的精确数。

坏账这块——按年走账期的金额，乘以行业 2–5% 取中位的坏账率（约 3%，行业经验估算），每年大概有 ${fmtCNYServer(
      n.badDebtExposure ?? 0
    )} 是坏账敞口。

破局靠 TermPay：让卖家用"先用后付"来付你的账单，TermPay 受托支付、直接打到你账户，你能把这约 ${fmtCNYServer(
      n.termpayRelease ?? 0
    )} 现金提前收回来，账期和坏账风险一并转出去。单个卖家最高可覆盖约 ${fmtCNYServer(
      n.termpayCapCny ?? 0
    )}（这是每户封顶、不是总盘子）。

落地第一步是开通基础包、把豆分期通道打开——几乎零成本，用提现券走收款流水抵扣返还。要不要我帮你看看怎么开起来？`,
    suggestedReplies: ["这个数怎么进一步算准？", "TermPay 怎么接入？", "基础包怎么零成本开通？", "看看适合我的权益方案"],
  };
}

/** 调 DeepSeek，带超时（默认 25s）。超时/网络错误会抛出，由调用方按"网络错误"处理（重试 / 兜底），避免无限等。 */
async function deepseekFetch(apiKey: string, body: string, timeoutMs = 25_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Request body is too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
