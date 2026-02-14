# AppStore Facade 收敛重构

## Goal

将所有绕过 AppStore 直接访问 `storage-repository.uts` 或 `storage-keys.uts` 的代码收敛到 AppStore facade 层，确保三层存储架构的完整性。

## Background

项目采用三层存储架构：
- **storage-keys.uts** — Key 生成/解析
- **storage-repository.uts** — 封装 uni.*Storage 读写、索引维护
- **AppStore.uts** — 向 domain/UI 暴露统一入口（Facade）

**架构规则**：
- pages/components 只能调用 AppStore
- domain/services 推荐调用 AppStore
- 禁止直接引用 repository 和 keys

## Requirements

### Batch 1 (P0): pages/components 收敛

**在 AppStore 新增以下 facade 方法**：

**会话操作**：
- `saveDraftSession(date, stageCode, roundId, sessionData)`
- `saveSubmittedSession(date, stageCode, roundId, sessionData)`
- `loadSessionForEdit(date, stageCode, roundId)`
- `deleteDraftSession(date, stageCode, roundId)`
- `getSessionsByDate(date)`
- `getAllDraftSessions()`
- `getSessionsByDateAndStage(date, stageCode)`

**量塘默认值**：
- `saveLiangTangDefault(classNo, defaults)`
- `loadLiangTangDefault(classNo)`

**人员数据**：
- `loadPersons()`
- `savePersons(persons)`

**修改以下文件的 import**：
- `pages/work/entry.uvue` → 从 AppStore 导入
- `pages/index/index.uvue` → 从 AppStore 导入
- `pages/stats/index.uvue` → 从 AppStore 导入（移除 storage-keys 引用）
- `pages/stats/person-detail.uvue` → 从 AppStore 导入
- `pages/stats/date-detail.uvue` → 从 AppStore 导入
- `pages/stats/bin-detail.uvue` → 从 AppStore 导入
- `pages/mine/roster-import.uvue` → 从 AppStore 导入
- `components/biz-worker-selector-pinyin/biz-worker-selector-pinyin.uvue` → 从 AppStore 导入

### Batch 2 (P1): domain/services 收敛

**在 AppStore 新增以下 facade 方法**：

**轮次数据**：
- `loadRounds()`
- `saveRounds(rounds)`
- `loadRoundConfig()`
- `saveRoundConfig(config)`

**系数与默认值**：
- `loadCoefConfig()`
- `loadStageRoleDefaults()`

**修改以下文件的 import**：
- `domain/services/RoundService.uts` → 从 AppStore 导入
- `domain/services/StageCoefService.uts` → 从 AppStore 导入
- `domain/services/DuiQuBaseService.uts` → 从 AppStore 导入（使用已有的 `getSessionsByDateAndStage`）

## Acceptance Criteria

- [ ] AppStore 新增了所有需要的 facade 方法（Batch 1 + Batch 2）
- [ ] 所有 pages/components 只从 AppStore 导入存储方法
- [ ] 所有列出的 domain/services 只从 AppStore 导入存储方法
- [ ] 验证命令通过：
  - `rg "storage-repository\.uts" --glob "pages/**" --glob "components/**"` → 无匹配
  - `rg "storage-keys\.uts" --glob "pages/**" --glob "components/**"` → 无匹配
  - `rg "storage-repository\.uts" domain/services/RoundService.uts domain/services/StageCoefService.uts domain/services/DuiQuBaseService.uts` → 无匹配
- [ ] 代码编译通过（uni_modules 编译成功）
- [ ] 遵循 AppStore 命名规范：`get/set/load/save{EntityName}`

## Technical Notes

**命名一致性**：
- 读取操作：`get{EntityName}()` 或 `load{EntityName}()`
- 写入操作：`set{EntityName}(value)` 或 `save{EntityName}(data)`
- 删除操作：`delete{EntityName}()`

**实现模式**：
- 从 `storage-repository.uts` import 底层函数（使用别名避免命名冲突）
- 薄封装，直接调用底层函数
- 对返回值做空值处理（如需要）

**不涉及 BinService/PenaltyService**：
- 这两个 Service 在代码搜索中未找到，可能已被移除或路径变更
- 本次重构聚焦于已确认存在的绕过点
