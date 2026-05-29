import "./seller-desk.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { showToast } from "@/components/ui/Toast";
import { SERVICE_TAXONOMY } from "@/schema/serviceTaxonomy";

type Intent = "provider" | "term" | "both";

/* ---------- 选项常量（对齐原型） ---------- */
const CAT_OPTIONS = [
  "3C 电子",
  "家居园艺 / 户外",
  "服饰鞋包",
  "美妆个护",
  "母婴玩具",
  "汽配工具",
];
const STAGE_OPTIONS = [
  "起步期（试水选品）",
  "成长期（快速放量）",
  "成熟期（稳定经营）",
  "多平台扩张期",
];
const PLATFORMS = ["Amazon", "Temu", "TikTok Shop", "SHEIN", "eBay", "独立站"];
const COUNTRIES = ["美国", "德国", "英国", "日本", "加拿大", "法国"];
const CONCERNS = [
  "成本太高",
  "服务不稳定",
  "响应太慢",
  "不知道谁靠谱",
  "账单压力大",
  "担心合规/风险",
];

interface EnvGroup {
  key: string;
  label: string;
  subs: string[];
}
/** 经营环节分类 = 共用服务分类树（一级大类 → 细分领域）。 */
const ENV_GROUPS: EnvGroup[] = SERVICE_TAXONOMY.map((c) => ({
  key: c.key,
  label: c.label,
  subs: c.subs,
}));
const ENV_UNSURE = "不确定，帮我判断";

const GMV_OPTIONS = ["10 万以下", "10 – 50 万", "80 – 120 万", "120 – 300 万", "300 万以上"];
const BUDGET_OPTIONS = ["1 万以内", "1 – 3 万", "3 – 8 万", "8 万以上"];
const FOCUS_OPTIONS = ["价格", "时效", "稳定性", "合规", "旺季扩容", "退货换标"];

const BILL_TYPES = ["物流费", "海外仓费", "广告费", "采购预付款", "保险 / 服务费", "其他"];
const BILL_AMOUNTS = ["5 万以下", "5-20 万", "20-50 万", "50 万以上", "自定义金额"];
const DUE_OPTIONS = ["7 天内", "8-15 天", "16-30 天", "30 天以上"];
const RECV_OPTIONS = ["7 天内", "8-15 天", "16-30 天", "30 天以上", "不确定"];
const CASH_OPTIONS = [
  "足够支付，不影响经营",
  "能支付，但会压缩备货 / 广告预算",
  "不够支付，需要延期或分期",
  "不确定",
];
const IMPACT_OPTIONS = ["不会影响", "会影响备货", "会影响广告投放", "会影响其他服务商付款", "不确定"];
const FUTURE_OPTIONS = ["备货", "物流 / 海外仓", "广告", "平台费用", "人工 / 运营", "其他服务商付款", "暂不清楚"];
const D_RECV_OPTIONS = ["20 万以下", "20-50 万", "50-100 万", "100 万以上"];

/* ---------- 推荐偏好 ---------- */
const PREF_PRESETS: Record<string, string[]> = {
  balance: ["服务稳定性", "价格透明度", "响应速度", "平台 / 类目经验", "账期支持能力", "豆沙包认证 / 优选"],
  low: ["价格透明度", "服务稳定性", "响应速度", "账期支持能力", "平台 / 类目经验", "豆沙包认证 / 优选"],
  stable: ["服务稳定性", "平台 / 类目经验", "响应速度", "价格透明度", "豆沙包认证 / 优选", "账期支持能力"],
};
const PREF_WEIGHTS = [28, 22, 18, 14, 10, 8];
const MORE_FACTORS = ["数据安全", "系统对接能力", "个性化服务能力", "旺季资源保障"];
const PREF_SEGS: { id: string; label: string }[] = [
  { id: "low", label: "更看重低价" },
  { id: "balance", label: "平衡推荐" },
  { id: "stable", label: "更看重稳定交付" },
];

/* ---------- 服务商数据 ---------- */
type BadgeClass = "preferred" | "cert" | "func" | "weak";
interface Provider {
  logo: string;
  name: string;
  badges: { t: string; c: BadgeClass }[];
  tags: string[];
  match: number;
  boost: number;
  reason: string;
  whyWeight: string;
  hits: [string, string][];
  weakness: string;
  termSync: { status: string; bills: string; advice: string };
}
const PROVIDERS: Provider[] = [
  {
    logo: "环邦",
    name: "环邦海外仓",
    badges: [{ t: "豆沙包优选", c: "preferred" }, { t: "已认证服务商", c: "cert" }],
    tags: ["海外仓", "美西 / 美东", "退货换标", "旺季扩容"],
    match: 94,
    boost: 2,
    reason: "适合家居大件卖家，美西/美东双仓覆盖，支持退货换标和旺季临时仓位。",
    whyWeight: "服务稳定性与旺季扩容命中较高，价格透明度中等。",
    hits: [["服务稳定性", "高"], ["旺季扩容", "高"], ["账期", "支持"], ["平台经验", "Amazon / Temu"]],
    weakness: "价格不是最低，适合更看重稳定履约的卖家。",
    termSync: { status: "待确认", bills: "海外仓费、退货换标费", advice: "先确认服务报价，再测算账期" },
  },
  {
    logo: "速通",
    name: "速通供应链",
    badges: [{ t: "已认证服务商", c: "cert" }, { t: "支持 TermPay", c: "func" }],
    tags: ["头程海派", "仓配一体", "FBA 中转", "可对接账期"],
    match: 91,
    boost: 2,
    reason: "海运头程 + 仓配一体，适合稳定补库，账单可对接 TermPay 延后支付。",
    whyWeight: "价格透明度与账期支持命中较高，响应速度中等。",
    hits: [["价格透明度", "高"], ["账期支持", "支持"], ["服务稳定性", "中高"], ["平台经验", "Amazon / Walmart"]],
    weakness: "海派时效需确认，急单建议搭配空派。",
    termSync: { status: "支持 TermPay", bills: "头程物流费、仓配服务费", advice: "可直接生成 TermPay 预申请" },
  },
  {
    logo: "云仓",
    name: "云仓宝",
    badges: [
      { t: "豆沙包优选", c: "preferred" },
      { t: "支持 TermPay", c: "func" },
      { t: "豆服云入驻", c: "weak" },
    ],
    tags: ["旺季临时仓位", "德国本地仓", "FBA 中转", "可对接账期"],
    match: 88,
    boost: 0,
    reason: "德国本地仓 + 旺季弹性仓位，适合欧洲站放量。",
    whyWeight: "覆盖地区与旺季资源命中较高，美西覆盖需确认。",
    hits: [["覆盖地区", "欧洲强"], ["旺季资源", "高"], ["账期", "支持"], ["平台经验", "Amazon EU"]],
    weakness: "欧洲覆盖较强，美西仓位需确认。",
    termSync: { status: "支持 TermPay", bills: "海外仓费、FBA 中转费", advice: "适合欧洲站账期错配场景" },
  },
];

const STORE_KEY = "df_desk_state_v3";

const INTENT_OPTIONS: { id: Intent; title: string; detail: string; icon: ReactNode }[] = [
  {
    id: "provider",
    title: "找合适服务商",
    detail: "按品类与需求匹配方向",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
    ),
  },
  {
    id: "term",
    title: "判断账单 / 账期压力",
    detail: "看现金流是否吃紧",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3v18M5 8h9a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h10" /></svg>
    ),
  },
  {
    id: "both",
    title: "两者都看",
    detail: "找服务商，也顺便看账期",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
    ),
  },
];

/* ============================================================
   状态类型
   ============================================================ */
interface FormState {
  intent: Intent;
  cat: string;
  stage: string;
  platform: string[];
  country: string[];
  env: string[];
  sub: string[];
  envUnsure: boolean;
  unsureText: string;
  prefSeg: string;
  prefOrder: string[];
  concern: string[];
  showMoreFactors: boolean;
  gmv: string;
  budget: string;
  region: string;
  focus: string[];
  billType: string;
  billAmount: string;
  billAmountCustom: string;
  due: string;
  recv: string;
  cash: string;
  impact: string;
  future: string[];
  dRecv: string;
  dFixed: string;
  dPlan: string;
  dVendor: string;
  dInvoice: string;
  dDirect: string;
}

const DEFAULT_FORM: FormState = {
  intent: "provider",
  cat: "",
  stage: "",
  platform: ["Amazon", "Temu"],
  country: ["美国", "德国"],
  env: ["找物流", "海外仓储", "跨境收款"],
  sub: ["FBA 头程海派", "仓储服务", "平台收款"],
  envUnsure: false,
  unsureText: "",
  prefSeg: "balance",
  prefOrder: PREF_PRESETS.balance.slice(),
  concern: ["成本太高", "账单压力大"],
  showMoreFactors: false,
  gmv: "",
  budget: "",
  region: "美西、美东、德国本地仓",
  focus: ["价格", "时效", "旺季扩容"],
  billType: "物流费",
  billAmount: "5-20 万",
  billAmountCustom: "",
  due: "7 天内",
  recv: "16-30 天",
  cash: "能支付，但会压缩备货 / 广告预算",
  impact: "不会影响",
  future: ["备货"],
  dRecv: "20-50 万",
  dFixed: "",
  dPlan: "",
  dVendor: "",
  dInvoice: "已有",
  dDirect: "是",
};

interface FlowFlags {
  layer1: boolean;
  refined: boolean;
  termDone: boolean;
}

/* 清空重填：所有选项归零（区别于带预选的 DEFAULT_FORM） */
const CLEARED_FORM: FormState = {
  intent: "provider",
  cat: "",
  stage: "",
  platform: [],
  country: [],
  env: [],
  sub: [],
  envUnsure: false,
  unsureText: "",
  prefSeg: "balance",
  prefOrder: PREF_PRESETS.balance.slice(),
  concern: [],
  showMoreFactors: false,
  gmv: "",
  budget: "",
  region: "",
  focus: [],
  billType: "",
  billAmount: "",
  billAmountCustom: "",
  due: "",
  recv: "",
  cash: "",
  impact: "",
  future: [],
  dRecv: "20-50 万",
  dFixed: "",
  dPlan: "",
  dVendor: "",
  dInvoice: "已有",
  dDirect: "是",
};

/* ============================================================
   账期测算（纯函数，对齐原型 calcTerm）
   ============================================================ */
type TermLevel = "低" | "中" | "高" | "待确认";
interface TermResult {
  level: TermLevel;
  badgeClass: "green" | "amber" | "rose";
  levelColor: string;
  cashText: string;
  mismatch: "存在" | "不明显" | "待确认";
  mmText: string;
  amountLabel: string;
}
function computeTerm(f: FormState): TermResult {
  let amount = f.billAmount;
  if (amount === "自定义金额") {
    amount = f.billAmountCustom ? "¥" + f.billAmountCustom : "自定义金额";
  }
  const rk: Record<string, number> = { "7 天内": 1, "8-15 天": 2, "16-30 天": 3, "30 天以上": 4 };
  const dueR = rk[f.due] || 0;
  const recvR = rk[f.recv] || 0;
  const mismatch: TermResult["mismatch"] =
    f.recv === "不确定" ? "待确认" : dueR && recvR && dueR < recvR ? "存在" : "不明显";

  let level: TermLevel;
  let badgeClass: TermResult["badgeClass"];
  let levelColor: string;
  let cashText: string;
  if (f.cash.indexOf("足够") === 0) {
    level = "低";
    badgeClass = "green";
    levelColor = "var(--green)";
    cashText = "支付后不影响经营";
  } else if (f.cash.indexOf("能支付") === 0) {
    level = "中";
    badgeClass = "amber";
    levelColor = "var(--amber)";
    cashText = "支付后可能压缩备货 / 广告预算";
  } else if (f.cash.indexOf("不够") === 0) {
    level = "高";
    badgeClass = "rose";
    levelColor = "var(--rose)";
    cashText = "当前现金不足，建议考虑延期或分期";
  } else {
    level = "待确认";
    badgeClass = "amber";
    levelColor = "var(--amber)";
    cashText = "现金充足度待确认，存在潜在账期风险";
  }
  if (mismatch === "存在" && level === "低") {
    level = "中";
    badgeClass = "amber";
    levelColor = "var(--amber)";
  }

  const mmText =
    mismatch === "存在"
      ? `账单 ${f.due}到期，但回款预计 ${f.recv}到账，存在明显错配。`
      : mismatch === "待确认"
      ? `账单 ${f.due}到期，回款时间尚不确定，存在潜在错配。`
      : "账单与回款节奏基本匹配。";

  return { level, badgeClass, levelColor, cashText, mismatch, mmText, amountLabel: amount };
}

/* 推荐方向（对齐原型 buildRec 的 dirParts 逻辑） */
function recDirection(f: FormState): string {
  const dirParts: string[] = [];
  if (f.env.indexOf("海外仓储") >= 0) dirParts.push("海外仓储");
  const headhaul = f.sub.filter((s) => /头程|空派|海派|专线|快递/.test(s))[0];
  if (headhaul) dirParts.push(headhaul);
  else if (f.env.indexOf("找物流") >= 0) dirParts.push("头程物流");
  if (f.env.indexOf("跨境收款") >= 0) dirParts.push("跨境收款");
  let parts = dirParts;
  if (!parts.length) parts = f.sub.slice(0, 3);
  if (!parts.length) parts = f.env.slice(0, 3);
  if (!parts.length) parts = ["综合服务商"];
  return parts.join(" + ");
}

/* ============================================================
   主组件
   ============================================================ */
export function SellerHomePage({ onViewProfile }: { onViewProfile: () => void }) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [flags, setFlags] = useState<FlowFlags>({ layer1: false, refined: false, termDone: false });
  const [matchVal, setMatchVal] = useState(0);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({ qA: true, qB: true, qC: true });
  const [contactLabel, setContactLabel] = useState("生成需求单 / 联系服务商");
  const [demandSubmitted, setDemandSubmitted] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showDeepBill, setShowDeepBill] = useState(false);
  const [showFundingCompare, setShowFundingCompare] = useState(false);
  const qBRef = useRef<HTMLDivElement | null>(null);
  const qCRef = useRef<HTMLDivElement | null>(null);
  const deepBillRef = useRef<HTMLDivElement | null>(null);
  const candListRef = useRef<HTMLDivElement | null>(null);
  const restored = useRef(false);

  const prov = form.intent === "provider" || form.intent === "both";
  const wantTerm = form.intent === "term" || form.intent === "both";

  const patch = (p: Partial<FormState>) => setForm((s) => ({ ...s, ...p }));

  /* ---------- localStorage 持久化（仅恢复输入，不自动出结果） ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<FormState>;
        setForm((cur) => ({ ...cur, ...s }));
      }
    } catch {
      /* ignore */
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  const term = useMemo(() => computeTerm(form), [form]);

  function scrollToRef(ref: RefObject<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---------- 多选 / 单选 toggle ---------- */
  function toggleMulti(key: keyof FormState, value: string) {
    setForm((s) => {
      const arr = (s[key] as string[]) || [];
      const next = arr.indexOf(value) >= 0 ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...s, [key]: next };
    });
  }

  /* ---------- 偏好预设 / 拖拽 ---------- */
  function setSeg(seg: string) {
    if (!PREF_PRESETS[seg]) return;
    patch({ prefSeg: seg, prefOrder: PREF_PRESETS[seg].slice() });
  }
  const dragIndex = useRef<number | null>(null);
  function onDragStart(i: number) {
    dragIndex.current = i;
  }
  function onDragOver(e: ReactDragEvent, i: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === i) return;
    setForm((s) => {
      const order = s.prefOrder.slice();
      const [moved] = order.splice(from, 1);
      order.splice(i, 0, moved);
      dragIndex.current = i;
      return { ...s, prefOrder: order, prefSeg: "custom" };
    });
  }

  /* ---------- 提交：初步判断 ---------- */
  function submitLayer1() {
    setFlags((f) => ({ ...f, layer1: true }));
    setMatchVal(0);
    window.requestAnimationFrame(() => {
      setTimeout(() => setMatchVal(flags.refined ? 95 : 92), 200);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateRec() {
    setFlags((f) => ({ ...f, refined: true }));
    setOpenCards((c) => ({ ...c, qA: false }));
    setMatchVal(0);
    window.requestAnimationFrame(() => setTimeout(() => setMatchVal(95), 150));
  }
  function calcTerm() {
    setFlags((f) => ({ ...f, termDone: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openContact(label: string) {
    setContactLabel(label);
    setShowContact(true);
    setDemandSubmitted(false);
    setOpenCards((c) => ({ ...c, qC: false }));
    setTimeout(() => scrollToRef(qCRef), 30);
  }
  function gotoTerm() {
    setOpenCards((c) => ({ ...c, qB: false }));
    setTimeout(() => scrollToRef(qBRef), 30);
  }
  function openDeepBill() {
    setShowDeepBill(true);
    setOpenCards((c) => ({ ...c, qB: false }));
    setTimeout(() => scrollToRef(deepBillRef), 30);
  }
  function saveReminder() {
    setReminderSaved(true);
    showToast("已保存账单提醒");
  }
  function submitDemand() {
    setDemandSubmitted(true);
    showToast("已提交，我们会尽快对接");
  }

  /* ---------- 示例数据 ---------- */
  function applyIntent(intent: Intent) {
    patch({ intent });
  }
  function fillDemoData() {
    const mode = form.intent || "provider";
    setFlags({ layer1: false, refined: false, termDone: false });
    setShowDeepBill(false);
    setShowContact(false);
    setMatchVal(0);
    if (mode === "provider") fillProviderDemo();
    else if (mode === "term") fillTermDemo();
    else fillBothDemo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function fillProviderDemo() {
    setForm((s) => ({
      ...s,
      intent: "provider",
      cat: "家居园艺 / 户外",
      stage: "成长期（快速放量）",
      platform: ["Amazon", "Temu"],
      country: ["美国", "德国"],
      env: ["找物流", "海外仓储"],
      envUnsure: false,
      sub: ["FBA 头程海派", "FBA 头程空派", "仓储服务", "一件代发", "中转服务", "贴标换标", "退货售后"],
      concern: ["服务不稳定", "不知道谁靠谱"],
      prefSeg: "stable",
      prefOrder: PREF_PRESETS.stable.slice(),
      gmv: "80 – 120 万",
      budget: "3 – 8 万",
      region: "美西、美东",
      focus: ["稳定性", "旺季扩容", "退货换标"],
    }));
  }
  function fillTermDemo() {
    setForm((s) => ({
      ...s,
      intent: "term",
      billType: "海外仓费",
      billAmount: "自定义金额",
      billAmountCustom: "468000",
      due: "8-15 天",
      recv: "30 天以上",
      cash: "不确定",
      impact: "会影响备货",
      future: ["备货", "物流 / 海外仓", "广告", "其他服务商付款"],
    }));
  }
  function fillBothDemo() {
    setForm((s) => ({
      ...s,
      intent: "both",
      cat: "家居园艺 / 户外",
      stage: "成长期（快速放量）",
      platform: ["Amazon", "Temu"],
      country: ["美国", "德国"],
      env: ["物流履约", "海外仓储", "支付收款"],
      envUnsure: false,
      sub: ["FBA 头程", "清关", "美西仓", "美东仓", "FBA 中转", "退货换标", "旺季临时仓位", "平台收款", "结汇", "香港开户", "账期/信贷支持"],
      concern: ["服务不稳定", "不知道谁靠谱", "账单压力大"],
      prefSeg: "stable",
      prefOrder: ["服务稳定性", "价格透明度", "账期支持能力", "平台 / 类目经验", "响应速度", "豆沙包认证 / 优选"],
      gmv: "80 – 120 万",
      budget: "3 – 8 万",
      region: "美西、美东、德国本地仓",
      focus: ["价格", "稳定性", "旺季扩容", "退货换标"],
      billType: "海外仓费",
      billAmount: "自定义金额",
      billAmountCustom: "468000",
      due: "8-15 天",
      recv: "30 天以上",
      cash: "不确定",
      impact: "会影响备货",
      future: ["备货", "物流 / 海外仓", "广告", "其他服务商付款"],
    }));
  }
  function clearDemoData() {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setForm(CLEARED_FORM);
    setFlags({ layer1: false, refined: false, termDone: false });
    setShowDeepBill(false);
    setShowContact(false);
    setMatchVal(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 派生：右侧结果可见性 ---------- */
  const showRec = prov && flags.layer1;
  const showCombo = form.intent === "both" && flags.layer1;
  const showTermResult = flags.termDone;
  const showTermGuide = !flags.termDone && wantTerm && flags.layer1;
  const showCompliance = flags.layer1 || flags.termDone;
  const showGhost = !showRec && !showTermResult && !showCombo && !showTermGuide;

  /* 细分需求：仅展示已选经营环节对应的分组 */
  const activeEnvGroups = ENV_GROUPS.filter((g) => form.env.indexOf(g.label) >= 0);

  /* 推荐依据标签 */
  const recBasis = [form.cat, form.platform.join(" / "), form.country.join(" / ")]
    .concat(form.env)
    .concat(form.sub.slice(0, 3))
    .concat(form.prefOrder.slice(0, 2))
    .filter(Boolean);

  const stageShort = form.stage.replace(/（.*）/, "").trim();
  const prefTop3 = form.prefOrder.slice(0, 3);
  const prefHook: string[] = [];
  if (prefTop3.indexOf("价格透明度") >= 0) prefHook.push("价格透明");
  if (prefTop3.indexOf("账期支持能力") >= 0) prefHook.push("支持账期");

  const matchExp = flags.refined
    ? `已结合预算与「${form.focus.join("、")}」等偏好优化，匹配度与候选排序据此更新。`
    : "分数综合经营环节、细分需求、平台 / 国家、筛选偏好与当前顾虑得出，仅作排序参考，请结合下方推荐理由与风险点判断。";

  const nextSteps: Record<TermLevel, string> = {
    "低": "暂不需要账期产品，可保存账单提醒。",
    "中": "建议测算 30 天账期方案。",
    "高": "建议进入 TermPay 预申请。",
    "待确认": "建议补充现金信息或咨询顾问。",
  };

  return (
    <main className="seller-desk wrap">
      <div className="desk-bg" aria-hidden />

      <header className="desk-head">
        <div className="pill">
          <span className="pulse" />
          <span>卖家智能服务台 · 先回答几个问题，再看结果</span>
        </div>
        <h1>卖家智能服务台</h1>
        <p>
          先回答几个问题，系统给出初步判断。需要更精准的推荐或账期测算，再按需补充信息——公司名称、账单这些不用一开始就填。
        </p>
      </header>

      <div className="desk">
        {/* ===== 左：渐进式问答 ===== */}
        <div className="flow">
          <div className="results-cap" style={{ marginBottom: 2 }}>
            <span className="sparkle" />
            经营问答 · 渐进式
            <span className="demo-bar">
              <button
                className="btn btn-soft"
                type="button"
                title="将根据当前选择的任务填入不同示例"
                onClick={fillDemoData}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
                填入示例数据
              </button>
              <button className="btn btn-ghost" type="button" onClick={clearDemoData}>
                清空重填
              </button>
            </span>
          </div>
          <p className="demo-note">将根据当前选择的任务填入不同示例</p>

          {/* STEP 1 意图选择 */}
          <section className="qcard">
            <div className="qcard-head">
              <span className="step">STEP 01</span>
              <h3>你今天主要想解决什么？</h3>
              {flags.layer1 ? (
                <span className="sum">✓ 已生成初步判断，可修改后重新生成</span>
              ) : null}
            </div>
            <div className="qcard-body">
              <div className="intent">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={"opt-card" + (form.intent === opt.id ? " on" : "")}
                    onClick={() => applyIntent(opt.id)}
                  >
                    <span className="oc-ic">{opt.icon}</span>
                    <span className="oc-t">{opt.title}</span>
                    <span className="oc-d">{opt.detail}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* STEP 2 经营信息（服务商） */}
          {prov ? (
            <section className="qcard">
              <div className="qcard-head">
                <span className="step">STEP 02</span>
                <h3>经营信息</h3>
                <span className="sum">用于匹配服务商方向</span>
              </div>
              <div className="qcard-body">
                <p className="q-hint">
                  <span className="dot" />
                  只需几个客观信息，约 30 秒。
                </p>

                <div className="fgrid">
                  <div className="field">
                    <label>
                      经营品类<span className="req">*</span>
                    </label>
                    <select
                      className="select"
                      value={form.cat}
                      onChange={(e) => patch({ cat: e.target.value })}
                    >
                      <option value="">请选择…</option>
                      {CAT_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>
                      经营阶段 / 规模区间<span className="req">*</span>
                    </label>
                    <select
                      className="select"
                      value={form.stage}
                      onChange={(e) => patch({ stage: e.target.value })}
                    >
                      <option value="">请选择…</option>
                      {STAGE_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <ChipField
                    label="主要平台"
                    required
                    options={PLATFORMS}
                    selected={form.platform}
                    onToggle={(v) => toggleMulti("platform", v)}
                  />
                  <ChipField
                    label="主要销售国家"
                    required
                    options={COUNTRIES}
                    selected={form.country}
                    onToggle={(v) => toggleMulti("country", v)}
                  />

                  <div className="field full">
                    <label>
                      你现在主要需要哪类服务支持？<span className="req">*</span>
                      <span className="tag-opt">可多选</span>
                    </label>
                    <div className="chips">
                      {ENV_GROUPS.map((g) => (
                        <span
                          key={g.key}
                          className={"chip-opt" + (form.env.indexOf(g.label) >= 0 ? " on" : "")}
                          onClick={() => toggleMulti("env", g.label)}
                        >
                          {g.label}
                        </span>
                      ))}
                      <span
                        className={"chip-opt" + (form.envUnsure ? " on" : "")}
                        onClick={() => patch({ envUnsure: !form.envUnsure })}
                      >
                        {ENV_UNSURE}
                      </span>
                    </div>
                  </div>

                  {activeEnvGroups.length > 0 ? (
                    <div className="field full">
                      <label>
                        具体需要什么？<span className="tag-opt">仅展开你选中的类目</span>
                      </label>
                      <div className="subneeds">
                        {activeEnvGroups.map((g) => (
                          <div className="sub-group" key={g.key}>
                            <span className="eg-title">{g.label}</span>
                            <div className="chips">
                              {g.subs.map((s) => (
                                <span
                                  key={s}
                                  className={"chip-opt" + (form.sub.indexOf(s) >= 0 ? " on" : "")}
                                  onClick={() => toggleMulti("sub", s)}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {form.envUnsure ? (
                    <div className="field full">
                      <label>
                        说说你的情况，我们帮你判断<span className="tag-opt">选了"不确定"时填</span>
                      </label>
                      <textarea
                        className="input"
                        value={form.unsureText}
                        onChange={(e) => patch({ unsureText: e.target.value })}
                        placeholder="例如：旺季前想补库，但不确定该先找海外仓还是先解决头程；预算有限，回款还要等一阵子……"
                      />
                    </div>
                  ) : null}

                  <div className="field full">
                    <label>
                      调整你的推荐偏好<span className="tag-opt">排序即权重</span>
                    </label>
                    <p className="pref-note">
                      拖动排序，系统会根据你的优先级调整推荐权重。你也可以直接使用默认推荐。
                    </p>
                    <p className="pref-sub">你更看重什么？</p>
                    <div className="pref-seg">
                      {PREF_SEGS.map((seg) => (
                        <button
                          key={seg.id}
                          type="button"
                          className={form.prefSeg === seg.id ? "on" : ""}
                          onClick={() => setSeg(seg.id)}
                        >
                          {seg.label}
                        </button>
                      ))}
                    </div>
                    <div className="pref-list">
                      {form.prefOrder.map((name, i) => {
                        const w = PREF_WEIGHTS[i] || 0;
                        return (
                          <div
                            key={name}
                            className="pref-row"
                            draggable
                            onDragStart={() => onDragStart(i)}
                            onDragOver={(e) => onDragOver(e, i)}
                          >
                            <span className="pref-rank">{i + 1}</span>
                            <span className="pref-handle">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" /><circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" /><circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" /></svg>
                            </span>
                            <span className="pref-name">{name}</span>
                            <span className="pref-bar">
                              <i style={{ width: (w / PREF_WEIGHTS[0]) * 100 + "%" }} />
                            </span>
                            <span className="pref-pct">{w}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="more-toggle"
                      onClick={() => patch({ showMoreFactors: !form.showMoreFactors })}
                    >
                      <span style={{ transform: form.showMoreFactors ? "rotate(180deg)" : undefined, display: "inline-block" }}>⌄</span>{" "}
                      更多评分因子
                    </button>
                    {form.showMoreFactors ? (
                      <div className="more-factors">
                        {MORE_FACTORS.map((f) => (
                          <span className="mf" key={f}>
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="field full">
                    <label>
                      你当前最大的顾虑是什么？<span className="tag-opt">可多选</span>
                    </label>
                    <div className="chips">
                      {CONCERNS.map((c) => (
                        <span
                          key={c}
                          className={"chip-opt" + (form.concern.indexOf(c) >= 0 ? " on" : "")}
                          onClick={() => toggleMulti("concern", c)}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="q-actions">
                  <button className="btn btn-primary btn-lg" type="button" onClick={submitLayer1}>
                    查看初步判断 <span>→</span>
                  </button>
                  <span className="note">无需注册，先看方向再决定要不要深入。</span>
                </div>
              </div>
            </section>
          ) : null}

          {/* 更精准推荐 (qA) — 服务商初判后出现 */}
          {showRec ? (
            <section className={"qcard" + (openCards.qA ? "" : " collapsed")}>
              <div
                className="qcard-head toggle"
                onClick={() => setOpenCards((c) => ({ ...c, qA: !c.qA }))}
              >
                <span className="step opt">可选</span>
                <h3>获取更精准推荐</h3>
                <span className="sum">补充预算与偏好</span>
                <span className="chev">⌄</span>
              </div>
              <div className="qcard-body">
                <div className="fgrid">
                  <div className="field">
                    <label>月 GMV</label>
                    <select className="select" value={form.gmv} onChange={(e) => patch({ gmv: e.target.value })}>
                      <option value="">请选择…</option>
                      {GMV_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>
                      服务预算范围 <span className="tag-opt">月</span>
                    </label>
                    <select className="select" value={form.budget} onChange={(e) => patch({ budget: e.target.value })}>
                      <option value="">请选择…</option>
                      {BUDGET_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field full">
                    <label>需要覆盖的服务地区</label>
                    <input
                      className="input"
                      value={form.region}
                      onChange={(e) => patch({ region: e.target.value })}
                      placeholder="如：美西、美东、德国本地仓"
                    />
                  </div>
                  <ChipField
                    label="对服务商最关注的因素"
                    optionalTag="可多选"
                    options={FOCUS_OPTIONS}
                    selected={form.focus}
                    onToggle={(v) => toggleMulti("focus", v)}
                  />
                </div>
                <div className="q-actions">
                  <button className="btn btn-primary" type="button" onClick={updateRec}>
                    更新推荐 <span>→</span>
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* 测算账期压力 (qB) */}
          {wantTerm ? (
            <section
              className={"qcard" + (openCards.qB ? "" : " collapsed")}
              ref={qBRef}
            >
              <div
                className="qcard-head toggle"
                onClick={() => setOpenCards((c) => ({ ...c, qB: !c.qB }))}
              >
                <span className="step">STEP 02</span>
                <h3>测算账期压力</h3>
                <span className="sum">是否需要顺便判断</span>
                <span className="chev">⌄</span>
              </div>
              <div className="qcard-body">
                <div className="bill-intro">
                  <div className="bi-title">快速判断账单压力</div>
                  <p>回答 5 个问题，先判断这笔账单是否会影响现金流。需要时再进入 TermPay 预申请。</p>
                </div>

                <SchipQuestion
                  n="1"
                  title="这笔账单是什么类型？"
                  options={BILL_TYPES}
                  value={form.billType}
                  onSelect={(v) => patch({ billType: v })}
                />
                <div className="bq">
                  <div className="bq-h">
                    <span className="bq-n">2</span>账单金额是多少？
                  </div>
                  <div className="schips">
                    {BILL_AMOUNTS.map((o) => (
                      <span
                        key={o}
                        className={"schip" + (form.billAmount === o ? " on" : "")}
                        onClick={() => patch({ billAmount: o })}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                  {form.billAmount === "自定义金额" ? (
                    <input
                      className="input"
                      style={{ marginTop: 10, maxWidth: 220 }}
                      value={form.billAmountCustom}
                      onChange={(e) => patch({ billAmountCustom: e.target.value })}
                      placeholder="输入金额（元）"
                    />
                  ) : null}
                </div>
                <SchipQuestion
                  n="3"
                  title="多久后需要支付？"
                  options={DUE_OPTIONS}
                  value={form.due}
                  onSelect={(v) => patch({ due: v })}
                />
                <SchipQuestion
                  n="4"
                  title="主要回款大概多久到账？"
                  options={RECV_OPTIONS}
                  value={form.recv}
                  onSelect={(v) => patch({ recv: v })}
                />
                <SchipQuestion
                  n="5"
                  title="当前可用于支付这笔账单的现金是否足够？"
                  options={CASH_OPTIONS}
                  value={form.cash}
                  onSelect={(v) => patch({ cash: v })}
                />

                {form.cash === "不确定" ? (
                  <div className="bsub">
                    <p className="bsub-note">
                      你暂时不确定现金是否足够。我们可以先根据账单到期时间、预计回款时间和未来 30 天支出类型做粗略判断。
                    </p>
                    <div className="bq">
                      <div className="bq-h sub">若现在支付这笔账单，会影响接下来 30 天的经营安排吗？</div>
                      <div className="schips">
                        {IMPACT_OPTIONS.map((o) => (
                          <span
                            key={o}
                            className={"schip" + (form.impact === o ? " on" : "")}
                            onClick={() => patch({ impact: o })}
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bq">
                      <div className="bq-h sub">
                        接下来 30 天还有哪些大额支出？<span className="tag-opt">可多选</span>
                      </div>
                      <div className="schips">
                        {FUTURE_OPTIONS.map((o) => (
                          <span
                            key={o}
                            className={"schip" + (form.future.indexOf(o) >= 0 ? " on" : "")}
                            onClick={() => toggleMulti("future", o)}
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="q-actions">
                  <button className="btn btn-primary" type="button" onClick={calcTerm}>
                    判断账单压力 <span>→</span>
                  </button>
                  <span className="note">仅做粗略判断，不会立即提交申请。</span>
                </div>

                {showDeepBill ? (
                  <div className="bdeep" ref={deepBillRef}>
                    <div className="qdiv" />
                    <div className="bi-title">补充信息，生成更准确方案</div>
                    <div className="fgrid" style={{ marginTop: 14 }}>
                      <div className="field">
                        <label>月均回款</label>
                        <select className="select" value={form.dRecv} onChange={(e) => patch({ dRecv: e.target.value })}>
                          {D_RECV_OPTIONS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>近 30 天固定支出</label>
                        <input className="input" value={form.dFixed} onChange={(e) => patch({ dFixed: e.target.value })} placeholder="如：约 35 万" />
                      </div>
                      <div className="field">
                        <label>近 30 天备货 / 广告计划</label>
                        <input className="input" value={form.dPlan} onChange={(e) => patch({ dPlan: e.target.value })} placeholder="如：补货 40 万 + 广告 8 万" />
                      </div>
                      <div className="field">
                        <label>账单对应服务商</label>
                        <input className="input" value={form.dVendor} onChange={(e) => patch({ dVendor: e.target.value })} placeholder="如：环邦海外仓" />
                      </div>
                      <SchipQuestionInline
                        label="是否已有发票 / 账单截图"
                        options={["已有", "暂无"]}
                        value={form.dInvoice}
                        onSelect={(v) => patch({ dInvoice: v })}
                      />
                      <SchipQuestionInline
                        label="是否希望服务商直接收款"
                        options={["是", "否"]}
                        value={form.dDirect}
                        onSelect={(v) => patch({ dDirect: v })}
                      />
                    </div>
                    <div className="q-actions">
                      <button className="btn btn-primary" type="button" onClick={() => openContact("TermPay 预申请")}>
                        提交并预申请 <span>→</span>
                      </button>
                      <span className="note">提交后由具备资质的合作机构审核。</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 提交动作 (qC) */}
          {showContact ? (
            <section className={"qcard" + (openCards.qC ? "" : " collapsed")} ref={qCRef}>
              <div
                className="qcard-head toggle"
                onClick={() => setOpenCards((c) => ({ ...c, qC: !c.qC }))}
              >
                <span className="step opt">提交前</span>
                <h3>{contactLabel}</h3>
                <span className="sum">补充联系与主体信息</span>
                <span className="chev">⌄</span>
              </div>
              <div className="qcard-body">
                <p className="q-hint" style={{ marginBottom: 18 }}>
                  <span className="dot" />
                  到这一步才需要可识别信息，用于对接服务商或发起预申请。
                </p>
                <div className="fgrid">
                  <div className="field">
                    <label>
                      公司名称<span className="req">*</span>
                    </label>
                    <input className="input" placeholder="营业执照全称" />
                  </div>
                  <div className="field">
                    <label>
                      联系人<span className="req">*</span>
                    </label>
                    <input className="input" placeholder="您的称呼" />
                  </div>
                  <div className="field">
                    <label>
                      手机号<span className="req">*</span>
                    </label>
                    <input className="input" placeholder="接收对接通知" />
                  </div>
                  <div className="field">
                    <label>企业主体信息</label>
                    <input className="input" placeholder="统一社会信用代码（选填）" />
                  </div>
                  <div className="field full">
                    <label>
                      相关账单 / 资料 <span className="tag-opt">选填</span>
                    </label>
                    <textarea className="input" placeholder="可补充账单截图说明、特殊要求等" />
                  </div>
                </div>
                <div className="q-actions">
                  <button
                    className={demandSubmitted ? "btn btn-soft btn-lg" : "btn btn-primary btn-lg"}
                    type="button"
                    onClick={submitDemand}
                    disabled={demandSubmitted}
                  >
                    {demandSubmitted ? "已提交 ✓" : (
                      <>
                        提交 <span>→</span>
                      </>
                    )}
                  </button>
                  <span className="note">
                    {contactLabel.indexOf("TermPay") >= 0
                      ? "金融类申请由具备资质的合作机构审核，额度 / 费率 / 期限以正式结果为准。"
                      : "提交后由豆服 DF 对接，金融类申请以正式审核为准。"}
                  </span>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {/* ===== 右：智能输出 ===== */}
        <aside className="results">
          <div className="results-cap">
            <span className="sparkle" />
            智能输出预览
          </div>

          {showGhost ? (
            <div className="rghost">
              <div className="gic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2" /></svg>
              </div>
              完成左侧几个问题，
              <br />
              这里会先给出
              <strong style={{ color: "var(--fg-dim)" }}>初步判断</strong>——
              <br />
              无需填写公司或账单信息。
            </div>
          ) : null}

          {/* 综合建议（仅"两者都看"） */}
          {showCombo ? (
            <section className="rpanel appear">
              <div className="rp-head">
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>
                </span>
                <h4>综合建议：服务商 + 账期一起看</h4>
              </div>
              <p className="rec-reason">
                从你的选择看，问题不是单纯找海外仓，而是旺季补库、仓储费/头程费集中到期和平台回款滞后叠在一起。建议优先选择支持{" "}
                <span className="hl">TermPay</span> 协同的仓配服务商，在确认仓位、报价和服务范围后，同步评估{" "}
                <span className="hl">30 天账期方案</span>，降低现金流压力。
              </p>
              <div className="combo-grid">
                <div className="combo-item">
                  <span className="combo-k">推荐优先级</span>
                  <span className="combo-v">优先看支持账期协同的海外仓 / 头程服务商</span>
                </div>
                <div className="combo-item">
                  <span className="combo-k">账期风险</span>
                  <span className="combo-v">账单到期早于平台回款，存在潜在错配</span>
                </div>
                <div className="combo-item">
                  <span className="combo-k">下一步</span>
                  <span className="combo-v">先确认服务商报价，再生成 TermPay 预申请</span>
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => scrollToRef(candListRef)}>
                  查看支持账期的服务商
                </button>
                <button className="btn btn-soft" type="button" onClick={gotoTerm}>
                  测算 30 天账期方案
                </button>
                <button className="btn btn-soft" type="button" onClick={() => openContact("生成服务需求单")}>
                  生成服务需求单
                </button>
              </div>
            </section>
          ) : null}

          {/* 服务商推荐 */}
          {showRec ? (
            <section className="rpanel accent appear">
              <div className="rp-head">
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>
                </span>
                <h4>服务商推荐方向</h4>
                <span className="badge indigo">
                  <span className="d" />
                  {flags.refined ? "已优化推荐" : "初步判断"}
                </span>
              </div>
              <div className="verify-row">
                <span className="vchip cert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l4 4L19 6" /></svg>
                  豆沙包认证
                </span>
                <span className="vchip pick">精选服务商池</span>
              </div>
              <div className="rfield">
                <span className="rk">推荐方向</span>
                <span className="rv">{recDirection(form)}</span>
              </div>
              <div className="rfield">
                <span className="rk">推荐依据</span>
                <div className="basis">
                  {recBasis.map((t, i) => (
                    <span key={t + i}>{t}</span>
                  ))}
                </div>
              </div>
              <p className="rec-reason">
                {form.intent === "both" ? (
                  <>
                    你当前的需求不是单纯找海外仓，而是希望在旺季补库时同时解决
                    <span className="hl">仓位、退货换标和账单支付节奏</span>。优先推荐
                    <span className="hl">支持账期协同</span>的仓配服务商，会比只看报价更稳。
                  </>
                ) : (
                  <>
                    你当前处于<span className="hl">{stageShort || "成长阶段"}</span>，
                    <span className="hl">{form.cat || "你的类目"}</span>
                    类目对仓储体积、旺季扩容和尾程时效要求较高；
                    {prefHook.length ? (
                      <>
                        同时你把<span className="hl">{prefHook.join("和")}</span>作为筛选偏好，
                      </>
                    ) : null}
                    因此优先推荐具备美西/美东仓配能力、可提供清晰报价
                    {prefHook.indexOf("支持账期") >= 0 ? "和账期协同能力" : ""}的服务商。
                  </>
                )}
              </p>
              <div className="rfield">
                <span className="rk">适配场景</span>
                <span className="rv" style={{ fontWeight: 400, fontSize: "13.5px", color: "var(--fg-dim)" }}>
                  {stageShort} · {form.platform.join(" / ")}｜{form.country.join(" / ") || "目标市场"} 多平台备货与旺季补库
                </span>
              </div>
              <div className="risk-note">
                <b>签约前重点确认：</b>旺季仓位是否锁定、是否支持退货换标、报价是否包含旺季附加费，以及账期支持是否需要额外审核。
              </div>
              <div className="match">
                <span className="lbl">综合匹配度 · 按你的权重排序</span>
                <span className="bar">
                  <i style={{ width: matchVal + "%" }} />
                </span>
                <span className="val">{matchVal || "—"}</span>
              </div>
              <p className="match-exp">{matchExp}</p>

              <div className="weight-mod">
                <div className="wm-h">当前推荐权重</div>
                <div className="wlist">
                  {form.prefOrder.map((name, i) => {
                    const w = PREF_WEIGHTS[i] || 0;
                    return (
                      <div className="wrow" key={name}>
                        <span className="wname">{name}</span>
                        <span className="wbar">
                          <i style={{ width: (w / PREF_WEIGHTS[0]) * 100 + "%" }} />
                        </span>
                        <span className="wpct">{w}%</span>
                      </div>
                    );
                  })}
                </div>
                <p className="wm-note">推荐排序根据你的偏好权重、服务商能力、认证状态和当前需求综合生成。</p>
                <p className="wm-fine">豆沙包认证 / 优选会影响可信度评分，但不会替代服务匹配度。</p>
              </div>

              <div className="pcards" ref={candListRef}>
                {PROVIDERS.map((p) => (
                  <ProviderCard
                    key={p.name}
                    p={p}
                    refined={flags.refined}
                    isBoth={form.intent === "both"}
                    onContact={openContact}
                    onViewProfile={onViewProfile}
                  />
                ))}
              </div>
              <p className="rec-disclaimer">
                推荐排序综合服务匹配度、认证状态、履约反馈及豆服云展示权益生成；最终合作以双方确认的服务协议为准。
              </p>
              <div className="actions secondary">
                <button className="btn btn-ghost" type="button" onClick={() => setOpenCards((c) => ({ ...c, qA: true }))}>
                  获取更精准推荐 <span>→</span>
                </button>
              </div>
            </section>
          ) : null}

          {/* 账期：引导 */}
          {showTermGuide ? (
            <section className="rpanel">
              <div className="rp-head">
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 3v18M5 8h9a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h10" /></svg>
                </span>
                <h4>账期判断</h4>
              </div>
              <p className="guide">
                {form.intent === "both" ? (
                  "如果你选择速通供应链或云仓宝这类支持 TermPay 的服务商，可在确认报价后，将对应头程/仓储账单纳入 30 天账期方案测算。"
                ) : (
                  <>
                    你选择的服务场景（如海外仓储 / 物流）可能涉及较大账单。
                    <b style={{ color: "#C4B5FD" }}>是否需要顺便判断账期压力？</b>
                    补充账单信息后可生成更准确的 TermPay 建议——现在不强制填写任何金额。
                  </>
                )}
              </p>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={gotoTerm}>
                  是，判断账期压力 <span>→</span>
                </button>
              </div>
            </section>
          ) : null}

          {/* 账期：结果 */}
          {showTermResult ? (
            <section className="rpanel appear">
              <div className="rp-head">
                <span className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 3v18M5 8h9a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h10" /></svg>
                </span>
                <h4>账期判断结果</h4>
                <span className={"badge " + term.badgeClass}>
                  <span className="d" />
                  压力{term.level}
                </span>
              </div>
              <div className="riskrow">
                <span className="k">账期压力等级</span>
                <span className="v" style={{ color: term.levelColor }}>{term.level}</span>
              </div>
              <div className="riskrow">
                <span className="k">是否存在账期错配</span>
                <span className="v" style={{ color: "var(--amber)" }}>{term.mismatch}</span>
              </div>
              <div className="riskrow">
                <span className="k">账单金额 / 类型</span>
                <span className="v">{term.amountLabel || "—"}｜{form.billType || "—"}</span>
              </div>
              <div className="riskrow">
                <span className="k">到期 / 回款</span>
                <span className="v">{form.due || "—"} / {form.recv || "—"}</span>
              </div>
              <p className="term-explain">
                {term.mmText}
                <br />
                现金影响：{term.cashText}。
              </p>

              {term.level === "待确认" ? (
                <div className="risk-note">
                  你暂时不确定现金是否足够。根据账单到期时间、预计回款时间和未来 30 天支出类型，系统判断<b>存在潜在账期风险</b>。补充现金信息后可生成更准确方案。
                </div>
              ) : null}

              {term.level === "中" || term.level === "高" ? (
                <>
                  <p className="match-exp" style={{ margin: "14px 0 6px" }}>
                    建议账期（覆盖回款空档，按审核结果为准）
                  </p>
                  <div className="term-options">
                    <div className="term-opt rec">
                      <b>30 天</b>推荐
                    </div>
                    <div className="term-opt">
                      <b>60 天</b>
                    </div>
                    <div className="term-opt">
                      <b>90 天</b>
                    </div>
                  </div>
                </>
              ) : null}

              {/* 三种筹资方式对比 */}
              {term.level === "高" ? (
                <FundingCompare />
              ) : term.level === "中" || term.level === "待确认" ? (
                <div className="funding-entry">
                  <button
                    type="button"
                    className="funding-entry-toggle"
                    onClick={() => setShowFundingCompare((v) => !v)}
                    aria-expanded={showFundingCompare}
                  >
                    <span>想了解其他筹资方式？看三种方式怎么选</span>
                    <span className={"chev" + (showFundingCompare ? " open" : "")}>⌄</span>
                  </button>
                  {showFundingCompare ? <FundingCompare /> : null}
                </div>
              ) : null}

              <p className="next-step">
                <b>建议下一步：</b>
                {nextSteps[term.level]}
              </p>

              <div className="actions">
                {term.level === "低" ? (
                  <button className="btn btn-soft" type="button" onClick={saveReminder} disabled={reminderSaved}>
                    {reminderSaved ? "已保存提醒 ✓" : "保存账单提醒"}
                  </button>
                ) : null}
                {term.level === "中" ? (
                  <>
                    <button className="btn btn-primary" type="button" onClick={openDeepBill}>
                      查看 30 天账期方案 <span>→</span>
                    </button>
                    <button className="btn btn-soft" type="button" onClick={() => openContact("TermPay 预申请")}>
                      TermPay 预申请
                    </button>
                  </>
                ) : null}
                {term.level === "高" ? (
                  <>
                    <button className="btn btn-primary" type="button" onClick={() => openContact("TermPay 预申请")}>
                      TermPay 预申请 <span>→</span>
                    </button>
                    <button className="btn btn-soft" type="button" onClick={openDeepBill}>
                      查看 30 天账期方案
                    </button>
                  </>
                ) : null}
                {term.level === "待确认" ? (
                  <>
                    <button className="btn btn-primary" type="button" onClick={openDeepBill}>
                      补充现金信息 <span>→</span>
                    </button>
                    <button className="btn btn-soft" type="button" onClick={() => openContact("咨询顾问")}>
                      咨询顾问
                    </button>
                  </>
                ) : null}
              </div>
              {term.level !== "低" ? (
                <p className="term-compliance">
                  额度、费率、期限及是否通过，以合作资金方审核和正式协议为准。
                </p>
              ) : null}
            </section>
          ) : null}

          {/* 合规 */}
          {showCompliance ? (
            <section className="rpanel compliance-p">
              <div className="rp-head">
                <span className="ic" style={{ color: "var(--green)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
                </span>
                <h4>风险与合规提示</h4>
              </div>
              <ul className="comp-list">
                <li>
                  <svg className="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></svg>
                  服务商推荐仅用于辅助筛选，最终服务以服务商协议为准。
                </li>
                <li>
                  <svg className="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></svg>
                  金融额度、费率、期限与审批以正式审核为准，由具备资质的合作机构提供。
                </li>
                <li>
                  <svg className="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></svg>
                  智能分析仅用于辅助理解与材料准备，不构成投资或融资建议。
                </li>
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

/* ============================================================
   子组件
   ============================================================ */

/** 三种筹资方式对比（金融科技栏高亮，承接 TermPay 预申请）。 */
function FundingCompare() {
  return (
    <div className="funding-compare">
      <p className="funding-compare-h">三种筹资方式，哪种更适合「大额账单 + 回款错配」？</p>
      <div className="funding-grid">
        <div className="funding-col">
          <div className="funding-col-t">银行贷款</div>
          <ul>
            <li>申请周期长，审核严格</li>
            <li>可能需要抵押 / 担保</li>
            <li>到期还本付息，灵活度低</li>
          </ul>
        </div>
        <div className="funding-col">
          <div className="funding-col-t">股权融资</div>
          <ul>
            <li>资金确定性低，周期久</li>
            <li>尽调资料复杂</li>
            <li>稀释股权、让渡部分经营参与</li>
          </ul>
        </div>
        <div className="funding-col fintech">
          <span className="funding-tag">更契合本场景</span>
          <div className="funding-col-t">
            金融科技产品
            <span className="funding-col-sub">TermPay · 豆分期升级版</span>
          </div>
          <ul>
            <li>申请简单，批复快</li>
            <li>随借随还，按账期灵活延期 / 分期</li>
            <li>贴合大额账单与回款节奏错配</li>
          </ul>
        </div>
      </div>
      <p className="funding-fine">
        额度、费率、期限以合作资金方审核与正式协议为准；Dowsure 提供技术、数据、风控与连接能力，不放款。
      </p>
    </div>
  );
}

function ChipField({
  label,
  required,
  optionalTag,
  options,
  selected,
  onToggle,
}: {
  label: string;
  required?: boolean;
  optionalTag?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="field full">
      <label>
        {label}
        {required ? <span className="req">*</span> : null}
        {optionalTag ? <span className="tag-opt">{optionalTag}</span> : null}
      </label>
      <div className="chips">
        {options.map((o) => (
          <span
            key={o}
            className={"chip-opt" + (selected.indexOf(o) >= 0 ? " on" : "")}
            onClick={() => onToggle(o)}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

function SchipQuestion({
  n,
  title,
  options,
  value,
  onSelect,
}: {
  n: string;
  title: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="bq">
      <div className="bq-h">
        <span className="bq-n">{n}</span>
        {title}
      </div>
      <div className="schips">
        {options.map((o) => (
          <span
            key={o}
            className={"schip" + (value === o ? " on" : "")}
            onClick={() => onSelect(o)}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

function SchipQuestionInline({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="schips">
        {options.map((o) => (
          <span
            key={o}
            className={"schip" + (value === o ? " on" : "")}
            onClick={() => onSelect(o)}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProviderCard({
  p,
  refined,
  isBoth,
  onContact,
  onViewProfile,
}: {
  p: Provider;
  refined: boolean;
  isBoth: boolean;
  onContact: (label: string) => void;
  onViewProfile: () => void;
}) {
  const m = refined ? p.match + p.boost : p.match;
  return (
    <div className="pcard">
      <div className="pcard-top">
        <span className="plogo">{p.logo}</span>
        <div className="pmeta">
          <div className="pname">{p.name}</div>
          <div className="pbadges">
            {p.badges.map((b) => (
              <span className={"pbadge " + b.c} key={b.t}>
                {b.c === "preferred" ? (
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.6L21 10l-5 4.3L17.6 21 12 17.3 6.4 21 8 14.3 3 10l6.4-1.4z" /></svg>
                ) : b.c === "cert" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l4 4L19 6" /></svg>
                ) : null}
                {b.t}
              </span>
            ))}
          </div>
        </div>
        <span className="pmatch">
          <b>{m}</b>
          <span>按你的权重</span>
        </span>
      </div>
      <div className="ptags">
        {p.tags.map((t) => (
          <span className="ctag" key={t}>
            {t}
          </span>
        ))}
      </div>
      <p className="preason">{p.reason}</p>
      <div className="term-sync">
        <div className="term-sync-title">账期协同</div>
        <div className="term-sync-row">
          <b>支持状态：</b>
          <span>{p.termSync.status}</span>
        </div>
        <div className="term-sync-row">
          <b>适合账单：</b>
          <span>{p.termSync.bills}</span>
        </div>
        <div className="term-sync-row">
          <b>建议：</b>
          <span>{p.termSync.advice}</span>
        </div>
      </div>
      <p className="whyw">
        <b>按你的权重排序：</b>
        {p.whyWeight}
      </p>
      <div className="hits">
        <div className="hk">命中你的偏好</div>
        <div className="hit-tags">
          {p.hits.map((h) => (
            <span className="hit" key={h[0]}>
              {h[0]}·{h[1]}
            </span>
          ))}
        </div>
      </div>
      <div className="weak">
        <span className="wi">短板</span>
        <span>{p.weakness}</span>
      </div>
      <div className="pactions">
        {isBoth ? (
          <button className="btn btn-primary main" type="button" onClick={() => onContact("生成需求并测算账期")}>
            生成需求并测算账期
          </button>
        ) : null}
        <button className="btn btn-primary main" type="button" onClick={onViewProfile}>
          查看详情
        </button>
        <button className="btn btn-soft" type="button" onClick={() => onContact("在线咨询")}>
          在线咨询
        </button>
        <button className="btn btn-soft" type="button" onClick={() => onContact("发起需求")}>
          发起需求
        </button>
      </div>
    </div>
  );
}
