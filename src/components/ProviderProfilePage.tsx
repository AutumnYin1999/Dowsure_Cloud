import "./provider-profile.css";
import { showToast } from "@/components/ui/Toast";

interface ProviderProfilePageProps {
  /** 返回卖家智能服务台 */
  onBackToDesk: () => void;
  /** 返回首页 */
  onHome: () => void;
}

const WHY_CHIPS = [
  "家居园艺 / 户外",
  "Amazon / Temu",
  "美国 / 德国",
  "海外仓储",
  "FBA 中转",
  "退货换标",
  "旺季临时仓位",
  "价格透明",
  "支持账期",
];

const CONFIRM_ITEMS = [
  "旺季仓位是否可提前锁定",
  "报价是否包含旺季附加费",
  "退货换标服务是否覆盖当前 SKU",
  "是否支持账期协同及对应审核条件",
];

const CAPABILITIES: { title: string; items: string[]; icon: JSX.Element }[] = [
  {
    title: "海外仓储",
    items: ["美西 / 美东双仓", "标准仓储", "大件仓储", "旺季临时仓位"],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M4 9l8-5 8 5" /></svg>
    ),
  },
  {
    title: "FBA 中转",
    items: ["入仓预约", "分批补货", "贴标换标", "FBA 退货处理"],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
    ),
  },
  {
    title: "尾程配送",
    items: ["本地派送", "多渠道发货", "订单履约", "异常件处理"],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /><path d="M3 6h11v9H3zM14 9h4l3 3v3h-2" /></svg>
    ),
  },
  {
    title: "退货换标",
    items: ["退货接收", "质检", "换标", "二次上架"],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" /></svg>
    ),
  },
];

const INFO_ROWS: [string, JSX.Element][] = [
  ["服务国家", <>美国</>],
  ["主要仓区", <>美西 / 美东</>],
  ["适合卖家规模", <>成长期 / 成熟期卖家</>],
  ["适合 SKU", <>中大件、家居园艺、户外用品</>],
  ["报价方式", <>按仓储费、操作费、尾程费组合报价</>],
  ["是否支持账期", <><span className="ok">支持</span>，需审核</>],
  ["是否支持 TermPay", <><span className="ok">支持对接</span></>],
  ["平均响应时间", <>1 个工作日内</>],
  ["豆服 DF 推荐来源", <>智能服务台匹配推荐</>],
];

const SIMILAR = [
  { logo: "速通", name: "速通供应链", match: "90", desc: "海运头程 + 仓配一体，账单可对接 TermPay 延后支付。" },
  { logo: "云仓", name: "云仓宝", match: "88", desc: "德国本地仓 + 旺季弹性仓位，适合欧洲站放量。" },
  { logo: "捷仓", name: "捷仓物流", match: "85", desc: "美东仓 + 尾程多渠道，中小件家居补货性价比高。" },
];

function PreferredBadge() {
  return (
    <span className="gbadge preferred">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.6L21 10l-5 4.3L17.6 21 12 17.3 6.4 21 8 14.3 3 10l6.4-1.4z" /></svg>
      豆沙包优选
    </span>
  );
}
function CertBadge({ label = "已认证服务商" }: { label?: string }) {
  return (
    <span className="gbadge cert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l4 4L19 6" /></svg>
      {label}
    </span>
  );
}

export function ProviderProfilePage({ onBackToDesk, onHome }: ProviderProfilePageProps) {
  return (
    <main className="provider-profile">
      <div className="pp-bg" aria-hidden />

      <div className="pp-crumb">
        <a onClick={onHome}>首页</a>
        <span className="sep">/</span>
        <a onClick={onBackToDesk}>卖家智能服务台</a>
        <span className="sep">/</span>
        <span className="cur">服务商主页</span>
      </div>

      {/* HERO */}
      <section className="pp-hero">
        <span className="src">
          <span className="sparkle" />
          豆服 DF 推荐生态 · 服务商主页
        </span>
        <div className="pp-top">
          <span className="pp-logo brand-avatar">环邦</span>
          <div className="pp-id">
            <h1>环邦海外仓</h1>
            <p className="intro">专注美西 / 美东海外仓、FBA 中转、退货换标与旺季弹性仓位服务。</p>
            <div className="pp-badges">
              <PreferredBadge />
              <CertBadge />
              <span className="gbadge cloud">豆服云入驻</span>
              <span className="gbadge func">支持 TermPay</span>
            </div>
            <div className="pp-meta">
              <div className="m">
                <span className="mk">覆盖地区</span>
                <span className="mv">美国美西 / 美国美东</span>
              </div>
              <div className="m">
                <span className="mk">适合平台</span>
                <span className="mv">Amazon / Temu / Walmart / 独立站</span>
              </div>
              <div className="m">
                <span className="mk">适合品类</span>
                <span className="mv">家居园艺 / 户外 / 大件商品</span>
              </div>
            </div>
            <div className="pp-cta">
              <button className="btn btn-primary btn-lg" type="button" onClick={() => showToast("已记录需求，我们会尽快对接")}>
                发起需求 <span>→</span>
              </button>
              <button className="btn btn-ghost btn-lg" type="button" onClick={() => showToast("已为你接入在线咨询")}>
                在线咨询
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="pp">
        <div className="col-main">
          {/* 为什么推荐 */}
          <section className="card">
            <div className="mod-h">
              <span className="mi">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3a9 9 0 0 1 9 9c0 3.5-2 5.5-3.5 6.5V21H6.5v-2.5C5 17.5 3 15.5 3 12a9 9 0 0 1 9-9z" /><path d="M9 21h6" /></svg>
              </span>
              <h2>为什么推荐给你</h2>
              <span className="sub">基于你在智能服务台的问卷</span>
            </div>
            <div className="bchips">
              {WHY_CHIPS.map((c) => (
                <span className="bchip" key={c}>
                  {c}
                </span>
              ))}
            </div>
            <p className="why-text">
              你当前处于<span className="hl">成长期</span>，家居园艺类目对仓储体积、旺季扩容和尾程时效要求较高。环邦海外仓覆盖
              <span className="hl">美西 / 美东仓</span>，支持退货换标和旺季临时仓位，适合大件类目卖家在旺季前进行补库与仓配优化。
            </p>
            <div className="confirm">
              <div className="ct">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></svg>
                风险与确认项
              </div>
              <ul>
                {CONFIRM_ITEMS.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 服务能力 */}
          <section className="card">
            <div className="mod-h">
              <span className="mi">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M3 13h18" /></svg>
              </span>
              <h2>服务能力</h2>
            </div>
            <div className="caps">
              {CAPABILITIES.map((cap) => (
                <div className="cap" key={cap.title}>
                  <h3>
                    <span className="ci">{cap.icon}</span>
                    {cap.title}
                  </h3>
                  <ul>
                    {cap.items.map((it) => (
                      <li key={it}>
                        <span className="dot" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 合作信息 */}
          <section className="card">
            <div className="mod-h">
              <span className="mi">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h16v12H4zM4 10h16" /><path d="M8 14h4" /></svg>
              </span>
              <h2>合作信息</h2>
            </div>
            <div className="info-grid">
              {INFO_ROWS.map(([k, v], i) => (
                <div className="row" key={i}>
                  <div className="k">{k}</div>
                  <div className="v">{v}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 案例与反馈 */}
          <section className="card">
            <div className="mod-h">
              <span className="mi">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 4h14v12H7l-3 3z" /><path d="M8 9h8M8 12h5" /></svg>
              </span>
              <h2>案例与反馈</h2>
              <span className="sub">样例展示</span>
            </div>
            <div className="cases">
              <div className="case">
                <p className="ch">家居卖家旺季补仓</p>
                <ul>
                  <li><span className="ck">✓</span>美西仓临时扩容</li>
                  <li><span className="ck">✓</span>退货换标处理</li>
                  <li><span className="ck">✓</span>尾程时效稳定</li>
                </ul>
                <span className="ctag">适合 Amazon US 卖家</span>
              </div>
              <div className="case">
                <p className="ch">户外用品卖家 FBA 中转</p>
                <ul>
                  <li><span className="ck">✓</span>分批补货</li>
                  <li><span className="ck">✓</span>降低单次入仓压力</li>
                  <li><span className="ck">✓</span>支持大件 SKU</li>
                </ul>
                <span className="ctag">大件仓配</span>
              </div>
            </div>
            <div className="quotes">
              <div className="quote">
                "响应速度快，旺季仓位沟通比较及时。"
                <span className="who">— 家居类目卖家 · Amazon US</span>
              </div>
              <div className="quote">
                "报价结构清楚，适合需要稳定仓配的卖家。"
                <span className="who">— 户外用品卖家 · 多平台</span>
              </div>
            </div>
          </section>

          {/* 账期与金融支持 */}
          <section className="card term">
            <div className="mod-h">
              <span className="mi">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3v18M5 8h9a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h10" /></svg>
              </span>
              <h2>账期与金融支持</h2>
            </div>
            <p className="term-lead">
              如该服务商账单金额较大，卖家可通过豆服 DF 判断是否存在账期压力，并申请 TermPay / 豆分期方案。
            </p>
            <div className="term-info">
              <div className="ti">
                <div className="k">支持账单类型</div>
                <div className="v">海外仓费 / 头程物流费 / 仓配服务费</div>
              </div>
              <div className="ti">
                <div className="k">可选账期</div>
                <div className="v">
                  <span className="pill-days">
                    <span className="pd">30 天</span>
                    <span className="pd">60 天</span>
                    <span className="pd">90 天</span>
                  </span>
                </div>
              </div>
            </div>
            <p className="term-note">审核说明：额度、费率、期限以正式审核为准，由具备资质的合作机构提供。</p>
            <div className="term-cta">
              <button className="btn btn-soft" type="button" onClick={onBackToDesk}>
                测算账期压力
              </button>
              <button className="btn btn-primary" type="button" onClick={onBackToDesk}>
                TermPay 预申请 <span>→</span>
              </button>
            </div>
          </section>
        </div>

        {/* 右侧固定操作栏 */}
        <aside className="rail">
          <div className="rail-card">
            <div className="rname">
              <span className="rlogo brand-avatar">环邦</span>
              <span className="rn">环邦海外仓</span>
            </div>
            <div className="rail-badges">
              <PreferredBadge />
              <CertBadge label="已认证" />
            </div>
            <div className="rail-actions">
              <button className="btn btn-primary" type="button" onClick={() => showToast("已记录需求，我们会尽快对接")}>
                发起需求 <span>→</span>
              </button>
              <button className="btn btn-soft" type="button" onClick={() => showToast("已为你接入在线咨询")}>
                在线咨询
              </button>
              <button className="btn btn-soft" type="button" onClick={() => showToast("已提交报价申请")}>
                申请报价
              </button>
              <div className="rail-sub">
                <button className="btn btn-ghost" type="button" onClick={() => showToast("已加入对比")}>
                  加入对比
                </button>
              </div>
            </div>
            <p className="rail-fine">服务商推荐仅用于辅助筛选，最终合作以双方确认的服务协议为准。</p>
          </div>
        </aside>
      </div>

      {/* 底部 */}
      <section className="pp-bottom">
        <div className="sim-head">
          <h2>相似服务商推荐</h2>
          <div className="links">
            <a onClick={onBackToDesk}>← 返回卖家智能服务台</a>
          </div>
        </div>
        <div className="sim-cards">
          {SIMILAR.map((s) => (
            <div className="sim" key={s.name}>
              <div className="st">
                <span className="slogo">{s.logo}</span>
                <span className="sn">{s.name}</span>
                <span className="sm">{s.match}</span>
              </div>
              <p className="sd">{s.desc}</p>
              <span className="sa">查看主页 →</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
