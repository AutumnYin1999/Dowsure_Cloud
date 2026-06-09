import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { providerAgentPlugin } from "./provider-agent-plugin";

export default defineConfig({
  plugins: [react(), deepseekAgentPlugin(), providerAgentPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

function deepseekAgentPlugin(): Plugin {
  return {
    name: "dowsure-deepseek-agent-api",
    configureServer(server) {
      server.middlewares.use("/api/seller-agent/chat", async (req, res) => {
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
          const payload = await readJsonBody(req);
          const model = env.DEEPSEEK_MODEL || "deepseek-v4-flash";
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: buildAgentMessages(payload),
              response_format: { type: "json_object" },
              stream: false,
              temperature: 0.35,
              max_tokens: 500,
              thinking: { type: "disabled" },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            sendJson(res, response.status, {
              error: "DeepSeek request failed",
              detail: errorText.slice(0, 500),
            });
            return;
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          const parsed = safeParseAgentJson(content);
          sendJson(res, 200, { text: parsed.text });
        } catch (error) {
          sendJson(res, 500, {
            error: "Agent API failed",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // ──────────────────────────────────────────────────────────────
      // 诊断 Agent「大脑」（C 方案 · 地基）
      //   输入：{ messages:[{role:'agent'|'user',content}], facts:{...} }
      //   输出：结构化 JSON（phase/reply/facts/missing/suggestedReplies）
      //   职责：自主追问 + 痛点识别 + 槽位收集；金额仍由前端确定性引擎算（单一数据源）。
      //   接好留用，前端接入 + 真实公式在 LD 确认后再做（见 documents/卖家痛点清单_2026-06-09.md）。
      // ──────────────────────────────────────────────────────────────
      server.middlewares.use("/api/seller-agent/diagnose", async (req, res) => {
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
          // 诊断大脑用更强的 pro：flash 对「都有/既要又要」这类模糊输入会退化成空白返回。
          const model = env.DEEPSEEK_DIAGNOSE_MODEL || "deepseek-v4-pro";
          // 自动重试：网络/HTTP 失败或返回无法解析的 JSON 都重试。
          // 关键：重试时必须换参数（升温 + 纠正指令），否则同样输入在低温下会确定性地再吐一次空白。
          const MAX_ATTEMPTS = 3;
          let content: unknown = null;
          let lastError: { status: number; detail: string } | null = null;

          for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const messages = buildDiagnosticMessages(payload);
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
              // 首次用中低温（0.6）已能明显降低空白退化；重试再升到 0.9 打破确定性。
              temperature: attempt === 1 ? 0.6 : 0.9,
              max_tokens: 900,
            });

            let response: Response;
            try {
              response = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body,
              });
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
              break; // 拿到可解析的 JSON，成功，停止重试
            }
            // 模型返回了无法解析的内容（如空白）→ 记一笔，若还有次数则升温重试
            server.config.logger.warn(
              `[diagnose] 模型返回非 JSON（${model}，attempt ${attempt}/${MAX_ATTEMPTS}），${
                attempt < MAX_ATTEMPTS ? "升温重试" : "走脚本兜底"
              }`
            );
          }

          // 两次都是 HTTP/网络错误：返回错误，让前端走“网络断了”提示。
          if (lastError && !extractJsonObject(content)) {
            sendJson(res, lastError.status, {
              error: "DeepSeek request failed",
              detail: lastError.detail,
            });
            return;
          }

          // 成功，或两次都返回坏 JSON（safeParseDiagnosis 内部温和兜底）。
          sendJson(res, 200, safeParseDiagnosis(content, payload));
        } catch (error) {
          sendJson(res, 500, {
            error: "Diagnose agent failed",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // ──────────────────────────────────────────────────────────────
      // 现金流诊断叙事（C 方案 · 自然语言版，替代固定卡片）
      //   输入：{ facts, numbers, task:'diagnosis'|'followup', messages? }
      //   输出：{ reply, suggestedReplies }
      //   AI 用自然语言写诊断 + 引用来源 + 引出 TermPay；数字只引用引擎算好的（不自己编）。
      // ──────────────────────────────────────────────────────────────
      server.middlewares.use("/api/seller-agent/cashflow", async (req, res) => {
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
          const payload = (await readJsonBody(req)) as CashflowRequest;
          const model = env.DEEPSEEK_DIAGNOSE_MODEL || "deepseek-v4-pro";
          const parsed = await requestModelJSON(apiKey, model, buildCashflowMessages(payload));
          const fb = cashflowFallback(payload);
          if (!parsed) {
            server.config.logger.warn("[cashflow] 模型多次非 JSON，走脚本兜底");
            sendJson(res, 200, fb);
            return;
          }
          sendJson(res, 200, {
            reply:
              typeof parsed.reply === "string" && parsed.reply.trim()
                ? parsed.reply.trim()
                : fb.reply,
            suggestedReplies: Array.isArray(parsed.suggestedReplies)
              ? parsed.suggestedReplies.slice(0, 4).map((s) => String(s))
              : fb.suggestedReplies,
          });
        } catch (error) {
          sendJson(res, 500, {
            error: "Cashflow agent failed",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      });
    },
  };
}

function buildAgentMessages(payload: unknown) {
  return [
    {
      role: "system",
      content:
        "你是豆服云卖家助手的中文对话润色层。只输出 JSON，格式为 {\"text\":\"...\"}。不要输出 Markdown。不要改变业务结论、问题顺序、金额、币种、单位、选项、产品名或服务商名。尤其不能把“万/元/人民币/月销区间”改成美元或其他单位。purpose 为 next_question 时，只能自然承接用户刚才的回答，并用 nextQuestion.prompt 的原意发问；不要列出、复述、改写或解释任何选项，因为选项已经由 UI 按钮展示。语气自然、简洁、像专业但不压迫的跨境电商顾问。每次回答控制在 1-3 句。",
    },
    {
      role: "user",
      content: JSON.stringify(payload),
    },
  ];
}

// ──────────────────────── 诊断 Agent 大脑 ────────────────────────

interface DiagnoseTurn {
  role: "agent" | "user";
  content: string;
}
interface DiagnoseRequest {
  messages?: DiagnoseTurn[];
  facts?: Record<string, unknown>;
}

/**
 * 诊断 Agent 的系统提示 —— 整个 agent 的灵魂。
 * 痛点分类 / 信号词 / 必填槽位均与 documents/卖家痛点清单_2026-06-09.md 对齐。
 * 痛点优先级、开场口径待 LD（06-10）确认后再微调本段。
 */
const DIAGNOSE_SYSTEM_PROMPT = `你是「豆服云」的资深跨境电商经营诊断顾问，正在和一位平台卖家对话。

# 身份（口径保持一致）
你是「豆服云」的经营诊断顾问。开场白可以每次换不同说法、自然生动一些，但身份口径必须一致：
- 绝不要给自己编人名（如老张、小李、小豆之类），也不要编造虚构的个人背景/履历故事。
- 需要自称时，用「豆服云诊断助手」或「豆服云的顾问」即可。

# 你的目标
通过自然、共情的对话，找出这位卖家当前最痛的经营问题，并收集出诊断所需的最少信息。不要像填表，要像一个真正懂行的顾问在和他聊。

# 卖家常见痛点（painPrimary 取值 → 含义 / 信号词）
- cashflow（现金流/账期）：回款慢、账单到期早于回款、现金被压、旺季不敢备货
- cost（服务成本）：物流/仓储费贵、报价不透明、利润被附加费吃掉
- stockout（履约/缺货）：旺季时效不稳、断货、怕差评
- provider_quality（服务商靠谱度）：被服务商坑、异常没人管、退款索赔没人扛、怕换错
- compliance（税务合规）：VAT/EPR、合规罚款、商标侵权
- ads（营销推广）：广告打水漂、ROI 低、新品没流量、达人踩坑
- appeal（申诉）：封号、冻结、绩效、解封无门
- onboarding（全球开店）：拓新平台/新站点、开户注册不会弄
- tools（运营工具）：多店铺管理乱、刊登/选品/数据靠人肉

# 诊断需要的必填槽位（四个全凑齐才能算账，缺一不可）
platform（主要平台）、painPrimary（主痛点）、gmvExact（具体月销额）、termDays（回款/账期天数）。
- gmvExact：要「具体数」，不要只停在区间。卖家若先说区间（如「20-50万」），顺势追一句「大概落在哪个数？比如 35 万左右？」拿到具体值。
- termDays：问「你的钱大概被压多久」——从平台回款 + 给服务商的账期算，得到一个天数（如 60/90 天）。这是「压在账期上的钱」最关键的输入。
- 只在「为了把痛点量化、把金额算准」时才问这些，并说明为什么要问；一次只问一个，不要一上来就索要、也不要一次抛多个问题。

# 对话规则
- 开场或信息不足时：用开放式问题让他说出最头疼的事，先共情再追问。
- 一次只聚焦一件事，回复 1-3 句，口语、不压迫、不念选项清单。
- suggestedReplies 给 2-3 个最可能的简短回答，作为按钮（不要把它们读出来）。
- 金额、额度、能省多少钱：你绝对不要自己编任何数字，那由系统的确定性公式计算。你只负责把痛点聊清楚。

# 只输出 JSON（不要 Markdown、不要解释），结构：
{
  "phase": "intake" | "ready_to_diagnose",
  "reply": "你这一轮要对卖家说的话（1-3句中文）",
  "facts": { "painPrimary": "...", "painDetail": "卖家原话里的具体痛点", "platform": "...", "gmvBand": "卖家给的区间(如有)", "gmvExact": "具体月销(如 35万)", "termDays": "回款/账期(如 90天)", "serviceCategory": "..." },
  "missing": ["还缺哪些必填槽位"],
  "suggestedReplies": ["简短选项1", "简短选项2"]
}
只有当 platform、painPrimary、gmvExact、termDays 四个槽位都已知时，才把 phase 置为 "ready_to_diagnose"，reply 用一句话过渡到「信息够了，我来帮你算一算」。只要还缺任何一个（含 gmvExact、termDays），phase 必须保持 "intake"，继续追问，绝不要提前下结论或报金额。facts 里只填已确认的字段，未知的省略。`;

function buildDiagnosticMessages(payload: DiagnoseRequest) {
  const history = Array.isArray(payload?.messages) ? payload.messages : [];
  const facts = payload?.facts ?? {};
  const turns = history.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content ?? ""),
  }));
  return [
    { role: "system", content: DIAGNOSE_SYSTEM_PROMPT },
    {
      role: "system",
      content: `当前已知事实（facts）：${JSON.stringify(facts)}。请在此基础上增量更新。`,
    },
    ...(turns.length
      ? turns
      : [{ role: "user", content: "（卖家刚进来，还没说话，请开场。）" }]),
  ];
}

/** 从模型返回里尽量抠出 JSON 对象：先去掉 ```json``` 代码围栏，再从首个 { 截到末个 }。 */
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
 * 模型彻底失灵时的「脚本化兜底」：按还缺哪个必填槽位，问下一题。
 * 保证就算 AI 抽风，对话也能继续推进、最终走到诊断，而不是卡在「没接住」死循环。
 */
function scriptedNextStep(payload: DiagnoseRequest) {
  const facts = (payload?.facts ?? {}) as Record<string, unknown>;
  const has = (k: string) => typeof facts[k] === "string" && (facts[k] as string).trim();
  if (!has("painPrimary")) {
    return {
      phase: "intake" as const,
      reply: "先帮我对一下焦点——你现在最头疼的，是现金/回款，还是成本、缺货？",
      facts,
      missing: ["painPrimary", "platform", "gmvExact", "termDays"],
      suggestedReplies: ["回款太慢、现金紧", "物流仓储成本高", "旺季怕断货"],
    };
  }
  if (!has("platform")) {
    return {
      phase: "intake" as const,
      reply: "了解。那你主要在哪个平台卖货？",
      facts,
      missing: ["platform", "gmvExact", "termDays"],
      suggestedReplies: ["Amazon", "TikTok Shop", "Amazon + TikTok Shop"],
    };
  }
  if (!has("gmvExact")) {
    return {
      phase: "intake" as const,
      reply: "为了把金额算准，能说个大概的具体月销吗？比如 35 万左右——不用很精确。",
      facts,
      missing: ["gmvExact", "termDays"],
      suggestedReplies: ["月销 20 万左右", "月销 50 万左右", "月销 100 万左右"],
    };
  }
  if (!has("termDays")) {
    return {
      phase: "intake" as const,
      reply: "最后一个：你的钱大概被压多久？也就是平台回款加上给服务商的账期，差不多多少天？",
      facts,
      missing: ["termDays"],
      suggestedReplies: ["60 天左右", "90 天左右", "120 天以上"],
    };
  }
  return {
    phase: "ready_to_diagnose" as const,
    reply: "好，信息够了，我来帮你算一算。",
    facts,
    missing: [],
    suggestedReplies: [],
  };
}

/**
 * 解析 Agent 返回的结构化 JSON。
 * - 解析成功：规整字段后返回。
 * - 解析失败且对话已开始：用脚本化追问顶上，保证对话能继续（不卡死、不像重启）。
 * - 解析失败且尚未开始：回退到安全开场轮。
 */
function safeParseDiagnosis(content: unknown, payload: DiagnoseRequest) {
  const hasUserTurn =
    Array.isArray(payload?.messages) && payload.messages.some((m) => m?.role === "user");
  const parsed = extractJsonObject(content);

  if (!parsed) {
    if (hasUserTurn) return scriptedNextStep(payload);
    return {
      phase: "intake" as const,
      reply: "先别急着填表——说说你最近经营上最头疼的是哪件事？",
      facts: payload?.facts ?? {},
      missing: ["painPrimary", "platform", "gmvExact", "termDays"],
      suggestedReplies: ["回款太慢、现金紧", "服务商不靠谱想换", "旺季怕断货"],
    };
  }

  return {
    phase: parsed.phase === "ready_to_diagnose" ? "ready_to_diagnose" : "intake",
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "嗯，我在听——再多说一点你的情况？",
    facts: {
      ...(payload?.facts ?? {}),
      ...(typeof parsed.facts === "object" && parsed.facts ? parsed.facts : {}),
    },
    missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    suggestedReplies: Array.isArray(parsed.suggestedReplies)
      ? parsed.suggestedReplies.slice(0, 3).map((s) => String(s))
      : [],
  };
}

// ──────────────────────── 现金流诊断叙事 ────────────────────────

interface CashflowNumbers {
  rep?: number;
  cashLock?: number;
  monthlyBill?: number;
  termpayRelease?: number;
  termpayQuota?: number;
  days?: number;
}
interface CashflowRequest {
  facts?: Record<string, unknown>;
  numbers?: CashflowNumbers;
  task?: "diagnosis" | "followup";
  messages?: { role: "agent" | "user"; content: string }[];
}

function fmtCNYServer(n: number): string {
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
      response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          stream: false,
          temperature: attempt === 1 ? 0.6 : 0.9,
          max_tokens: 900,
        }),
      });
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

function buildCashflowMessages(payload: CashflowRequest) {
  const f = payload.facts ?? {};
  const n = payload.numbers ?? {};
  const platform = (f.platform as string) || "你的平台";
  const gmvLabel = (f.gmvExact as string) || (f.gmvBand as string) || "你当前的体量";
  const termLabel = (f.termDays as string) || `${n.days ?? 90} 天`;
  const task = payload.task === "followup" ? "followup" : "diagnosis";

  const system = `你是「豆服云」的经营诊断顾问，正在和一位卖家聊他的现金流。语气自然、口语、像顾问当面聊天——不要分点罗列，不要像表格或卡片那样堆字段。

# 已知事实（数字均由系统按行业系数算好，你只能引用，绝不能自己另外编任何金额）
- 平台：${platform}
- 月销：${gmvLabel}
- 回款/账期：约 ${termLabel}
- 账期占用现金（账压）：约 ${fmtCNYServer(n.cashLock ?? 0)}（= 月销 × 11.85% × 账期/90天；来源：JungleScout《2025 亚马逊卖家报告》+ 卖家实测）
- 用 TermPay 延期约 ${n.days ?? 90} 天可释放的现金：约 ${fmtCNYServer(n.termpayRelease ?? 0)}
- TermPay 预估可用额度：约 ${fmtCNYServer(n.termpayQuota ?? 0)}（= 月销 × 1.5；来源：对标 Payoneer ×1.4 / Wayflyer ×1.5–3 的行业共识）

# TermPay（豆分期）是什么
跨境卖家「先用后付」工具：把物流/仓储/广告等服务商账单延期 60/90/120 天，放款直接打到服务商账户（受托支付）；额度≈月GMV×1.5（封顶 $100 万）；免息（服务商贴息）或固定手续费，费用透明、无隐藏；按期还款。它不是贷款，是把你的付款账期往后挪。

# 你的任务
${
  task === "diagnosis"
    ? `给出一段现金流诊断（4–6 句，自然口语，像顾问当面算给他听）。重点：先讲清楚"这个数怎么来的"再亮数，别让数字凭空蹦出来——
① 先说比例的出处与估算逻辑：跨境卖家平均约有 11.85% 的月销会卡在回款时间差里（据 JungleScout《2025 亚马逊卖家报告》+ 卖家实测），账期越长压得越多，所以按"月销 × 11.85% × 你的账期÷90天"来估；
② 然后代入他的月销和账期，自然地报出账压金额（约 ${fmtCNYServer(n.cashLock ?? 0)}），把"这笔钱此刻正躺在回款里、动不了"的痛感讲到他心里去；
③ 最后自然过渡到 TermPay 怎么帮他把这笔现金提前释放出来。
口径要诚实：这是"按行业平均估算"，不是他账上的精确数——可以说"大致测算""估个量级"，不要说成铁定如此。
最后在 suggestedReplies 里给 3–4 个"想了解 TermPay 哪方面"的简短选项（例如额度、费用/账期、放款方式、和借贷的区别）。`
    : `卖家在追问 TermPay 的某个方面，用上面的产品信息准确、口语地回答（2–4 句）。若他问"这个比例/数字怎么算的"，就如实讲：月销 × 11.85%（JungleScout 报告 + 卖家实测）× 账期÷90天，并说明这是行业平均估算、非精确账目。suggestedReplies 给 2–3 个相关的后续问题。`
}

# 只输出 JSON：{"reply":"...","suggestedReplies":["...","..."]}
再次强调：除上面明确给你的金额外，绝不要在回答里出现任何其它具体数字。`;

  const messages: { role: string; content: string }[] = [{ role: "system", content: system }];
  if (task === "diagnosis") {
    messages.push({ role: "user", content: "（请基于以上事实，给我现金流诊断。）" });
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

/** 模型失灵时的脚本兜底：用引擎数字拼一段自然语言诊断（仍然只用有出处的数）。 */
function cashflowFallback(payload: CashflowRequest) {
  const n = payload.numbers ?? {};
  const f = payload.facts ?? {};
  const gmvLabel = (f.gmvExact as string) || (f.gmvBand as string) || "你当前的体量";
  return {
    reply: `按你月销 ${gmvLabel}、账期约 ${
      n.days ?? 90
    } 天，亚马逊卖家平均约有 11.85% 的销售额卡在回款时间差里（据 JungleScout《2025 亚马逊卖家报告》）——也就是说大约 ${fmtCNYServer(
      n.cashLock ?? 0
    )} 此刻正躺在回款里、动不了。偏偏旺季要备货，这笔钱却用不上，常常只能再去借。其实用 TermPay 把物流、仓储这些账单延期约 ${
      n.days ?? 90
    } 天，就能把大约 ${fmtCNYServer(n.termpayRelease ?? 0)} 现金先释放回你手上。想先了解哪方面？`,
    suggestedReplies: [
      "能延多久？费用怎么算？",
      "我大概能拿多少额度？",
      "钱是怎么打给服务商的？",
      "这跟找银行借贷有什么区别？",
    ],
  };
}

function safeParseAgentJson(content: unknown): { text: string } {
  if (typeof content !== "string") return { text: "" };
  try {
    const parsed = JSON.parse(content) as { text?: unknown };
    return { text: typeof parsed.text === "string" ? parsed.text.trim() : "" };
  } catch {
    return { text: content.trim() };
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
