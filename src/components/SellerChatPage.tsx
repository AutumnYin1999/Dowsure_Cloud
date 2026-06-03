import { ArrowRight, Bot, RotateCcw, Send, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { showToast } from "@/components/ui/Toast";
import "./seller-desk.css";
import "./seller-chat.css";

/**
 * 卖家智能服务台 · 对话版 —— /seller/chat
 *
 * 本轮范围：3 个问题（对话式信息收集）→ 直接出「智能诊断」。
 *   纯前端 mock，自包含示例数据；TermPay / 服务商推荐本轮不掺进来。
 *
 * ⚠️ 这是 SellerHomePage 的「对话版副本」，原 /seller 页面完全不动。
 *    选项文案沿用原卖家台（PLATFORMS / GMV_OPTIONS / CONCERNS）。
 *    诊断逻辑（diagnose）是透明 mock —— 后续接后端/真实算法只需替换这一处。
 */

// ──────────────────────── 选项（与原卖家台同源） ────────────────────────

const PLATFORMS = ["Amazon", "Temu", "TikTok Shop", "SHEIN", "eBay", "独立站"];
const GMV_OPTIONS = ["10 万以下", "10 – 50 万", "80 – 120 万", "120 – 300 万", "300 万以上"];
const CONCERNS = [
  "成本太高",
  "服务不稳定",
  "响应太慢",
  "不知道谁靠谱",
  "账单压力大",
  "担心合规/风险",
];

// ──────────────────────── 问题脚本 ────────────────────────

interface QuestionDef {
  id: "platform" | "gmv" | "concern";
  prompt: string;
  options: string[];
  placeholder: string;
  sample: string;
  parse: (text: string) => string | null;
}

const QUESTIONS: QuestionDef[] = [
  {
    id: "platform",
    prompt:
      "你好 👋 我是豆服云卖家助手。先认识一下你的生意——你主要在哪个平台卖货？",
    options: PLATFORMS,
    placeholder: "点上面选一个，或直接打字，比如「主要做亚马逊」",
    sample: "Amazon",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/amazon|亚马逊|亚马孙/.test(s)) return "Amazon";
      if (/temu|拼多多|多多/.test(s)) return "Temu";
      if (/tiktok|tik tok|抖音|小店/.test(s)) return "TikTok Shop";
      if (/shein/.test(s)) return "SHEIN";
      if (/ebay|易贝/.test(s)) return "eBay";
      if (/独立站|shopify|自建站|官网/.test(s)) return "独立站";
      return null;
    },
  },
  {
    id: "gmv",
    prompt: "了解～ 那你现在每月 GMV 大概在哪个区间？",
    options: GMV_OPTIONS,
    placeholder: "选一个区间，或直接说「一个月大概一两百万」",
    sample: "120 – 300 万",
    parse: (t) => {
      const m = t.match(/(\d+(?:\.\d+)?)/);
      if (m) {
        let n = parseFloat(m[1]);
        if (/亿/.test(t)) n *= 10000;
        else if (/千万/.test(t)) n *= 1000;
        else if (/百万/.test(t)) n *= 100;
        if (n > 0) {
          if (n < 10) return "10 万以下";
          if (n < 50) return "10 – 50 万";
          if (n < 120) return "80 – 120 万";
          if (n < 300) return "120 – 300 万";
          return "300 万以上";
        }
      }
      return null;
    },
  },
  {
    id: "concern",
    prompt: "最后一个：现在生意上最让你头疼、最想先解决的是哪一块？",
    options: CONCERNS,
    placeholder: "选最头疼的那个，或跟我说说你的情况",
    sample: "账单压力大",
    parse: (t) => {
      const s = t.toLowerCase();
      if (/账单|账期|回款|现金流|资金|垫资/.test(s)) return "账单压力大";
      if (/贵|成本|太高|费用/.test(s)) return "成本太高";
      if (/不稳定|出问题|时效差|履约/.test(s)) return "服务不稳定";
      if (/慢|响应|没人理|对接慢/.test(s)) return "响应太慢";
      if (/谁靠谱|不知道找谁|挑不出|选不出/.test(s)) return "不知道谁靠谱";
      if (/合规|风险|税|vat|政策/.test(s)) return "担心合规/风险";
      return null;
    },
  },
];

/** 「填入示例」的整套示例案例（逐题填会用到对应字段）。 */
const SAMPLE = { platform: "Amazon", gmv: "120 – 300 万", concern: "账单压力大" };

const Q_LABEL: Record<QuestionDef["id"], string> = {
  platform: "主要平台",
  gmv: "月 GMV",
  concern: "当前最头疼",
};

// ──────────────────────── 智能诊断（透明 mock，后续替换后端） ────────────────────────

/** GMV 档位 → 代表性月 GMV（元），用于金额估算。 */
const GMV_REP: Record<string, number> = {
  "10 万以下": 60_000,
  "10 – 50 万": 300_000,
  "80 – 120 万": 1_000_000,
  "120 – 300 万": 2_000_000,
  "300 万以上": 5_000_000,
};

function fmtCNY(n: number): string {
  if (n >= 10_000) {
    const w = n / 10_000;
    return `¥${Number.isInteger(w) ? w : w.toFixed(1)} 万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

interface Kpi {
  k: string;
  v: number;
  note: string;
  focus: boolean;
}
interface Dim {
  title: string;
  tone: "warn" | "risk" | "good";
  tag: string;
  insight: string;
  direction: string;
}
interface Diagnosis {
  headline: string;
  kpis: Kpi[];
  dims: Dim[];
}

function diagnose(answers: Record<string, string>): Diagnosis {
  const platform = answers.platform ?? "你的平台";
  const gmvLabel = answers.gmv ?? "当前体量";
  const concern = answers.concern ?? "经营效率";
  const rep = GMV_REP[gmvLabel] ?? 300_000;

  const waste = Math.round((rep * 0.025) / 1000) * 1000; // 服务成本可优化 ≈ 2.5%/月
  const credit = Math.round((rep * 0.6) / 10000) * 10000; // 账期占用 ≈ 0.6 月 GMV
  const stockout = Math.round((rep * 0.2) / 10000) * 10000; // 旺季缺货风险 ≈ 0.2 月 GMV

  const focusCredit = concern === "账单压力大";
  const focusCost = concern === "成本太高";
  const focusStock = !focusCredit && !focusCost;

  const kpis: Kpi[] = [
    {
      k: "服务成本可优化 / 月",
      v: waste,
      note: "物流/海外仓/广告等服务费中，约 2.5% 来自可压缩的低效环节",
      focus: focusCost,
    },
    {
      k: "账期占用资金",
      v: credit,
      note: "账单到期常早于平台回款，约 0.6 个月 GMV 的现金被占用",
      focus: focusCredit,
    },
    {
      k: "旺季缺货风险 / 季",
      v: stockout,
      note: "备货资金或履约不稳导致的潜在销售损失估算",
      focus: focusStock,
    },
  ];

  const dims: Dim[] = [
    {
      title: "成本结构",
      tone: focusCost ? "risk" : "warn",
      tag: focusCost ? "重点" : "可优化",
      insight: `月 GMV ${gmvLabel} 体量下，服务费里通常有可优化空间，按经验约 ${fmtCNY(
        waste
      )}/月 来自低效环节。`,
      direction: "用透明比价 + 服务商匹配，先把这部分浪费压下来。",
    },
    {
      title: "现金流 / 账期",
      tone: focusCredit ? "risk" : "warn",
      tag: focusCredit ? "重点" : "需关注",
      insight: `估算约有 ${fmtCNY(
        credit
      )} 资金被账期占用——账单到期早于平台回款，旺季尤其紧。`,
      direction: "理顺回款节奏、优化账期结构（具体方案后续展开）。",
    },
    {
      title: "履约 / 服务稳定",
      tone: focusStock ? "risk" : "good",
      tag: focusStock ? "重点" : "尚可",
      insight: `旺季履约一旦掉链子，潜在销售损失估算约 ${fmtCNY(
        stockout
      )}/季，服务商稳定性是关键变量。`,
      direction: "优先选稳定性高、旺季能扩容、且有对应平台经验的服务商。",
    },
  ];

  const headline = `按你「${platform} · 月GMV ${gmvLabel}」来看，你点的最头疼是「${concern}」。我扫了一遍经营面，下面是诊断重点 👇`;

  return { headline, kpis, dims };
}

// ──────────────────────── 消息模型 ────────────────────────

interface Message {
  id: number;
  role: "agent" | "user";
  text: string;
}

interface SellerChatPageProps {
  onHome?: () => void;
}

export function SellerChatPage({ onHome }: SellerChatPageProps) {
  const idRef = useRef(1);
  const nextId = () => idRef.current++;

  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, role: "agent", text: QUESTIONS[0].prompt },
  ]);
  const [stepIdx, setStepIdx] = useState(0); // 0/1/2 = 等第 N 题；3 = 出诊断
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);

  const done = stepIdx >= QUESTIONS.length;
  const current = !done ? QUESTIONS[stepIdx] : null;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  function answerCurrent(value: string, displayText: string) {
    if (thinking || done) return;
    const step = stepIdx;
    const q = QUESTIONS[step];

    setMessages((m) => [...m, { id: nextId(), role: "user", text: displayText }]);
    setAnswers((a) => ({ ...a, [q.id]: value }));

    const isLast = step === QUESTIONS.length - 1;
    setThinking(isLast ? "正在分析你的经营面…" : "正在记录…");
    window.setTimeout(
      () => {
        setThinking(null);
        if (!isLast) {
          setMessages((m) => [
            ...m,
            { id: nextId(), role: "agent", text: QUESTIONS[step + 1].prompt },
          ]);
          setStepIdx(step + 1);
        } else {
          setStepIdx(step + 1); // → done，渲染诊断
        }
      },
      isLast ? 1400 : 600
    );
  }

  function handleSend() {
    const text = input.trim();
    if (!text || !current || thinking) return;
    setInput("");
    const parsed = current.parse(text);
    answerCurrent(parsed ?? text, text);
  }

  function handleFillSample() {
    if (!current || thinking) return;
    const value = SAMPLE[current.id];
    answerCurrent(value, value);
  }

  function handleRestart() {
    idRef.current = 1;
    setMessages([{ id: 0, role: "agent", text: QUESTIONS[0].prompt }]);
    setStepIdx(0);
    setAnswers({});
    setInput("");
    setThinking(null);
  }

  const diag = done ? diagnose(answers) : null;

  return (
    <div className="seller-desk">
      <div className="desk-bg" aria-hidden />

      <main className="seller-chat">
        {/* 头部 */}
        <div className="desk-head" style={{ paddingBottom: 18 }}>
          <span className="pill">
            <span className="pulse" />
            卖家智能服务台 · 对话版
          </span>
          <h1>3 个问题，给你一份智能诊断</h1>
          <p>像聊天一样回答几个问题，我来帮你扫一遍经营面，算出当前最该先动的地方。</p>
        </div>

        {/* 进度点 */}
        <div className="chat-progress" style={{ marginBottom: 12 }}>
          {QUESTIONS.map((q, i) => (
            <span
              key={q.id}
              className={
                "dot " +
                (i < stepIdx ? "done" : i === stepIdx && !done ? "cur" : "todo")
              }
            />
          ))}
        </div>

        {/* 对话卡片 */}
        <div className="chat-card">
          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={"msg " + m.role}>
                <div className="avatar">
                  {m.role === "agent" ? <Bot size={17} /> : "你"}
                </div>
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
                  <span className="label">{thinking}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* 输入区（收集中才显示） */}
          {!done ? (
            <div className="composer">
              <div className="opt-list">
                {current!.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    className="opt-row"
                    disabled={!!thinking}
                    onClick={() => answerCurrent(opt, opt)}
                  >
                    <span className="opt-key">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                    <ArrowRight className="opt-arrow" size={16} />
                  </button>
                ))}
              </div>
              <div className="input-row">
                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={!!thinking}
                  onClick={handleFillSample}
                  title="填入当前问题的示例答案"
                >
                  <Wand2 size={15} />
                  填入示例
                </button>
                <input
                  className="input"
                  value={input}
                  disabled={!!thinking}
                  placeholder={current!.placeholder}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!!thinking || !input.trim()}
                  onClick={handleSend}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* 智能诊断 */}
        {done && diag ? (
          <div className="diag">
            {/* 回答回显 */}
            <div className="recap">
              {QUESTIONS.map((q) => (
                <span key={q.id} className="tag">
                  {Q_LABEL[q.id]}：<b>{answers[q.id] ?? "—"}</b>
                </span>
              ))}
            </div>

            {/* 诊断结论 */}
            <div className="diag-head">
              <div className="cap">
                <span className="sparkle" />
                智能诊断
              </div>
              <p>{diag.headline}</p>
            </div>

            {/* 金额诊断 KPI */}
            <div className="kpis">
              {diag.kpis.map((kp) => (
                <div key={kp.k} className={"kpi" + (kp.focus ? " focus" : "")}>
                  {kp.focus ? <span className="badge-focus">最痛点</span> : null}
                  <div className="kpi-k">{kp.k}</div>
                  <div className="kpi-v">{fmtCNY(kp.v)}</div>
                  <div className="kpi-note">{kp.note}</div>
                </div>
              ))}
            </div>

            {/* 维度卡 */}
            {diag.dims.map((d) => (
              <div key={d.title} className={"dim tone-" + d.tone}>
                <div className="dim-h">
                  <span className="dim-t">{d.title}</span>
                  <span className="dim-tag">{d.tag}</span>
                </div>
                <p className="dim-insight">{d.insight}</p>
                <div className="dim-dir">
                  <ArrowRight className="arr" size={16} />
                  <span>{d.direction}</span>
                </div>
              </div>
            ))}

            <p className="diag-note">
              以上为 demo 示例诊断，金额由透明 mock 系数估算，接入真实数据后替换。下一步可做服务商匹配 / 账期方案（本轮暂未开发）。
            </p>
            <div className="diag-foot">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => showToast("服务商匹配功能开发中（demo）")}
              >
                下一步：匹配服务商
                <ArrowRight size={16} />
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleRestart}>
                <RotateCcw size={15} />
                重新填一遍
              </button>
              {onHome ? (
                <button type="button" className="btn btn-soft" onClick={onHome}>
                  返回首页
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
