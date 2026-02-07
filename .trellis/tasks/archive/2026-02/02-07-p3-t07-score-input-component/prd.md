# P3-T07 工分输入控件统一封装

## Goal

抽离统一的"0.1 精度工分输入控件"（biz-score-input），支持 +0.1/-0.1 微调、输入纠错与格式化，避免 biz-bin-card 和 biz-cross-bin-input 中的重复代码。

## Requirements

### 功能需求

1. **Stepper 微调**
   - 提供 `+` / `-` 按钮，每次调整 0.1 分（内部 ±1 单位）
   - 最小值为 0，不允许负数

2. **直接输入**
   - 支持数字键盘直接输入
   - 输入时不做限制，blur 时进行格式化

3. **输入纠错与格式化**
   - 非数字输入自动归零
   - 负数自动归零
   - 统一保留 1 位小数（使用 `.toFixed(1)`）

4. **内部单位**
   - 内部使用整数单位 `PointsUnits`（points × 10）
   - 复用 `domain/models/types.uts` 中的 `pointsToUnits` / `unitsToPoints` 函数

### 组件接口

```typescript
// Props
type Props = {
  modelValue: number      // v-model 绑定值（PointsUnits 整数单位）
  min: number             // 最小值，默认 0
  max: number             // 最大值，默认 null（无限制）
  step: number            // 步进值，默认 1（对应 0.1 分）
  disabled: boolean       // 禁用状态，默认 false
  size: string            // 尺寸：'normal' | 'small'，默认 'normal'
}

// Events
@update:modelValue(value: number)  // 值变更事件
```

### 样式需求

- 大字号、大触控区域，满足现场手套操作
- 两种尺寸：
  - `normal`：用于跨仓岗位等独立输入场景
  - `small`：用于仓卡片内的紧凑布局
- 禁用态视觉反馈

## Acceptance Criteria

- [ ] 任意输入最终落为 0.1 精度且不出现浮点误差（内部单位整数）
- [ ] 大字号/大触控区域满足现场操作
- [ ] 支持 v-model 双向绑定
- [ ] 支持 disabled 禁用状态
- [ ] 支持 min/max 边界限制
- [ ] 符合 easycom 规范，可直接在模板中使用

## Technical Notes

### 参考实现

从 `biz-cross-bin-input.uvue` 提取的核心逻辑：

```typescript
// 输入处理
onPointsInput(e: UniInputEvent) {
  this.displayPoints = e.detail.value
}

// blur 时格式化
onPointsBlur() {
  let inputVal = parseFloat(this.displayPoints)
  if (isNaN(inputVal)) inputVal = 0
  if (inputVal < 0) inputVal = 0
  this.pointsUnits = pointsToUnits(inputVal)
  this.displayPoints = unitsToPoints(this.pointsUnits).toFixed(1)
  this.emitChange()
}

// 微调
onIncrease() {
  this.pointsUnits = this.pointsUnits + 1
  this.displayPoints = unitsToPoints(this.pointsUnits).toFixed(1)
  this.emitChange()
}
```

### 文件位置

```
components/
  biz-score-input/
    biz-score-input.uvue
```

### 后续重构（本任务不做）

创建组件后，可在后续任务中将 biz-bin-card 和 biz-cross-bin-input 中的工分输入部分替换为此组件。
