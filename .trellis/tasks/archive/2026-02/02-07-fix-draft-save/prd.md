# 修复保存草稿功能

## Goal
修复保存草稿功能，使其真正可用。当前草稿保存和提交功能只显示提示信息，但不实际保存数据，导致用户数据丢失。

## Background
根据 codex 的检查报告，发现以下关键问题：
1. `saveDraft()` 方法只显示 Toast，不保存数据
2. `submit()` 方法只显示 Toast，不验证和保存数据
3. 录入页面无法加载已有草稿
4. `getLastSubmittedBins()` 不检查状态，可能返回草稿数据

存储层 API（`saveSession`、`loadSession`、`deleteSession`）已实现但从未被调用。

## Requirements

### 1. 修复 `saveDraft()` 方法
**文件**: `pages/work/entry.uvue`

- 构建会话数据对象，包含：
  - `status: 'draft'` - 标记为草稿状态
  - `session_date` - 会话日期
  - `stage_code` - 阶段代码
  - `round_id` - 轮次 ID（如果有）
  - `bins` - 发酵仓数据（包含人员分配）
  - `timestamp` - 保存时间戳
- 调用 `saveSession(date, stageCode, roundId, sessionData)` 保存数据
- 保存成功后显示"草稿已保存"提示
- 保存失败时显示错误提示

### 2. 修复 `submit()` 方法
**文件**: `pages/work/entry.uvue`

- 验证数据完整性：
  - 检查是否有发酵仓数据
  - 检查每个仓是否有人员分配
  - 检查工分分配是否完整
- 验证通过后构建会话数据对象：
  - `status: 'submitted'` - 标记为已提交状态
  - 其他字段同草稿
- 调用 `saveSession()` 保存数据
- 保存成功后显示"提交成功"提示并返回首页
- 验证失败时显示具体错误信息

### 3. 实现草稿加载功能
**文件**: `pages/work/entry.uvue`

- 在 `onLoad(options)` 方法中：
  - 解析 URL 参数：`date`、`stage`、`roundId`
  - 如果提供了 `date` 参数（表示要加载已有会话）：
    - 调用 `loadSession(date, stage, roundId)` 加载数据
    - 如果加载成功，恢复页面状态：
      - 设置 `currentDate` 为加载的日期
      - 恢复 `binList` 数据
      - 恢复每个仓的人员分配
    - 如果加载失败，使用默认的新建会话流程
  - 如果没有 `date` 参数，使用当前日期创建新会话

### 4. 修复 `getLastSubmittedBins()` 方法
**文件**: `domain/services/BinService.uts`

- 在扫描会话数据时，添加状态检查：
  - 只处理 `status == 'submitted'` 的会话
  - 跳过 `status == 'draft'` 的会话
  - 如果 `status` 字段不存在，为了向后兼容，视为已提交
- 确保只返回真正提交的数据

## Acceptance Criteria

### 草稿保存
- [ ] 点击"保存草稿"按钮后，数据实际保存到存储
- [ ] 首页"最近草稿"列表能显示保存的草稿
- [ ] 草稿数据包含 `status: 'draft'` 字段
- [ ] 保存失败时显示错误提示

### 草稿加载
- [ ] 从首页点击草稿项，能跳转到录入页面
- [ ] 录入页面正确加载草稿数据
- [ ] 发酵仓列表、人员分配、工分分配都正确恢复
- [ ] 加载失败时有友好的错误提示

### 数据提交
- [ ] 提交前验证数据完整性
- [ ] 验证失败时显示具体错误信息
- [ ] 验证通过后数据保存到存储
- [ ] 提交的数据包含 `status: 'submitted'` 字段
- [ ] 提交成功后返回首页

### 状态过滤
- [ ] `getLastSubmittedBins()` 只返回已提交的数据
- [ ] 草稿不会影响"最近一次提交"的查询结果

## Technical Notes

### 会话数据结构
```typescript
type SessionData = {
  status: SessionStatus  // 'draft' | 'submitted'
  session_date: string
  stage_code: string
  round_id: number | null
  bins: BinData[]
  timestamp: number  // 保存时间戳
}
```

### 存储 API
- `saveSession(date, stageCode, roundId, sessionData)` - 保存会话
- `loadSession(date, stageCode, roundId)` - 加载会话
- `getSessionsByDate(date)` - 获取指定日期的所有会话

### 数据验证规则
1. 至少有一个发酵仓
2. 每个仓至少有一个人员
3. 每个仓的工分已分配（总分配 = 仓总分）

### 错误处理
- 使用 `uni.showToast()` 显示错误提示
- 错误信息要具体明确，帮助用户理解问题

### 向后兼容
- 旧数据可能没有 `status` 字段，视为已提交
- 加载失败时不影响新建会话流程

## Related Files
- `pages/work/entry.uvue` - 录入页面（主要修改）
- `domain/services/BinService.uts` - 仓服务（状态过滤）
- `storage/storage-repository.uts` - 存储服务（参考 API）
- `pages/index/index.uvue` - 首页（参考跳转模式）
- `domain/models/types.uts` - 类型定义（SessionStatus）
