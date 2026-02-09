# 实现跨仓工分扣除逻辑

## Goal

当拉车/打杂人员（跨仓岗位）分配工分时，需要从对应发酵仓的可用工分中扣除，使发酵仓卡片显示正确的剩余工分。

## Background

根据 `.claude/方案总结.md` 中的工分分配逻辑：
- 跨仓岗位（拉车/打杂）从多间发酵仓按曲坯数量比例抽取工分
- 发酵仓内人员分配剩余工分

当前问题：
1. `allocateCrossBinPoints` 函数已正确计算 `sources` 数组（每个发酵仓应扣除的工分）
2. `pages/work/entry.uvue` 已保存和恢复 `crossBinSources` 数据
3. **但是**，`biz-bin-card` 组件在计算剩余工分时，没有考虑跨仓抽取的扣除

## Requirements

1. **传递跨仓扣除数据**：`entry.uvue` 需要将每个发酵仓的跨仓扣除工分传递给对应的 `biz-bin-card` 组件

2. **计算正确的剩余工分**：`biz-bin-card` 组件需要在计算剩余工分时，扣除跨仓抽取的工分
   - 剩余工分 = 总工分 - 仓内已分配 - 跨仓扣除

3. **UI 显示**：发酵仓卡片应显示跨仓扣除信息（可选，但建议显示）

## Technical Design

### 数据流

```
entry.uvue
  |-- crossBinSources: AssignmentSourceCreateParams[]
  |     (stage_bin_id -> source_points_units 映射)
  |
  |-- 计算每个仓的跨仓扣除
  |     getCrossBinDeduction(stageBinId): PointsUnits
  |
  v
biz-bin-card (新增 prop)
  |-- crossBinDeduction: PointsUnits (从该仓扣除的跨仓工分)
  |
  |-- remainingUnits = totalPointsUnits - assignedUnits - crossBinDeduction
```

### 修改文件

1. **`pages/work/entry.uvue`**
   - 添加方法 `getCrossBinDeduction(stageBinId: number): PointsUnits`
   - 在 `biz-bin-card` 组件上添加 `:crossBinDeduction="getCrossBinDeduction(binInfo.stage_bin_id)"`

2. **`components/biz-bin-card/biz-bin-card.uvue`**
   - 添加 prop `crossBinDeduction: { type: Number, default: 0 }`
   - 修改 `remainingUnits` 计算逻辑
   - （可选）在 UI 中显示跨仓扣除信息

## Acceptance Criteria

- [ ] 当跨仓岗位分配工分后，对应发酵仓的剩余工分正确减少
- [ ] 剩余工分 = 总工分 - 仓内已分配 - 跨仓扣除
- [ ] 跨仓扣除按曲坯数量比例分配到各发酵仓
- [ ] 修改跨仓工分后，发酵仓剩余工分实时更新
- [ ] 移除跨仓岗位后，发酵仓剩余工分恢复

## Technical Notes

### AssignmentSourceCreateParams 结构

```typescript
type AssignmentSourceCreateParams = {
  assignment_id: number
  stage_bin_id: number           // 来源发酵仓 ID
  source_points_units: PointsUnits  // 从该仓抽取的工分单位
}
```

### 注意事项

1. `crossBinSources` 是一个数组，需要根据 `stage_bin_id` 查找对应的扣除值
2. 当 `crossBinSources` 为空或找不到对应仓时，扣除值为 0
3. 需要处理跨仓岗位被移除的情况（`showCrossBinSection = false`）
