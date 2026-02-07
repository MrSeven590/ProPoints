# P3-T10 工作台最近草稿/已提交列表

## Goal

补齐工作台列表：展示最近草稿、最近提交、按日期分组，支持快速继续编辑与删除草稿。

## Requirements

### 功能需求

1. **最近草稿列表**
   - 展示状态为 `draft` 的会话
   - 按日期倒序排列（最新在前）
   - 显示：日期、环节名称、轮次（如有）
   - 点击可跳转到录入页继续编辑
   - 支持删除草稿

2. **最近已提交列表**
   - 展示状态为 `submitted` 的会话
   - 按日期倒序排列
   - 显示：日期、环节名称、轮次（如有）
   - 点击可跳转到录入页查看/编辑

3. **数据加载**
   - 使用 `getSessionsByDate` 从 storage 加载
   - 加载最近 7 天的数据
   - 按状态分组展示

### UI 需求

- 草稿列表在上，已提交列表在下
- 空状态显示"暂无草稿"/"暂无已提交记录"
- 草稿项右侧显示删除按钮
- 列表项样式：卡片式，显示环节图标、环节名称、日期

## Acceptance Criteria

- [ ] 可从工作台一键进入指定日期/环节/轮次的会话
- [ ] 删除草稿会同步清理索引（不出现"幽灵条目"）
- [ ] 草稿和已提交分开展示
- [ ] 列表按日期倒序排列

## Technical Notes

### 数据来源

```typescript
// storage/storage-repository.uts
export function getSessionsByDate(date: string): UTSJSONObject[]

// 会话数据结构
type StageSession = {
  session_date: string      // YYYY-MM-DD
  stage_code: StageCode     // AN_QU | YI_FAN | ER_FAN | CHAI_QU | DUI_QU
  round_id: number | null
  status: SessionStatus     // 'draft' | 'submitted'
  // ...
}
```

### 环节名称映射

```typescript
const STAGE_NAMES: Map<string, string> = new Map([
  ['AN_QU', '安曲'],
  ['YI_FAN', '一次翻曲'],
  ['ER_FAN', '二次翻曲'],
  ['CHAI_QU', '拆曲'],
  ['DUI_QU', '堆曲']
])
```

### 跳转参数

```typescript
// 跳转到录入页
uni.navigateTo({
  url: `/pages/work/entry?stage=${stageCode}&date=${date}&roundId=${roundId}`
})
```
