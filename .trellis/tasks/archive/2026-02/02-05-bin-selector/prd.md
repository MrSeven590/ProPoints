# 发酵仓选择器组件

## Goal
实现 `biz-bin-selector` 组件，用于在工分录入页面选择发酵仓。支持多选、楼层切换、智能推断预选。

## Requirements

### 功能需求
1. **班级只读展示**：班级信息从 AppStore 获取，页面内只读展示
2. **楼层切换**：支持 3/4/5 楼切换（Tab 或下拉选择）
3. **发酵仓网格**：
   - 多选模式
   - 每格展示完整编号（如 `3-3-1`、`3-3-2`）
   - 网格上限展示至该楼层的 `seq_max`
4. **交互**：
   - 点击编号格：切换选中/取消
   - 长按：连续范围选择（从上次选中位置到当前位置）
   - 页面加载时自动预选"下一组"（智能推断结果）

### seq_max 推断规则
- 优先取该班级该楼层历史最大 `seq_no`
- 若无历史则取班级配置的楼层默认仓数（`getBinSeqMaxByFloor`）
- 未配置默认 `24`

### Props 设计
- `selectedBins: BinCode[]` - 已选中的发酵仓列表（v-model）
- `defaultFloor?: number` - 默认楼层（可选，默认 3）
- `maxSelect?: number` - 最大可选数量（可选，不限制则不传）

### Events
- `update:selectedBins` - 选中列表变化时触发
- `change` - 选中列表变化时触发（携带新列表）

## Acceptance Criteria
- [ ] 组件能正确展示班级（只读）和楼层切换
- [ ] 网格正确展示该楼层所有发酵仓编号
- [ ] 点击可切换选中/取消状态
- [ ] 长按可连续范围选择
- [ ] 选中状态有明显视觉区分
- [ ] 组件正确触发 update:selectedBins 事件

## Technical Notes
- 使用 Options API（与项目现有模式一致）
- 类型定义使用 `type` 而非 `interface`
- 条件语句必须使用布尔值
- 样式仅支持 flex 布局和类选择器
- 参考 `pages/mine/class-config.uvue` 的网格选择器 UI 模式
