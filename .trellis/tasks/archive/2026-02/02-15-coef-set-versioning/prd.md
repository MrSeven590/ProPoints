# 系数版本化重构 - 防止历史数据漂移

## Goal

实现系数版本化管理，确保历史会话数据永远使用当时的系数快照，避免"修改系数导致历史数据重算"的问题。同时实现已提交会话的只读模式，避免"回看就生成草稿"。

## Background

当前问题：
1. 系数配置直接覆盖保存，历史会话数据会随着系数修改而漂移
2. 已提交的会话在回看时会自动生成草稿，导致数据混乱
3. 无法追溯历史会话使用的系数版本

## Requirements

### 1. 数据模型层
- ✅ `CoefSet` 和 `CoefItem` 类型已定义（无需修改）
- ✅ `StageSession` 已包含 `coef_set_id` 字段（无需修改）

### 2. 存储层改造
- 新增系数版本存储结构：
  - `pp:cfg:coef-set:{setId}` - 单个系数版本数据
  - `pp:idx:coef-sets` - 所有版本ID列表（索引）
  - `pp:cfg:active-coef-set` - 当前生效版本ID
- 废弃旧的 `pp:cfg:coef` 存储（或改为兼容层）
- 实现版本化存储API：
  - `saveCoefSet(setId, data)`
  - `loadCoefSet(setId)`
  - `getAllCoefSetIds()`
  - `saveActiveCoefSetId(setId)`
  - `loadActiveCoefSetId()`

### 3. 业务服务层改造
- 修改 `StageCoefService`：
  - `getStageCoef(stageCode, coefSetId?)` - 支持按版本ID读取
  - `getLiangTangRoleCoef(roleCode, coefSetId?)` - 支持按版本ID读取
  - 新增 `getActiveCoefSetId()` - 获取当前生效版本
  - 新增 `createNewCoefSet(name, coefData)` - 创建新版本
- 修改 `AppStore`：
  - `saveCoefConfig()` 改为 `createCoefSetVersion(name, coefData)`
  - 新增 `getActiveCoefSetId()`
  - 新增 `setActiveCoefSet(setId)`
  - 新增 `getAllCoefSets()`

### 4. 设置页改造
- 保存系数时创建新版本（而非覆盖）
- 版本命名：自动生成 `系数版本 v{id}` 或允许用户输入
- 可选：展示历史版本列表
- 可选：支持切换生效版本

### 5. 录入页改造
- 创建新会话时绑定当前生效的 `coef_set_id`
- 加载会话时使用会话绑定的 `coef_set_id` 读取系数
- 实现只读模式：
  - 已提交会话默认进入只读模式
  - 只读模式下禁止所有编辑操作
  - 提供"进入编辑"按钮，点击后生成草稿并进入编辑模式
- 修复 autosave 逻辑：
  - 只读模式下禁止 autosave
  - 加载数据期间（isRestoring）禁止 autosave

### 6. 组件层改造
- `biz-bin-card` 组件：
  - 新增 `readonly` prop
  - 新增 `stageCoef` prop（避免组件内部读取 active 系数）
- `biz-session-role-card` 组件：
  - 新增 `readonly` prop
  - readonly 模式下禁止所有编辑交互
  - 禁止 watcher 在只读模式下触发 change 事件

### 7. 初始化脚本改造
- 创建默认系数版本（setId=1）
- 设置默认版本为当前生效版本
- 可选：提供数据迁移脚本（将现有会话的 `coef_set_id` 设为 1）

## Acceptance Criteria

- [ ] 存储层：系数版本化存储结构实现完成
- [ ] 服务层：系数读取支持按版本ID查询
- [ ] 设置页：保存系数时创建新版本
- [ ] 录入页：新会话绑定当前生效版本
- [ ] 录入页：已提交会话默认只读，不生成草稿
- [ ] 录入页：提供"进入编辑"功能，显式生成草稿
- [ ] 组件层：支持 readonly 模式
- [ ] 初始化：默认版本创建成功
- [ ] 验证：修改系数后，历史会话数据不变
- [ ] 验证：回看已提交会话不会生成草稿

## Technical Notes

### 实施顺序
1. 存储层：实现版本化存储API
2. 服务层：修改系数读取逻辑支持版本ID
3. 初始化：创建默认版本
4. 设置页：修改保存逻辑为创建新版本
5. 录入页：实现只读模式和编辑模式切换
6. 组件层：传递 readonly 和 coef 参数
7. 验证：端到端测试

### 关键约束
- 遵循三层存储架构：页面 → AppStore → storage-repository → storage-keys
- 使用 UTS 类型安全规范：`type` 而非 `interface`，`null` 而非 `undefined`
- 会话数据的 `status: 'draft' | 'submitted'` 状态管理
- 组件间通信使用 EventBus（不支持 pinia/vuex）

### 风险与缓解
- **历史数据迁移**：现有会话的 `coef_set_id` 为 `null`，需要在初始化时兜底为默认版本ID
- **只读模式实现**：需要在多个子组件中传递 `readonly` 属性，注意组件层级传递
- **草稿与已提交区分**：需要明确区分"查看已提交"和"编辑已提交"两种场景

## Out of Scope

- 系数版本历史查看页面（可后续增强）
- 系数版本回滚功能（可后续增强）
- 系数版本对比功能（可后续增强）
