import { loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * 「服务商」增长诊断 Agent 的后端插件 —— 对标卖家版后端（deepseekAgentPlugin），但领域是服务商。
 *
 * 取代原服务商问卷：用聊天收集服务商经营现状，最后给一份经营诊断 + 建议，并把痛点对应到
 * 豆服云能解决什么。两个接口：
 *  - /api/provider-agent/diagnose ：意图收集大脑（自主追问 + 槽位收集）
 *  - /api/provider-agent/report   ：经营诊断叙事 + 豆服云能力问答
 *
 * 单独成文件，便于和卖家版各自独立演化、避免互相覆盖。规则集中在
 * PROVIDER_DIAGNOSE_SYSTEM_PROMPT / buildProviderReportMessages 两处，后续按服务商需求改这里即可。
 */
export function providerAgentPlugin(): Plugin {
  return {
    name: "dowsure-deepseek-provider-agent-api",
    configureServer(server) {
      // ── 意图收集大脑：自主追问 + 槽位收集（服务商类型 / 获客 / 回款 / 经营压力）。
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
              break;
            }
            server.config.logger.warn(
              `[provider-diagnose] 模型返回非 JSON（${model}，attempt ${attempt}/${MAX_ATTEMPTS}），${
                attempt < MAX_ATTEMPTS ? "升温重试" : "走脚本兜底"
              }`
            );
          }

          if (lastError && !extractJsonObject(content)) {
            sendJson(res, lastError.status, {
              error: "DeepSeek request failed",
              detail: lastError.detail,
            });
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

      // ── 经营诊断叙事 + 豆服云能力问答：AI 用自然语言给诊断 + 建议，把痛点对应到豆服云能解决什么。
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
              typeof parsed.reply === "string" && parsed.reply.trim()
                ? parsed.reply.trim()
                : fb.reply,
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
 * 服务商诊断 Agent 的系统提示 —— 整个 agent 的灵魂。
 * 痛点口径、必填槽位与原服务商问卷（4 模块）对齐；豆服云能力口径与 knowledgeBase 对齐。
 */
const PROVIDER_DIAGNOSE_SYSTEM_PROMPT = `你是「豆服云」的资深服务商增长顾问，正在和一位跨境电商服务商（物流 / 海外仓 / ERP工具 / 广告营销 / 财税合规 / 支付收款等）对话。

# 身份（口径保持一致）
你是「豆服云」的服务商增长顾问。开场白可以每次换不同说法、自然生动一些，但身份口径必须一致：
- 绝不要给自己编人名（如老张、小李、小豆之类），也不要编造虚构的个人背景/履历故事。
- 需要自称时，用「豆服云顾问」或「豆服云的增长顾问」即可。

# 你的目标
通过自然、共情的对话，摸清这位服务商当前经营上最卡的地方，并收集出诊断所需的最少信息。不要像填问卷，要像一个真正懂跨境服务商生意的顾问在跟他聊。

# 服务商常见痛点（边聊边对照，帮你判断追问方向）
- 获客难：找不到精准客户、线索质量差、转化率低、获客成本高、不知道客户靠不靠谱
- 回款 / 坏账：给客户账期、回款慢、有坏账或逾期、账期与自身垫资错配
- 经营压力：价格内卷、利润薄、资金周转紧、人力成本高、合规财税压力
- 增长 / 品牌：想触达中大卖 / T0·T1、想做品牌曝光、想对接平台资源

# 诊断需要的必填槽位（四个全凑齐才能给诊断，缺一不可）
- providerType：服务商类型 / 主营环节（如 头程物流 / 海外仓 / ERP工具 / 广告营销 / 财税 / 支付）
- acquisition：获客现状 + 最大困难（他现在怎么找客户、卡在哪——精准度 / 线索质量 / 成本 / 转化）
- receivables：回款健康度（与客户怎么结算、给不给账期、账期多长、有没有坏账 / 回款慢）
- pressure：当前最大的经营压力 + 资金周转紧不紧（价格内卷 / 利润薄 / 资金紧 / 获客难 / 合规）
可选补充：scale（规模 / 客户数）、openConcern（一句话最头疼的事）。

# 对话规则
- 开场或信息不足时：用开放式问题让他说出最头疼的事，先共情再追问。
- 一次只聚焦一件事，回复 1-3 句，口语、不压迫、不念选项清单。
- suggestedReplies 给 2-3 个最可能的简短回答，作为按钮（不要把它们读出来）。
- 不要在收集阶段就长篇大论讲豆服云的方案；等信息齐了再到诊断阶段展开。
- 绝不要编造任何价格、授信额度或承诺。

# 只输出 JSON（不要 Markdown、不要解释），结构：
{
  "phase": "intake" | "ready_to_diagnose",
  "reply": "你这一轮要对服务商说的话（1-3句中文）",
  "facts": { "providerType": "...", "acquisition": "...", "receivables": "...", "pressure": "...", "scale": "...", "openConcern": "..." },
  "missing": ["还缺哪些必填槽位"],
  "suggestedReplies": ["简短选项1", "简短选项2"]
}
只有当 providerType、acquisition、receivables、pressure 四个槽位都已知时，才把 phase 置为 "ready_to_diagnose"，reply 用一句话过渡到「信息够了，我来帮你把经营现状理一理」。只要还缺任何一个，phase 必须保持 "intake"，继续追问，绝不要提前下结论。facts 里只填已确认的字段，未知的省略。`;

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
    ...(turns.length
      ? turns
      : [{ role: "user", content: "（服务商刚进来，还没说话，请开场。）" }]),
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

/** 模型彻底失灵时的「脚本化兜底」：按还缺哪个必填槽位，问下一题。 */
function scriptedProviderNextStep(payload: DiagnoseRequest) {
  const facts = (payload?.facts ?? {}) as Record<string, unknown>;
  const has = (k: string) => typeof facts[k] === "string" && (facts[k] as string).trim();
  if (!has("providerType")) {
    return {
      phase: "intake" as const,
      reply: "先认识一下你的生意——你主要是做哪块服务的？物流、海外仓、ERP工具，还是广告 / 财税这些？",
      facts,
      missing: ["providerType", "acquisition", "receivables", "pressure"],
      suggestedReplies: ["头程物流 / 海外仓", "ERP / 工具", "广告 / 营销"],
    };
  }
  if (!has("acquisition")) {
    return {
      phase: "intake" as const,
      reply: "了解。那获客这块，你现在主要靠什么找客户？最卡的是哪一步——找不到精准客户，还是转化、成本？",
      facts,
      missing: ["acquisition", "receivables", "pressure"],
      suggestedReplies: ["找不到精准客户", "线索多但转化低", "获客成本太高"],
    };
  }
  if (!has("receivables")) {
    return {
      phase: "intake" as const,
      reply: "回款这块呢？你跟客户怎么结算——先款后服务、月结，还是给账期？有没有坏账或回款慢的情况？",
      facts,
      missing: ["receivables", "pressure"],
      suggestedReplies: ["给账期、回款偏慢", "月结为主", "基本先款后服务"],
    };
  }
  if (!has("pressure")) {
    return {
      phase: "intake" as const,
      reply: "最后一个：眼下最大的经营压力是什么？资金周转紧不紧？",
      facts,
      missing: ["pressure"],
      suggestedReplies: ["价格内卷、利润薄", "资金周转紧", "获客难"],
    };
  }
  return {
    phase: "ready_to_diagnose" as const,
    reply: "好，信息够了，我来帮你把经营现状理一理。",
    facts,
    missing: [],
    suggestedReplies: [],
  };
}

/** 解析 Agent 返回的结构化 JSON；失败时温和兜底，保证对话不卡死。 */
function safeParseProviderDiagnosis(content: unknown, payload: DiagnoseRequest) {
  const hasUserTurn =
    Array.isArray(payload?.messages) && payload.messages.some((m) => m?.role === "user");
  const parsed = extractJsonObject(content);

  if (!parsed) {
    if (hasUserTurn) return scriptedProviderNextStep(payload);
    return {
      phase: "intake" as const,
      reply: "先别急着填问卷——说说你最近经营上最头疼的是哪件事？是获客、回款，还是利润 / 资金？",
      facts: payload?.facts ?? {},
      missing: ["providerType", "acquisition", "receivables", "pressure"],
      suggestedReplies: ["获客太难", "客户压价、账期长", "资金周转紧"],
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

// ──────────────────────── 经营诊断叙事 + 豆服云能力问答 ────────────────────────

interface ReportRequest {
  facts?: Record<string, unknown>;
  task?: "diagnosis" | "followup";
  messages?: { role: "agent" | "user"; content: string }[];
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
          max_tokens: 1100,
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

/** 豆服云对服务商的能力清单（口径与 knowledgeBase 对齐），让 AI 把痛点对应到具体能力。 */
const DOWSURE_CAPABILITIES = `# 豆服云能为服务商解决什么（你诊断后要把他的痛点自然对应到这些能力，点名具体能力，但绝不要报价或编数字）
- 获客难 / 找不到精准客户：AI 智能拓客（按品类、规模出具深度卖家分析报告，精准触达中大卖、T0/T1）、平台首页 Banner 曝光、AI 品牌营销赋能、「大卖有约」游学考察 / 冠名权益。
- 给卖家账期 / 怕坏账 / 回款慢：TermPay 嵌入式金融端口（把账期金融嵌进你的官网 / ERP / 客户后台 / 公众号，受托支付直达）、TermPay 账期风控模型（违约预测 + 授信额度建议，帮你控坏账）。
- 资金周转紧 / 想融资：债权 / 股权融资咨询、公司财务诊断、财税合规指导。
- 合规 / 出海落地：香港跨境电商加速器（落地、资本对接、政策通道）、财税指导。
- 想对接平台资源 / 政策：平台最新政策同步 + 1v1 商务对接、平台资源对接私享会。`;

function buildProviderReportMessages(payload: ReportRequest) {
  const f = payload.facts ?? {};
  const providerType = (f.providerType as string) || "（未明确）";
  const acquisition = (f.acquisition as string) || "（未明确）";
  const receivables = (f.receivables as string) || "（未明确）";
  const pressure = (f.pressure as string) || "（未明确）";
  const extra = [f.scale, f.openConcern].filter(Boolean).join("；") || "（无）";
  const task = payload.task === "followup" ? "followup" : "diagnosis";

  const system = `你是「豆服云」的服务商增长顾问，正在和一位跨境电商服务商聊他的经营。语气自然、口语、像顾问当面聊——不要像表格或问卷那样堆字段、分点罗列。

# 这位服务商的现状（他自己说的）
- 服务商类型 / 主营：${providerType}
- 获客现状 / 最大困难：${acquisition}
- 回款 / 账期 / 坏账：${receivables}
- 经营压力 / 资金：${pressure}
- 其他：${extra}

${DOWSURE_CAPABILITIES}

# 你的任务
${
  task === "diagnosis"
    ? `给一段经营诊断 + 建议（4-6 句，自然口语，可分 2-3 个小段）：① 先点出他在「获客 / 回款 / 经营压力 / 资金」里最关键的 1-2 个瓶颈，讲到他心里去（用他自己的话回扣）；② 自然地把这些瓶颈对应到豆服云能怎么帮他（点名上面清单里的具体能力），让他感到「这平台确实能解决我的问题」；③ 给一条最该先做的建议。最后在 suggestedReplies 里给 3-4 个"想深入了解豆服云哪方面"的简短选项（例如 AI 智能拓客、TermPay 嵌入式 / 账期风控、融资 / 财税、大卖有约 / 品牌曝光）。`
    : `服务商在追问豆服云的某个方面，用上面的能力信息准确、口语地回答（2-4 句），并尽量回扣他的现状。suggestedReplies 给 2-3 个相关的后续问题。`
}

# 只输出 JSON：{"reply":"...","suggestedReplies":["...","..."]}
绝不要编造任何具体价格、授信额度、ROI 或承诺；只描述能力方向，不报数字。`;

  const messages: { role: string; content: string }[] = [{ role: "system", content: system }];
  if (task === "diagnosis") {
    messages.push({ role: "user", content: "（请基于以上现状，给我一份经营诊断和建议。）" });
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

/** 模型失灵时的脚本兜底：用已知现状拼一段自然语言诊断（不报任何数字 / 价格）。 */
function providerReportFallback(payload: ReportRequest) {
  const f = payload.facts ?? {};
  const providerType = (f.providerType as string) || "你这类服务商";
  return {
    reply: `从你说的看，${providerType}现在卡得最明显的，是获客的精准度和回款节奏这两块——找客户费劲、给了账期又怕回款慢、压资金。这其实是豆服云最对得上的地方：获客上可以用 AI 智能拓客按品类和规模帮你精准触达中大卖；回款上可以用 TermPay 嵌入式端口把账期金融接进你的客户流程，再配账期风控模型帮你控坏账。建议先从最痛的那一块切入，我可以分别给你讲讲。`,
    suggestedReplies: [
      "AI 智能拓客怎么帮我找客户？",
      "TermPay 嵌入式怎么接？",
      "账期风控怎么控坏账？",
      "融资 / 财税这块能帮什么？",
    ],
  };
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
