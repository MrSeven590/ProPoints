# 修复发酵仓推测逻辑

## Goal
修复发酵仓自动推测和手动选择的逻辑错误，使其正确推测同一楼层的后续仓，并显示所有可用的发酵仓。

## Background
根据 codex 的分析，发现 `getSeqMaxForFloor()` 方法存在设计缺陷：
- 将"历史最大使用序号"当作"楼层容量"
- 导致推测逻辑过早换楼
- 导致 UI 只显示已使用的仓

## Problem Description

### 症状 1：推测到错误楼层
**期望行为**：
- 当 3-3-1 和 3-3-2 工分录入后
- 第二次工分录入应自动推断为 3-3-3 和 3-3-4

**实际行为**：
- 自动推断为 3-4-1 和 3-4-2（错误地跳到下一楼层）

**原因**：
- `getSeqMaxForFloor(3)` 返回 `2`（历史最大值）
- 推测逻辑认为 3 楼只有 2 个仓
- 当尝试推测序号 3 时，`3 > 2`，触发"换楼"逻辑

### 症状 2：手动选择楼层后只显示已使用的仓
**期望行为**：
- 手动选择 3 楼后，应显示所有可用的发酵仓（如 1-24 号）

**实际行为**：
- 只显示 3-3-1 和 3-3-2，无法选择其他仓

**原因**：
- UI 使用 `v-for="seq in seqMax"` 渲染
- `seqMax` 来自 `getSeqMaxForFloor()`，返回 `2`
- UI 只渲染 2 个格子

## Root Cause

**问题代码**：`domain/services/BinService.uts:85-95`

```typescript
export function getSeqMaxForFloor(
  classNo: number,
  floorNo: number,
  stageCode: StageCode
): number {
  const historyMax = getHistoryMaxSeqNo(classNo, floorNo)
  if (historyMax > 0) {
    return historyMax  // ❌ 错误：用历史最大值作为容量
  }
  // 回退到配置值
  const config = getFloorConfig(classNo, floorNo)
  if (config != null) {
    return config.seq_max
  }
  return 24  // 默认值
}
```

**问题**：
- 当 `historyMax > 0` 时，直接返回历史最大值
- 忽略了配置的楼层容量
- 导致容量被"历史记录"缩小

## Requirements

### 修复 `getSeqMaxForFloor()` 方法

**修改位置**：`domain/services/BinService.uts:85-95`

**修复逻辑**：
1. 获取配置的楼层容量（`configSeqMax`）
2. 获取历史最大使用序号（`historyMax`）
3. 返回 `max(configSeqMax, historyMax)`

**原理**：
- 配置容量是物理限制（楼层实际有多少个仓）
- 历史记录可以扩展显示范围（如果历史使用超过配置）
- 但历史记录不应缩小物理容量

**伪代码**：
```typescript
export function getSeqMaxForFloor(
  classNo: number,
  floorNo: number,
  stageCode: StageCode
): number {
  // 1. 获取配置容量
  let configSeqMax = 24  // 默认值
  const config = getFloorConfig(classNo, floorNo)
  if (config != null) {
    configSeqMax = config.seq_max
  }

  // 2. 获取历史最大值
  const historyMax = getHistoryMaxSeqNo(classNo, floorNo)

  // 3. 返回两者的最大值
  return Math.max(configSeqMax, historyMax)
}
```

## Acceptance Criteria

### 推测逻辑修复
- [ ] 当 3-3-1 和 3-3-2 录入后，自动推测为 3-3-3 和 3-3-4
- [ ] 推测逻辑在同一楼层内连续推测，直到达到楼层容量
- [ ] 只有当序号超过楼层容量时，才换到下一楼层

### UI 显示修复
- [ ] 手动选择 3 楼后，显示所有可用的发酵仓（1-24 号）
- [ ] 已使用的仓显示为已选中状态
- [ ] 未使用的仓可以正常选择

### 边界情况
- [ ] 如果历史使用超过配置容量（如配置 24，历史用到 26），显示 26 个仓
- [ ] 如果没有历史记录，显示配置容量的仓
- [ ] 如果没有配置，显示默认 24 个仓

## Technical Notes

### 相关代码位置
- `domain/services/BinService.uts:85` - `getSeqMaxForFloor()` 方法（需要修复）
- `domain/services/BinService.uts:186` - `inferNextBins()` 方法（使用 `getSeqMaxForFloor()`）
- `domain/services/BinService.uts:28` - `getHistoryMaxSeqNo()` 方法（获取历史最大值）
- `components/biz-bin-selector/biz-bin-selector.uvue:34` - UI 渲染（`v-for="seq in seqMax"`）
- `components/biz-bin-selector/biz-bin-selector.uvue:157` - 楼层切换时更新 `seqMax`

### 测试场景
1. **场景 1**：首次录入
   - 无历史记录
   - 应显示配置容量的仓（如 24 个）

2. **场景 2**：第二次录入（已有 3-3-1 和 3-3-2）
   - 自动推测应为 3-3-3 和 3-3-4
   - 手动选择 3 楼应显示所有 24 个仓

3. **场景 3**：历史使用超过配置
   - 配置容量 24，历史用到 26
   - 应显示 26 个仓

## Related Files
- `domain/services/BinService.uts` - 仓服务（主要修改）
- `components/biz-bin-selector/biz-bin-selector.uvue` - 选择器组件（验证修复效果）
