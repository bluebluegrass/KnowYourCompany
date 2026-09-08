# KnowYourCompany v2 技术设计文档

> 状态：提案（Design only）
> 日期：2026-09-06
> 本文不改变现有实现、不迁移现有报告，也不新增任何外部服务。它定义下一轮实现应遵循的产品边界、数据契约、质量门槛和验收标准。

## 1. 摘要

KnowYourCompany 的目标应从「汇总一份公司资料」升级为「帮助某一位候选人决定是否继续投入求职时间，并为下一轮面试做好准备」。

现有项目已经完成了重要的工程基础：按研究维度生成查询、获取网页、按时效筛选、规范化及去重证据、构建小型证据包、让模型逐段分析、产出 JSON，再确定性地渲染为 HTML。这条流水线应被保留。

v2 不应再以增加搜索数量为核心。它应在现有流水线中引入四个能力：

1. **可审计的主张（claim）与来源质量**：每个影响结论的主张都能追溯至具体来源、发布日期、采集时间、适用范围和证据等级。
2. **候选人匹配（candidate fit）**：将城市、职级、签证、薪资底线和办公偏好纳入结论，而不是输出对所有人都相同的「安全/不安全」。
3. **行动输出（actionability）**：把风险、缺口和不确定性转译成可直接问招聘方或面试官的问题，以及继续/暂停/核实的下一步。
4. **时点与变更（freshness and deltas）**：将一次性报告定义为可复查的快照；后续运行可指出哪些结论、来源和风险发生了变化。

第一阶段不建议做用户账户、持续推送、网页端或自动化投递。v2 首先应是一个高可信、可复核、可离线分享的候选人决策报告。

## 2. 背景与现状

### 2.1 当前产品承诺

产品帮助候选人在投入多轮面试前，了解公司和特定岗位的公开信号。现有研究范围包括裁员、财务健康度、领导层、法律与监管、文化、远程/混合办公、薪酬、面试体验、签证、产品市场健康度、公司历史与创始人背景等 12 个维度。

该产品不是投资尽调、信用报告、法律意见或对公司作出事实裁决的工具。它的工作方式是从公开资料中提取「值得继续核实的信号」。

### 2.2 当前运行时架构

当前构建产物所呈现的核心流程如下。本文假定该流程是 v2 的兼容基础。

```text
候选人输入
  │
  ├─ 输入规范化 / 本地语言判定
  ├─ 分研究维度的查询计划与时效预算
  ├─ 搜索与页面抓取（可缓存）
  ├─ 页面清洗、来源标准化、去重与评分
  ├─ 每个维度的 EvidencePacket
  ├─ 模型按维度生成 SectionAnalysis
  ├─ 模型生成跨维度的 FinalSummary
  ├─ ReportModel JSON（主工件）
  └─ 确定性 HTML renderer（展示层）
```

现有架构的优点：

- 研究、模型判断和 HTML 呈现已经分离。
- 每段模型输入是有限的证据包，而不是全部网页正文。
- 各维度已有不同的查询、抓取、证据和社区来源预算。
- 时效窗口已覆盖大部分动态维度；法律和公司历史可以保留更长期的有效资料。
- 来源注册表已经与最终报告一起保存，适合成为 v2 的证据账本基础。
- render-only 模式无需模型或网络调用，便于复现和视觉迭代。

### 2.3 当前缺口

以下问题会直接影响用户对数据的信任和产品的决策价值：

| 缺口 | 现象 | 对候选人的风险 | v2 的处理方式 |
|---|---|---|---|
| 颜色与证据脱钩 | 红黄绿是段落级结果，用户难判断具体事实强弱 | 把「没查到」误读成「没有」 | 为关键主张显示证据等级、时效和适用范围 |
| 信息与个人约束脱钩 | 相同公司报告对需要签证与不需要签证的用户没有区别 | 用户无法判断问题是否阻断自己 | 新增 CandidateProfile 与 fit 计算 |
| 结论不可直接行动 | 用户看到风险后仍不知道该问什么 | 报告成为资料收藏，而不是决策工具 | 每个相关信号产出核实问题和行动建议 |
| 「当前」定义不足 | 不同来源的发布时间、采集时间和历史性质混在一起 | 旧资料被误当成现状 | 统一 freshness 状态、过期规则和 delta 机制 |
| 来源质量不显性 | 官方页面与聚合站、社区帖的视觉权重接近 | 弱来源可能被放大 | 来源分层、冲突检测和关键结论门槛 |
| 快照缺少可比性 | 再跑一次报告难以快速看到变化 | 用户需要重新阅读整份报告 | 保存稳定的 claim ID 和 snapshot diff |

## 3. 目标、非目标与设计原则

### 3.1 v2 目标

1. 让候选人在 60 秒内知道：哪些信号最影响自己、可信度如何、下一步做什么。
2. 任何红色结论都能跳转到支持它的结构化主张和来源。
3. 将「未发现风险」「证据不足」「来源相互矛盾」明确区分。
4. 针对候选人的角色、地点、签证与偏好，生成条件化建议。
5. 不牺牲现有 JSON-first、离线 HTML 和缓存架构。
6. 允许模型输出被程序化校验，而不是完全依赖提示词约束。

### 3.2 非目标

- 不预测公司会不会倒闭、裁员或给 offer。
- 不对公司、员工或创始人作未证实的负面指控。
- 不将社区评论转化为确定性事实。
- 不抓取需要绕过登录、付费墙、访问限制或反爬机制的数据。
- 不自动发送邮件、投递简历、联系员工或代表用户进行沟通。
- 第一阶段不做长期后台监控或自动通知；只设计可比较的快照基础。

### 3.3 设计原则

**可核实胜过全面。** 一条可追溯的关键主张，优于十条无法判断出处的摘要。

**不确定性是一种输出。** 证据不足必须单独呈现，不能为了完整度把它涂成绿色。

**匹配而非评分。** 输出应回答「对这位候选人是否值得继续」，不是对公司给一个万能分数。

**主张数据化，展示可替换。** JSON 只存语义数据，不存 HTML 片段；renderer 是唯一负责格式化和转义的地方。

**动态事实有时效。** RTO、职位、签证政策、薪资、招聘流程、裁员和领导变动必须显示「截至何时」。

**高影响结论需要更高门槛。** 红色风险不应建立在单个低可信社区帖子上。

## 4. 用户与核心任务

### 4.1 主要用户

主要用户是正在申请海外或跨城市职位、需要在多轮面试前判断是否投入时间的候选人。典型高约束场景包括：

- 需要雇主签证或担保。
- 只能接受远程或明确的混合办公安排。
- 有最低总薪酬要求。
- 处在职业转换期，需要评估职位的成长和稳定性。
- 同时在推进多家公司，无法为每一家做手工背景调查。

### 4.2 核心 Job To Be Done

> 当我考虑某公司、某城市的某个职位时，帮助我用可验证的公开信息识别关键风险和待确认事项；告诉我这是否与我的底线冲突，以及下一轮应该问谁、问什么。

### 4.3 关键用户旅程

```text
输入机会信息与个人约束
        ↓
获得一页「适配与优先行动」摘要
        ↓
查看每个关键结论的证据、时效、地点/岗位范围
        ↓
复制面试问题或核实清单
        ↓
在下一轮面试后记录答案（后续版本）
        ↓
必要时重新运行并查看与上次快照的变化
```

## 5. 功能需求

### 5.1 新增输入：CandidateProfile

v2 在不改变公司、地点、角色和输出语言的基础上，新增可选候选人约束。所有字段默认最小化收集；未填写的字段不得被推断。

| 字段 | 类型 | 用途 | 是否保存到报告 |
|---|---|---|---|
| `seniority` | enum | 判断薪酬、面试流程和成长信号的相关性 | 是 |
| `workAuthorization` | enum | 判断签证是否是阻断项 | 是，使用抽象状态 |
| `minimumCompensation` | money + currency | 判断公开薪资带是否可能低于底线 | 是，仅在用户要求时 |
| `workModePreference` | enum | 判断远程/混合/RTO 是否匹配 | 是 |
| `priorities` | 1–3 个枚举 | 在摘要中排序：稳定性、薪酬、成长、文化、弹性、签证 | 是 |
| `dealBreakers` | 枚举列表 | 识别阻断项，例如「不支持签证」 | 是 |
| `notes` | string | 只给本次模型上下文，不进入公开或分享工件 | 否，默认不保存 |

`workAuthorization` 必须使用抽象状态：`not_needed`、`needs_employer_sponsorship`、`eligible_independent_route`、`unknown`。不要收集护照、签证号码、出生日期或其他身份证件信息。

### 5.2 结论状态

每个 section 和每个 claim 都必须使用不同的维度表达「风险」与「证据情况」。颜色不能单独承担两种含义。

```text
impact:        blocking | material | watch | informational
evidenceState: verified | corroborated | limited | conflicting | insufficient
freshness:     current | aging | historical | unknown
fit:           aligned | investigate | mismatch | not_applicable
```

展示规则：

- `green` 仅可用于 `verified/corroborated` 且未发现与候选人有关的担忧；文案为「未发现已验证的担忧」，不能写「安全」。
- `grey` 用于 `insufficient`、数据缺失或范围不匹配，文案为「公开证据不足以判断」。
- `yellow` 用于混合、过期、冲突或需要候选人核实的情况。
- `red` 用于已经满足质量门槛且会显著影响候选人决定的 `material/blocking` 信号。

### 5.3 面试行动包

每个 `material`、`watch`、`conflicting` 或与用户 deal-breaker 有关的 claim，最多生成：

- 一个中性、非指控式的核实问题；
- 建议询问对象：recruiter、hiring manager、future teammate、HR/immigration；
- 问这个问题的原因；
- 哪种回答可视为 `resolved`、`still_unclear` 或 `mismatch`。

不应生成带有事实前提的攻击性问题。例如不要问「听说你们正在裁员是真的吗？」；应问「过去 12 个月团队的编制和优先级有什么变化？这个岗位是新增还是替补？」。

### 5.4 快照和变化

第一次运行生成完整快照。后续运行使用同一公司、地点和角色的基线快照，比较：

- 新增、移除或改变的 claim；
- 来源的发布时间或有效性变化；
- `severity`、`evidenceState`、`fit` 的变化；
- 新出现或消失的行动项。

初期只提供 CLI 参数 `--compare <previous-report.json>` 和报告内的「自上次检查以来」模块。不做后台任务、定时通知或账户体系。

## 6. 目标架构

### 6.1 总体架构

```text
                         ┌─────────────────────────────┐
                         │ RunInput                     │
                         │ company / role / location    │
                         │ CandidateProfile (optional)  │
                         └──────────────┬──────────────┘
                                        │
                   ┌────────────────────▼─────────────────────┐
                   │ Query Planner                              │
                   │ section + locale + candidate constraints   │
                   └────────────────────┬─────────────────────┘
                                        │
             ┌──────────────────────────▼─────────────────────────┐
             │ Retrieval & Source Registry                          │
             │ fetch, normalize URL, classify source, capture dates │
             └──────────────────────────┬─────────────────────────┘
                                        │
             ┌──────────────────────────▼─────────────────────────┐
             │ Evidence Pipeline                                    │
             │ recency → relevance → dedupe → quality policy        │
             └──────────────┬───────────────────────┬──────────────┘
                            │                       │
                 ┌──────────▼──────────┐  ┌────────▼───────────┐
                 │ Section analysis     │  │ Claim validator     │
                 │ model emits Claims   │  │ deterministic gates │
                 └──────────┬──────────┘  └────────┬───────────┘
                            └───────────┬────────────┘
                                        │
                 ┌──────────────────────▼──────────────────────┐
                 │ Fit & Action engine                           │
                 │ candidate mapping / questions / next actions  │
                 └──────────────────────┬──────────────────────┘
                                        │
                 ┌──────────────────────▼──────────────────────┐
                 │ Report v2 JSON                                │
                 │ + optional SnapshotDiff                        │
                 └──────────────────────┬──────────────────────┘
                                        │
                 ┌──────────────────────▼──────────────────────┐
                 │ Deterministic renderer                        │
                 │ HTML / future PDF renderer                    │
                 └─────────────────────────────────────────────┘
```

### 6.2 责任边界

| 组件 | 责任 | 不负责 |
|---|---|---|
| Query planner | 基于 section、地点、角色、语言生成查询 | 评估事实真伪 |
| Retrieval | 找到和抓取公开来源 | 给公司下结论 |
| Source registry | 标准化 URL、来源类型、日期、抓取元数据 | 生成自然语言摘要 |
| Evidence pipeline | 选择有限、相关、较新且多样的证据 | 让模型绕过质量门槛 |
| Section analyzer | 根据 evidence packet 生成结构化 claims | 编造来源、输出 HTML |
| Claim validator | 施加来源、时效、冲突、范围等确定性规则 | 代替模型解释上下文 |
| Fit engine | 将已验证 claim 映射到用户约束 | 对未填写偏好作假设 |
| Action engine | 生成中性核实问题和优先行动 | 推荐操纵式谈判策略 |
| Renderer | 呈现已验证的 Report v2 JSON | 重新研究或改写事实 |

## 7. 数据模型与契约

### 7.1 兼容策略

现有 `ReportModel` 和 HTML renderer 不应在同一个改动中被删除。新增 `reportVersion: 2`，并为 v1/v2 renderer 建立显式分发：

```text
reportVersion absent / 1  → 现有 renderer
reportVersion 2           → v2 renderer
unknown version           → 明确失败，不猜测兼容性
```

这样已有 `.report.json` 仍然可以确定性地重渲染。v2 报告不能退回到将 HTML 作为数据字段的格式。

### 7.2 TypeScript 参考接口

以下接口是设计契约，而不是本次需要创建的代码。

```ts
type SectionId =
  | "layoffs"
  | "financial_health"
  | "leadership_stability"
  | "legal_regulatory"
  | "company_culture"
  | "work_policy"
  | "compensation_benefits"
  | "interview_experience"
  | "visa_sponsorship"
  | "product_market_health"
  | "company_profile_history"
  | "founder_background";

type Impact = "blocking" | "material" | "watch" | "informational";
type EvidenceState =
  | "verified"
  | "corroborated"
  | "limited"
  | "conflicting"
  | "insufficient";
type Freshness = "current" | "aging" | "historical" | "unknown";
type SourceTier = "primary" | "authoritative" | "reputable" | "community" | "aggregator";
type FitState = "aligned" | "investigate" | "mismatch" | "not_applicable";

interface CandidateProfile {
  seniority?: "intern" | "junior" | "mid" | "senior" | "staff_plus" | "manager_plus";
  workAuthorization?:
    | "not_needed"
    | "needs_employer_sponsorship"
    | "eligible_independent_route"
    | "unknown";
  minimumCompensation?: { amount: number; currency: string; period: "year" | "month" };
  workModePreference?: "remote_only" | "hybrid_ok" | "office_ok" | "unknown";
  priorities?: Array<"stability" | "compensation" | "growth" | "culture" | "flexibility" | "visa">;
  dealBreakers?: Array<"no_sponsorship" | "office_required" | "below_min_compensation" | "active_layoffs">;
}

interface SourceRecord {
  sourceId: string;
  canonicalUrl: string;
  displayUrl: string;
  title: string;
  publisher?: string;
  tier: SourceTier;
  sourceType: "official" | "government" | "filing" | "news" | "community" | "job_posting" | "aggregator";
  publishedAt?: string;
  fetchedAt: string;
  language: string;
  locationScope?: string;
  accessState: "fetched" | "partial" | "unavailable";
}

interface ClaimScope {
  role?: string;
  function?: string;
  level?: string;
  location?: string;
  employmentType?: "employee" | "contractor" | "platform_worker" | "unknown";
}

interface Claim {
  claimId: string;
  sectionId: SectionId;
  text: string;
  impact: Impact;
  evidenceState: EvidenceState;
  freshness: Freshness;
  sourceRefs: string[];
  scope: ClaimScope;
  candidateFit: FitState;
  fitReason?: string;
  contradictions?: string[];
  actionRefs: string[];
}

interface ActionItem {
  actionId: string;
  claimId: string;
  priority: 1 | 2 | 3;
  owner: "recruiter" | "hiring_manager" | "future_teammate" | "hr_or_immigration" | "candidate";
  question: string;
  rationale: string;
  resolutionCriteria: string;
}

interface ReportV2 {
  reportVersion: 2;
  reportId: string;
  generatedAt: string;
  target: { company: string; role?: string; location?: string };
  candidateProfile?: CandidateProfile;
  sources: Record<string, SourceRecord>;
  sections: Array<{ sectionId: SectionId; claims: Claim[]; summary: string }>;
  decision: {
    recommendation: "continue" | "continue_after_verification" | "pause" | "insufficient_evidence";
    rationale: string;
    blockingClaimIds: string[];
    topActionIds: string[];
  };
  actions: ActionItem[];
  comparison?: SnapshotDiff;
}
```

### 7.3 Claim ID 和稳定性

`claimId` 应由 `sectionId + canonicalized claim subject + scope` 形成稳定 ID，而不是对完整自然语言文本哈希。原因是模型改写同一个结论时，比较功能仍应识别为同一条主张。

示例：

```text
work_policy:barcelona:engineering:hybrid-two-days
visa_sponsorship:netherlands:role-specific-availability
layoffs:company-wide:2026-q2-reduction
```

模型应被要求输出 `claimSubject` 和受控枚举，程序再生成 `claimId`。无法规范化的 claim 不进入 delta 比较，仍可在本次报告中展示。

## 8. 来源质量、时效与冲突处理

### 8.1 来源层级

| 层级 | 典型来源 | 可支持的结论 |
|---|---|---|
| Primary | 公司职位页、财报、监管机构、法院记录、官方签证名录 | RTO、岗位、融资、执法、签证资格等事实 |
| Authoritative | 政府数据库、证券交易所、权威行业机构 | 监管、公司注册、市场基准 |
| Reputable | 有编辑标准的新闻媒体 | 裁员、管理层变化、融资等报道 |
| Community | Glassdoor、Blind、Reddit、公开员工经验 | 感受、反复出现的主题、面试经验 |
| Aggregator | 薪酬、公司资料或职位聚合页 | 仅用作线索或补充，不独立支持高影响结论 |

### 8.2 关键 claim 门槛

| Claim 条件 | 最低要求 |
|---|---|
| `blocking` | 至少一条 Primary/Authoritative，或两条相互独立的 Reputable；必须有明确范围 |
| `material` | 至少一条 Primary/Authoritative/Reputable；若只有一条，标为 `limited` |
| 文化/面试体验 | 至少两条不同来源或有时间分布的社区线索；不得写成公司事实 |
| 薪资 | 职位、地点与职级至少匹配两项；否则标为范围有限 |
| 签证 | 优先官方名录和具体职位页；其他岗位的先例不能推断为当前岗位承诺 |
| 未发现风险 | 只允许写「在已检索公开来源中未发现」，并显示检索覆盖和时效 |

### 8.3 Freshness 规则

`publishedAt` 与 `fetchedAt` 必须同时保存。两者回答不同问题：前者表示事实发生/发表的时间，后者表示系统最后核查的时间。

建议默认窗口：

| 维度 | current | aging | historical |
|---|---:|---:|---:|
| 裁员、RTO、签证、招聘、薪资 | <= 6 个月 | 6–12 个月 | > 12 个月 |
| 财务、领导、产品健康 | <= 12 个月 | 12–24 个月 | > 24 个月 |
| 法律 | 取决于案件状态；持续案件可为 current | 结案后说明历史属性 | 不删除，保留结果与日期 |
| 公司历史、创始人教育 | 不适用 | 不适用 | durable |

当前实现的 24 个月 section budget 可以保留为检索预算；但**展示层的 freshness 不应只依赖该预算**。候选人需要区分「仍可研究」与「可作为当前决定的证据」。

### 8.4 冲突处理

当两个高质量来源对同一事实给出不同答案时，系统不得静默选择一个。应创建 `evidenceState: conflicting` 的 claim，并展示：

- 两个说法分别是什么；
- 各自的来源、日期和范围；
- 为什么无法合并；
- 建议由谁在面试中确认。

例如，公司泛用 careers 页面称「hybrid」，但特定岗位页写「每周 3 天办公室」。应以具体岗位页为候选人相关事实，同时把公司级政策作为背景，而不是平均成「部分混合」。

## 9. 分析与决策逻辑

### 9.1 模型输出约束

Section analyzer 的输出从「摘要 + key findings」演进为「摘要 + claims」。模型只能引用提供的 `sourceId`；不得输出 URL、不得新增来源、不得在没有 sourceRef 的情况下生成外部事实。

建议的模型规则：

```text
- 每个 claim 只表达一个可验证主张。
- 明确区分事实、社区体验和分析推断。
- 不能由证据支持时，输出 insufficient，而不是补全。
- 不能把平台工作者的法律事件泛化为企业员工工作环境。
- 不能把其他地点、其他角色或旧职位的签证/RTO 信息泛化到目标职位。
- 对用户未提供的偏好不作价值判断。
```

### 9.2 确定性 Claim Validator

模型完成后，validator 必须执行以下检查：

1. 所有 claim 至少有一个有效 `sourceRef`；否则降为 `insufficient` 或移除。
2. `blocking` claim 是否满足来源层级和数量门槛；否则最高只能为 `material + limited`。
3. 来源是否在允许的时效窗口内；超窗则设为 `aging/historical`，并降低 impact 或要求核实。
4. claim scope 是否与目标 role/location 相容；不相容则设 `not_applicable` 或仅作背景显示。
5. 同一 claim 的来源是否冲突；冲突时不得输出 `verified`。
6. 社区来源是否超出维度预算；超过时只保留主题多样性最高的证据。
7. 文本是否包含无来源的精确数字、绝对词或法律定性；命中后拒绝或回退重生成。

Validator 输出应同时写入 `validationWarnings`，以便开发者和测试检查，而不必全部展示给最终用户。

### 9.3 Fit Engine

Fit engine 是确定性规则层，不应用模型猜测。它只把已验证或需要核实的 claim 映射到 CandidateProfile：

| 条件 | 结果 |
|---|---|
| 用户 `remote_only`，岗位明确要求固定办公室出勤 | `mismatch`，可成为 blocking |
| 用户需要雇主担保，具体岗位未证实支持 | `investigate`，优先行动为 recruiter 核实 |
| 用户最低薪资高于匹配职位的可信薪资上界 | `mismatch`；若基准弱则仍为 investigate |
| 活跃裁员有高可信证据，用户优先稳定性 | `investigate` 或 material，不能自动阻断 |
| 用户未填某项偏好 | `not_applicable`，不进入总推荐 |

决策输出不应压缩成单一数值分。建议使用：

```text
continue                    没有已验证的阻断项，关键不确定性可接受
continue_after_verification 没有已验证的阻断项，但有 1–3 个必须先确认的问题
pause                       已有与明确 deal-breaker 冲突的高可信事实
insufficient_evidence       公开资料不足，无法给出个人化建议
```

### 9.4 Action Engine

Action engine 先用规则选择需要行动的 claim，再用受约束的模型模板或确定性模板生成自然语言。选中顺序：

1. 已验证的 deal-breaker；
2. 与用户优先级最相关的 material claim；
3. conflicting / insufficient 但在面试中可快速解决的 claim；
4. 最多三个行动项，避免报告变成任务清单。

每个问题必须引用 claim 的实际 scope。例如地点未知时不得写成「Amsterdam 团队」；应改为「这个岗位所属团队」。

## 10. Report v2 展示设计

HTML 仍保持离线、自包含和确定性。建议只增加以下信息层，不推倒现有视觉结构：

1. **顶部决策卡**：目标岗位、生成时间、建议状态、已验证的阻断项、前三个行动。
2. **候选人条件说明**：只显示本次实际采用的约束，并提示未填写的项不会影响结论。
3. **信号卡**：每个 claim 显示 impact、evidenceState、freshness、scope 与 fit，而不仅是颜色。
4. **证据抽屉**：展开后可看到来源层级、日期、摘要片段和链接；不在默认页面重复整段原文。
5. **面试问题区**：按该问谁分组，可一键复制（纯前端、无需网络）。
6. **变化区**：只有 `--compare` 时出现，按新增/移除/状态变化列出。

无障碍要求：颜色不是唯一语义；所有状态有文字标签；来源链接包含可辨识标题；键盘可展开证据；复制操作有焦点和成功提示。

## 11. 快照比较设计

### 11.1 输入与输出

```text
current ReportV2 + previous ReportV2 → SnapshotDiff
```

```ts
interface SnapshotDiff {
  previousReportId: string;
  comparedAt: string;
  addedClaimIds: string[];
  removedClaimIds: string[];
  changedClaims: Array<{
    claimId: string;
    changedFields: Array<"impact" | "evidenceState" | "freshness" | "candidateFit" | "sourceRefs">;
    summary: string;
  }>;
  newActionIds: string[];
}
```

### 11.2 比较规则

- 仅比较目标公司一致、地点/角色高度相近的报告；否则显示「不可可靠比较」。
- `sourceRefs` 增减本身不是风险变化；只有影响 claim 状态或文本支持时才在用户层突出。
- 过去快照的结论不会被重写；当前报告单独记录当前判断。
- 过期来源导致的 `freshness` 变化应被显示，即使主张本身未变化。

## 12. 缓存、成本与可复现性

### 12.1 缓存键

沿用现有抓取、证据包、section analysis 和 summary 的分层缓存，但 v2 的缓存输入必须加入：

- `reportVersion`
- section prompt version
- evidence quality policy version
- CandidateProfile 的**只影响本段输出字段**
- action template version

原始检索和证据包不应因用户薪资底线不同而重新抓取；fit/action 输出可以单独缓存或每次快速计算。

### 12.2 可复现性

报告元数据必须记录：

- `generatedAt`、时钟时区与工具版本；
- 查询计划版本、质量策略版本、提示词版本；
- 每个来源的 `fetchedAt`；
- 模型提供方和模型标识（若可用）；
- cache hit/miss 统计。

由于网页会变动，重新运行研究不可能字节级一致；但对相同 ReportV2 JSON 的渲染必须字节级一致。

## 13. 隐私、安全与法律边界

### 13.1 隐私

- CandidateProfile 默认只写入本地报告；不上传至第三方分析服务。
- 不接收身份证、护照、签证号码、住址、电话号码或雇主内部材料。
- `notes` 默认只存在于进程内；若未来支持保存，必须要求显式 opt-in。

### 13.2 内容与诽谤风险

- 法律、监管、裁员和个人背景只使用可公开核实的来源。
- 对未证实指控、社区传闻和个人体验使用明确限定语。
- 禁止输出「公司违法」「文化有毒」等无范围、无证据的定性；应改为「若干近期公开评论提到……，但样本有限」。
- 法律事件必须标明案件状态、涉及的人群和时间，不能把平台劳动者事件泛化为全体员工待遇。

### 13.3 HTML 安全

v2 JSON 只保存纯文本与受控枚举。renderer 对所有文本进行 HTML escape；URL 需允许 `https:`/`http:`，链接属性由 renderer 构建，不能让模型提供 HTML、事件属性或样式。这样可以避免报告内容成为本地 HTML 注入入口。

## 14. 迁移与实现阶段

### Phase 0：基线和样本集

- 收集 10–15 个匿名化或公开公司样本，覆盖不同国家、规模、行业和信息稀疏度。
- 为每个样本人工标注 3–5 个应出现的主张、关键来源、范围和是否应为 grey/yellow/red。
- 将当前报告作为对照，不修改运行逻辑。

**完成条件**：样本集、预期主张和人工评审 rubric 被保存；无生产改动。

### Phase 1：证据账本与 claim contract

- 引入 `ReportV2`、`SourceRecord`、`Claim` schema 和 schema validation。
- 让 section analyzer 输出 claim 而非不可分割的大段 finding。
- 增加 source tier、发布时间、适用范围和 freshness 计算。
- 新增 deterministic Claim Validator。

**完成条件**：任意 v2 report 都能枚举每个高影响 claim 的来源、范围和证据状态；无来源 claim 不会渲染为红/黄结论。

### Phase 2：CandidateProfile、Fit 和 Action

- 增加可选输入及 CLI 参数。
- 实现确定性 fit rules。
- 生成最多三项面试行动及问题。
- 设计并实现顶部决策卡与行动区。

**完成条件**：同一家公司在「需要签证」和「不需要签证」两种 profile 下，只有相关 section 的 fit/action 不同；无 profile 时结果不假设用户偏好。

### Phase 3：Snapshot diff

- 建立稳定 claim ID。
- 实现 `--compare`、兼容性检查和 SnapshotDiff。
- 渲染新增/移除/状态变化。

**完成条件**：相同报告比较无变化；人为修改一个 claim 的来源、freshness 或状态时，diff 正确且易读。

### Phase 4：质量优化与回归

- 根据样本集校准来源阈值和时效窗口。
- 评估模型成本、缓存命中和运行时间。
- 清除或隔离遗留 v1 输出路径，但保留 v1 render compatibility。

**完成条件**：满足第 15 节全部验收标准，且 v1 render-only 回归测试通过。

## 15. 测试策略与验收标准

### 15.1 单元测试

- `SourceTier` 规则：官方、政府、新闻、社区、聚合来源分类正确。
- freshness：边界日期、无发布日期、持续法律事件和历史信息规则正确。
- claim validator：无 source、弱 source 的 blocking、范围不匹配、冲突来源均被正确降级。
- fit engine：remote-only、签证、薪资底线和未填写偏好的所有组合。
- action engine：问题对象、优先级、最大数量和中性措辞。
- renderer：文本 escape、链接协议过滤、无未填 placeholder、对相同 JSON 可确定性输出。
- snapshot diff：新增/移除/状态变化/不兼容目标。

### 15.2 集成测试

- 使用 fixture 的 SourceRegistry 和 EvidencePacket 跑完整的研究后半段。
- 验证高影响 claim 的所有 `sourceRefs` 都存在于 registry。
- 验证 section 中的高影响 claim 至少满足质量政策。
- 验证缓存键在 policy、prompt 和 profile 变更时按预期失效或复用。
- 验证 render-only 不触发网络或模型调用。

### 15.3 人工质量评审

每个试点报告由人工用以下问题审阅：

1. 顶部三项行动是否能在真实招聘流程中执行？
2. 任一红/黄信号是否能在两次点击内看到出处与日期？
3. 是否有把其他城市、角色或人群的事实泛化到目标岗位？
4. 是否把「没找到」错写为「没有」？
5. 结论是否比原报告更容易帮助用户决定继续、暂停或核实？

### 15.4 发布门槛

- 100% 的 `blocking`/`material` claim 有至少一个有效 source reference。
- 100% 的 `blocking` claim 满足来源层级与范围门槛。
- 0 个已知原始 HTML 注入路径。
- 所有 v2 报告通过 schema validation。
- 相同 v2 JSON 的两次渲染结果完全一致。
- 所有 v1 fixture 仍可渲染。
- 样本集上，人工评审不接受的高影响 claim 比当前基线减少至少 50%。

## 16. 预期模块影响（实施时的导航，不是本次改动）

| 区域 | 预期职责变化 |
|---|---|
| `src/types/` | ReportV2、Claim、CandidateProfile、SnapshotDiff schema |
| `src/retrieval/` | source tier 与发布日期/范围抽取增强 |
| `src/evidence/` | 质量策略、冲突检测、evidence ledger |
| `src/model/` | section prompt/output 改为结构化 claims；summary 改为决策摘要 |
| `src/report/` | claim validation、fit/action、snapshot comparison、version dispatch |
| `src/render/` | v2 renderer、escape、安全链接构建、行动与 diff 组件 |
| `src/config/` | section-specific quality/freshness 规则与 prompt versions |
| `src/tests/` | fixtures、validator、fit/action、diff、v1/v2 renderer 回归 |

若仓库当前只保留 `dist/` 构建输出，实施开始前必须先恢复或定位对应的 TypeScript 源文件和构建配置。不要直接把 v2 逻辑手工维护在构建产物中。

## 17. 风险与待决策事项

| 风险/问题 | 建议默认选择 |
|---|---|
| 模型能否可靠判定来源层级？ | 以代码的域名/来源类型规则为准；模型只可提出建议 |
| 首期是否显示数值总分？ | 不显示。使用 recommendation + evidence state + fit，避免虚假精确度 |
| 是否将候选人偏好写进报告？ | 仅保存结构化、用户明确提供的字段；敏感备注不保存 |
| 发现负面社区内容时如何处理？ | 只总结重复主题、说明样本限制，不将其作为确定性事实 |
| 是否做自动监控？ | 暂不做；先用 `--compare` 验证快照模型价值 |
| 哪些国家先支持？ | 继续优先支持已有本地语言和签证查询规则的国家，再根据样本扩展 |

## 18. 成功定义

v2 成功不是报告更长，或搜索更多网页。成功标准是：候选人看完后能清楚说出：

1. 对我而言，最重要的三个已验证或待核实信号是什么；
2. 这些信号分别有多新、适用于谁、证据有多强；
3. 下一轮我要问谁、问什么；
4. 若一周后重新检查，哪些事情变了。

达到这一点后，KnowYourCompany 才从「AI 公司资料整理器」变成真正的求职决策辅助工具。
