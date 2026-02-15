# 在设置页面添加打分系数编辑功能

## Goal
在 `/pages/mine/settings` 页面中添加可编辑所有打分系数的功能，允许用户修改工序系数和晾堂岗位系数。

## Requirements

### 功能需求
- 在设置页面添加"打分系数配置"区块
- 支持编辑 5 个工序系数：
  - 安曲 (AN_QU)
  - 一次翻曲 (YI_FAN)
  - 二次翻曲 (ER_FAN)
  - 拆曲 (CHAI_QU)
  - 堆曲 (DUI_QU)
- 支持编辑 4 个晾堂岗位系数：
  - 麦料 (WHEAT_MATERIAL)
  - 守机 (MACHINE_GUARD)
  - 下曲 (KOJI_UNLOADER)
  - 微机 (MICRO_OPERATOR)
- 保存时显示 Toast 提示
- 输入验证：系数范围 0.1 ~ 5.0

### 架构约束
- 页面层必须通过 AppStore 访问存储（禁止直接调用 storage-repository）
- 需要在 AppStore 中添加 `saveCoefConfig()` 和 `getCoefConfig()` 方法
- 保存时需要保存完整的配置对象（包含 version、name、stages、liangTang）

## Acceptance Criteria

- [ ] AppStore 中添加了 `saveCoefConfig()` 和 `getCoefConfig()` 方法
- [ ] 设置页面显示所有 9 个系数的编辑输入框
- [ ] 输入框显示当前系数值
- [ ] 输入框支持小数输入（type="digit"）
- [ ] 保存按钮点击后更新存储
- [ ] 保存成功后显示 Toast 提示
- [ ] 输入验证：系数必须在 0.1 ~ 5.0 范围内
- [ ] 样式与现有设置页面保持一致

## Technical Notes

### 存储结构
```typescript
{
  version: 1,
  name: '默认系数版本',
  effectiveFrom: 0,
  effectiveTo: null,
  stages: {
    AN_QU: 1.1,
    YI_FAN: 1.25,
    ER_FAN: 0.9,
    CHAI_QU: 1.12,
    DUI_QU: 0.29
  },
  liangTang: {
    WHEAT_MATERIAL: 0.85,
    MACHINE_GUARD: 0.8,
    KOJI_UNLOADER: 0.8,
    MICRO_OPERATOR: 0.7
  }
}
```

### 实现方案
- 使用原生 `<input type="digit">` 组件（与现有设置页面保持一致）
- 使用 `@blur` 事件处理输入完成
- 参考 `pages/mine/settings.uvue` 中的管理员姓名编辑模式
