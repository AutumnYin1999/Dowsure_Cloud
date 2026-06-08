import { ArrowRight, Bot, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./seller-desk.css";
import "./seller-chat.css";
import { diagnoseEconomics, type SellerEconomics, type SellerFacts } from "@/core/sellerEconomics";

/**
 * /agent —— AI 驱动的卖家诊断对话页（C 方案 · 自然语言诊断版）。
 *
 * 两个阶段：
 *  ① intake：DeepSeek 大脑自主追问，收集 平台/月销/主痛点（/api/seller-agent/diagnose）。
 *  ② termpay：槽位齐了 → 引擎算出有出处的金额 → AI 用「自然语言」给现金流诊断、引用行业报告、
 *     自然引出 TermPay，并给几个选项让用户选了解 TermPay 的哪方面（/api/seller-agent/cashflow）。
 *
 * 数字只由引擎算（单一数据源、有出处），AI 只负责把它讲成话——不自己编数字。
 */

type ChatMsg = { id: number; role: "agent" | "user"; text: string };
type Stage = "intake" | "termpay";

interface BrainResponse {
  phase: "intake" | "ready_to_diagnose";
  reply: string;
  facts: SellerFacts;
  missing: string[];
  suggestedReplies: string[];
}
interface CashflowResponse {
  reply: string;
  suggestedReplies: string[];
}

async function callBrain(
  messages: { role: "agent" | "user"; content: string }[],
  facts: SellerFacts
): Promise<BrainResponse> {
  const res = await fetch("/api/seller-agent/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, facts }),
  });
  if (!res.ok) throw new Error(`brain ${res.status}`);
  return (await res.json()) as BrainResponse;
}

async function callCashflow(body: {
  facts: SellerFacts;
  numbers: SellerEconomics;
  task: "diagnosis" | "followup";
  messages?: { role: "agent" | "user"; content: string }[];
}): Promise<CashflowResponse> {
  const res = await fetch("/api/seller-agent/cashflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`cashflow ${res.status}`);
  return (await res.json()) as CashflowResponse;
}

export function AgentChatPage({ onHome }: { onHome?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [facts, setFacts] = useState<SellerFacts>({});
  const [numbers, setNumbers] = useState<SellerEconomics | null>(null);
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
    : stage === "termpay"
    ? "想了解 TermPay 的什么？直接问我"
    : "直接打字告诉我你的情况，比如「旺季老断货」「回款太慢」";

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

  // 阶段①：意图收集（AI 大脑）。槽位齐了 → 过渡到现金流诊断。
  async function runIntake(history: { role: "agent" | "user"; content: string }[]) {
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callBrain(history, facts);
      const merged = { ...facts, ...data.facts };
      setFacts(merged);
      pushAgent(data.reply);

      if (data.phase === "ready_to_diagnose") {
        const econ = diagnoseEconomics(merged);
        setNumbers(econ);
        setStage("termpay");
        const diag = await callCashflow({ facts: merged, numbers: econ, task: "diagnosis" });
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

  // 阶段②：TermPay 自由问答。
  async function runTermpay(history: { role: "agent" | "user"; content: string }[]) {
    if (!numbers) return;
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callCashflow({ facts, numbers, task: "followup", messages: history });
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
    else void runTermpay(history);
  }

  function restart() {
    idRef.current = 0;
    setMessages([]);
    setFacts({});
    setNumbers(null);
    setStage("intake");
    setSuggested([]);
    setInput("");
    void runIntake([]);
  }

  return (
    <div className="seller-desk">
      <div className="desk-bg" aria-hidden />
      <section className="seller-chat">
        <div className="desk-head" style={{ paddingBottom: 18 }}>
          <span className="pill">
            <span className="pulse" />
            豆服云 AI 诊断 · DeepSeek 驱动（测试版）
          </span>
          <h1>像聊天一样，我来帮你诊断经营问题</h1>
          <p>不用填表 —— 说说你最近最头疼的事，我会顺着帮你把问题聊清楚、算明白。</p>
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
