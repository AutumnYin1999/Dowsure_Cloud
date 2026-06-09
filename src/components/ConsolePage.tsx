import { ArrowLeft, ClipboardList, Database, Users } from "lucide-react";

/**
 * /console —— 控制台 · 数据看板（占位）。
 *
 * 规划用途：汇总卖家 / 服务商在前面对话与表单里留下的资料（留资线索、提交的需求/反馈、
 * 报名记录、诊断结果等），供运营侧查看与跟进。当前为占位页，接后端数据后再填充。
 */
export function ConsolePage({ onHome }: { onHome: () => void }) {
  return (
    <main className="container max-w-6xl space-y-5 pb-28 pt-20 sm:pt-24">
      <button
        type="button"
        onClick={onHome}
        className="inline-flex items-center gap-1.5 text-sm text-[color:var(--fg-mute)] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回首页
      </button>

      <section className="dow-console-panel p-6 sm:p-8">
        <span className="dow-eyebrow dow-eyebrow-dot">CONSOLE · 数据看板</span>
        <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-white sm:text-[32px]">
          控制台 · 数据看板
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--fg-mute)]">
          这里会汇总前面卖家 / 服务商在对话与表单里留下的资料 —— 留资线索、提交的需求与反馈、
          活动报名、经营诊断结果等，供运营侧统一查看与跟进。
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "留资客户", value: "—" },
            { label: "待跟进", value: "—" },
            { label: "本周新增", value: "—" },
            { label: "已对接", value: "—" },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-3)] p-4 text-center"
            >
              <p className="font-display text-2xl font-bold text-white">{k.value}</p>
              <p className="mt-1 text-xs text-[color:var(--fg-mute)]">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlaceholderPanel
          icon={Users}
          title="客户线索"
          desc="卖家 / 服务商对话中留下的画像与联系方式将汇总在此。"
        />
        <PlaceholderPanel
          icon={ClipboardList}
          title="提交的需求 / 反馈"
          desc="「提交需求 / 反馈」与报名记录将汇总在此，便于顾问跟进。"
        />
      </div>

      <div className="dow-glass-card flex items-center gap-3 p-5 text-sm text-[color:var(--fg-mute)]">
        <Database className="h-4 w-4 text-[color:var(--violet)]" />
        数据看板开发中 —— 接入后端后，这里将展示真实的留资与跟进数据。
      </div>
    </main>
  );
}

function PlaceholderPanel({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Users;
  title: string;
  desc: string;
}) {
  return (
    <section className="dow-glass-card p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[color:var(--violet)]" />
        <span className="text-base font-semibold text-white">{title}</span>
      </div>
      <p className="mt-1.5 text-xs text-[color:var(--fg-mute)]">{desc}</p>
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-dashed border-[color:var(--border-2)] p-3"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-[color:var(--bg-3)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-1/3 rounded bg-[color:var(--bg-3)]" />
              <div className="h-2 w-2/3 rounded bg-[color:var(--bg-3)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
