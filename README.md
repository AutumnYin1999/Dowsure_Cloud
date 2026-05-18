# 豆服云 · 服务商增长引擎 (Demo)

面向跨境电商服务商的「智能套餐推荐工具」demo。服务商扫码进入页面，填写 3 分钟问卷，系统根据规则引擎 + mock agent 输出推荐的「豆服云权益套餐组合」。

## 技术栈

- React 18 + Vite + TypeScript
- Tailwind CSS (shadcn/ui 风格组件，内置在 `src/components/ui/`)
- lucide-react 图标
- 纯前端 mock，无后端、无大模型 API 依赖

## 启动

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产出 dist/
npm run typecheck
```

## 目录结构

```
src/
  App.tsx                      # 流程编排:welcome → 问卷 → 分析 → 推荐
  types.ts                     # 全局领域类型 (BenefitItem / ProviderProfile / RecommendationPlan ...)
  data/knowledgeBase.ts        # 豆服云权益知识库 mock + RAG 检索接口 mock
  schema/questionnaireSchema.ts# 问卷字段 schema + 预算映射
  core/recommender.ts          # 规则推荐引擎 (13 条规则, 优先级合并, 预算约束)
  core/agentNarrator.ts        # Agent 自然语言解释生成 (mock, 未来可替换为 LLM)
  components/
    ui/                        # shadcn 风格基础组件 (Button / Card / Badge / Input / OptionCard / Toggle / Disclosure / Progress / Toast)
    StepsHeader.tsx            # 顶部流程进度
    WelcomePage.tsx            # 欢迎/落地页 + 权益概览
    QuestionnairePage.tsx      # 3 步问卷
    AnalyzingPage.tsx          # 分析中 loading
    RecommendationPage.tsx     # 推荐结果页 (含预算切换、复制摘要)
    BenefitCard.tsx            # 单项权益卡片 (含推荐理由展开)
    categoryMeta.ts            # 类别 / 优先级 → 颜色 / 图标 元数据
```

## 推荐链路 (当前 demo)

```
问卷答案
  → 归一化为 ProviderProfile
  → recommend(profile)                       (core/recommender.ts)
     ├ 13 条规则触发 RuleHit
     ├ 同 benefit 合并优先级 + 原因
     ├ 按预算上限裁剪 optional 项
     └ 调用 generateNarrative(profile, plan)  (core/agentNarrator.ts)
  → RecommendationPlan (含 items, narrative, nextSteps, total)
  → 前端展示
```

## 未来接真实 RAG + Agent

代码已做好抽象，替换路径：

| 当前 demo                                | 未来生产                                            |
| ---------------------------------------- | --------------------------------------------------- |
| `data/knowledgeBase.ts` 数组             | 接入 vector store (Pinecone / Weaviate / pgvector)，BenefitItem 作为 metadata |
| `retrieveBenefits({ keywords, categories })` 关键词匹配 | embedding similarity + metadata filter             |
| `core/recommender.ts` 13 条规则           | 规则 + LLM-based planner 协同；规则做硬约束，LLM 做软排序 |
| `core/agentNarrator.ts` 模板拼接          | LLM 调用 (Claude / GPT)，输入 = profile + plan.items |

`recommend(profile)` 与 `generateNarrative(profile, plan)` 这两个入口签名保持稳定，UI 层不需要任何修改。

## 推荐规则（简要）

- 所有人默认含 `base-package`（基础包，￥28,888）
- `lead-gen` → AI 拓客跃升版
- `brand-exposure` → 首页 Banner + AI 品牌营销赋能
- 物流 / 海外仓 / ERP + `offer-credit` → 嵌入式金融 + 账期风控
- `reach-top-sellers` 或 客户层级为亿级 / T0/T1 → 大卖有约
- `platform-resource` → 平台政策同步 + 1v1 商务对接
- `hk-services` → 香港跨境电商加速器
- `financing-tax` 或 需要金融服务 → 债权 / 股权 / 财务诊断 / 财税
- 报告需求 80 份 → 拓客跃升版；120 份 → 拓客领航版
- 想参加线下活动 → 线下联合营销
- 预算 ≥ 20 万 → 解锁尊享私享会
- 预算 ≥ 80 万 → 赠送亚马逊年度大会联合参展
- 所有方案默认赠送渠道合作 / 物流险咨询 / 香港开户

详细规则请直接看 [src/core/recommender.ts](src/core/recommender.ts)，每条规则都有 `ruleId`，方便 debug 与未来 A/B。

## 交互特性

- 问卷分 3 步，含必填校验与错误提示
- 提交后 ~1.8s 的分析 loading（带 4 个阶段动画）
- 推荐结果页：方案命名、自然语言陈述、按类别分组的权益卡、单卡可展开看推荐理由 + 命中规则 id
- 顶部流程进度条 (4 步)
- 推荐页支持直接切换预算重新推荐
- 推荐页支持按目标 chip 过滤定位
- 一键复制推荐摘要到剪贴板（含 fallback）
- 桌面端 + 移动端均可用（扫码入口场景）
