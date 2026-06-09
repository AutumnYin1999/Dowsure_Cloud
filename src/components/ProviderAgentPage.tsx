import { ArrowRight, Bot, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./seller-desk.css";
import "./seller-chat.css";

/**
 * /provider-agent —— AI 驱动的「服务商」增长诊断对话页。
 *
 * 取代原服务商问卷流（QuestionnairePage → Analyzing → Diagnosis → Recommendation）：
 * 现在用聊天的方式收集服务商经营现状，边聊边说明豆服云能帮服务商解决什么，最后给一份
 * 经营诊断报告 + 建议。结构对标卖家版 /seller-agent，但领域是服务商、产出是定性诊断。
 *
 * 两个阶段：
 *  ① intake：AI 大脑自主追问，收集 服务商类型/获客困难/回款账期/经营压力（/api/provider-agent/diagnose）。
 *  ② report：槽位齐了 → AI 用自然语言给经营诊断 + 建议，并把痛点对应到豆服云的能力，
 *     再自由问答豆服云怎么帮他（/api/provider-agent/report）。
 *
 * 与卖家版不同：服务商诊断是定性建议，没有必须由引擎保证的硬金额；但 AI 仍禁止编造
 * 权益价格 / 授信承诺（见 provider-agent-plugin.ts 的系统提示）。
 */

type ChatMsg = { id: number; role: "agent" | "user"; text: string };
type Stage = "intake" | "report";

/** 服务商经营现状的对话槽位（AI 增量填充，前端只透传）。 */
type ProviderFacts = {
  providerType?: string; // 服务商类型 / 主营环节
  acquisition?: string; // 获客方式 + 最大困难
  receivables?: string; // 结算方式 / 账期 / 坏账 / 回款周期
  pressure?: string; // 最大经营压力 + 资金紧张度
  scale?: string; // 规模 / 客户数（选填）
  openConcern?: string; // 一句话最头疼（选填）
  [k: string]: string | undefined;
};

interface BrainResponse {
  phase: "intake" | "ready_to_diagnose";
  reply: string;
  facts: ProviderFacts;
  missing: string[];
  suggestedReplies: string[];
}
interface ReportResponse {
  reply: string;
  suggestedReplies: string[];
}

async function callBrain(
  messages: { role: "agent" | "user"; content: string }[],
  facts: ProviderFacts
): Promise<BrainResponse> {
  const res = await fetch("/api/provider-agent/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, facts }),
  });
  if (!res.ok) throw new Error(`brain ${res.status}`);
  return (await res.json()) as BrainResponse;
}

async function callReport(body: {
  facts: ProviderFacts;
  task: "diagnosis" | "followup";
  messages?: { role: "agent" | "user"; content: string }[];
}): Promise<ReportResponse> {
  const res = await fetch("/api/provider-agent/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`report ${res.status}`);
  return (await res.json()) as ReportResponse;
}

export function ProviderAgentPage({ onHome }: { onHome?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [facts, setFacts] = useState<ProviderFacts>({});
  const [stage, setStage] = useState<Stage>("intake");
  const [suggested, setSuggested] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const nextId = () => ++idRef.current;

  const inputPlaceholder = thinking
    ? "AI 正在思考…"
    : suggested.length
    ? `直接打字，或参考上面，比如「${suggested.slice(0, 2).join("」「")}」`
    : stage === "report"
    ? "想了解豆服云怎么帮你？直接问我"
    : "直接打字告诉我你的情况，比如「获客太难」「客户压价、账期还长」";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking, suggested]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runIntake([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushAgent(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text }]);
  }
  function apiHistory(list: ChatMsg[]) {
    return list.map((m) => ({ role: m.role, content: m.text }));
  }

  // 阶段①：意图收集（AI 大脑）。槽位齐了 → 过渡到经营诊断报告。
  // baseFacts 显式传入：restart 时 setFacts({}) 还没生效，闭包里的 facts 仍是旧值，
  // 必须把要用的 facts 当参数传进来，否则“重新开始”会把上一轮的 facts 发给 AI（上下文没清）。
  async function runIntake(
    history: { role: "agent" | "user"; content: string }[],
    baseFacts: ProviderFacts = facts
  ) {
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callBrain(history, baseFacts);
      const merged = { ...baseFacts, ...data.facts };
      setFacts(merged);
      pushAgent(data.reply);

      if (data.phase === "ready_to_diagnose") {
        setStage("report");
        const diag = await callReport({ facts: merged, task: "diagnosis" });
        pushAgent(diag.reply);
        setSuggested(diag.suggestedReplies ?? []);
      } else {
        setSuggested(data.suggestedReplies ?? []);
      }
    } catch {
      pushAgent("网络好像断了一下，能再说一次吗？（或检查 DEEPSEEK_API_KEY 是否配好）");
    } finally {
      setThinking(false);
    }
  }

  // 阶段②：诊断报告后的自由问答（豆服云怎么帮你）。
  async function runReport(history: { role: "agent" | "user"; content: string }[]) {
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callReport({ facts, task: "followup", messages: history });
      pushAgent(data.reply);
      setSuggested(data.suggestedReplies ?? []);
    } catch {
      pushAgent("这条没接住，能再问一次吗？");
    } finally {
      setThinking(false);
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput("");
    const userMsg: ChatMsg = { id: nextId(), role: "user", text: trimmed };
    const history = [...apiHistory(messages), { role: "user" as const, content: trimmed }];
    setMessages((prev) => [...prev, userMsg]);
    if (stage === "intake") void runIntake(history);
    else void runReport(history);
  }

  function restart() {
    idRef.current = 0;
    setMessages([]);
    setFacts({});
    setStage("intake");
    setSuggested([]);
    setInput("");
    void runIntake([], {}); // 强制用空 facts，绕开 setFacts 异步未生效导致的旧上下文残留
  }

  return (
    <div className="seller-desk">
      <div className="desk-bg" aria-hidden />
      <section className="seller-chat">
        <div className="desk-head" style={{ paddingBottom: 18 }}>
          <span className="pill">
            <span className="pulse" />
            豆服云 · 服务商增长诊断 · DeepSeek 驱动（测试版）
          </span>
          <h1>像聊天一样，帮你把获客和经营问题聊清楚</h1>
          <p>不用填问卷 —— 说说你最近最头疼的事，我顺着帮你把经营现状理清楚，给你一份诊断和建议。</p>
        </div>

        <div className="chat-card">
          <div className="chat-scroll">
            {messages.map((m) => (
              <div key={m.id} className={"msg " + m.role}>
                <div className="avatar">{m.role === "agent" ? <Bot size={17} /> : "你"}</div>
                <div className="bubble">{m.text}</div>
              </div>
            ))}
            {thinking ? (
              <div className="msg agent">
                <div className="avatar">
                  <Bot size={17} />
                </div>
                <div className="thinking">
                  <span className="tdot" style={{ animationDelay: "0s" }} />
                  <span className="tdot" style={{ animationDelay: "0.18s" }} />
                  <span className="tdot" style={{ animationDelay: "0.36s" }} />
                  <span className="label">AI 正在思考…</span>
                </div>
              </div>
            ) : null}

            {!thinking && suggested.length ? (
              <div className="flow-options">
                {suggested.map((s) => (
                  <button key={s} type="button" className="opt-chip" onClick={() => send(s)}>
                    <span className="opt-text">{s}</span>
                    <ArrowRight className="opt-arrow" size={15} />
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="composer">
            <div className="input-row">
              <input
                className="input"
                value={input}
                disabled={thinking}
                placeholder={inputPlaceholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send(input);
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={thinking || !input.trim()}
                onClick={() => send(input)}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="chat-actions">
          <button type="button" className="btn btn-ghost" onClick={restart}>
            <RotateCcw size={15} />
            重新开始
          </button>
          {onHome ? (
            <button type="button" className="btn btn-soft" onClick={onHome}>
              返回首页
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
