# A-G 架构重复问题收口推进计划

## 一、文档目的

本文用于承接当前讨论结论与只读复核结果，指导后续对 A-G 架构重复问题进行分轮收口。

核心目标不是一次性清空全项目所有 `UTSJSONObject` 或弱类型痕迹，而是在已完成 Phase 2 核心数据流强类型化的基础上，继续把重复协议、重复映射、重复状态源和组件边界 legacy payload 按风险顺序收口，确保每一轮都可编译、可运行验证、可局部止损。

本文作为后续推进的执行索引，明确：

- 当前总体状态；
- A-G 问题现状；
- 已完成修复；
- 第 1~3 轮执行状态与阶段准入判断；
- 验证清单；
- 推进原则与禁止事项。

---

## 二、当前总体状态

### 2.1 总体判断

当前项目已完成从“页面 / Validator / Storage 多处手工拼弱类型 JSON”向“内部强类型、边界弱类型”的关键转向。

只读复核显示，以下关键能力已经存在：

- `domain/services/session-adapter.uts` 已提供 `sessionDataToStorageJson` 等 adapter 能力；
- `pages/work/entry.uvue` 已引入并使用 `validateTypedSessionData`；
- `domain/services/Validator.uts` 已存在 `validateTypedSessionData` typed 主入口，并保留旧入口兼容；
- `components/biz-session-role-card/biz-session-role-card.uvue` 的 `initialWorkers` 已使用 `SessionWorkerData[]`；
- `components/biz-bin-card/biz-bin-card.uvue` 的 `initialWorkers` 已使用 `SessionPenaltyWorkerData[]`；
- `components/biz-cross-bin-input/biz-cross-bin-input.uvue` 的 `externalSources` 已使用 `AssignmentSourceCreateParams[]`；
- `pages/work/entry.uvue` 的 `onCrossBinChange(payload: CrossBinChangePayload)` 已直接接收 typed payload。

因此，后续推进重点已从“建核心 typed 架构”转为“清理重复过渡层、固化边界契约、补齐运行验证”。截至第 3 轮只读复核，核心录入代码链路已基本 typed，本轮不建议继续改业务代码，优先做文档对齐与阶段准入记录。

### 2.2 当前阶段定位

可将当前状态视为：

- **Phase 2 主链路基本完成**：读链、写链、Validator typed 入口、storage adapter 已具备；
- **Phase 3 组件边界 typed 化已基本完成核心范围**：role-card、bin-card、cross-bin 三个关键边界已呈 typed 形态；
- **第 1、2 轮复核/收口已完成，当前处于第 3 轮收尾准入**：本轮以文档对齐、合法边界标注、验证记录为主；
- **剩余风险主要在运行验证**：需继续通过真实设备 / HBuilderX 日志确认无 cast、null、payload 字段缺失等运行态异常。

### 2.3 不应误判的点

- 项目仍允许在 storage、导入导出、配置解析、消息模板等边界层保留 `UTSJSONObject`。
- 不要求全项目搜索 `UTSJSONObject` 为零。
- 当前要收口的是核心录入链路与组件边界的重复协议问题，不是重写统计、导入导出、配置服务。

---

## 三、A-G 问题现状表

| 编号 | 问题类别                           | 典型表现                                                                          | 当前状态                                                                                                                                                                 | 后续处理建议                                                       |
| ---- | ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| A    | 页面、存储、校验之间重复 JSON 映射 | `entry.uvue`、`Validator`、storage 各自拆装 `bins/cross_bin/liang_tang/dui_qu`    | **基本收口**。adapter 与 typed session 主链路已存在                                                                                                                      | 后续只做残余检查，不再大改主链路                                   |
| B    | 页面内部重复弱类型状态             | 页面核心状态曾同时存在 typed state、`UTSJSONObject[]` 镜像、Map/数组双轨事实源    | **大部分收口**。`SessionEntryPageState`、`EntryBinCardState`、`SessionWorkerData` 等已成为主表达                                                                         | 检查 `entry.uvue` 是否仍有不必要的本地重复类型或反向镜像写入       |
| C    | 组件边界重复 payload 协议          | 页面 typed，但传给组件前又转成 legacy `UTSJSONObject[]`；组件 emit 弱类型 payload | **核心范围已基本收口**。role-card、bin-card、cross-bin 已看到 typed props / typed payload，entry 中未发现 `toBinWorkerPayload` / `parseCrossBinChangePayload` 主路径残留 | 后续以运行回归和局部复核为主，不再大改组件边界                     |
| D    | snake_case / camelCase 混用        | storage DTO 与 page state 字段命名混在同一层                                      | **已建立边界规则**：storage DTO 用 snake_case，page state 用 camelCase，adapter 负责转换                                                                                 | 继续防止越层字段；不要删除 adapter 的合法 storage 边界转换         |
| E    | Validator 兼容逻辑重复             | Validator 既解析 raw JSON，又承担业务规则，导致页面字段兼容逻辑散落               | **基本收口**。`validateTypedSessionData` 已存在，旧入口作为兼容 wrapper                                                                                                  | 保持规则层 typed 主入口；旧兼容入口可保留，不作为核心录入页主路径  |
| F    | 运行时 cast / null 风险            | `SessionPenaltyWorkerData cannot be cast to UTSJSONObject`、payload 字段缺失      | **进入准入验证阶段**。代码链路已基本 typed，风险主要靠运行日志确认                                                                                                       | 必须通过 HBuilderX / 真机日志继续排除 cast、null、payload 结构异常 |
| G    | 文档、计划与当前实现不同步         | Phase 2 / Phase 3 文档中仍有“待做”项，但代码已有部分实现                          | **本轮已对齐**。本文记录当前代码复核结论；旧 Phase 2 / Phase 3 计划仅作历史背景参考                                                                                      | 后续推进以 A-G 收口计划、当前代码复核和运行验证为准                |

---

## 四、已完成修复

### 4.1 Phase 2 核心数据流修复

已完成或已具备的关键能力：

- 新增并使用 session adapter，将 storage JSON 与 typed session 之间的转换集中处理；
- 建立 `SessionData`、`SessionEntryPageState` 等 typed 主模型；
- 将历史数据兼容逻辑向 adapter 集中，避免页面和 Validator 分散兜底；
- 保存链路具备 `SessionData -> sessionDataToStorageJson` 能力；
- Validator 具备 `validateTypedSessionData` typed 主入口；
- 旧 `validateSessionData` 保留兼容包装，降低迁移风险。

### 4.2 页面状态与业务事实源修复

已完成或已推进的内容：

- 页面核心状态逐步从弱类型数组转向共享模型；
- `getLiangTangInitialWorkers()` 返回 `SessionWorkerData[]`；
- 仓卡片输入使用 `getBinWorkers(stageBinId)` 作为 typed 数据来源；
- 跨仓变更使用 `CrossBinChangePayload`；
- 页面保存、提交、校验路径不再依赖各入口手工拼独立 JSON。

### 4.3 组件边界修复

只读复核确认以下方向已落地：

- `biz-session-role-card.uvue`：
  - `initialWorkers` 默认值为 `SessionWorkerData[]`；
  - watcher 接收 `SessionWorkerData[]`；
  - 内部 `workers` 为 `SessionWorkerData[]`。
- `biz-bin-card.uvue`：
  - `initialWorkers` 已声明为 `SessionPenaltyWorkerData[]`；
  - watcher 接收 `SessionPenaltyWorkerData[]`；
  - 内部 `workerList` 使用 `BinWorkerItem[]`。
- `biz-cross-bin-input.uvue`：
  - `bins` 使用 `StageBinInfo[]`；
  - `externalSources` 使用 `AssignmentSourceCreateParams[]`；
  - 内部 `sources` 使用 `AssignmentSourceCreateParams[]`；
  - 页面 `onCrossBinChange(payload: CrossBinChangePayload)` 已 typed。

### 4.4 已形成的推进资料

当前已有可参考资料：

- `PHASE2_IMPLEMENTATION_GUIDE.md`：核心数据流强类型化的历史分步方案，当前不再作为待办逐项执行；
- `PHASE3_COMMIT_SPLIT_PLAN.md`：三个组件边界 typed 化的历史 commit 切分方案，当前不再作为待办逐项执行；
- 本文：基于当前复核结果，对 A-G 重复问题进行收尾判断与阶段准入记录。

> 第 3 轮代码复核结论：`entry.uvue` 已走 `buildSessionDataFromState` / `entryPageStateToSessionData` 与 `validateTypedSessionData`；三个核心组件 props、watcher、内部状态已基本 typed；`session-adapter`、`default-data-parser`、`Validator` 中的 `UTSJSONObject` 多属于 storage、默认数据解析、旧兼容入口、i18n 消息模板等合法边界，不作为清零目标。

第 3 轮复核补充：`entry.uvue` 与 role-card、bin-card、cross-bin 三个核心组件边界未发现 `toBinWorkerPayload` / `parseCrossBinChangePayload` 主路径残留；`session-adapter`、`default-data-parser` 中的 `UTSJSONObject` 属 storage DTO、默认数据解析或旧兼容边界，不纳入“清零”目标。

---

## 五、第 1~3 轮执行状态与阶段准入判断

## 第 1 轮：组件边界 typed 契约复核与残余 legacy 清理

**执行状态：已完成核心范围复核与必要收口。** 当前复核未发现 `entry.uvue` 仍以 `toBinWorkerPayload` / `parseCrossBinChangePayload` 作为主路径；role-card、bin-card、cross-bin 的 props、watcher、内部状态已基本 typed。后续不再按本轮清单逐项改业务代码，仅保留运行回归与局部问题止损。

### 目标

确认 role-card、bin-card、cross-bin 三个核心组件边界已经真正形成单一 typed 协议，不再存在“props typed，但初始化 / emit / 页面接收仍走 legacy payload”的重复路径。

### 范围

重点文件：

- `components/biz-session-role-card/biz-session-role-card.uvue`
- `components/biz-bin-card/biz-bin-card.uvue`
- `components/biz-cross-bin-input/biz-cross-bin-input.uvue`
- `pages/work/entry.uvue`
- 必要时补充：`domain/models/assignment.uts`、`domain/models/session.uts`

重点检查：

- `initialWorkers`、`externalSources`、`change` payload 是否全链路 typed；
- `initWorkersFromProps()`、`initWorkerList()`、cross-bin 初始化逻辑是否还存在弱类型下标读取；
- 页面是否还存在 `toBinWorkerPayload()` 这类 legacy helper；
- 页面接收事件是否仍通过 `parseCrossBinChangePayload()` 等旧包装作为主路径；
- 组件范围内是否仍存在不必要的 `UTSJSONObject[]`、`['personId']`、`['pointsUnits']` 等。

### 验收

- 三个组件与 `entry.uvue` 编译通过；
- role-card 四个晾堂岗位默认值、历史值、编辑、只读模式正常；
- bin-card 新建、历史回填、曲量、工分、扣分、加减人员正常；
- cross-bin 人员选择、工分输入、来源预览、回填正常；
- 自动保存、日期切换、轮次切换至少验证一次；
- 运行日志无新增 `ClassCastException`、null 字段异常、payload 字段缺失。

### 风险

- bin-card 交互最复杂，改动可能影响工分平衡、扣分草稿、拖拽排序；
- cross-bin 与 `occupiedIds`、来源分摊、仓卡扣减联动，容易出现显示正确但保存后重载不一致；
- UTS 模板类型约束较强，props typed 化可能触发编译问题。

### 不做事项

- 不改 storage / adapter / Validator 主链路；
- 不扩散到统计页、详情页、导入导出；
- 不追求全项目 `UTSJSONObject` 清零；
- 不在本轮重构业务算法或 UI 样式。

---

## 第 2 轮：页面事实源与保存 / 校验主链路收口验证

**执行状态：已完成主链路复核与收口判断。** `entry.uvue` 当前已走 `buildSessionDataFromState` / `entryPageStateToSessionData` 构造 typed session，并使用 `validateTypedSessionData` 作为提交校验主入口；保存、提交、校验不再按历史计划继续拆业务链路。后续重点是保存后重载、日期 / 轮次切换和运行日志验证。

### 目标

确认 `entry.uvue` 内部只有一个业务事实源，保存、自动保存、提交、校验全部走同一条 typed 主链路，避免“页面显示正确但保存 / 校验使用另一份数据”的重复状态问题。

### 范围

重点文件：

- `pages/work/entry.uvue`
- `domain/services/session-adapter.uts`
- `domain/services/Validator.uts`
- `domain/stores/AppStore.uts`

重点检查：

- `buildStateForDate` / `applyState` 是否仍保持 typed 页面态；
- `captureCurrentEntryState`、`buildSessionData`、保存入口是否保持同一条链路；
- `saveDraftSession` / `saveSubmittedSession` 前是否统一经过 `sessionDataToStorageJson`；
- `submit()` / `doSubmit()` 是否使用 `validateTypedSessionData`；
- `wheatMaterialWorkers` 等如仍作为组件输入镜像，不应反过来成为保存事实源；
- `binCardsData`、`liangTangRolesData`、`duiQuWorkers`、`crossBinSources` 的事实源边界是否清晰。

### 验收

- 新建会话、已有 draft、已有 submitted 均可加载；
- 修改仓卡片、晾堂、堆曲、跨仓后自动保存正常；
- 日期切换前保存正常；
- 轮次切换前保存正常；
- 提交后重新进入数据一致；
- 同一份数据通过 typed Validator 与旧兼容入口的核心规则结果一致；
- storage 中 session JSON 字段名仍保持 snake_case，不发生字段漂移。

### 风险

- 页面镜像字段如果仍被某些组件依赖，贸然删除会导致显示或回填缺失；
- 历史草稿兼容依赖 adapter，改错会导致旧数据打不开；
- 保存链路问题通常要通过“保存后重载”才能暴露，不能只看当前页面状态。

### 不做事项

- 不改组件边界协议，除非发现第 1 轮遗漏；
- 不新增统计 / 导出能力；
- 不调整 session JSON schema 语义；
- 不删除 adapter 中必要的历史兼容兜底。

---

## 第 3 轮：收尾清理、文档对齐与阶段准入

**执行状态：进行文档对齐与阶段准入记录。** 根据当前分析 / QA 结论，本轮最小安全实现仅更新计划文档，不改 `entry.uvue`、三个核心组件、adapter、Validator、default-data-parser 等业务链路；不删除合法 `UTSJSONObject` 边界。

> 第 1、2 轮核心范围已通过代码复核，本轮压缩为一次文档收尾 commit；如后续运行验证发现具体问题，应回到对应组件或链路做最小修复，而不是重启大范围 typed 改造。

### 目标

清理“功能已 typed，但代码和文档看起来仍处于过渡期”的残留，建立进入后续 Phase 4 / 统计导出等工作的准入条件。

### 范围

重点文件：

- 相关 Markdown 计划文档；
- 仅作只读复核参考：`pages/work/entry.uvue`、三个核心组件、`domain/services/session-adapter.uts`、`domain/services/Validator.uts`、`domain/services/default-data-parser.uts`。

重点检查：

- 标注 Phase 2 / Phase 3 旧计划属于历史执行计划 / 背景参考；
- 更新旧计划中已经完成但仍容易被误读为待做的内容；
- 明确后续 Phase 4 不应破坏 typed 主路径和 adapter 边界；
- 明确 `session-adapter`、`default-data-parser`、`Validator` 中 storage / 默认数据解析 / 旧兼容入口 / i18n 消息模板相关 `UTSJSONObject` 属于合法保留边界；
- 形成最终搜索与验证记录。

### 验收

- 编译通过；
- 核心录入链路运行通过；
- A-G 表中 A-F 均达到“核心链路已收口 / 仅边界允许保留弱类型”；
- G 达到“文档与代码当前状态一致”；
- 后续新功能明确以 typed 模型和 adapter 边界为准。

### 风险

- 清理命名或注释时可能引发不必要的大 diff；
- 如果顺手做业务重构，会增加回归定位成本；
- 文档更新如果脱离代码复核，容易再次造成计划与实现不一致。

### 不做事项

- 不做大规模重命名；
- 不做跨阶段业务功能；
- 不改导入导出、统计、配置服务中的合法 `UTSJSONObject` 边界；
- 不把文档收尾包装成“全项目弱类型清零”。

---

## 六、验证清单

### 6.1 静态搜索检查

每轮完成后建议搜索：

```text
UTSJSONObject
UTSJSONObject[]
['personId']
['personName']
['pointsUnits']
['deductedUnits']
['penaltyReason']
['penaltyId']
toBinWorkerPayload
parseCrossBinChangePayload
validateSessionData(
validateTypedSessionData
sessionDataToStorageJson
```

判定标准：

- 组件边界范围内不应再出现不必要的 legacy payload；
- storage、导入导出、配置解析、消息模板等边界层可以保留 `UTSJSONObject`；
- 旧兼容入口可以存在，但不应是核心录入页主路径。

### 6.2 编译验证

优先执行项目实际可用编译命令：

```bash
./compile-propoints-android.sh cycle
```

如当前环境不适合完整编译，可至少执行可用的轻量检查，并在交付说明中明确“文档变更未运行编译”或“代码变更已运行编译”。

### 6.3 页面加载回归

- [ ] 新建空页面打开正常；
- [ ] draft 页面打开正常；
- [ ] submitted 页面打开正常；
- [ ] 日期切换正常；
- [ ] 轮次切换正常；
- [ ] `isRestoring` 不会卡死。

### 6.4 编辑回归

- [ ] 选择仓位正常；
- [ ] 仓卡片工人编辑正常；
- [ ] 仓卡片曲量编辑正常；
- [ ] 仓卡片扣分展开、保存、取消正常；
- [ ] 晾堂四岗位显示、编辑、单人池联动正常；
- [ ] 堆曲岗位编辑正常；
- [ ] 跨仓人员、工分、来源预览正常；
- [ ] `occupiedIds` 去重和互斥正常。

### 6.5 保存 / 提交回归

- [ ] 自动保存正常；
- [ ] 备注修改立即保存正常；
- [ ] 日期切换前草稿保存正常；
- [ ] 轮次切换前草稿保存正常；
- [ ] 提交成功后可重新打开；
- [ ] 保存后重载数据与保存前一致；
- [ ] storage JSON 字段名仍为 snake_case。

### 6.6 校验回归

至少覆盖：

- [ ] 管理员姓名缺失；
- [ ] 仓位无人；
- [ ] 工分不平衡；
- [ ] 跨仓来源不完整；
- [ ] 微机禁用但存在数据；
- [ ] 堆曲工分不平衡；
- [ ] 人员重复分配；
- [ ] 扣分原因缺失；
- [ ] 扣分后最终分不为负。

### 6.7 运行日志检查

必须确认无新增：

- [ ] `ClassCastException`；
- [ ] `SessionPenaltyWorkerData cannot be cast to UTSJSONObject`；
- [ ] payload 字段缺失；
- [ ] null 字段异常；
- [ ] 日期切换或提交前后的 runtime warning。

---

## 七、推进原则

1. **边界优先**  
   storage DTO 与 page state 的字段转换只放在 adapter；组件 props / emits 只走共享 typed 协议。

2. **单一事实源**  
   页面每块业务数据只保留一个事实源。必要镜像只能作为组件输入，不允许成为保存或校验的第二事实源。

3. **小步提交**  
   每轮只改一个明确边界或一条明确链路，避免组件协议、adapter、Validator、storage 同时改动。

4. **先验证再扩散**  
   role-card、bin-card、cross-bin 等核心路径稳定后，才允许进入统计、导出、Phase 4 扩展。

5. **允许边界弱类型**  
   不追求全项目 `UTSJSONObject` 清零。storage、导入导出、配置解析、消息模板等天然边界可以继续使用弱类型。

6. **typed 主路径不可回退**  
   新增代码应默认使用 `SessionData`、`SessionEntryPageState`、`SessionWorkerData`、`SessionPenaltyWorkerData`、`CrossBinChangePayload` 等共享类型。

7. **历史兼容集中处理**  
   旧数据兼容只进入 adapter 或明确的兼容 wrapper，不允许重新散落到页面 methods 和规则层。

8. **运行验证与编译同等重要**  
   UTS / uvue 的部分问题只会在运行态暴露，尤其是 cast、payload、null 字段问题。

9. **不顺手重构**  
   每轮都有明确“不做事项”。发现额外问题先记录，除非阻塞当前验收，否则不顺手扩大范围。

10. **文档以代码复核为准**  
    旧计划文档中若存在“待做”但代码已完成的内容，应以只读复核结果更新判断，避免重复劳动。

---

## 八、建议下一步

第 1、2 轮核心收口已完成当前代码复核；后续进入 Phase 4 / 统计导出前，应继续遵守 typed 主路径准入：新增录入页逻辑以 `SessionData`、`EntryPageState`、`SessionWorkerData`、`SessionPenaltyWorkerData`、`CrossBinChangePayload` 等共享类型为准，storage DTO / 默认数据解析 / 导入导出 / 配置解析等边界允许保留 `UTSJSONObject`，但不得重新把 legacy payload 作为核心组件协议或保存 / 校验事实源。
