import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

export default defineConfig({
  plugins: [react(), deepseekAgentPlugin()],
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
