# Phase 2 Implementation Guide

## 总体策略说明

Phase 2 的目标不是一次性“清零所有 UTSJSONObject”，而是把 `entry.uvue -> Validator -> Storage` 的核心数据流改造成“内部强类型、边界弱类型”的结构。

建议遵循以下原则：

1. 先建 adapter，再动页面和校验器。
2. 先收敛读链，再收敛写链。
3. 页面内部只保留一种业务真相，不再并存 `Map + 弱类型数组` 双轨状态。
4. 所有历史数据兼容逻辑集中到 adapter，不散落在页面 methods 中。
5. 每个 commit 都必须满足：可编译、关键路径可手动验证、失败时可局部回滚。

推荐提交顺序：

1. `feat(session): add session adapter skeleton`
2. `refactor(entry): route load flow through typed adapter`
3. `refactor(entry): apply typed page state`
4. `refactor(entry): unify page field types`
5. `refactor(entry): route save flow through SessionData`
6. `refactor(validator): add typed validation entry and compatibility wrapper`
7. `chore(session): cleanup names and residual weak typing`

---

## Commit 1: 新增 session adapter 骨架

### 目标

先把“字段转换职责”从页面和 Validator 中抽离出来，建立后续重构的稳定落点。

### 修改文件

- `domain/services/session-adapter.uts`（新建）
- `domain/models/session.uts`（如需要补充上下文类型）
- `domain/models/index.uts`（如需要导出）

### 具体改造步骤

#### 1. 先加最小导出函数签名

先新增函数签名和空实现，不马上替换调用方：

```ts
export function storageJsonToSessionData(raw: UTSJSONObject): SessionData {
  // 第一版允许保留兼容兜底
}

export function sessionDataToStorageJson(data: SessionData): UTSJSONObject {
}

export function sessionDataToEntryPageState(
  data: SessionData,
  options: SessionEntryStateBuildOptions
): SessionEntryPageState {
}

export function entryPageStateToSessionData(
  state: SessionEntryPageState,
  options: SessionDataBuildOptions
): SessionData {
}
```

#### 2. 先从现有代码搬运“纯字段映射”

优先搬运最稳定的部分：

- bins 的 snake_case <-> camelCase 映射
- cross_bin 的字段映射
- liang_tang 的 role map 构造
- dui_qu 的字段映射

#### 3. 暂时不要碰页面调用方

本 commit 只建能力，不换入口。

### 先删什么

- 不删现有逻辑
- 不改 `entry.uvue`
- 不改 `Validator.uts` 调用入口

### 后加什么

- 新增 adapter 文件
- 新增必要的 options 类型

### 关键代码示例

#### adapter 中处理历史字段兼容

```ts
const savedSnapshot = raw['coef_snapshot'] as UTSJSONObject | null
const binsRaw = raw['bins'] as UTSJSONObject[] | null

return {
  session_date: (raw['session_date'] as string | null) ?? '',
  class_no: (raw['class_no'] as number | null) ?? 0,
  stage_code: ((raw['stage_code'] as string | null) ?? 'AN_QU') as StageCode,
  round_id: raw['round_id'] as number | null,
  coef_set_id: (raw['coef_set_id'] as number | null) ?? DEFAULT_COEF_SET_ID,
  coef_snapshot: savedSnapshot,
  bins: parseBins(binsRaw),
  cross_bin: parseCrossBin(raw['cross_bin'] as UTSJSONObject | null),
  liang_tang: parseLiangTang(raw['liang_tang'] as UTSJSONObject | null),
  dui_qu: parseDuiQu(raw['dui_qu'] as UTSJSONObject | null),
  status: ((raw['status'] as string | null) ?? 'draft') as SessionStatus,
  remark: (raw['remark'] as string | null) ?? '',
  session_bonus_units: (raw['session_bonus_units'] as number | null) ?? 0,
  created_by_manager: (raw['created_by_manager'] as string | null) ?? '',
  updated_by_manager: (raw['updated_by_manager'] as string | null) ?? ''
} as SessionData
```

### 验证检查点

- 文件可编译
- 新增函数均可被 import
- 对空对象、旧草稿对象、完整对象调用不会抛异常

### 回滚方案

- 只删除 `domain/services/session-adapter.uts`
- 回退 `domain/models/index.uts` 的导出修改
- 对主流程无侵入，回滚成本最低

---

## Commit 2: 读链改造 - buildStateForDate 接入 adapter

### 目标

把页面“读取 session 并转页面态”的核心逻辑从手动拆字段切换为 adapter 驱动。

### 修改文件

- `pages/work/entry.uvue`
- `domain/services/session-adapter.uts`

### 重点函数

- `buildStateForDate`
- `onLoad`
- `performSwitchDate`
- `performSwitchRound`

### 具体改造步骤

#### 1. 先保留旧签名，内部改实现

第一步不要立刻改签名，先把内部实现替换掉：

```ts
buildStateForDate(date: string): UTSJSONObject {
  const raw = loadSessionForEdit(date, this.stageCode, roundId)
  if (raw == null) {
    return this.buildDefaultEntryState(date) as unknown as UTSJSONObject
  }

  const session = storageJsonToSessionData(raw)
  const state = sessionDataToEntryPageState(session, {
    stageCode: this.stageCode,
    roundId: this.roundId,
    defaultCrossBinRoleCode: this.crossBinRoleCode,
    defaultCrossBinRoleName: this.crossBinRoleName,
    microEnabled: this.microEnabled,
    managerName: getManagerName().trim()
  })

  return state as unknown as UTSJSONObject
}
```

#### 2. 验证无误后再改强类型返回值

第二步再改为：

```ts
buildStateForDate(date: string): SessionEntryPageState
```

#### 3. 默认新建状态抽成 helper

把当前大段“无 roundId / 无已有数据”的默认构造抽成：

```ts
buildDefaultEntryState(date: string): SessionEntryPageState
```

### 先删什么

- 删除 `buildStateForDate` 内部手动解析 `bins/cross_bin/liang_tang/dui_qu` 的大段逻辑
- 删除在该函数内对旧字段逐个 `state['xxx'] = ...` 的写法

### 后加什么

- 增加 `buildDefaultEntryState`
- 增加 adapter 调用

### 关键代码示例

#### 默认页面态 helper

```ts
buildDefaultEntryState(date: string): SessionEntryPageState {
  return {
    hasData: false,
    sessionDate: date,
    coefSetId: loadActiveCoefSetId() ?? DEFAULT_COEF_SET_ID,
    coefSnapshot: loadCoefSet(loadActiveCoefSetId() ?? DEFAULT_COEF_SET_ID),
    selectedBins: [],
    stageBinInfos: [],
    binCardsData: new Map<number, EntryBinCardState>(),
    showCrossBinSection: stageHasCrossBinRole(this.stageCode),
    crossBinRoleCode: this.crossBinRoleCode,
    crossBinPersonId: null,
    crossBinPersonName: '',
    crossBinPointsUnits: 0,
    crossBinSources: [],
    liangTangRolesData: new Map<string, LiangTangRoleData>(),
    wheatMaterialWorkers: [],
    machineGuardWorkers: [],
    kojiUnloaderWorkers: [],
    microOperatorWorkers: [],
    duiQuWorkers: [],
    duiQuTotalKojiCount: 0,
    duiQuTotalPoolUnits: 0,
    sessionStatus: 'draft',
    viewMode: 'edit',
    sessionRemark: '',
    sessionBonusUnits: 0,
    createdByManager: getManagerName().trim(),
    updatedByManager: getManagerName().trim(),
    occupiedIds: [],
    missingAnQuBins: []
  } as SessionEntryPageState
}
```

### 验证检查点

- 新建页面打开正常
- 已有 draft 正常回填
- 已有 submitted 正常只读显示
- 日期切换不报错
- 轮次切换不报错

### 回滚方案

- 回退 `buildStateForDate` 到原手动解析版本
- adapter 文件保留，不影响后续继续尝试

---

## Commit 3: applyState 改为强类型页面态

### 目标

让页面状态应用逻辑彻底摆脱 `UTSJSONObject` 下标访问。

### 修改文件

- `pages/work/entry.uvue`

### 重点函数

- `applyState`

### 具体改造步骤

#### 1. 改函数签名

```ts
applyState(nextState: SessionEntryPageState) {
```

#### 2. 逐项替换下标访问

把：

```ts
this.sessionDate = nextState['sessionDate'] as string
```

替换为：

```ts
this.sessionDate = nextState.sessionDate
```

#### 3. 派生逻辑保留在 applyState 尾部

保留：

- `updateOccupiedIds()`
- `recalculateCrossBinSources()`
- `updateLiangTangPoolCache()`
- `updateDuiQuPoolCache()`

### 先删什么

- 删除 `nextState['xxx']` 全部下标访问
- 删除不必要的 `as string` / `as number` 断言

### 后加什么

- 强类型属性访问

### 关键代码示例

```ts
applyState(nextState: SessionEntryPageState) {
  try {
    this.isRestoring = true

    this.sessionDate = nextState.sessionDate
    this.tempDate = nextState.sessionDate
    this.coefSetId = nextState.coefSetId
    this.coefSnapshot = nextState.coefSnapshot
    this.selectedBins = nextState.selectedBins
    this.stageBinInfos = nextState.stageBinInfos
    this.binCardsData = nextState.binCardsData
    this.missingAnQuBins = nextState.missingAnQuBins

    this.showCrossBinSection = nextState.showCrossBinSection
    this.crossBinRoleCode = nextState.crossBinRoleCode
    this.crossBinPersonId = nextState.crossBinPersonId
    this.crossBinPersonName = nextState.crossBinPersonName
    this.crossBinPointsUnits = nextState.crossBinPointsUnits
    this.crossBinSources = nextState.crossBinSources

    this.liangTangRolesData = nextState.liangTangRolesData
    this.wheatMaterialWorkers = nextState.wheatMaterialWorkers
    this.machineGuardWorkers = nextState.machineGuardWorkers
    this.kojiUnloaderWorkers = nextState.kojiUnloaderWorkers
    this.microOperatorWorkers = nextState.microOperatorWorkers

    this.duiQuWorkers = nextState.duiQuWorkers
    this.duiQuTotalKojiCount = nextState.duiQuTotalKojiCount
    this.duiQuTotalPoolUnits = nextState.duiQuTotalPoolUnits

    this.sessionStatus = nextState.sessionStatus
    this.viewMode = nextState.viewMode
    this.sessionRemark = nextState.sessionRemark
    this.sessionBonusUnits = nextState.sessionBonusUnits
    this.createdByManager = nextState.createdByManager
    this.updatedByManager = nextState.updatedByManager

    this.updateOccupiedIds()
    this.recalculateCrossBinSources()
  } finally {
    this.isRestoring = false
  }
}
```

### 验证检查点

- `onLoad` 后页面渲染正常
- 日期切换后数据完整
- 切换轮次后数据完整
- `isRestoring` 没有卡死

### 回滚方案

- 仅回滚 `applyState` 签名和内部属性访问
- 读链 adapter 仍可保留

---

## Commit 4: 页面字段类型统一，移除本地重复弱类型

### 目标

让页面内部状态和共享模型对齐，减少“双份真相”。

### 修改文件

- `pages/work/entry.uvue`
- `domain/models/session.uts`（如需补字段）
- `domain/models/ferment.uts`
- `domain/models/assignment.uts`

### 重点函数与区域

- 本地 type 定义区
- `data()` 返回对象中的类型标注
- `loadLiangTangDefaults`
- `loadLiangTangDefaultsForNewSession`
- `loadDuiQuDefaultsForNewSession`
- `getBinWorkers`
- `onDuiQuRoleChange`
- `onLiangTangRoleChange`
- `onBinCardChange`

### 具体改造步骤

#### 1. 先删页面本地重复 type

删除：

- `type BinWorkerData`
- `type BinCardData`
- `type LiangTangWorkerData`
- `type LiangTangRoleData`

改为 import 共享类型。

#### 2. 把页面核心状态改成强类型

把：

```ts
wheatMaterialWorkers: [] as UTSJSONObject[]
machineGuardWorkers: [] as UTSJSONObject[]
kojiUnloaderWorkers: [] as UTSJSONObject[]
microOperatorWorkers: [] as UTSJSONObject[]
duiQuWorkers: [] as UTSJSONObject[]
```

改成：

```ts
wheatMaterialWorkers: [] as SessionWorkerData[]
machineGuardWorkers: [] as SessionWorkerData[]
kojiUnloaderWorkers: [] as SessionWorkerData[]
microOperatorWorkers: [] as SessionWorkerData[]
duiQuWorkers: [] as DuiQuWorkerData[]
```

#### 3. 如果组件暂时还吃弱类型，边界再转

例如 `getBinWorkers`：

```ts
getBinWorkers(stageBinId: number): SessionPenaltyWorkerData[] {
  const cardData = this.binCardsData.get(stageBinId)
  return cardData != null ? cardData.workers : []
}
```

如果组件必须吃旧 payload，再单独做输出转换 helper：

```ts
toLegacyWorkerPayload(workers: SessionPenaltyWorkerData[]): UTSJSONObject[]
```

### 先删什么

- 删除页面本地重复类型
- 删除页面内部把强类型先转成 `UTSJSONObject[]` 再存回状态的逻辑

### 后加什么

- 统一 import 共享类型
- 必要时增加 `toLegacy...` helper，仅用于组件边界

### 关键代码示例

```ts
import type {
  EntryBinCardState,
  SessionEntryPageState,
  DuiQuWorkerData,
  LiangTangRoleData
} from '../../domain/models/session.uts'
import type {
  SessionWorkerData,
  SessionPenaltyWorkerData
} from '../../domain/models/assignment.uts'
```

```ts
onDuiQuRoleChange(data: UTSJSONObject) {
  const workers = data['workers'] as UTSJSONObject[] | null
  if (workers != null) {
    const nextWorkers: DuiQuWorkerData[] = []
    for (let i = 0; i < workers.length; i++) {
      const w = workers[i]
      nextWorkers.push({
        personId: w['personId'] as number | null,
        personName: (w['personName'] as string | null) ?? '',
        pointsUnits: (w['pointsUnits'] as number | null) ?? 0,
        positionIndex: (w['positionIndex'] as number | null) ?? i + 1
      } as DuiQuWorkerData)
    }
    this.duiQuWorkers = nextWorkers
  }
}
```

### 验证检查点

- 搜索页面内部 `UTSJSONObject[]` 数量明显下降
- 晾堂岗位编辑正常
- 堆曲岗位编辑正常
- 仓卡片回填正常
- `occupiedIds` 计算正常

### 回滚方案

- 回滚页面类型定义和 `data()` 类型声明
- 保留 adapter 和读链改造
- 必要时仅恢复组件边界映射

---

## Commit 5: 写链改造 - buildSessionData 返回 SessionData

### 目标

把页面保存链改成 `PageState -> SessionData -> StorageJson`，避免每个入口直接拼 JSON。

### 修改文件

- `pages/work/entry.uvue`
- `domain/services/session-adapter.uts`

### 重点函数

- `buildSessionData`
- `flushDraftIfNeeded`
- `flushDraftIfNeededWithRound`
- `submit`
- `doSubmit`
- `doAutoSave`

### 具体改造步骤

#### 1. 先改 `buildSessionData` 返回 `SessionData`

```ts
buildSessionData(status: SessionStatus): SessionData {
  return entryPageStateToSessionData(this.captureCurrentEntryState(status), {
    stageCode: this.stageCode,
    stageName: this.stageName,
    roundId: this.roundId,
    coefSetId: this.coefSetId,
    coefSnapshot: this.coefSnapshot,
    managerName: getManagerName().trim()
  })
}
```

#### 2. 增加 `captureCurrentEntryState`

把当前页面字段组装成统一 `SessionEntryPageState`：

```ts
captureCurrentEntryState(status: SessionStatus): SessionEntryPageState {
  return {
    hasData: true,
    sessionDate: this.sessionDate,
    coefSetId: this.coefSetId,
    coefSnapshot: this.coefSnapshot,
    selectedBins: this.selectedBins,
    stageBinInfos: this.stageBinInfos,
    binCardsData: this.binCardsData,
    showCrossBinSection: this.showCrossBinSection,
    crossBinRoleCode: this.crossBinRoleCode,
    crossBinPersonId: this.crossBinPersonId,
    crossBinPersonName: this.crossBinPersonName,
    crossBinPointsUnits: this.crossBinPointsUnits,
    crossBinSources: this.crossBinSources,
    liangTangRolesData: this.liangTangRolesData,
    wheatMaterialWorkers: this.wheatMaterialWorkers,
    machineGuardWorkers: this.machineGuardWorkers,
    kojiUnloaderWorkers: this.kojiUnloaderWorkers,
    microOperatorWorkers: this.microOperatorWorkers,
    duiQuWorkers: this.duiQuWorkers,
    duiQuTotalKojiCount: this.duiQuTotalKojiCount,
    duiQuTotalPoolUnits: this.duiQuTotalPoolUnits,
    sessionStatus: status,
    viewMode: this.viewMode,
    sessionRemark: this.sessionRemark,
    sessionBonusUnits: this.sessionBonusUnits,
    createdByManager: this.createdByManager,
    updatedByManager: this.updatedByManager,
    occupiedIds: this.occupiedIds,
    missingAnQuBins: this.missingAnQuBins
  } as SessionEntryPageState
}
```

#### 3. 所有保存入口统一先序列化

把：

```ts
const sessionData = this.buildSessionData('draft')
saveDraftSession(date, this.stageCode, roundId, sessionData)
```

改成：

```ts
const session = this.buildSessionData('draft')
const raw = sessionDataToStorageJson(session)
saveDraftSession(date, this.stageCode, roundId, raw)
```

### 先删什么

- 删除 `buildSessionData` 里直接拼 `UTSJSONObject` 的逻辑
- 删除每个保存入口各自手工构造 JSON 的可能分叉

### 后加什么

- `captureCurrentEntryState`
- 统一序列化调用

### 验证检查点

- 自动保存正常
- 日期切换前保存正常
- 轮次切换前保存正常
- 提交后可重新加载
- 保存出的结构字段名仍然是 snake_case

### 回滚方案

- 回滚 `buildSessionData` 到 JSON 拼装版本
- adapter 读链和页面类型统一可先保留

---

## Commit 6: Validator 双入口

### 目标

让规则引擎主流程吃强类型 `SessionData`，同时保留旧入口兼容现有调用方。

### 修改文件

- `domain/services/Validator.uts`
- `domain/services/session-adapter.uts`

### 重点函数

- `normalizeSessionData`
- `validateSessionData`
- 新增 `validateTypedSessionData`

### 具体改造步骤

#### 1. 先把现有标准化函数改成“吃 SessionData”

```ts
function normalizeTypedSessionData(data: SessionData): NormalizedSessionData {
}
```

#### 2. 保留旧入口包装

```ts
export function validateSessionData(
  raw: UTSJSONObject,
  ctx: ValidationContext
): ValidationResult {
  const session = storageJsonToSessionData(raw)
  return validateTypedSessionData(session, ctx)
}
```

#### 3. 新增主入口

```ts
export function validateTypedSessionData(
  data: SessionData,
  ctx: ValidationContext
): ValidationResult {
  const normalized = normalizeTypedSessionData(data)
  const runtime = buildRuntimeContext(normalized)
  const rules = sortRulesByCategory(getRulesForMode(ctx.mode))
  // ...
}
```

#### 4. 移除规则层对页面 camelCase worker 字段的依赖

规则层只认 DTO：

- `person_id`
- `points_units`
- `deducted_units`
- `position_index`

### 先删什么

- 删除 `normalizeSessionData(raw)` 中页面层字段兼容散点逻辑
- 删除对 `personId` / `pointsUnits` 的直接解析依赖

### 后加什么

- typed 主入口
- raw 兼容包装入口

### 关键代码示例

```ts
function normalizeTypedSessionData(data: SessionData): NormalizedSessionData {
  const bins: NormalizedBin[] = []
  for (let i = 0; i < data.bins.length; i++) {
    const bin = data.bins[i]
    const workers: NormalizedWorker[] = []
    for (let j = 0; j < bin.workers.length; j++) {
      const worker = bin.workers[j]
      workers.push({
        person_id: worker.person_id,
        person_name: worker.person_name,
        points_units: worker.points_units,
        deducted_units: worker.deducted_units,
        penalty_reason: worker.penalty_reason,
        penalty_id: worker.penalty_id,
        position_index: worker.position_index
      } as NormalizedWorker)
    }
    bins.push({
      bin_id: bin.bin_id,
      stage_bin_id: bin.stage_bin_id,
      bin_code: bin.bin_code,
      koji_count: bin.koji_count,
      total_points_units: bin.total_points_units,
      workers: workers
    } as NormalizedBin)
  }

  return {
    status: data.status,
    session_date: data.session_date,
    stage_code: data.stage_code,
    stage_name: '',
    round_id: data.round_id,
    coef_set_id: data.coef_set_id,
    created_by_manager: data.created_by_manager,
    updated_by_manager: data.updated_by_manager,
    remark: data.remark,
    bins: bins,
    cross_bin: normalizeCrossBin(data.cross_bin),
    liang_tang: normalizeLiangTang(data.liang_tang),
    dui_qu: normalizeDuiQu(data.dui_qu),
    session_bonus_units: data.session_bonus_units
  } as NormalizedSessionData
}
```

### 验证检查点

- `submit()` 仍能触发校验
- 直接传 `SessionData` 给 typed 入口结果正确
- 旧入口和新入口对同一份数据返回一致
- 微机/跨仓/堆曲规则结果不变

### 回滚方案

- 保留 `validateTypedSessionData`
- 若发现问题，暂时把 `validateSessionData` 恢复为旧 raw 逻辑
- 页面写链仍可保留 `SessionData -> StorageJson`

---

## Commit 7: 清理命名和残余弱类型

### 目标

收尾并清除“Phase 2 已完成但代码里仍像没完成”的残留。

### 修改文件

- `pages/work/entry.uvue`
- `domain/services/Validator.uts`
- `domain/services/session-adapter.uts`

### 具体改造步骤

#### 1. 统一命名

如果要和设计文档一致，可在此时改名：

- `buildStateForDate` -> `buildStateFromSessionDataForDate` 或保留原名
- `buildSessionData` -> `buildSessionDataFromState`

不建议中途多次改名。

#### 2. 搜索残余弱类型

重点搜索：

- `UTSJSONObject`
- `UTSJSONObject[]`
- `['personId']`
- `['pointsUnits']`
- `['deductedUnits']`
- `as UTSJSONObject`

#### 3. 仅保留边界层弱类型

允许残留的位置：

- storage 读取入口
- 组件临时兼容边界
- coef snapshot 如暂时未强类型化

### 验证检查点

- 编译通过
- 核心页面加载/编辑/提交通过
- 弱类型仅留在边界

### 回滚方案

- 该 commit 可整包回滚
- 不应影响前面核心结构

---

## 验证检查清单

### A. 编译检查

每个关键 commit 后都执行：

```bash
npm run build
```

如果项目不是 npm build，则执行实际可用的编译命令。

### B. 页面加载回归

- 新建空页面打开正常
- draft 页面打开正常
- submitted 页面打开正常
- 日期切换正常
- 轮次切换正常

### C. 编辑回归

- 选择仓位正常
- 仓卡片工人编辑正常
- 晾堂岗位编辑正常
- 堆曲岗位编辑正常
- 跨仓岗位编辑正常
- `occupiedIds` 去重正常

### D. 保存回归

- 自动保存正常
- 备注修改立即保存正常
- 日期切换前草稿保存正常
- 轮次切换前草稿保存正常
- 提交成功后可重新打开

### E. 校验回归

至少验证以下场景：

- 管理员姓名缺失
- 仓位无人
- 工分不平衡
- 跨仓来源不完整
- 微机禁用但有数据
- 堆曲工分不平衡
- 人员重复分配

---

## 风险应对方案

### 1. 历史数据兼容

处理原则：

- 所有旧数据兼容逻辑集中在 `storageJsonToSessionData`
- 页面和 Validator 不自行兜底旧字段

应对动作：

- 为 `cross_bin/liang_tang/dui_qu` 提供空值兼容
- 对 `enabled == null` 的历史数据保留旧行为
- 对缺失的 manager/coefficient/remark 做默认值补齐

失败信号：

- 历史草稿打不开
- 切换日期时报字段为空异常

止损方案：

- 保留 Commit 1 adapter 骨架
- 暂时回退 Commit 2 读链切换

### 2. 字段命名混用

处理原则：

- storage DTO 永远 snake_case
- page state 永远 camelCase
- 命名转换只允许发生在 adapter 和必要的组件边界

应对动作：

- 任何 `entry.uvue` 内出现 `person_id` 都要警惕是否越层
- 任何 `Validator` 内出现 `personId` 都要警惕是否没收口

失败信号：

- 保存出的 JSON 结构字段名漂移
- Validator 读不到新结构字段

止损方案：

- 保留 typed 结构
- 恢复 raw wrapper 中的兼容映射

### 3. Map 与数组双轨状态

处理原则：

- 每块业务数据只保留一个事实源

建议事实源：

- bin: `binCardsData`
- 晾堂: `liangTangRolesData`
- 堆曲: `duiQuWorkers`

应对动作：

- `wheatMaterialWorkers` 等如必须保留，只作为组件输入镜像，不作为独立真相
- `applyState` 中统一从强类型 state 设置它们
- `captureCurrentEntryState` 不从镜像反推业务真相，尽量从事实源取数

失败信号：

- 页面显示对，但保存后重载错
- 改 A 区域，B 区域未同步

止损方案：

- 回到“事实源优先”策略
- 暂时让镜像在 `applyState` 时重建，避免双向写

### 4. 提交流程回归

处理原则：

- 所有保存与提交共用同一条序列化路径

应对动作：

- 统一走：`captureCurrentEntryState -> buildSessionData -> sessionDataToStorageJson`
- 不允许 `submit` 和 `doAutoSave` 各自拼自己的 JSON

失败信号：

- 自动保存成功但提交失败
- 提交通过但重载数据异常
- 日期切换保存出来的结构和手动提交结构不一致

止损方案：

- 临时恢复 `buildSessionData` 旧实现
- 保留读链和页面强类型改造不动

---

## 最终完成标准

满足以下条件，才算 Phase 2 完成：

1. `buildStateForDate` 返回 `SessionEntryPageState`
2. `applyState` 接受 `SessionEntryPageState`
3. 页面核心状态不再以 `UTSJSONObject[]` 作为主要业务类型
4. `buildSessionData` 返回 `SessionData`
5. `saveDraftSession/saveSubmittedSession` 前统一经过 `sessionDataToStorageJson`
6. `Validator` 具备 `SessionData` typed 主入口和 raw 兼容入口
7. 历史草稿、自动保存、提交、日期切换、轮次切换均回归通过
