# KnowYourCompany v2：Task-by-Task Technical Implementation Plan

> 状态：实施计划；尚未开始代码改动
> 依赖设计文档：[v2-technical-design.md](./v2-technical-design.md)
> 本文把设计拆成有明确输入、输出、验收标准和依赖关系的任务。任务按顺序执行；每个 phase 结束必须通过其验证门槛，才进入下一阶段。

## 1. 执行原则

- 不修改或删除旧的 v1 `.report.json`、HTML 报告和 render-only 行为。
- 所有新报告明确写入 `reportVersion: 2`；不做隐式格式猜测。
- 所有模型输出先通过 schema 和确定性 validator，后才可进入报告或 renderer。
- 不将候选人的敏感自由文本写入报告或缓存。
- 每个功能 task 都必须包含单元测试；每个 phase 都必须包含一个端到端 fixture。
- 不在 `dist/` 中直接开发。若 TypeScript 源码或构建配置缺失，先完成 Task 0。

## 2. 任务依赖图

```text
T0 工程基线与源码恢复
 │
 ├─ T1 v2 schema 与版本分发
 │   ├─ T2 来源元数据与分层
 │   │   ├─ T3 证据质量/时效策略
 │   │   │   ├─ T4 Claim validator
 │   │   │   └─ T5 模型 claim 输出
 │   │   │       └─ T6 v2 报告编排
 │   │   └─ T7 CandidateProfile 输入
 │       └─ T8 Fit engine
 │           └─ T9 Action engine
 │               └─ T10 决策摘要
 │
 ├─ T11 v2 安全 renderer
 │   └─ T12 v2 报告体验与复制交互
 │
 ├─ T13 Snapshot diff
 │   └─ T14 CLI 比较模式
 │
 └─ T15 端到端质量评估与发布门槛
```

## Phase 0 — 基线、源码与样本

### T0. 恢复可开发的工程基线

**目的**：确认当前仓库的 TypeScript 源码、构建脚本、测试脚本和 `dist/` 的对应关系，避免直接编辑构建输出。

**依赖**：无。

**预期改动区域**：仓库根目录、`package.json`、`tsconfig.json`、`src/`、`.gitignore`；仅在实际缺失时恢复源文件或构建配置。

**实施步骤**：

1. 记录当前 git status，明确哪些已有未提交内容不属于本次工作。
2. 确认 `src/`、`package.json`、lockfile 和 TypeScript 配置是否被追踪且存在。
3. 将 `dist/` 中运行时模块清单与预期 `src/` 目录逐项对照。
4. 若源文件确实缺失，从可信 git 历史、远端分支或原始开发目录恢复；不可从压缩/反编译产物手工重建后直接继续开发，除非用户明确授权。
5. 运行现有 install、build、test 和最小 render-only smoke test，记录 Node 版本与结果。
6. 新建 `docs/v2-baseline.md`，只记录环境、命令、测试结果、已有风险与未解决项。

**验收标准**：

- 开发使用的源码路径明确，且 `build` 能从源码生成/验证运行时产物。
- 现有测试结果被保存；失败项明确为 pre-existing 或本次引入。
- 能对一个既有 v1 JSON 执行 render-only 并得到 HTML。
- 未修改产品行为。

**停止条件**：如果无法找到可信源码或构建配置，停止在此 task，向用户报告，不开始 v2 功能实现。

### T0.1. 建立 v2 质量 fixture 集

**目的**：让后续质量判断可测试、可回归，而不是只靠单次真实搜索。

**依赖**：T0。

**预期改动区域**：`tests/fixtures/v2/`、`docs/v2-fixture-rubric.md`。

**实施步骤**：

1. 选择 10–15 个公开样本，覆盖：信息充分公司、信息稀疏公司、跨国公司、不同城市同一公司、需要签证的岗位、RTO 矛盾、历史法律事件、近期组织变动。
2. 不把真实个人求职资料写入 fixture；使用公开或匿名化目标信息。
3. 每个样本定义：输入、目标范围、可接受来源、预期 claim、禁止泛化、预期 `evidenceState`、预期行动项。
4. 保存冻结的网页摘要或结构化 source registry fixture，避免测试依赖实时网络。

**验收标准**：

- 每项新规则至少有一个正向和一个反向 fixture。
- 任何 reviewer 可根据 rubric 判断 claim 是否可接受。
- fixture 不包含私人候选人信息或需要授权访问的内容。

## Phase 1 — v2 数据契约与证据质量

### T1. 引入 ReportV2 schema 与版本分发

**目的**：让 v1 与 v2 报告能共存、验证和渲染，不破坏历史工件。

**依赖**：T0。

**预期改动区域**：`src/types/`、`src/model/schema.ts`、`src/report/`、`src/render/`、`tests/schema.test.ts`。

**实施步骤**：

1. 定义 `ReportV2`、`SourceRecord`、`Claim`、`ActionItem`、`CandidateProfile` 和 `SnapshotDiff` 的 TypeScript 类型及 runtime schema。
2. 在 v2 顶层加入 `reportVersion: 2` 和稳定 `reportId`。
3. 增加 `parseReport()` 或等价入口：缺少版本或为 `1` 时走现有 parser；`2` 时走 v2 parser；未知版本抛出可读错误。
4. 定义纯文本字段规则，拒绝模型输出的 HTML、事件属性与未受控对象。
5. 添加 v1 和 v2 fixture，覆盖 parse、serialize、reject-invalid-version。

**验收标准**：

- 任一 v2 JSON 通过 schema 后才可交给 renderer。
- 所有既有 v1 JSON 仍能解析和 render-only。
- v2 JSON 不存储 HTML 片段。
- 未知版本不被静默当作 v1。

### T2. 扩展 SourceRegistry：分层、范围和采集元数据

**目的**：把来源的可信度与适用范围从模型判断中移到可测试的数据层。

**依赖**：T1。

**预期改动区域**：`src/retrieval/cleaner.ts`、`src/retrieval/*client.ts`、`src/evidence/source-normalizer.ts`、`src/types/`、`src/config/`、对应 tests。

**实施步骤**：

1. 给 `SourceRecord` 新增 `tier`、`sourceType`、`publisher`、`publishedAt`、`fetchedAt`、`language`、`locationScope`、`accessState`。
2. 以代码维护来源分类策略：官方域名/职位页、政府、法院/监管、公司申报、媒体、社区、聚合站；未知来源默认为低层级而不是高层级。
3. 规范 URL 后生成稳定 `sourceId`；确保同一个 canonical URL 不会因 query string 重复登记。
4. 将发布日期提取的成功/失败明确保存；不可把抓取日期误当发布日期。
5. 对职位页、政府网页与公司 careers 页尝试抽取地点、职位、发布日期等 scope 线索；无法确定时留空。

**验收标准**：

- SourceRegistry 中所有来源有 `fetchedAt`、`sourceType` 和 `tier`。
- 不能确定发布日期时 `publishedAt` 为空，且不会自动补成当前日期。
- URL 去重稳定，来源分类由测试覆盖。
- 现有来源 registry 仍能通过 v1 路径使用。

### T3. 实现 section-specific Evidence Quality Policy

**目的**：将时效窗口、来源预算、强结论门槛变成确定性配置。

**依赖**：T2。

**预期改动区域**：`src/config/sections.ts`、`src/config/evidence-policy.ts`、`src/evidence/`、tests。

**实施步骤**：

1. 定义各 section 的 `current`、`aging`、`historical` 窗口；法律和公司历史使用特殊规则。
2. 定义每个 section 的允许来源层级、社区来源上限、默认 evidence cap 和例外条件。
3. 定义 `blocking` 与 `material` claim 的最少独立来源条件。
4. 为同一出版商、转载稿和同一聚合来源添加独立性识别规则，防止两个转载被误算为双重验证。
5. 将已有 recency scoring 与新的 freshness label 分开：前者用于证据选择，后者用于用户可见解释。

**验收标准**：

- 一个 18 个月前的 RTO 来源可以参与研究，但在展示中为 `historical`，不能单独支撑「当前」结论。
- 两条同源转载不满足 corroboration 门槛。
- 一个具体职位的官方岗位页优先于泛用 careers 页。
- 法律持续案件与已结案历史事件在 fixture 中被正确区别。

### T4. 实现 Claim Validator 与质量告警

**目的**：在模型输出与报告输出之间添加不可绕过的质量门。

**依赖**：T1、T2、T3。

**预期改动区域**：`src/report/claim-validator.ts`、`src/evidence/`、`src/logging/`、tests。

**实施步骤**：

1. 验证每个 claim 的 source references 均存在于 SourceRegistry。
2. 根据 T3 policy 验证 `impact` 和 `evidenceState` 是否允许组合；不满足的 claim 降级或拒绝。
3. 验证 location、role、employment type 与报告 target 的兼容性；不适用证据不能进入个人化结论。
4. 识别相同 claim subject 的相冲突事实，写入 `conflicting` 状态与结构化 warning。
5. 检测没有来源的精确数字、绝对性语言及原始 HTML，拒绝或要求模型重试。
6. 为被降级/拒绝的 claim 记录机器可读 `validationWarnings`，供 debug log 和测试使用。

**验收标准**：

- 没有 source 的 claim 永远不出现在用户报告中。
- 仅由一个社区帖子支持的负面评价不能成为 `material` 或 `blocking`。
- 范围不匹配的 claim 不会影响 `candidateFit`。
- 所有 validator 分支在 fixture 中被覆盖。

### T5. 将 SectionAnalyzer 输出迁移为结构化 claims

**目的**：让模型提供可验证的原子事实和解释，而不是不可拆分的段落结论。

**依赖**：T1、T2、T3。

**预期改动区域**：`src/prompts/`、`src/model/section-analyzer.ts`、`src/model/schema.ts`、`src/types/`、tests。

**实施步骤**：

1. 更新每个 section prompt：每条 claim 只表达一个主张，必须给出 `sourceRefs` 和 `scope`。
2. 强制模型从 EvidencePacket 中给出的 source IDs 选择；禁止输出新 URL 或未提供的资料。
3. 让模型分别标注事实、社区主题和分析推断，并在后处理时映射到允许的 `evidenceState`。
4. 对 culture、interview、compensation、visa 等高歧义 section 提供专用 prompt rules。
5. 更新最终 summary prompt，使它只引用已验证 claims 和 candidate fit 结果。
6. 将 T4 validator 接到分析重试路径：结构错误可重试一次；质量不足不重试而是降级为不足证据。

**验收标准**：

- 模型输出可通过 runtime schema，且 sourceRef 100% 来自输入 registry。
- 任何 section 可单独生成、缓存和验证。
- 内容测试证明模型不会将平台劳动者事件泛化为雇员体验。
- 渲染层不需要解析模型自由文本以寻找链接或标签。

### T6. 生成并持久化完整 ReportV2

**目的**：将 v2 section claims、来源账本和 validation 结果整合成唯一真源 JSON。

**依赖**：T4、T5。

**预期改动区域**：`src/report/orchestrator.ts`、`src/report/artifact-paths.ts`、`src/cache/`、tests。

**实施步骤**：

1. 将 v2 运行输出组装为 `ReportV2`，含 target、sources、sections、validation metadata 和生成元数据。
2. 维持 v1 输出开关或独立命令，直到 v2 经过发布门槛。
3. 定义 v2 artifact 命名，不覆盖同名 v1 文件；例如使用版本后缀或固定 metadata 字段。
4. 保存查询/提示词/质量策略版本以及 cache 统计，供可复现和排错。
5. 保证相同的已生成 JSON 可在无模型、无网络条件下 render。

**验收标准**：

- v2 full run 输出可被 v2 render-only 读取。
- JSON 中的 source、claim、section 和 report target 关联完整。
- 失败 section 以明确 `insufficient` 状态进入报告，而不是让整次 run 失败。

## Phase 2 — 候选人匹配、行动与决策

### T7. 添加 CandidateProfile 输入和 CLI 参数

**目的**：收集最少且足够的用户约束，作为确定性 fit 输入。

**依赖**：T1、T6。

**预期改动区域**：`src/cli.ts`、`src/types/`、`src/report/input.ts`、tests、README usage。

**实施步骤**：

1. 在交互式 CLI 中逐项询问可选 profile 字段，并允许跳过。
2. 添加非交互式参数：`--seniority`、`--work-authorization`、`--minimum-compensation`、`--currency`、`--work-mode`、`--priority`、`--deal-breaker`。
3. 对枚举值、金额和优先级数量做输入校验；无效输入返回可读错误。
4. `notes` 若实现，只传给运行时上下文且不写入 JSON、日志或缓存键。
5. 更新帮助文本，解释 profile 影响「适配建议」而不改变研究事实。

**验收标准**：

- 全部 profile 字段可跳过，旧命令仍可运行。
- 用户未填写的偏好不会被默认成 deal-breaker。
- 任何敏感证件类字段均不被接受或保存。
- CLI 参数和交互式输入产出同一 CandidateProfile。

### T8. 实现确定性 Fit Engine

**目的**：根据已验证 claim 与用户显式约束，计算 `aligned / investigate / mismatch / not_applicable`。

**依赖**：T4、T6、T7。

**预期改动区域**：`src/report/fit-engine.ts`、`src/config/fit-rules.ts`、tests。

**实施步骤**：

1. 写成数据驱动规则，而不是将判断写入 prompts。
2. 优先覆盖：签证、固定办公要求、薪资范围、近期稳定性。
3. 对范围不足和弱证据只输出 `investigate`，不得输出 `mismatch`。
4. 将 fit reason 关联到 claim ID 与用户具体约束；不披露未提供信息。
5. 无 CandidateProfile 时所有 candidate fit 为 `not_applicable`，但保留事实性风险状态。

**验收标准**：

- remote-only + 具体岗位固定到岗 → `mismatch`。
- 需要担保 + 无具体岗位证据 → `investigate`，不是「不支持」。
- 薪资数据地点或职级不匹配 → 不可直接判定 mismatch。
- 规则矩阵在 unit tests 中覆盖。

### T9. 实现 Action Engine 与面试问题模板

**目的**：让报告的风险结论变成候选人在下一步可使用的中性问题。

**依赖**：T8。

**预期改动区域**：`src/report/action-engine.ts`、`src/config/action-templates.ts`、`src/model/`（如需受约束措辞）、tests。

**实施步骤**：

1. 根据 `blocking`、`material`、`conflicting`、`investigate` 和 deal-breaker 选择候选 claim。
2. 排序：明确阻断项 > 用户 priority 相关项 > 可快速核实的不确定项。
3. 每个 action 生成 owner、question、rationale 和 resolution criteria；报告最多显示三项。
4. 默认使用受控模板；只有在模板无法覆盖时才调用小型、schema 约束的生成步骤。
5. 对问法运行措辞检查：禁止预设指控、绝对化断言和不在证据中出现的细节。

**验收标准**：

- 每个 action 都能追溯至一个 claim。
- 没有高优先级 claim 时不生成虚构行动项。
- 问题能在不暴露候选人敏感信息的前提下提出。
- 最大数量、优先级和 owner 映射均有测试。

### T10. 实现个人化决策摘要

**目的**：以可解释的状态代替单一「公司好不好」分数。

**依赖**：T8、T9。

**预期改动区域**：`src/report/decision-engine.ts`、`src/model/final-summary.ts` 或等价模块、tests。

**实施步骤**：

1. 先由代码计算 recommendation：`continue`、`continue_after_verification`、`pause`、`insufficient_evidence`。
2. 模型只将已选择的 claim 与 action 编排为简洁 rationale；不能改变 recommendation 或引入事实。
3. 输出最多三条顶级原因和三个 action IDs。
4. 输入为空 profile 时，决策说明改为一般性研究总结，不冒充个人建议。

**验收标准**：

- 已验证的 deal-breaker 可以导致 `pause`；弱证据不能。
- recommendation 的每个理由都能追到 claim。
- 输出不含数值总分或「安全公司」等过度承诺。

## Phase 3 — v2 渲染、安全与交互

### T11. 实现 v2 安全 renderer 与版本路由

**目的**：以安全、确定性的方式把语义 JSON 转为离线 HTML，并保留 v1 renderer。

**依赖**：T1、T6、T10。

**预期改动区域**：`src/render/report-renderer.ts`、`src/render/html-fragments.ts`、`references/`、render tests。

**实施步骤**：

1. 通过 `reportVersion` 路由 v1 和 v2 render paths。
2. 新增集中 HTML escape、属性 escape、URL 协议白名单和安全外链构建函数。
3. 把 claim、source、action、decision 渲染为纯文本和受控 DOM fragments；禁止模型提供 HTML。
4. 保持 v2 render-only 绝不读取网络、不调用模型。
5. 增加 snapshot tests 和 malicious-input fixtures。

**验收标准**：

- 相同 v2 JSON 两次渲染字节级一致。
- `<script>`、`javascript:` URL、事件属性及样式注入均被转义或拒绝。
- 所有 v1 fixture 保持现有渲染行为。

### T12. 实现 v2 报告信息层与复制体验

**目的**：让用户在 60 秒内看到适配、证据强度与可执行下一步。

**依赖**：T11。

**预期改动区域**：v2 HTML template/renderer fragments、`references/styles.css`、浏览器/DOM tests。

**实施步骤**：

1. 增加顶部决策卡：目标、生成日期、recommendation、前三个行动。
2. 为 claim 增加 Impact、Evidence State、Freshness、Scope、Candidate Fit 的文字标签；颜色仅作辅助。
3. 添加可键盘操作的「证据抽屉」，显示来源级别、日期、适用范围和链接。
4. 添加行动问题区及纯前端复制按钮；无 Clipboard API 时提供选择文本 fallback。
5. 只在 report 实际含 CandidateProfile 时显示「本次采用的条件」；不展示 notes。
6. 检查长文本、窄屏、深色模式和不依赖颜色的状态区分。

**验收标准**：

- 每个 material/blocking claim 可在两次交互内查看来源。
- 键盘可访问所有交互元素；状态有文字而不仅是颜色。
- 复制按钮不需要网络权限。
- v1 HTML 外观和内容未被意外改变。

## Phase 4 — 快照比较

### T13. 实现稳定 Claim ID 与 SnapshotDiff

**目的**：对同一机会的两个报告做有意义的变化比较。

**依赖**：T4、T6、T10。

**预期改动区域**：`src/report/claim-id.ts`、`src/report/snapshot-diff.ts`、types、tests。

**实施步骤**：

1. 从 section、规范化 subject 和 scope 构建 claim ID；不要对完整自然语言 claim 文本做哈希。
2. 定义 report target 的兼容性规则：公司必须一致；地点/角色只允许显式的等价映射。
3. 比较新增、移除、影响状态、证据状态、freshness、candidate fit、source refs 和 action 的变化。
4. 对无法稳定匹配的 claim 只标注「需人工比较」，不得错误归为新增风险。
5. 生成适合渲染的简短 diff summary，但保留原始变化字段。

**验收标准**：

- 同一 report 与自身比较无变化。
- 仅措辞改写的同一主张不会被识别为新增/移除。
- 角色或地点明显不同的报告会拒绝比较。
- 过期导致 freshness 变化会正确出现。

### T14. 添加 `--compare` CLI 与 diff 展示

**目的**：让用户能通过现有 CLI 触发一次性快照比较，不引入后台监控。

**依赖**：T13、T11。

**预期改动区域**：`src/cli.ts`、`src/report/orchestrator.ts`、renderer、README、CLI tests。

**实施步骤**：

1. 添加 `--compare <previous-report.json>` 参数，仅接受兼容的 v2 JSON。
2. 在完整 v2 run 后执行 diff，并把结果写入当前 JSON；不改写历史 JSON。
3. 在 HTML 中仅当 diff 非空时显示「自上次检查以来」。
4. 通过 CLI 提示清楚解释：比较不是实时监控，只比较两份运行时快照。
5. 为不存在文件、v1 文件、无效 JSON 和不兼容 target 添加错误处理。

**验收标准**：

- `--compare` 不触发额外的网络操作以读取历史报告。
- 不兼容输入有可读错误且不会生成半成品报告。
- 最新 HTML 能显示新增/移除/状态变化。

## Phase 5 — 质量、回归与发布

### T15. 建立端到端质量评估与发布检查

**目的**：把 v2 的「可信、个人化、可行动」目标变成可重复的发布门槛。

**依赖**：T0.1、T6、T10、T12、T14。

**预期改动区域**：`tests/`、`scripts/`（若已有测试工具链）、`docs/v2-release-checklist.md`、CI 配置（如适用）。

**实施步骤**：

1. 用冻结 fixture 跑完整 pipeline，收集 claim coverage、validator 降级、source-tier 分布和渲染快照。
2. 建立人工评审表：事实支持、范围适配、时效、行动可执行性、措辞安全。
3. 设定并自动检查硬门槛：
   - 100% `blocking/material` claim 有有效 source ref；
   - 100% `blocking` claim 满足最低来源门槛；
   - 0 个 renderer 注入测试失败；
   - v1 renderer regression 全部通过；
   - 相同 JSON 重渲染字节一致。
4. 对 10–15 个样本做人审，对比当前基线，记录误导性高影响结论的减少情况。
5. 运行一次真实但非敏感的 smoke test；将网络变化、模型不稳定性与 fixture 测试分开报告。
6. 在 release checklist 中记录版本、迁移策略、已知限制和回滚方法。

**验收标准**：

- 所有硬门槛通过。
- 评审确认行动项能被真实候选人使用，且没有预设指控性表述。
- v2 默认启用前，v1 回滚路径明确。

## 3. 实施顺序与合并建议

建议以能独立合并和回滚的 PR 边界执行：

| PR | 包含任务 | 不应包含 |
|---|---|---|
| PR 0 | T0、T0.1 | 任意产品功能 |
| PR 1 | T1、T2 | renderer 视觉改动 |
| PR 2 | T3、T4、T5 | CandidateProfile、CLI 新输入 |
| PR 3 | T6、T7、T8 | v2 默认启用 |
| PR 4 | T9、T10 | 页面大规模重设计 |
| PR 5 | T11、T12 | snapshot compare |
| PR 6 | T13、T14 | 后台监控或通知 |
| PR 7 | T15 | 功能扩张 |

每个 PR 都应：

1. 更新相关 schema 与 unit tests；
2. 保持 v1 fixture render 成功；
3. 明确是否改变 CLI、artifact 格式或 cache key；
4. 包含最少一条失败案例测试；
5. 在合并前运行 lint、typecheck、test 和 renderer snapshot tests。

## 4. 不应提前做的工作

在 T15 完成前，不建议开始以下工作：

- 自动重新检查、定时任务、邮件或通知；
- 用户登录、云端历史记录或团队共享；
- 公司综合评分或排名；
- PDF 导出；
- 针对所有国家的签证规则扩张；
- 在报告中增加更多研究维度。

这些都依赖 claim 质量、范围和 freshness 先达到可信基线。先把 12 个现有维度做成可审计的候选人决策工具，价值会比继续扩展搜索面更高。

## 5. Definition of Done

v2 可以认为完成，当且仅当：

1. 用户能提供或跳过 CandidateProfile，且不会因跳过被推断偏好；
2. 每个高影响结论都能看到来源、来源等级、日期和适用范围；
3. 「没有找到风险」「证据不足」「来源冲突」显示为不同状态；
4. 报告提供最多三项可直接用于下一轮面试的核实问题；
5. 两个兼容 v2 快照可通过 `--compare` 看到实际变化；
6. v1 JSON 与 HTML 的 render-only 行为仍受回归测试保护；
7. 所有发布门槛与人工评审均通过。
