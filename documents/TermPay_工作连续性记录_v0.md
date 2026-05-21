# TermPay 工作连续性记录 v0

日期: 2026-05-21  
当前目标: 完成 TermPay 方案文档 + HTML 展示页,用于 CEO / Leadership Sync 汇报  
当前状态: Claude 正在修改前端 demo;本文档用于记录方案思路、CEO 反馈、后续工作路径

---

## 1. 当前总 Pathmap

本阶段不再扩展成多份文档,聚焦一份核心方案 + 一个展示页。

### 1.1 核心文档

建议名称:

《TermPay CEO Dashboard & 12周融资证据作战图 v1》

文档模块:

1. CEO Dashboard
2. W6 Pilot / W12 Financing Evidence
3. 核心 KPI 与证据口径
4. Second Close Milestone 映射
5. Blocking Risks & CEO Decision Required
6. 附录:压缩版 12 周计划 / AI Prompt / 跨团队依赖

### 1.2 HTML 展示页

建议名称:

`TermPay CEO Dashboard`

用途:

- 给 CEO / leadership sync 展示
- 用图表、KPI 卡片、流程图替代大段 Markdown
- 风格向 CEO 已有页面靠近:深色、玻璃卡片、大标题、KPI dashboard、decision panel

展示页模块:

1. Hero / Executive Summary
2. W6 / W12 双节点看板
3. KPI Grid
4. AP+AR 闭环流程图
5. Second Close Milestone 映射
6. Blocking Risks
7. CEO Decision Required

---

## 2. TermPay 是什么

TermPay 是豆分期的战略升级版。

原豆分期是面向跨境电商卖家的 "Pay Later / 先用后付" 工具,主要解决卖家支付物流、海外仓、广告、采购等大额账单时的现金流压力。

升级后的 TermPay 不应被写成孤立分期产品,而应定位为:

**Dowsure L2 嵌入式金融执行层中的 AP 账单金融模块。**

它连接四方:

- 卖家:授权数据,提交账单,获得延期 / 分期支付能力
- 服务商:确认账单,提前收款,降低账期风险
- 银行 / 资金方:提供资金,保留最终审批权
- Dowsure:提供数据连接、风控建议、流程编排、贷后监控、Finance 对账和审计轨迹

核心原则:

**Dowsure does not lend; Dowsure makes lending possible.**

即 Dowsure 不自营放贷、不持有应收账款、不承担隐藏 first-loss,而是让银行资金在可解释、可审计、可监控的闭环中服务跨境商户。

---

## 3. TermPay 当前重点

当前重点不是证明"页面做完"或"流程跑通",而是证明:

1. W6 能否进入受控 pilot
2. W12 能否形成融资 evidence pack
3. TermPay 能否证明 Dowsure 不放贷也能跑通 AP+AR 闭环
4. 银行 / 资金方是否愿意基于 Dowsure 的风控、授权和贷后监控扩大额度
5. TermPay 是否能带动 FastPay / MoreFund / FX / Treasury / Agent OS cross-sell

所以 v1 文档要从"项目计划"升级为"融资证据作战图"。

---

## 4. 第一版文件的问题

当前文件:

`D:\HKBU\豆分期\TermPay_12周冲刺计划_v0.md`

优点:

- 方向正确
- 已经没有把 TermPay 写成孤立分期产品
- 已经放进 Dowsure L2 嵌入式金融执行层
- 已覆盖卖家、服务商、资金方、风控、Finance、合规等链路
- 周度计划完整

主要问题:

1. 更像项目计划,不像 CEO dashboard
2. 周度任务过长,老板不容易抓重点
3. KPI 不够硬,缺少 target / actual / owner / status
4. pilot case 数、facilitated volume、服务商数、审批 SLA 等没有前置
5. 每个 deliverable 没有明确挂到 Second Close hard milestones
6. first-loss、revenue recognition、bank revenue share 等融资 DD 关键口径还不够突出
7. Blocking risks 和 CEO 需要拍板事项不够靠前

---

## 5. CEO 反馈摘要

CEO 认可方向,但要求下一版压实成融资作战图。

关键反馈:

1. 不要把 TermPay 写成孤立的"分期产品"
2. 要放在 Dowsure L2 嵌入式金融执行层
3. 必须体现银行资金、服务商账单、卖家授权、Sentinel 风控、Finance 对账和审计轨迹
4. v0 现在还不够硬,像项目计划,不像融资 milestone 作战图
5. 下一版要直接压成 CEO dashboard
6. W6 要回答能否 pilot
7. W12 要回答能否形成融资证据
8. 必须补:
   - pilot case 数
   - facilitated volume
   - 服务商数
   - 资金方审批 SLA
   - 通过率 / 补件率 / 拒绝率
   - 复用意向
   - 单 case CM
   - 银行 revenue share
   - facility 进展
   - first-loss / revenue recognition 口径
9. 每个 deliverable 都要挂到 Second Close hard milestones
10. Amazon 和银行股东相关对外口径必须收紧
11. 不要出现"独家""保证""银行级""最低费率"等表达
12. 下一版不要扩清单,要压出硬指标、blocking risks 和需要 CEO 拍板的事项

---

## 6. 已完成的第一步:CEO Dashboard 草案

已完成第一版 CEO Dashboard 内容骨架,包含:

1. 一句话判断
2. CEO Dashboard 总表
3. W6 / W12 判断标准
4. CEO 需要拍板事项
5. 本阶段结论

当前还需要补充:

- 具体 target 数字
- 当前状态红黄绿
- 每项 owner
- 数据来源
- 证据形式
- 哪些是事实,哪些是假设,哪些待 CEO 拍板

---

## 7. 接下来要做什么

### Step 1:完善 CEO Dashboard

补齐表格字段:

- Target
- Actual / Current
- Owner
- Status
- Evidence
- CEO Ask

### Step 2:写 W6 / W12 硬目标

W6 只判断是否能 pilot。  
W12 判断是否能进入融资 evidence pack。

### Step 3:写 KPI 与证据口径

重点 KPI:

- pilot case 数
- facilitated volume
- 服务商数
- 资金方审批 SLA
- 通过率
- 补件率
- 拒绝率
- 复用意向
- 单 case CM
- bank revenue share
- facility progress
- first-loss clean
- revenue recognition clean

### Step 4:写 Second Close milestone 映射

优先映射:

- M1:repayment / exception / risk monitoring
- M2:facility / bank credit appetite
- M5:positive contribution margin
- M8:revenue recognition
- M9:无隐藏 first-loss / repurchase / guarantee

### Step 5:写 Blocking Risks & CEO Decision Required

核心风险:

- first-loss / 回购 / 担保边界不清
- 资金方审批 SLA 不确定
- 服务商账单真实性不足
- Revenue recognition 口径不清
- Amazon / 银行股东对外口径越界
- pilot 样本太小导致融资证据不足

CEO 需拍板:

- W6 / W12 case 数
- W12 facilitated volume target
- 首批服务商名单
- 资金方 SLA
- 单 case 上限
- first-loss 边界
- 对外口径边界

### Step 6:HTML 展示页

HTML 不承载所有细节,只展示老板关心的 dashboard 信息。

内容来自文档前 5 个模块,不搬运附录。

---

## 8. 当前协作状态

Claude 正在做前端 demo。

当前前端方向:

- 将豆服云 demo 的问卷部分改成 CEO 喜欢的深色 Agent OS 风格
- 保留现有业务逻辑
- 强化 TermPay 主线
- 不做真实 RAG、后端、支付、授信、银行 API

Codex 当前负责:

- 梳理 TermPay 方案逻辑
- 生成 CEO dashboard 内容
- 记录工作连续性
- 输出给 Claude 的 prompt
- 后续审查内容是否符合 CEO 反馈和融资叙事

---

## 9. 当前核心判断

TermPay v1 的核心不是"做一个分期产品计划",而是:

**用 12 周证明 Dowsure 在不自营放贷、不承担隐藏 first-loss 的前提下,可以通过服务商账单、卖家授权、银行资金、Sentinel 风控和 Finance 对账,跑通 AP+AR 闭环,并形成支持 Second Close 的融资证据。**

W6 看能不能 pilot。  
W12 看能不能进入 financing evidence pack。

---

## 10. 正式 v1 文档结构草案

正式交付文档暂定为:

《TermPay CEO Dashboard & 12周融资证据作战图 v1》

### 模块 1:CEO Dashboard

作用:给 CEO 3 分钟内判断项目状态。

要回答:

- W6 能不能进入 pilot?
- W12 能不能形成融资证据?
- 当前有哪些红黄绿状态?
- 哪些事项需要 CEO / leadership 拍板?

先不填写具体数字,只保留结构字段:

| 维度 | W6 Pilot Readiness | W12 Financing Evidence | Evidence | Status | CEO Ask |
|---|---|---|---|---|---|

建议维度:

1. Pilot case
2. Facilitated volume
3. 服务商数
4. 资金方审批 SLA
5. 风控漏斗
6. AP+AR 闭环
7. 单 case CM
8. Facility 进展
9. First-loss 边界
10. Revenue recognition
11. Cross-sell
12. 对外口径

### 模块 2:W6 Pilot / W12 Financing Evidence

作用:把 12 周计划压成两个硬节点。

W6 只回答:是否具备受控 pilot 条件。  
W12 只回答:是否具备进入融资 evidence pack 的证据。

结构:

| 节点 | 判断问题 | 必须具备的证据 | 不达标后果 |
|---|---|---|---|
| W6 | 能不能 pilot | 待填 | 只能继续沙盒 / replay |
| W12 | 能不能进融资证据包 | 待填 | 不能作为 Second Close 支撑 |

### 模块 3:核心 KPI 与证据口径

作用:解释 CEO dashboard 里的指标到底怎么算。

暂定 KPI:

- Pilot case 数
- Facilitated volume
- 服务商数
- 资金方审批 SLA
- 通过率 / 补件率 / 拒绝率
- 复用意向
- 单 case CM
- Bank revenue share
- Facility progress
- First-loss clean
- Revenue recognition clean

结构:

| KPI | 定义 | 数据来源 | 更新频率 | 负责人 |
|---|---|---|---|---|

### 模块 4:Second Close Milestone 映射

作用:证明 TermPay 不是一个孤立产品,而是服务融资 milestone。

优先映射:

- M1:repayment / exception / risk monitoring
- M2:facility / bank credit appetite
- M5:positive contribution margin
- M8:revenue recognition
- M9:无隐藏 first-loss / repurchase / guarantee

结构:

| Milestone | TermPay 如何支撑 | 需要的证据 | 风险 |
|---|---|---|---|

### 模块 5:Blocking Risks & CEO Decision Required

作用:把风险和需要拍板事项前置。

风险结构:

| 风险 | 影响 | 当前状态 | 缓释动作 | 需要谁拍板 |
|---|---|---|---|---|

CEO 拍板事项结构:

| 决策事项 | 推荐默认值 | 不拍板的影响 |
|---|---|---|

### 模块 6:附录

只放支撑材料,不作为正文主体。

附录内容:

- 压缩版 12 周计划
- AI Prompt
- 跨团队依赖
- 原 v0 可交付清单摘要

---

## 11. 模块 2 讨论记录:W6 Pilot / W12 Financing Evidence

模块 2 的作用:把原来的 12 周长计划压缩成两个关键判断节点。

这部分不需要写成完整周计划,也不需要展开所有任务细节,而是回答两个老板最关心的问题:

1. 第 6 周能不能进入受控试点?
2. 第 12 周能不能形成融资证据?

### 11.1 W6: Pilot Go / No-Go

W6 只判断 TermPay 是否具备受控 pilot 条件,不要求证明规模化。

W6 必须回答:

- 是否有真实服务商账单场景?
- 是否有卖家授权和账单材料?
- 是否有资金方审批路径?
- 是否有 Sentinel / 风控审核和人工审核兜底?
- 是否能生成付款、还款计划、对账和审计记录路径?
- 是否没有隐藏 first-loss、回购、担保或误导性营销口径?

如果以上条件不满足,TermPay 不应进入真实 pilot,只能继续做沙盒或 replay。

一句话:

**W6 看能不能试跑。**

### 11.2 W12: Financing Evidence Pack

W12 不只是证明"流程跑通",而是判断 TermPay 是否可以进入融资 evidence pack。

W12 必须证明:

- 有一批 pilot case 数据
- 有 facilitated volume
- 有服务商复用意向
- 有资金方审批表现
- 有风控漏斗数据
- 有单 case CM
- 有 first-loss / revenue recognition 口径
- 能映射到 Second Close hard milestones

一句话:

**W12 看试跑结果能不能拿去给 CEO、银行、投资人看。**

### 11.3 模块 2 建议结构

正式文档中,模块 2 可以用一张表承载:

| 节点 | 判断问题 | 必须具备的证据 | 不达标后果 |
|---|---|---|---|
| W6 | 能不能 pilot | 真实账单、卖家授权、资金方审批路径、风控/人工审核、对账与审计记录 | 只能继续沙盒 / replay,不能进入真实 pilot |
| W12 | 能不能进融资证据包 | pilot case、facilitated volume、服务商复用、资金方审批表现、风控漏斗、单 case CM、first-loss / rev rec 口径 | 不能作为 Second Close 支撑材料 |

### 11.4 当前理解

模块 1 是 CEO Dashboard,负责让 CEO 一眼看状态。  
模块 2 是 W6/W12 判断标准,负责解释两个关键节点到底怎么判定。

后续填写内容时,先不追求所有金融指标都懂,只要记住:

**W6 = 能不能 pilot**  
**W12 = 能不能证明有价值**

---

## 12. 模块 3 讨论记录:核心 KPI 与证据口径

模块 3 的作用:把 CEO Dashboard 里的指标解释清楚。

模块 1 负责放结果表。  
模块 2 负责解释 W6 / W12 两个关键节点。  
模块 3 负责回答:

> 这些指标到底是什么意思?怎么算?谁负责?从哪里拿数据?

### 12.1 CEO 反馈中点名要补的指标

CEO 反馈里明确要求补:

- pilot case 数
- facilitated volume
- 服务商数
- 资金方审批 SLA
- 通过率 / 补件率 / 拒绝率
- 复用意向
- 单 case CM
- 银行 revenue share
- facility 进展
- first-loss / revenue recognition 口径

这些就是模块 3 的主体。

### 12.2 建议结构

正式文档中,模块 3 可以用一张表承载:

| KPI | 人话解释 | 为什么重要 | 数据来源 | Owner |
|---|---|---|---|---|

### 12.3 KPI 人话解释

#### 1. Pilot case 数

有多少个真实试点案例。

不是页面 demo,不是模拟数据,而是真实卖家、真实服务商账单、真实审批路径。

#### 2. Facilitated volume

TermPay 帮忙促成的账单支付金额。

注意:这不是 Dowsure 放款金额,而是通过 TermPay 流程被资金方审批 / 支付 / 处理的账单规模。

#### 3. 服务商数

有多少服务商接入或愿意试点。

证明 TermPay 不是只适合一个客户,而是有服务商侧可复制性。

#### 4. 资金方审批 SLA

资金方处理一个 case 要多久。

例如初审 48 小时、补件后 72 小时内复审。这个指标决定产品体验和销售承诺能不能成立。

#### 5. 通过率 / 补件率 / 拒绝率

所有申请里,多少通过、多少需要补材料、多少被拒。

这是风控漏斗,能证明 Dowsure 不是盲目推单,而是在筛选质量。

#### 6. 复用意向

服务商或卖家是否愿意下一次继续使用 TermPay。

这个指标证明 TermPay 有复购价值,不是一次性试验。

#### 7. 单 case CM

CM = Contribution Margin,单个 case 的贡献毛利。

人话解释:这单扣掉银行分成、服务成本、风控 / 运营成本后,Dowsure 有没有赚到钱。

#### 8. 银行 revenue share

银行 / 资金方和 Dowsure 怎么分收入。

这个影响 Dowsure 到底能确认多少 net revenue。

#### 9. Facility 进展

银行 / 资金方愿意给多少可提款额度或合作额度。

这是融资叙事核心之一:银行是否愿意基于 Dowsure 的风控放大额度。

#### 10. First-loss 口径

Dowsure 有没有承担第一损失、回购、兜底、担保。

CEO 很在意这个,因为如果存在隐藏 first-loss,会影响融资 DD、会计确认和监管风险。

#### 11. Revenue recognition 口径

这笔收入如何入账。

需要说明是净收入、服务费、还是银行分成后的 net revenue。这个口径必须由 Finance / Legal 确认。

### 12.4 当前理解

模块 3 不是为了堆指标,而是让 CEO 知道:

- TermPay 的 pilot 结果会被怎样量化
- 哪些数字能进入融资材料
- 哪些口径必须先被 Finance / Legal 确认

模块 2 与模块 3 的关系:

- 模块 2:W6 / W12 要证明什么
- 模块 3:用哪些 KPI 来证明

---

## 13. 模块 4 讨论记录:Second Close Milestone 映射

模块 4 的作用:回答 CEO 最在意的问题:

> TermPay 跟融资有什么关系?它到底支持哪几个 Second Close hard milestones?

这部分不能只说"TermPay 是个好产品",而要说明:

**TermPay 能为 Series C Second Close 提供哪些证据。**

### 13.1 基本判断

TermPay 不需要硬凑全部 9 个 milestone。

优先映射以下 5 个:

1. M1:Repayment / loss / exception 风控表现
2. M2:$300M+ facility / 银行资金方进展
3. M5:Positive contribution margin
4. M8:Revenue recognition clean
5. M9:无隐藏 first-loss / repurchase / guarantee

这 5 个与 TermPay 最相关。不要硬说 TermPay 直接负责所有 9 个 milestone,否则会显得虚。

### 13.2 M1:风控和异常监控

TermPay 能证明:

Dowsure 可以基于卖家授权数据、服务商账单、回款监控和 Sentinel 风控,持续追踪还款与异常。

TermPay 需要提供的证据:

- 每个 case 的还款计划
- 异常事件记录
- 通过 / 补件 / 拒绝原因
- Sentinel 审核记录
- 人工 override 记录

### 13.3 M2:银行 / 资金方 facility

TermPay 能证明:

银行或资金方愿意基于 Dowsure 的风控、账单验证和贷后监控推进审批,甚至扩大额度。

TermPay 需要提供的证据:

- 资金方审批 SLA
- 银行 / 资金方 feedback
- credit appetite 记录
- facility / LOI / term sheet 进展
- 每周 funding pipeline

### 13.4 M5:Contribution margin

TermPay 能证明:

这不是免费跑流程,而是每个 case 有收入、有成本、有毛利测算。

TermPay 需要提供的证据:

- 单 case gross fee
- bank revenue share
- servicing cost
- fraud / exception cost
- net contribution margin

### 13.5 M8:Revenue recognition

TermPay 能证明:

Dowsure 的收入确认口径清楚,不把银行资金、GMV、facilitated volume 混成收入。

TermPay 需要提供的证据:

- net revenue 口径
- bank share 口径
- 服务费确认方式
- Finance memo v0
- Big-4 / audit pre-review input

### 13.6 M9:First-loss / guarantee clean

TermPay 能证明:

Dowsure 不承担隐藏 first-loss、不回购、不兜底、不对外担保。

TermPay 需要提供的证据:

- 风险责任矩阵
- 合同条款 review
- 资金方最终审批权说明
- 对外话术禁用词
- Legal / Finance sign-off matrix

### 13.7 模块 4 建议结构

正式文档中,模块 4 可以用一张表承载:

| Milestone | TermPay 如何支撑 | 需要形成的证据 | 当前风险 |
|---|---|---|---|
| M1 | 风控与还款监控闭环 | case audit trail、Sentinel review、异常记录 | 样本不足 |
| M2 | 银行 / 资金方愿意审批和放大额度 | SLA、feedback、facility pipeline | 资金方边界未锁 |
| M5 | 单 case 能算清楚 CM | gross fee、bank share、servicing cost、net CM | 成本口径未定 |
| M8 | 收入口径清楚 | revenue memo、net revenue 口径 | Finance / Legal 未确认 |
| M9 | 无隐藏兜底风险 | first-loss matrix、合同 review | 需 CEO 拍板 |

### 13.8 当前理解

模块 4 不要写成"TermPay 支持所有战略目标"。

要写成:

**TermPay 优先支撑 M1 / M2 / M5 / M8 / M9,其他 milestone 只作为间接 cross-sell 贡献。**

补充判断:

- M3 / M4 是 FastPay 的量和客户数,TermPay 不要硬抢
- M6 / M7 是 Agent OS 订阅,TermPay 只能作为 cross-sell 或 usage evidence
- M8 / M9 对 TermPay 特别重要,因为金融产品最怕收入确认和风险兜底不干净

一句话:

**模块 4 不是讲 TermPay 多厉害,而是把 TermPay 翻译成融资 milestone 能看懂的证据。**

---

## 14. 模块 5 讨论记录:Blocking Risks & CEO Decision Required

模块 5 是整份文档里最"老板视角"的部分之一。

它回答两个问题:

1. 什么东西会卡死 TermPay?
2. 哪些事情必须 CEO / leadership 拍板?

CEO 反馈里明确要求:

> 下一版不要扩清单,要压出硬指标、blocking risks 和需要 CEO 拍板的事项。

所以模块 5 必须靠前、必须直接、不能写得像普通风险清单。

### 14.1 模块 5 分两块

建议分成:

1. Blocking Risks
2. CEO Decision Required

### 14.2 Blocking Risks 是什么

Blocking risk 不是普通风险。

它的意思是:

**如果不解决,这个项目不能进入 pilot,或者不能作为融资证据。**

### 14.3 建议风险清单

#### R1:First-loss / 回购 / 担保边界不清

如果 Dowsure 被理解成兜底方,TermPay 就会变成"类放贷"或隐性担保,影响融资 DD、收入确认和监管风险。

需要:

- Legal / Finance 出责任矩阵
- 合同条款 review
- CEO 拍板:Dowsure 不兜底、不回购、不隐性担保

#### R2:资金方审批 SLA 不确定

如果银行 / 资金方审批太慢,卖家体验和服务商销售承诺都会崩。

需要:

- 初审 SLA
- 补件 SLA
- 拒绝 / 通过口径
- fallback 资金方路径

#### R3:服务商账单真实性不足

如果账单造假、关联交易或服务未交付,TermPay 风控基础会失真。

需要:

- 服务商白名单
- 账单模板
- 交付证明
- 异常账单人工审核

#### R4:Revenue recognition 口径不清

如果 GMV、facilitated volume、银行资金、Dowsure net revenue 混在一起,融资材料会被 Finance / auditor 挑战。

需要:

- Finance memo
- bank share 口径
- net revenue 口径
- 单 case UE 模板

#### R5:对外口径越界

Amazon / 银行股东相关表达必须收紧。

不能出现:

- 独家
- 保证
- 银行级
- 最低费率
- 秒批秒放
- 零坏账
- Dowsure 放款

需要:

- 禁用词清单
- 对外材料 review
- 8 月官宣前统一口径

#### R6:Pilot 样本太少

如果 W12 只有 1-2 个 case,很难支撑融资 evidence。

需要:

- W6 / W12 case target
- 服务商名单
- 销售 pipeline
- 每周进度看板

### 14.4 CEO Decision Required

这部分不是"请老板看看",而是明确告诉 CEO:

> 如果这些不拍板,团队没法继续推进。

建议结构:

| 决策事项 | 推荐默认值 | 不拍板的影响 |
|---|---|---|
| W6 pilot case 数 | 5-8 个候选 case | 无法判断 W6 是否达标 |
| W12 pilot case 数 | 10-20 个受控 case | 无法形成 cohort evidence |
| W12 facilitated volume | USD 500K-1M target range | 融资材料缺少规模感 |
| 首批服务商类型 | 物流 / 海外仓优先 | 场景过散,账单验证难度升高 |
| 首批服务商数 | W6 3 家,W12 5 家 | 无法证明服务商侧可复制 |
| 资金方 SLA | 初审 48h,补件后 72h 内复审 | 卖家体验和销售承诺不可控 |
| First-loss 边界 | Dowsure 不兜底、不回购、不隐性担保 | 影响融资 DD / ASC 606 / 合规 |
| 对外口径 | 8 月官宣前只使用 pilot / 受控验证表达 | 可能触发 Amazon / 银行股东口径风险 |

### 14.5 当前理解

模块 5 不是为了显得想得周全,而是为了把"会卡死项目的风险"和"必须老板拍板的事项"提前暴露。

语气应该直接:

- 不写"可能存在一定风险"
- 要写"如果不解决,不能 pilot / 不能进入融资 evidence pack"
- 每个风险都要有 owner 或 decision ask

模块关系:

- 模块 1:老板一眼看状态
- 模块 2:W6/W12 怎么判
- 模块 3:用什么 KPI 判
- 模块 4:怎么映射融资 milestone
- 模块 5:什么会卡住,以及谁要拍板

---

## 15. 模块 6 讨论记录:附录

模块 6 的作用:

**把执行细节收起来,不要挡住 CEO 看重点。**

原 v0 里很多内容不是没用,而是位置太靠前。

CEO 不想一上来就看 W1-W12 每周任务、AI prompt、跨团队依赖大表。这些东西应该放到附录里,作为支撑材料。

### 15.1 附录 A:压缩版 12 周计划

不是原封不动搬 W1-W12,而是压缩成 4 个阶段:

| 阶段 | 周期 | 目标 | 关键产出 |
|---|---|---|---|
| Phase 1 | W1-W2 | Scope freeze / pilot 准备 | 场景、服务商、资金方、合规边界 |
| Phase 2 | W3-W6 | Pilot readiness | 产品流程、风控、授权、对账、Go/No-Go |
| Phase 3 | W7-W10 | Controlled pilot | case 运行、审批数据、服务商反馈、风控漏斗 |
| Phase 4 | W11-W12 | Evidence pack | CEO dashboard、cohort report、CM、milestone 映射 |

这样老板能看到节奏,但不会被每周任务淹没。

### 15.2 附录 B:跨团队依赖

保留原来的跨团队依赖,但压缩成:

| 团队 | 需要支持什么 | 截止节点 |
|---|---|---|
| Product | 申请流程、状态机、dashboard | W3-W6 |
| RD | 账单、审计、对账、数据接口 | W4-W10 |
| Risk / Sentinel | 风控政策、审核规则、异常监控 | W2-W11 |
| Finance | CM、revenue recognition、bank share | W3-W11 |
| Bank BD | 资金方 SLA、facility、审批反馈 | W2-W12 |
| Sales | pilot case、服务商名单、复用反馈 | W1-W12 |
| Legal / Compliance | first-loss、授权、对外口径 | W1-W12 |

重点:每个团队只写一两行,不展开成大段。

### 15.3 附录 C:AI Prompt

AI Prompt 可以保留,但放最后。

包括:

- 12 周计划生成 prompt
- Product SPEC prompt
- 周报 prompt
- 给 Claude / Codex 的开发 prompt

它是工具,不是 CEO 关注点,所以不要放正文。

### 15.4 附录 D:原 v0 可交付清单摘要

原来的 SKU / deliverable 清单可以保留摘要版,避免别人觉得内容被删了。

但建议改口径:

不要叫"可交付清单",可以叫:

**Evidence Detail Backlog**

意思是:这些东西不是正文重点,但后续可以作为证据细项展开。

### 15.5 附录原则

附录不是垃圾桶,也不是越多越好。

附录只放:

- 正文需要但不能展开的东西
- 团队执行时需要的东西
- CEO 追问时可以翻到的东西

不放:

- 重复解释
- 长篇战略背景
- 过细的每周任务
- 还没想清楚的功能清单
- 和 TermPay 无关的公司级内容

### 15.6 当前完整框架

整份文档结构至此完整:

1. CEO Dashboard:老板一眼看状态
2. W6 / W12:两个硬节点
3. KPI:用什么数字证明
4. Milestone:怎么服务融资
5. Risks & Decisions:什么会卡住,谁要拍板
6. Appendix:执行细节收纳区

一句话:

**附录负责证明"我们有执行细节",但不抢正文的 CEO 决策视角。**
