import { ArrowRight, Bot, RotateCcw, Send, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./seller-desk.css";
import "./seller-chat.css";
import {
  creditRatioFromText,
  diagnoseProviderEconomics,
  monthlyRevenueFromText,
  type ProviderEconomics,
  type ProviderFacts,
} from "@/core/providerEconomics";
import { providerFactsToProfile } from "@/core/providerFactsToProfile";
import type { ProviderProfile } from "@/types";

/**
 * /provider-agent —— 服务商 TermPay（豆分期）成交诊断 Agent。
 *
 * 取代原服务商问卷流：用聊天收集经营现状（复用问卷 schema 的枚举字段），算出有出处的
 * 金额痛点，再把痛点对应到 TermPay 怎么帮服务商「提前回款 + 卸坏账」，促成交。
 *
 * 两个阶段：
 *  ① intake：AI 大脑递进式追问，收集 服务商类型/规模(月营收)/结算方式/账期/坏账（/api/provider-agent/diagnose）。
 *     槽位齐 → 前端确定性引擎 diagnoseProviderEconomics() 算出金额（单一数据源、有出处）。
 *  ② report：AI 用自然语言给经营诊断 + TermPay 方案，只引用引擎算好的数（不自己编）（/api/provider-agent/report）。
 *
 * 红线：金额只由引擎算，AI 永远不碰数字。
 */

type ChatMsg = { id: number; role: "agent" | "user"; text: string };
/**
 * intake：收集槽位 → teaser：软提示 + 粗数 + 邀约（二选一）
 * refine：用户要详细 → 补 1-2 个真实数据（可跳过）→ report：详细长报告 + 自由问答
 */
type Stage = "intake" | "teaser" | "refine" | "report";

/**
 * 服务商主营类别（开场选项）。合并自项目已有分类（SellerChatPage / serviceTaxonomy）+ 截图那套，
 * 并补上锚定画像「海外仓储」。providerType 在引擎里只作展示标签、不参与算钱，故用中文类别即可。
 * 要增减类别，改这一处即可。
 */
const PROVIDER_TYPE_CATEGORIES = [
  "海外仓储",
  "物流服务",
  "供应链全托管",
  "跨境收款",
  "财税合规",
  "海外营销",
  "选品 / 软件工具",
  "全球开店",
  "知识产权",
  "申诉服务",
  "其他",
];

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
  numbers: ProviderEconomics;
  task: "teaser" | "fullReport" | "followup";
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

export function ProviderAgentPage({
  onHome,
  onConfirmOrder,
}: {
  onHome?: () => void;
  /** 客户决定下单：把对话收集的 facts 桥接成 profile，跳到购物车页（权益方案）。 */
  onConfirmOrder?: (profile: ProviderProfile) => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [facts, setFacts] = useState<ProviderFacts>({});
  const [numbers, setNumbers] = useState<ProviderEconomics | null>(null);
  const [stage, setStage] = useState<Stage>("intake");
  const [suggested, setSuggested] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const nextId = () => ++idRef.current;

  const inputPlaceholder = thinking
    ? "AI 正在思考…"
    : stage === "refine"
    ? "比如「月营收 800 万，约七成给账期」，或点「按现在的估算直接出」"
    : suggested.length
    ? `直接打字，或点上面的选项，比如「${suggested.slice(0, 2).join("」「")}」`
    : stage === "report"
    ? "想了解豆服云权益怎么帮你？直接问我"
    : "直接打字告诉我你的情况，比如「我们是海外仓」「给大卖 60 天账期」";

  useEffect(() => {
    const last = messages[messages.length - 1];
    // 新 AI 回复：把它的顶部对齐到可视区顶部，让人从头读、不用往上划；
    // 思考中 / 用户刚发：滚到底，露出最新输入与「正在思考」。
    if (!thinking && last?.role === "agent") {
      lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, thinking, suggested]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 开场用静态问候，不调 API —— 页面秒开，避免一进来就卡在 DeepSeek 调用上。
  // 大脑从用户第一句回复开始接管（runIntake 会带上这条问候作为上下文）。
  function greet() {
    pushAgent("我是豆服云的顾问。先认识一下你的生意——你主要做哪类跨境服务？选一个最接近的，或直接打字告诉我。");
    setSuggested(PROVIDER_TYPE_CATEGORIES);
  }

  function pushAgent(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text }]);
  }
  function apiHistory(list: ChatMsg[]) {
    return list.map((m) => ({ role: m.role, content: m.text }));
  }

  // 阶段①：意图收集（AI 大脑）。槽位齐了 → 引擎算钱 → 过渡到诊断报告。
  // baseFacts 显式传入：restart 时 setFacts({}) 还没生效，闭包里的 facts 仍是旧值，
  // 必须把要用的 facts 当参数传进来，否则“重新开始”会把上一轮的 facts 发给 AI。
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
        // 槽位齐 → 算钱 → 先给「软提示 teaser」（粗数 + 邀约），不一上来糊一大段。
        const econ = diagnoseProviderEconomics(merged);
        setNumbers(econ);
        setStage("teaser");
        const teaser = await callReport({ facts: merged, numbers: econ, task: "teaser" });
        pushAgent(teaser.reply);
        setSuggested(
          teaser.suggestedReplies ?? ["要，帮我精算一份明细", "够了，直接看权益方案"]
        );
      } else {
        setSuggested(data.suggestedReplies ?? []);
      }
    } catch {
      pushAgent("网络好像断了一下，能再说一次吗？（或检查 DEEPSEEK_API_KEY 是否配好）");
    } finally {
      setThinking(false);
    }
  }

  // 阶段②：诊断 / TermPay 自由问答。
  async function runReport(history: { role: "agent" | "user"; content: string }[]) {
    if (!numbers) return;
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callReport({ facts, numbers, task: "followup", messages: history });
      pushAgent(data.reply);
      setSuggested(data.suggestedReplies ?? []);
    } catch {
      pushAgent("这条没接住，能再问一次吗？");
    } finally {
      setThinking(false);
    }
  }

  // teaser 之后：用户二选一。够了→直接进购物车；要详细→进 refine 问真实数据。
  async function handleTeaserChoice(text: string) {
    if (/看方案|看权益|直接|够了|不用|先看|够用|跳过|不必|不想/.test(text)) {
      if (onConfirmOrder) {
        onConfirmOrder(providerFactsToProfile(facts));
        return;
      }
    }
    // 要详细 → 进 refine。静态问句，秒回、不调 API、不抽风。
    setStage("refine");
    pushAgent(
      "好。给我两个更准的数，报告就贴你的实际、不再用行业估算：\n\n① 你实际月营收大概多少？\n② 给账期的客户大概占几成？\n\n嫌麻烦也行，点下面「按现在的估算直接出」，我立刻给你拉完整版。"
    );
    setSuggested(["按现在的估算直接出"]);
  }

  // refine：解析用户补的真实数据（营收 / 给账期占比），重算引擎，再出详细长报告。
  async function handleRefine(text: string) {
    const skip = /估算|就这样|按现在|直接出|跳过|不用|懒得|随便|都行/.test(text);
    let merged = facts;
    if (!skip) {
      const rev = monthlyRevenueFromText(text);
      const ratio = creditRatioFromText(text);
      merged = {
        ...facts,
        ...(rev > 0 ? { monthlyRevenue: text } : {}),
        ...(ratio !== undefined ? { creditRatioOverride: ratio } : {}),
      };
      setFacts(merged);
    }
    setThinking(true);
    setSuggested([]);
    try {
      const econ = diagnoseProviderEconomics(merged);
      setNumbers(econ);
      setStage("report");
      const rep = await callReport({ facts: merged, numbers: econ, task: "fullReport" });
      pushAgent(rep.reply);
      setSuggested(rep.suggestedReplies ?? []);
    } catch {
      setStage("report");
      pushAgent("这份报告没生成出来，能再说一次吗？");
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
    else if (stage === "teaser") void handleTeaserChoice(trimmed);
    else if (stage === "refine") void handleRefine(trimmed);
    else void runReport(history);
  }

  function restart() {
    idRef.current = 0;
    setMessages([]);
    setFacts({});
    setNumbers(null);
    setStage("intake");
    setSuggested([]);
    setInput("");
    greet(); // 静态开场，秒回，不调 API
  }

  return (
    <div className="seller-desk">
      <div className="desk-bg" aria-hidden />
      <section className="seller-chat">
        <div className="desk-head" style={{ paddingBottom: 18 }}>
          <span className="pill">
            <span className="pulse" />
            豆服云 · 服务商经营诊断 · DeepSeek 驱动（测试版）
          </span>
          <h1>服务商权益匹配智能体</h1>
          <p>不用填问卷 —— 说说你的经营情况，我帮你看清获客、回款、资金这些卡点，给你一套适合的豆服云权益方案（含 TermPay 帮你提前回款、卸掉坏账）。</p>
        </div>

        <div className="chat-card">
          <div className="chat-scroll">
            {messages.map((m, i) => (
              <div
                key={m.id}
                ref={i === messages.length - 1 ? lastMsgRef : undefined}
                className={"msg " + m.role}
              >
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
          {stage !== "intake" && onConfirmOrder ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConfirmOrder(providerFactsToProfile(facts))}
            >
              <ShoppingCart size={15} />
              查看适合我的权益方案
              <ArrowRight size={15} />
            </button>
          ) : null}
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
