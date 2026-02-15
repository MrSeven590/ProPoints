# Storage Architecture

> 存储架构设计、分层访问规则与索引策略

---

## 分层访问规则

### 三层架构依赖关系

```
页面/组件层 (pages/**、components/**)
  ✅ → AppStore
  ❌ → storage-repository (禁止)
  ❌ → storage-keys (禁止)

domain/services 层
  ✅ → AppStore (推荐)
  ⚠️ → storage-repository (尽量避免，已有绕过需逐步收敛)
  ❌ → storage-keys (禁止)

AppStore 层 (domain/stores/AppStore.uts)
  ✅ → storage-repository (唯一推荐入口)

storage-repository 层
  ✅ → storage-keys (内部正常引用)

storage 内部模块 (init.uts、oplog.uts)
  ✅ → storage-repository (内部正常引用)
```

### 规则说明

| 层级 | 可引用 | 禁止引用 |
|------|--------|----------|
| `pages/**`、`components/**` | `AppStore.uts` | `storage-repository.uts`、`storage-keys.uts`、`StorageUnsafe.uts` |
| `domain/services/**` | `AppStore.uts`（推荐）<br>`StorageUnsafe.uts`（特殊场景） | `storage-keys.uts` |
| `domain/stores/AppStore.uts` | `storage-repository.uts` | — |
| `domain/stores/StorageUnsafe.uts` | `storage-repository.uts` | — |
| `storage/**` 内部 | `storage-repository.uts`、`storage-keys.uts` | — |

### StorageUnsafe 模块

**位置**: `domain/stores/StorageUnsafe.uts`

**用途**: 提供绕过 repository 约束的直接存储访问，仅用于无法通过 repository 标准 API 实现的特殊场景。

**API**:
- `loadData(key: string): UTSJSONObject | null` — 直接读取存储
- `saveData(key: string, data: UTSJSONObject): void` — 直接写入存储
- `listAllSessionKeys(): string[]` — 列出所有会话 key

**风险**:
- 绕过索引维护逻辑，可能导致数据不一致
- 使用错误的 key 可能覆盖或损坏数据
- 不受三层架构约束保护

**使用场景**:
- `PenaltyService.uts` — 扣分数据嵌套在 session 内部，需要直接读写 session key
- `BinService.uts` — 需要扫描所有会话 key 进行历史查询

**禁止场景**:
- 新代码禁止使用此模块
- pages/components 层禁止引用此模块
- 能通过 AppStore 标准 API 实现的场景禁止使用

### 历史绕过记录（已修复）

以下文件曾直接绕过架构，现已全部修复（2026-02-15）：

- `DuiQuBaseService.uts` — 使用 `uni.getStorageInfoSync()` 和原始 key 字符串 `:AN_QU:`
  - 修复：添加 `AppStore.findAnQuSessionByBinId()` 方法
- `BinService.uts` — 使用 `uni.getStorageInfoSync()` 和原始 key 前缀 `pp:session:`
  - 修复：通过 `StorageUnsafe.listAllSessionKeys()` 访问
- `AppStore.uts` — 暴露不安全的通用 API `loadData/saveData`
  - 修复：移动到 `StorageUnsafe.uts` 模块并添加警告文档
- `PenaltyService.uts` — 使用 `AppStore.loadData/saveData`
  - 修复：改为从 `StorageUnsafe.uts` 引用
- `findAnQuSessionByBinId()` — 缺少确定性的选择规则
  - 修复：实现确定性选择规则（submitted > draft，最新日期优先，最新 updated_at 优先）
- `getBinKojiCountsFromAnQu()` — 循环调用导致性能问题
  - 修复：添加批量方法 `findAnQuSessionsByBinIds()`，一次扫描返回所有结果

### 架构检查规则

**加强版验证命令（2026-02-15）：**

```bash
# 规则1：禁止直接使用 storage API（同步+异步）
rg "uni\.(getStorage|setStorage|removeStorage|clearStorage|getStorageInfo)" --glob "*.uts" --glob "*.uvue" --glob "!storage/**"

# 规则2：禁止使用原始 key 字符串
rg "pp:(session|idx|cfg|data):" --glob "*.uts" --glob "*.uvue" --glob "!storage/**"

# 规则3：禁止 pages/components 引用 StorageUnsafe
rg "StorageUnsafe\.uts" --glob "pages/**" --glob "components/**"
```

### 收敛策略

1. **新代码**：严格遵守分层规则，不得新增绕过
2. **存量代码**：逐步将 services/pages 中的 repository 调用迁移到 AppStore facade 方法
3. **不安全 API**：仅在无法通过 repository 标准 API 实现的特殊场景使用 `StorageUnsafe.uts`

---

## Key 设计

### Session Keys

**草稿 (Draft)**
```
Key: pp:session:${date}:${stage}:${round}:draft
索引: pp:idx:draft (全局)
```

**已提交 (Submitted)**
```
Key: pp:session:${date}:${stage}:${round}
索引: pp:idx:date:${date} (按日期)
```

### 设计原则

1. **Key 分离**: 草稿和已提交使用不同的 key,防止相互覆盖
2. **索引分离**: 草稿使用全局索引,已提交使用按日期索引
3. **职责清晰**: Repository API 明确区分 draft 和 submitted 操作

---

## Repository API

### Draft Operations

```typescript
// 保存草稿 (写入 draft key + 维护全局索引)
saveDraftSession(date, stageCode, roundId, sessionData)

// 加载会话 (优先 draft,不存在则 submitted)
loadSessionForEdit(date, stageCode, roundId)

// 删除草稿 (删除 draft key + 从全局索引移除)
deleteDraftSession(date, stageCode, roundId)

// 获取所有草稿 (从全局索引读取)
getAllDraftSessions()
```

### Submitted Operations

```typescript
// 保存已提交 (写入 submitted key + 维护日期索引 + 删除 draft)
saveSubmittedSession(date, stageCode, roundId, sessionData)

// 删除已提交 (删除 submitted key + 从日期索引移除)
deleteSession(date, stageCode, roundId)

// 按日期查询已提交
getSessionsByDate(date)
getSessionsByDateAndStage(date, stageCode)
```

---

## 索引维护

### 全局草稿索引 (pp:idx:draft)

**维护时机**:
- `saveDraftSession()` → 添加 draft key
- `saveSubmittedSession()` → 移除 draft key
- `deleteDraftSession()` → 移除 draft key

**查询场景**:
- 工作台草稿列表
- 草稿数量统计

### 按日期索引 (pp:idx:date:${date})

**维护时机**:
- `saveSubmittedSession()` → 添加 submitted key
- `deleteSession()` → 移除 submitted key

**查询场景**:
- 统计首页 (本月概览)
- 每日公示预览
- 按人员/按仓查询

---

## 关键约束

### 1. 防止数据覆盖

❌ **错误**: 草稿和已提交使用相同 key
```typescript
// 危险! 会覆盖已提交数据
saveData(getSessionKey(date, stage, round), draftData)
```

✅ **正确**: 使用不同的 key
```typescript
// 安全: 草稿和已提交分离
saveDraftSession(date, stage, round, draftData)
saveSubmittedSession(date, stage, round, submittedData)
```

### 2. 加载优先级

编辑会话时,优先加载草稿:
```typescript
loadSessionForEdit(date, stage, round) {
  // 1. 尝试加载 draft
  let data = loadData(getSessionDraftKey(...))
  if (data != null) return data

  // 2. 不存在则加载 submitted
  return loadData(getSessionKey(...))
}
```

### 3. 提交时清理草稿

提交时必须删除对应的草稿:
```typescript
saveSubmittedSession(...) {
  // 1. 保存 submitted
  saveData(getSessionKey(...), data)
  addToIndex(getDateIndexKey(date), key)

  // 2. 删除 draft (关键!)
  deleteDraftSession(date, stage, round)
}
```

---

## 历史教训

### Bug: 草稿覆盖已提交数据

**问题**:
- 草稿和已提交使用相同 key
- 自动保存会覆盖已提交数据
- 导致数据丢失和状态降级

**解决方案**:
- Key 分离: draft key 添加 `:draft` 后缀
- 索引分离: 草稿使用全局索引,已提交使用日期索引
- API 分离: 明确区分 draft 和 submitted 操作

**验证要点**:
1. 快捷入口编辑已提交记录 → 自动保存不覆盖
2. 提交草稿 → 草稿正确删除
3. 统计查询 → 只显示已提交

### Bug: 晾堂功能关键问题修复 (2026-02-13)

**问题 1: 微机权限判断错误**
- 使用 `isMicroEnabledForCurrentRound()` 基于当前轮次
- 编辑历史会话时会使用错误的权限状态
- `microEnabled` 不会在页面显示/轮次变化时刷新

**解决方案**:
- 添加 `isMicroEnabledByRoundId(roundId)` 方法
- `initLiangTangSection()` 使用会话的 `roundId` 而非当前轮次
- `loadExistingSession()` 加载会话后刷新 `microEnabled`

**问题 2: 默认人员 Key 缺少班级号**
- 使用 `pp:cfg:liangtang-default` (全局)
- 多班级场景会冲突

**解决方案**:
- 修改为 `pp:cfg:liangtang-default:{classNo}`
- 所有调用处传入 `classNo` 参数

**问题 3: 晾堂工分计算公式错误**
- 使用 `/20` 作为基数
- 正确公式应为 `/160`

**解决方案**:
- `calcLiangTangPoolUnits()` 改为 `floor1(曲坯数/160 × 系数) × 10`

**验证要点**:
1. 编辑历史会话 → 微机权限正确
2. 多班级场景 → 默认人员不冲突
3. 晾堂工分计算 → 使用正确公式

---

## 性能考虑

### 草稿索引选择

**全局索引 vs 按日期索引**:

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| 全局索引 | 一次读取,性能可预测 | 单 key 可能增长 | 草稿数量有限 |
| 按日期索引 | 避免单 key 过大 | 需要聚合多个索引 | 数据量极大 |

**选择**: 草稿使用全局索引
- 草稿数量通常不大 (用户会定期提交/删除)
- 1MB 限制风险极低
- 代码更简单,性能更好

### 已提交索引选择

**选择**: 已提交使用按日期索引
- 按日期查询是主要场景
- 避免单个索引无限增长
- 统计查询性能更好

---

## 系数版本化存储 (2026-02-15)

### 背景

系数配置需要版本化管理，防止修改系数导致历史数据漂移。每个会话绑定创建时的系数快照，确保历史数据永远使用当时的系数。

### Key 设计

| Key | 用途 | 示例 |
|-----|------|------|
| `pp:cfg:coef-set:{setId}` | 单个系数版本数据 | `pp:cfg:coef-set:1` |
| `pp:idx:coef-sets` | 所有版本 ID 列表 | `[1, 2, 3]` |
| `pp:cfg:active-coef-set` | 当前生效版本 ID | `{ setId: 2 }` |
| `pp:cfg:coef` | 旧版配置（兼容） | 已废弃，保留用于迁移 |

### CoefSet 数据结构

```typescript
type CoefSet = {
  id: number
  name: string                    // 如 "系数版本 v1"
  effectiveFrom: number           // 生效时间戳
  effectiveTo: number | null      // 失效时间戳（null 表示当前生效）
  stages: UTSJSONObject           // 工序系数 { AN_QU: 1.1, ... }
  liangTang: UTSJSONObject        // 晾堂岗位系数 { WHEAT_MATERIAL: 0.85, ... }
}
```

### Repository API

```typescript
// 保存系数版本
saveCoefSet(setId: number, coefSet: UTSJSONObject): void

// 加载系数版本
loadCoefSet(setId: number): UTSJSONObject | null

// 获取所有版本 ID
getAllCoefSetIds(): number[]

// 保存/加载当前生效版本 ID
saveActiveCoefSetId(setId: number): void
loadActiveCoefSetId(): number | null
```

### AppStore API

```typescript
// 创建新版本（自动生成 ID 和名称）
createCoefSetVersion(name: string, coefData: UTSJSONObject): number

// 获取当前生效版本 ID
getActiveCoefSetId(): number

// 设置生效版本
setActiveCoefSet(setId: number): void

// 获取所有版本
getAllCoefSets(): UTSJSONObject[]

// 加载指定版本
loadCoefSetById(setId: number): UTSJSONObject | null
```

### Snapshot-First 策略

系数计算采用 **snapshot-first** 策略，优先从会话绑定的快照读取：

```typescript
// StageCoefService 新增函数
getStageCoefFromSnapshot(stageCode, snapshot)        // 从快照读取工序系数
getLiangTangRoleCoefFromSnapshot(roleCode, snapshot) // 从快照读取晾堂系数

// ScoreCalculator 支持 snapshot 参数
calcLiangTangPoolUnits(dailyCount, roleCode, coefSnapshot, coefSetId)
```

**优先级**：
1. `coefSnapshot` (会话绑定的快照)
2. `coefSetId` (版本化存储)
3. 硬编码默认值

### 会话数据结构变更

```typescript
// StageSession 新增字段
{
  coef_set_id: number | null      // 系数版本 ID
  coef_snapshot: UTSJSONObject | null  // 完整系数快照
}
```

### 只读模式

已提交会话默认进入只读模式，防止"回看就生成草稿"：

- `viewMode: 'view' | 'edit'` - 视图模式
- `isRestoring: boolean` - 数据恢复期间标志
- 子组件通过 `readonly` prop 禁用交互
- 点击"进入编辑"显式生成草稿

### 验证要点

1. **修改系数** → 生成新版本，历史数据不变
2. **新建会话** → 绑定当前生效版本 + 保存快照
3. **回看历史** → 使用会话绑定的快照计算
4. **只读模式** → 无法编辑，不生成草稿
5. **进入编辑** → 显式生成草稿

---

## 最佳实践

1. **始终使用 Repository API**: 不要直接操作 storage
2. **提交时删除草稿**: 避免残留草稿
3. **加载时优先草稿**: 支持"编辑已提交"场景
4. **索引与数据同步**: 维护索引时同步更新数据
5. **防御性编程**: 读取索引时过滤 null 数据
6. **系数 Snapshot-First**: 计算时优先使用会话绑定的快照，防止历史漂移
