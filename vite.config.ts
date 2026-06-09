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

      // ──────────────────────────────────────────────────────────────
      // 服务商推荐叙事（provider 线 · 自然语言版）
      //   输入：{ facts, candidates:[{name,subs,platforms,regions,strengths,blurb}], task:'recommend'|'followup', messages? }
      //   输出：{ reply, suggestedReplies }
      //   AI 只能从 candidates（前端用 providerCatalog 匹配出的候选）里讲，绝不能另选或编造服务商。
      // ──────────────────────────────────────────────────────────────
      server.middlewares.use("/api/seller-agent/providers", async (req, res) => {
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
          const payload = (await readJsonBody(req)) as ProvidersRequest;
          const model = env.DEEPSEEK_DIAGNOSE_MODEL || "deepseek-v4-pro";
          const parsed = await requestModelJSON(apiKey, model, buildProvidersMessages(payload));
          const fb = providersFallback(payload);
          if (!parsed) {
            server.config.logger.warn("[providers] 模型多次非 JSON，走脚本兜底");
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
            error: "Providers agent failed",
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
        "你是豆服云卖家助手的中文对话润色层。只输出 JSON，格式为 {\"text\":\"...\"}。不要输出 Markdown。不要改变业务结论、问题顺序、金额、币种、单位、选项、产品名或服务商名。尤其不能把“万/元/人民币/月销区间”改成美元或其他单位。purpose 为 next_question 时，只能自然承接用户刚才的回答，并用 nextQuestion.prompt 的原意发问；不要列出、复述、改写或解释任何选项，因为选项已经由 UI 按钮展示。语气自然、简洁、像专业但不压迫的跨境电商顾问；绝不用「兄弟 / 老铁 / 哥们 / 咱 / 老板」这类称兄道弟、套近乎的字眼，称呼对方用「你」或「您」。每次回答控制在 1-3 句。",
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
- 始终是专业、懂行的顾问口吻：称呼对方用「你」或「您」，可以亲和有温度，但**绝不用「兄弟 / 老铁 / 哥们 / 咱 / 老板」这类称兄道弟、套近乎的字眼**，也不油腻、不卖力讨好。

# 你的目标
通过自然、共情的对话，先听懂这位卖家最头疼的事，判断他该走哪条线，再把那条线诊断所需的最少信息收齐。不要像填表，要像一个真正懂行的顾问在和他聊。

# 卖家常见痛点（painPrimary 取值 → 含义 / 信号词）
- cashflow（现金流/账期）：回款慢、账单到期早于回款、现金被压、旺季不敢备货、想晚点付服务商账单
- cost（服务成本）：物流/仓储费贵、报价不透明、利润被附加费吃掉
- stockout（履约/缺货）：旺季时效不稳、断货、怕差评
- provider_quality（服务商靠谱度）：被服务商坑、异常没人管、退款索赔没人扛、怕换错、想换/想找服务商
- compliance（税务合规）：VAT/EPR、合规罚款、商标侵权
- ads（营销推广）：广告打水漂、ROI 低、新品没流量、达人踩坑
- appeal（申诉）：封号、冻结、绩效、解封无门
- tools（运营工具）：多店铺管理乱、刊登/选品/数据靠人肉

# 关键一步：判断走哪条线（line）—— 这是你最重要的判断
卖家进来有两条线，你要根据他真正的诉求判断他属于哪条，并据此决定问什么：
- **termpay（账期/现金流分析）**：他的核心痛是「钱被压住、回款慢、现金紧、旺季不敢备货、想把账单往后缓一缓」。→ line = "termpay"
- **provider（找/换靠谱服务商）**：他的核心诉求是「想找/换某一类服务商、怕踩坑、嫌现在的服务商贵/不稳/售后差」（物流、海外仓、税务合规、收款、营销、运营工具、申诉等）。→ line = "provider"
判断逻辑：
- 现金流/账期/资金被压/想晚点付 → termpay。
- 想找谁来做某件事、想换服务商、怕选错、嫌服务商贵或不稳 → provider。
- 一时聊不清就先共情、再用一句话帮他二选一（例如「你是想先理顺现金、把账期往后挪，还是想先找/换个更靠谱的服务商？」），别急着下结论。

# 各条线的必填槽位（凑齐对应那条线的槽位才算 ready）
所有线都先要 platform（主要平台）和 painPrimary（主痛点）。然后：
- **termpay 线** 还需要：gmvExact（具体月销额）、termDays（回款/账期天数）。
  - gmvExact：要「具体数」，别停在区间。卖家先给区间（如「20-50万」），顺势追一句「大概落在哪个数？比如 35 万左右？」。
  - termDays：问「你的钱大概被压多久」——平台回款 + 给服务商的账期，得一个天数（如 60/90 天）。
- **provider 线** 还需要：serviceCategory（想找哪一类服务商）、servicePain（最怕踩的坑）。
  - serviceCategory 必须取这七类之一（用中文原词）：运营工具、找物流、海外仓储、税务&合规、跨境收款、营销推广、申诉服务。
  - servicePain：他最担心的问题，例如「报价不透明、利润被附加费吃掉」「旺季时效不稳、怕断货」「异常没人处理、退款索赔没人扛」「不知道谁适合我的平台、怕换错」。
  - provider 线不需要月销和账期，别去问 gmvExact / termDays。

# 对话规则
- 开场或信息不足时：用开放式问题让他说出最头疼的事，先共情再追问。
- 一次只聚焦一件事，回复 1-3 句，口语、不压迫、不念选项清单。
- 只在「为了把诊断做准」时才问槽位，并说明为什么问；一次只问一个，不要一上来就索要、也不要一次抛多个问题。
- suggestedReplies 给 2-3 个最可能的简短回答，作为按钮（不要把它们读出来）。
- 金额、额度、能省多少钱、推荐哪家服务商：你绝对不要自己编，这些由系统的确定性引擎/资料库给出。你只负责把痛点和诉求聊清楚。

# 卖家坚持要直接出结果时（重要，必须照做）
如果卖家明确表示不想再答、要你直接给结果（信号词：直接推荐、跳过、别问了、快点、不用问、就这样、先随便看看、你看着办），**立刻停止追问**，把 phase 置为 "ready_to_diagnose"，用已知槽位 + 合理默认先给结果：
- provider 线：serviceCategory 是关键，尽量从他前面说过的话里判断出来（他说「推荐物流服务商」→ serviceCategory=找物流）；servicePain 缺就当作综合靠谱度来挑、platform 缺就按多平台通用。
- termpay 线：月销缺按中等体量、账期缺按 90 天。
- reply 坦诚一句「那我先按通用情况帮你推荐/测算，回头按你的实际情况再细化」，别假装信息很全。
- facts 里只填卖家真实说过的，**不要把默认值当成他确认的事实写进去**（默认值由系统兜底，你只管把 phase 推进到 ready）。

# 只输出 JSON（不要 Markdown、不要解释），结构：
{
  "line": "termpay" | "provider",
  "phase": "intake" | "ready_to_diagnose",
  "reply": "你这一轮要对卖家说的话（1-3句中文）",
  "facts": { "painPrimary": "...", "painDetail": "卖家原话里的具体痛点", "platform": "...", "gmvBand": "卖家给的区间(如有)", "gmvExact": "具体月销(如 35万)", "termDays": "回款/账期(如 90天)", "serviceCategory": "七类之一(provider线)", "servicePain": "最怕的坑(provider线)" },
  "missing": ["还缺哪些必填槽位"],
  "suggestedReplies": ["简短选项1", "简短选项2"]
}
ready 判定（务必严格）：
- line = "termpay"：只有当 platform、gmvExact、termDays 都已知，才把 phase 置为 "ready_to_diagnose"，reply 用一句话过渡到「信息够了，我来帮你算一算」。
- line = "provider"：只有当 platform、serviceCategory、servicePain 都已知，才把 phase 置为 "ready_to_diagnose"，reply 用一句话过渡到「了解了，我从靠谱的服务商里帮你挑几家」。
只要对应线还缺任何一个槽位，phase 必须保持 "intake" 继续追问，绝不要提前下结论、报金额或报服务商。line 一旦能判断就尽早给出，哪怕还在 intake。facts 里只填已确认的字段，未知的省略。`;

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
 * 从已知 facts 粗判走哪条线（仅兜底用，正常由 AI 给 line）。
 * 有服务商类目/坑、或痛点明显指向「找服务商」→ provider；否则默认 termpay。
 */
function inferLine(facts: Record<string, unknown>): "termpay" | "provider" {
  const s = (k: string) => (typeof facts[k] === "string" ? (facts[k] as string) : "");
  if (s("serviceCategory") || s("servicePain")) return "provider";
  const pain = (s("painPrimary") + s("painDetail")).toLowerCase();
  if (/provider_quality|cost|stockout|compliance|ads|appeal|tools/.test(pain)) return "provider";
  if (/找|换|服务商|靠谱|不稳|物流|海外仓|税务|合规|收款|营销|推广|工具|申诉/.test(pain))
    return "provider";
  return "termpay";
}

/**
 * 模型彻底失灵时的「脚本化兜底」：按线、按还缺哪个必填槽位，问下一题。
 * 保证就算 AI 抽风，对话也能继续推进、最终走到诊断，而不是卡在「没接住」死循环。
 */
function scriptedNextStep(payload: DiagnoseRequest) {
  const facts = (payload?.facts ?? {}) as Record<string, unknown>;
  const has = (k: string) => typeof facts[k] === "string" && (facts[k] as string).trim();
  const line = inferLine(facts);

  if (!has("painPrimary")) {
    return {
      line,
      phase: "intake" as const,
      reply: "先帮我对一下焦点——你现在最头疼的，是现金/回款，还是想找/换个更靠谱的服务商？",
      facts,
      missing: ["painPrimary", "platform"],
      suggestedReplies: ["回款太慢、现金紧", "想找/换靠谱服务商", "旺季怕断货"],
    };
  }
  if (!has("platform")) {
    return {
      line,
      phase: "intake" as const,
      reply: "了解。那你主要在哪个平台卖货？",
      facts,
      missing: ["platform"],
      suggestedReplies: ["Amazon", "TikTok Shop", "Amazon + TikTok Shop"],
    };
  }

  if (line === "provider") {
    if (!has("serviceCategory")) {
      return {
        line,
        phase: "intake" as const,
        reply: "你现在想先看哪类服务商？",
        facts,
        missing: ["serviceCategory", "servicePain"],
        suggestedReplies: ["找物流", "海外仓储", "税务&合规"],
      };
    }
    if (!has("servicePain")) {
      return {
        line,
        phase: "intake" as const,
        reply: "这一类里，你最怕踩哪个坑？",
        facts,
        missing: ["servicePain"],
        suggestedReplies: ["报价不透明、被附加费吃掉", "旺季时效不稳、怕断货", "异常没人管、售后没人扛"],
      };
    }
    return {
      line,
      phase: "ready_to_diagnose" as const,
      reply: "了解了，我从靠谱的服务商里帮你挑几家。",
      facts,
      missing: [],
      suggestedReplies: [],
    };
  }

  // termpay 线
  if (!has("gmvExact")) {
    return {
      line,
      phase: "intake" as const,
      reply: "为了把金额算准，能说个大概的具体月销吗？比如 35 万左右——不用很精确。",
      facts,
      missing: ["gmvExact", "termDays"],
      suggestedReplies: ["月销 20 万左右", "月销 50 万左右", "月销 100 万左右"],
    };
  }
  if (!has("termDays")) {
    return {
      line,
      phase: "intake" as const,
      reply: "最后一个：你的钱大概被压多久？也就是平台回款加上给服务商的账期，差不多多少天？",
      facts,
      missing: ["termDays"],
      suggestedReplies: ["60 天左右", "90 天左右", "120 天以上"],
    };
  }
  return {
    line,
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
      line: "termpay" as const,
      phase: "intake" as const,
      reply: "先别急着填表——说说你最近经营上最头疼的是哪件事？",
      facts: payload?.facts ?? {},
      missing: ["painPrimary", "platform"],
      suggestedReplies: ["回款太慢、现金紧", "服务商不靠谱想换", "旺季怕断货"],
    };
  }

  const mergedFacts = {
    ...(payload?.facts ?? {}),
    ...(typeof parsed.facts === "object" && parsed.facts ? parsed.facts : {}),
  };
  const line = parsed.line === "provider" ? "provider" : parsed.line === "termpay" ? "termpay" : inferLine(mergedFacts);

  return {
    line,
    phase: parsed.phase === "ready_to_diagnose" ? "ready_to_diagnose" : "intake",
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "嗯，我在听——再多说一点你的情况？",
    facts: mergedFacts,
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

  const system = `你是「豆服云」的经营诊断顾问，正在和一位卖家聊他的现金流。语气是专业、沉稳、懂行的顾问当面聊——自然、口语、不分点罗列、不堆字段；可以亲和有温度，但**绝不用「兄弟 / 老铁 / 哥们 / 咱 / 老板」这类称兄道弟、套近乎的字眼**，称呼对方用「你」或「您」即可。

# 引用口径（重要）
讲数据来源时，统一说"根据行业数据测算/行业平均估算"即可，不要点名某一份具体报告（比如某某报告、某某机构年度报告）——反复引用同一份会显得只有单一来源、不够权威。

# 已知事实（数字均由系统按行业系数算好，你只能引用，绝不能自己另外编任何金额）
- 平台：${platform}
- 月销：${gmvLabel}
- 回款/账期：约 ${termLabel}
- 账期占用现金（账压）：约 ${fmtCNYServer(n.cashLock ?? 0)}（= 月销 × 11.85% × 账期/90天；按行业数据测算）
- 用 TermPay 延期约 ${n.days ?? 90} 天可释放的现金：约 ${fmtCNYServer(n.termpayRelease ?? 0)}

# TermPay（豆分期 / Dowsure Pay in 4）是什么
跨境卖家「先用后付」工具：把采购、物流/仓储、营销这些服务商账单延期（可分期），放款直接打到服务商账户（受托支付）；免息（服务商贴息）或固定手续费，费用透明、无隐藏；按期还款。它不是贷款，是把你的付款账期往后挪。（额度怎么说见下方专门口径。）
申请很简单：提供相关账单 + 付款凭证就能用上账期。它覆盖的采购/物流/营销，正是卖家最大的几块跨境支出（约占七成）。
背书：由豆沙包（Dowsure）对接持牌金融机构提供——Dowsure 2017 年在国内首创跨境电商保险、2019 年起与银行合作金融产品，已累计助力跨境行业融资破 66 亿，资金与授信审批由合作机构承担。

# 行业背景（可引用，用来说明 TermPay 为什么有用）
据 Dowsure 调研，过半跨境卖家很难从服务商处拿到账期，且账期普遍集中在 30 天内——这正是 TermPay 要补的缺口：把这段被压住的现金提前盘活。

# 额度怎么说（重要口径，必须照做）
- 额度不是"按月销乘个固定倍数"算的。真实做法是：授权后接入卖家亚马逊店铺近半年的真实经营数据来评估，最高 100 万元，具体额度以授权测算 + 官方审核为准。
- 卖家问"我能拿多少额度"时：就讲"看你店铺近半年的真实经营数据来定、最高 100 万、以授权测算和官方审核为准"，给他确定性和安全感。
- 绝对不要报一个具体的额度数字（如"你大概能拿 XX 万"），也绝对不要透露评估的百分比、比例或任何风控模型细节——这些是不对外的。

# 你的任务
${
  task === "diagnosis"
    ? `给出一段现金流诊断（4–6 句，自然口语，像顾问当面算给他听）。重点：先讲清楚"这个数怎么来的"再亮数，别让数字凭空蹦出来——
① 先说比例的出处与估算逻辑：跨境卖家平均约有 11.85% 的月销会卡在回款时间差里（根据行业数据综合测算），账期越长压得越多，所以按"月销 × 11.85% × 你的账期÷90天"来估；
② 然后代入他的月销和账期，自然地报出账压金额（约 ${fmtCNYServer(n.cashLock ?? 0)}），把"这笔钱此刻正躺在回款里、动不了"的痛感讲到他心里去；
③ 最后自然过渡到 TermPay 怎么帮他把这笔现金提前释放出来。
口径要诚实：这是"按行业平均估算"，不是他账上的精确数——可以说"大致测算""估个量级"，不要说成铁定如此。
最后在 suggestedReplies 里给 3–4 个"想了解 TermPay 哪方面"的简短选项（例如额度、费用/账期、放款方式、和借贷的区别）。`
    : `卖家在追问 TermPay 的某个方面，用上面的产品信息准确、口语地回答（2–4 句）。若他问"这个比例/数字怎么算的"，就如实讲：月销 × 11.85%（按行业数据测算）× 账期÷90天，并说明这是行业平均估算、非精确账目。suggestedReplies 给 2–3 个相关的后续问题。`
}

# 只输出 JSON：{"reply":"...","suggestedReplies":["...","..."]}
再次强调：① 涉及「卖家自己的钱」（账压、可释放现金）只能用上面系统算好的金额，绝不能自己另编；② 额度只说"看店铺近半年数据、最高 100 万、以审核为准"，不要报具体额度数字、不要透露评估比例/模型；③ 上面给出的行业数据（如账期普遍 30 天内、覆盖约七成支出、融资破 66 亿）可以自然引用，但不要再编造其它没给过的数字，也不要自己做乘除推算出新数字（如能省多少 / 回本几个月 / ROI）。`;

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
    } 天，亚马逊卖家平均约有 11.85% 的销售额卡在回款时间差里（按行业数据测算）——也就是说大约 ${fmtCNYServer(
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

// ──────────────────────── 服务商推荐叙事 ────────────────────────

interface ProviderCandidate {
  name?: string;
  tier?: "certified" | "partner";
  subs?: string[];
  platforms?: string[];
  regions?: string[];
  strengths?: string;
  blurb?: string;
}
interface ProvidersRequest {
  facts?: Record<string, unknown>;
  candidates?: ProviderCandidate[];
  task?: "recommend" | "followup";
  /** 卖家要求「直接推荐、别多问」时为 true：推荐走极简、不铺垫。 */
  brief?: boolean;
  messages?: { role: "agent" | "user"; content: string }[];
}

function candidateLines(candidates: ProviderCandidate[]): string {
  return candidates
    .map((c, i) => {
      const parts = [
        `${i + 1}. ${c.name ?? "（未命名）"}${c.tier === "certified" ? "【豆沙包高级认证服务商】" : ""}`,
        c.strengths ? `优势：${c.strengths}` : "",
        c.subs?.length ? `能力：${c.subs.join("、")}` : "",
        c.platforms?.length ? `擅长平台：${c.platforms.join("、")}` : "",
        c.regions?.length ? `覆盖：${c.regions.join("、")}` : "",
        c.blurb ? `简介：${c.blurb}` : "",
      ].filter(Boolean);
      return parts.join("；");
    })
    .join("\n");
}

function buildProvidersMessages(payload: ProvidersRequest) {
  const f = payload.facts ?? {};
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const platform = (f.platform as string) || "你的平台";
  const category = (f.serviceCategory as string) || "你要找的这一类";
  const pain = (f.servicePain as string) || "你最担心的问题";
  const task = payload.task === "followup" ? "followup" : "recommend";

  const system = `你是「豆服云」的资深跨境电商顾问，正在帮一位卖家挑「${category}」类的服务商。语气是专业、沉稳、懂行的顾问当面聊——自然、口语、不像表格或广告、不夸大；可以亲和有温度，但**绝不用「兄弟 / 老铁 / 哥们 / 咱 / 老板」这类称兄道弟、套近乎的字眼**，称呼对方用「你」或「您」即可。

# 卖家情况
- 平台：${platform}
- 想找的服务商类型：${category}
- 最怕踩的坑：${pain}

# 你只能从下面这份「候选服务商名单」里推荐（按匹配度排序，已由系统从豆服云资料库筛出）
${candidates.length ? candidateLines(candidates) : "（暂无匹配候选——老实告诉卖家这一类暂时没有合适的，建议留个联系方式让豆服云人工帮他匹配。）"}

# 铁律
- 绝对不要推荐名单之外的任何服务商，也不要编造名单里没有的能力、平台、区域、价格或数据。
- 名单里没写的细节（如具体报价、时效天数）就不要编，可以说「具体可以让豆服云帮你对接确认」。
- 不要把名单当广告念，要结合他的平台(${platform})和他怕的坑(${pain})解释「为什么这家适合他、怎么帮他避坑」。
- 标【豆沙包高级认证服务商】的是豆沙包重点推荐、深度合作的服务商，请优先推荐、放在最前面讲，并可点出「这家是豆沙包高级认证的合作伙伴，对接和售后更有保障」；其余为普通合作服务商，正常介绍即可，不要贬低。

# 你的任务
${
  task === "followup"
    ? `卖家在追问某一家或某个方面，基于名单信息口语作答（2–4 句）。名单里没有的就别编，引导他让豆服云对接确认。suggestedReplies 给 2–3 个相关后续问题。`
    : payload.brief
    ? `卖家已经明确说不想多聊、要你直接给。请极简推荐，最多 2–3 句：
- 不要任何铺垫开场（别写「选 XX 最怕的坑就是…」这种），直接点名最合适的 2–3 家（带【豆沙包高级认证服务商】的放最前），每家半句话理由就够。
- 收尾一句「想更准就告诉我平台和顾虑，或让豆服云帮你对接报价/时效」。
suggestedReplies 给 3–4 个简短选项（例如「帮我对接 XX」「XX 和 XX 怎么选」「还有别的吗」）。`
    : `给一段推荐（4–6 句，自然口语）：先点出他这类需求挑服务商时最该看的 1-2 个关键点（结合他怕的坑），再从名单里挑最合适的 2-3 家、各用一句话说清「适合他的理由」，最后自然收一句「想深入了解哪家、或让豆服云帮你牵线对接」。
最后在 suggestedReplies 里给 3–4 个简短后续选项（例如「XX 和 XX 怎么选」「帮我对接 XX」「还有别的吗」「怎么避免被附加费坑」）。`
}

# 数字红线
名单里没有的数字一律不编：不报价格 / 折扣 / "省多少%" / 评分 / 成交量这类具体数。名单里有的照引，没有就用文字定性说（"性价比突出""口碑稳"），并引导让豆服云核实对接。

# 只输出 JSON：{"reply":"...","suggestedReplies":["...","..."]}`;

  const messages: { role: string; content: string }[] = [{ role: "system", content: system }];
  if (task === "recommend") {
    messages.push({ role: "user", content: "（请基于以上候选，给我服务商推荐。）" });
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

/** 模型失灵时的脚本兜底：直接用候选名单拼一段推荐（仍只用名单里的信息）。 */
function providersFallback(payload: ProvidersRequest) {
  const f = payload.facts ?? {};
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const category = (f.serviceCategory as string) || "这一类";
  if (!candidates.length) {
    return {
      reply: `${category}里暂时没匹配到特别合适的，我先把你的需求记下，让豆服云的顾问人工帮你对接靠谱的服务商，好吗？`,
      suggestedReplies: ["好，帮我对接", "换一类看看", "我再想想"],
    };
  }
  const top = candidates.slice(0, 3);
  const lines = top
    .map((c) => `「${c.name}」${c.strengths ? `——${c.strengths}` : ""}`)
    .join("；");
  return {
    reply: `按你的情况，${category}里我先帮你挑了这几家：${lines}。具体报价和时效可以让豆服云帮你对接确认。想先深入了解哪家？`,
    suggestedReplies: [
      ...top.slice(0, 2).map((c) => `多讲讲「${c.name}」`),
      "帮我对接其中一家",
      "还有别的吗？",
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
