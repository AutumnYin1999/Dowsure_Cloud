import { ArrowRight, BadgeCheck, Bot, MapPin, RotateCcw, Send, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./seller-desk.css";
import "./seller-chat.css";
import { diagnoseEconomics, type SellerEconomics, type SellerFacts } from "@/core/sellerEconomics";
import {
  matchProviders,
  painFromLabel,
  PROVIDER_TIER_LABEL,
  type SellerProvider,
} from "@/data/providerCatalog";
import { categoryByLabel, SERVICE_TAXONOMY } from "@/schema/serviceTaxonomy";

/**
 * /agent —— AI 驱动的卖家诊断对话页（C 方案 · 自然语言诊断版）。
 *
 * 大脑先判断走哪条线（line），再按对应线收集槽位、出诊断：
 *  ① intake：DeepSeek 大脑自主追问 + 判断 line（/api/seller-agent/diagnose）。
 *  ② termpay 线：槽位齐了 → 引擎算出有出处的金额 → AI 用自然语言给现金流诊断、引出 TermPay
 *     （/api/seller-agent/cashflow）。
 *  ③ provider 线：槽位齐了 → providerCatalog 确定性匹配出候选 → AI 用自然语言讲为什么推荐、
 *     怎么避坑（/api/seller-agent/providers）。
 *
 * 红线：数字只由引擎算、服务商只从资料库匹配（单一数据源、有出处），AI 只负责把它讲成话——不自己编。
 */

type ChatMsg = {
  id: number;
  role: "agent" | "user";
  text: string;
  /** 服务商推荐时附带的资料卡（弹卡片）。 */
  cards?: SellerProvider[];
};
type Line = "termpay" | "provider";
type Stage = "intake" | "termpay" | "provider";

interface BrainResponse {
  line: Line;
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
interface ProvidersResponse {
  reply: string;
  suggestedReplies: string[];
}

/**
 * 固定开场白（不发请求，秒出）。
 * 原来进页面要调大脑 API 生成开场，转圈慢；开场不带任何 facts，写死即可，
 * 等用户说了第一句再请求大脑判断 line / 收集槽位。
 */
const OPENING_REPLY =
  "你好，我是豆服云的诊断助手 👋 说说你最近经营上最头疼的事——是想理顺现金、把账期往后挪，还是想找/换个更靠谱的服务商？我顺着帮你聊清楚、算明白。";
const OPENING_SUGGESTED = ["回款太慢、现金紧", "想找/换靠谱服务商", "旺季怕断货"];

/** 把大脑给的服务商类目文案（可能不规范）解析成 serviceTaxonomy 的 key。 */
function resolveCategoryKey(label?: string): string | undefined {
  if (!label) return undefined;
  const exact = categoryByLabel(label);
  if (exact) return exact.key;
  const s = label.toLowerCase();
  for (const c of SERVICE_TAXONOMY) {
    if (s.includes(c.label) || c.label.includes(label)) return c.key;
    if (c.subs.some((sub) => s.includes(sub.toLowerCase()))) return c.key;
  }
  if (/物流|货代|头程|专线|快递|小包/.test(s)) return "logistics";
  if (/仓|代发|海外仓/.test(s)) return "warehouse";
  if (/税|vat|epr|合规|商标|专利/.test(s)) return "tax";
  if (/收款|支付|结汇|回款|payoneer|pingpong/.test(s)) return "payment";
  if (/营销|推广|广告|达人|红人|kol|tiktok/.test(s)) return "marketing";
  if (/erp|工具|运营|刊登|选品|数据/.test(s)) return "operation";
  if (/申诉|解封|封号|冻结|侵权/.test(s)) return "appeal";
  return undefined;
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

/** 判断卖家是不是「别问了，直接推荐」——用于让推荐走极简、不铺垫。 */
function wantsDirect(history: { role: "agent" | "user"; content: string }[]): boolean {
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  return /直接|随便|跳过|别问|别管|快点|不用问|就这样|你看着办|赶紧|懒得|简单点|别废话/.test(lastUser);
}

async function callProviders(body: {
  facts: SellerFacts;
  candidates: SellerProvider[];
  task: "recommend" | "followup";
  brief?: boolean;
  messages?: { role: "agent" | "user"; content: string }[];
}): Promise<ProvidersResponse> {
  const res = await fetch("/api/seller-agent/providers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`providers ${res.status}`);
  return (await res.json()) as ProvidersResponse;
}

export function AgentChatPage({ onHome }: { onHome?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [facts, setFacts] = useState<SellerFacts>({});
  const [numbers, setNumbers] = useState<SellerEconomics | null>(null);
  const [candidates, setCandidates] = useState<SellerProvider[]>([]);
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
    : suggested.length
    ? `直接打字，或参考上面，比如「${suggested.slice(0, 2).join("」「")}」`
    : stage === "termpay"
    ? "想了解 TermPay 的什么？直接问我"
    : stage === "provider"
    ? "想深入了解哪家、或让我帮你对接？直接问我"
    : "直接打字告诉我你的情况，比如「想找靠谱物流」「回款太慢」";

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
    showOpening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushAgent(text: string, cards?: SellerProvider[]) {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text, cards }]);
  }

  // 固定开场：直接显示，不发请求。
  function showOpening() {
    setSuggested(OPENING_SUGGESTED);
    pushAgent(OPENING_REPLY);
  }
  function apiHistory(list: ChatMsg[]) {
    return list.map((m) => ({ role: m.role, content: m.text }));
  }

  // 阶段①：意图收集（AI 大脑）+ 判断 line。槽位齐了 → 过渡到对应线的诊断/推荐。
  // 仅在用户说话后调用；开场是固定文案（showOpening），不走这里、不发请求。
  async function runIntake(history: { role: "agent" | "user"; content: string }[]) {
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callBrain(history, facts);
      const merged = { ...facts, ...data.facts };
      setFacts(merged);
      pushAgent(data.reply);

      if (data.phase === "ready_to_diagnose") {
        if (data.line === "provider") {
          // provider 线：资料库确定性匹配 → AI 讲推荐（只从候选里讲）。
          const categoryKey = resolveCategoryKey(merged.serviceCategory);
          const pain = painFromLabel(merged.servicePain);
          const matched = matchProviders({
            categoryKey,
            pains: pain ? [pain] : [],
            platform: merged.platform,
            limit: 3,
          }).map((m) => m.provider);
          setCandidates(matched);
          setStage("provider");
          const rec = await callProviders({
            facts: merged,
            candidates: matched,
            task: "recommend",
            brief: wantsDirect(history), // 用户要求直接推荐 → 极简、不铺垫
          });
          pushAgent(rec.reply, matched); // 附资料卡：推荐时弹出候选服务商卡片
          setSuggested(rec.suggestedReplies ?? []);
        } else {
          // termpay 线：引擎算金额 → AI 讲现金流诊断（只引用算好的数）。
          const econ = diagnoseEconomics(merged);
          setNumbers(econ);
          setStage("termpay");
          const diag = await callCashflow({ facts: merged, numbers: econ, task: "diagnosis" });
          pushAgent(diag.reply);
          setSuggested(diag.suggestedReplies ?? []);
        }
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

  // 阶段③：服务商推荐自由问答（只在已匹配的候选里答）。
  async function runProvider(history: { role: "agent" | "user"; content: string }[]) {
    setThinking(true);
    setSuggested([]);
    try {
      const data = await callProviders({ facts, candidates, task: "followup", messages: history });
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
    else if (stage === "provider") void runProvider(history);
    else void runTermpay(history);
  }

  function restart() {
    idRef.current = 0;
    setMessages([]);
    setFacts({});
    setNumbers(null);
    setCandidates([]);
    setStage("intake");
    setInput("");
    showOpening(); // 固定开场，不发请求；下一句用户输入才请求大脑
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
          <h1>卖家经营诊断智能体</h1>
          <p>不用填表 —— 说说你最近最头疼的事，我会顺着帮你把问题聊清楚、算明白。</p>
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
                <div className="msg-body">
                  <div className="bubble">{m.text}</div>
                  {m.cards?.length ? (
                    <div className="provider-cards">
                      {m.cards.map((p) => (
                        <ProviderCard key={p.id} p={p} />
                      ))}
                    </div>
                  ) : null}
                </div>
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

/** 点击资料卡 → 新标签页打开该服务商详情页（/seller/provider?id=）。 */
function openProviderProfile(id: string) {
  window.open(`/seller/provider?id=${encodeURIComponent(id)}`, "_blank", "noopener,noreferrer");
}

/** 服务商资料卡：推荐时弹出，可点击查看详情；高级认证服务商带徽章高亮。 */
function ProviderCard({ p }: { p: SellerProvider }) {
  const tier = p.tier ?? "recommend";
  const certified = tier === "certified";
  const open = () => openProviderProfile(p.id);
  return (
    <div
      className={"provider-card clickable" + (certified ? " is-certified" : "")}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="pc-head">
        <span className="pc-name">
          <Store size={15} className="pc-name-ico" />
          {p.name}
        </span>
        <span
          className={
            "pc-badge" +
            (certified ? " certified" : tier === "recommend" ? " recommend" : " partner")
          }
        >
          {certified ? <BadgeCheck size={13} /> : null}
          {PROVIDER_TIER_LABEL[tier]}
        </span>
      </div>
      {p.strengths ? <p className="pc-strength">{p.strengths}</p> : null}
      <div className="pc-meta">
        {p.platforms?.length ? (
          <span className="pc-line">
            <span className="pc-key">擅长平台</span>
            {p.platforms.join(" · ")}
          </span>
        ) : null}
        {p.regions?.length ? (
          <span className="pc-line">
            <span className="pc-key">
              <MapPin size={12} /> 覆盖
            </span>
            {p.regions.join(" · ")}
          </span>
        ) : null}
      </div>
      {p.subs?.length ? (
        <div className="pc-subs">
          {p.subs.map((s) => (
            <span key={s} className="pc-sub">
              {s}
            </span>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="pc-detail"
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
      >
        查看详情
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
