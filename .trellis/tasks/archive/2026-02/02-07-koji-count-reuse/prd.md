# P3-T05 曲坯数复用：从安曲记录带出

## Goal

实现"一翻/二翻/拆曲"环节的曲坯数量从该仓安曲记录自动带出；缺失时给予明确提示与跳转入口。

## Background

- 安曲环节录入时，用户手动输入每个发酵仓的曲坯数量
- 后续环节（一翻/二翻/拆曲）应复用安曲记录的曲坯数，无需重复输入
- `DuiQuBaseService.uts` 中的 `getBinKojiCountFromAnQu` 服务函数已实现
- 当前 `entry.uvue` 使用模拟数据，未调用真实服务

## Requirements

### 功能需求

1. **非安曲环节选仓后自动填入曲坯数**
   - 当环节为 YI_FAN / ER_FAN / CHAI_QU 时
   - 选择发酵仓后，调用 `getBinKojiCountFromAnQu` 获取该仓的安曲曲坯数
   - 自动填入到 `stageBinInfos` 中

2. **无安曲记录时的处理**
   - 跟踪哪些仓缺少安曲记录
   - 在 UI 中显示警告提示："以下仓位缺少安曲记录: xxx"
   - 提供跳转到安曲录入的入口按钮

3. **提交校验**
   - 存在缺失安曲记录的仓时，阻止提交
   - 显示明确的错误提示

## Acceptance Criteria

- [ ] 非安曲环节选仓后自动填入曲坯数（从安曲记录获取）
- [ ] 无安曲记录时阻止提交并提示"请先录安曲"
- [ ] 提供跳转到安曲录入页面的入口

## Technical Notes

### 已有服务函数

```typescript
// domain/services/DuiQuBaseService.uts
export type BinKojiCountResult = {
  binId: number
  binCode: string
  kojiCount: number
  found: boolean
}

export function getBinKojiCountFromAnQu(binId: number): BinKojiCountResult
```

### 需要修改的文件

1. `pages/work/entry.uvue`
   - 导入 `getBinKojiCountFromAnQu`
   - 修改 `updateStageBinInfos()` 方法
   - 添加 `missingAnQuBins` 状态跟踪
   - 添加提示 UI 和跳转逻辑
   - 修改提交校验逻辑

### 环节判断

- AN_QU: 安曲（曲坯数可编辑）
- YI_FAN: 一翻（曲坯数从安曲带出，只读）
- ER_FAN: 二翻（曲坯数从安曲带出，只读）
- CHAI_QU: 拆曲（曲坯数从安曲带出，只读）
- DUI_QU: 堆曲（不涉及发酵仓选择）

## References

- 开发计划.md P3-T05 任务定义
- DuiQuBaseService.uts 服务实现
