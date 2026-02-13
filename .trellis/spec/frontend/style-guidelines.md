# Style Guidelines

> uni-app X 样式开发规范

---

## Overview

本项目使用 ucss（CSS 子集）编写样式，仅支持 flex 布局和类选择器。

**关键约束：**
- 仅支持 flex 布局（不支持 grid、float 等）
- 仅支持类选择器（不支持 ID、标签、属性选择器）
- 单位仅支持 px 和 %
- 不支持伪类、伪元素
- 不支持 CSS 变量

---

## Shared Modal Styles

### 概述

项目中的弹窗（Modal）使用共享样式类，避免重复代码。

### 共享样式类

| 类名 | 用途 | 说明 |
|------|------|------|
| `.picker-mask` | 遮罩层 | 半透明黑色背景，居中显示弹窗 |
| `.modal-container` | 弹窗容器 | 白色背景、圆角、内边距 |
| `.modal-header` | 弹窗头部 | 标题和关闭按钮的布局 |
| `.modal-title` | 弹窗标题 | 标题文本样式 |
| `.modal-close` | 关闭按钮容器 | 圆形关闭按钮 |
| `.modal-close-text` | 关闭按钮文本 | "X" 文本样式 |
| `.modal-actions` | 底部按钮区域 | 取消/确认按钮的布局 |
| `.modal-btn` | 按钮基础样式 | 按钮尺寸、居中、圆角 |
| `.modal-btn-cancel` | 取消按钮 | 灰色背景 |
| `.modal-btn-confirm` | 确认按钮 | 蓝色背景 |
| `.modal-btn-text` | 按钮文本基础 | 字体大小、粗细 |
| `.modal-btn-text-cancel` | 取消按钮文本 | 灰色文本 |
| `.modal-btn-text-confirm` | 确认按钮文本 | 白色文本 |

### 使用示例

```vue
<template>
  <!-- 遮罩层 -->
  <view v-if="showModal" class="picker-mask" @click="onClose">
    <!-- 弹窗容器：共享类 + 特定类 -->
    <view class="modal-container my-modal-container" @click.stop="">
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">弹窗标题</text>
        <view class="modal-close" @click="onClose">
          <text class="modal-close-text">X</text>
        </view>
      </view>

      <!-- 内容区域（自定义） -->
      <view class="my-modal-content">
        <!-- 自定义内容 -->
      </view>

      <!-- 底部按钮 -->
      <view class="modal-actions">
        <view class="modal-btn modal-btn-cancel" @click="onCancel">
          <text class="modal-btn-text modal-btn-text-cancel">取消</text>
        </view>
        <view class="modal-btn modal-btn-confirm" @click="onConfirm">
          <text class="modal-btn-text modal-btn-text-confirm">确认</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
  /* 特定样式：仅定义宽度和内容区域 */
  .my-modal-container {
    width: 320px;
  }

  .my-modal-content {
    padding: 16px 0;
    /* 自定义内容样式 */
  }
</style>
```

### 特定样式

每个弹窗只需定义：
1. **容器宽度**：通过特定类设置（如 `.date-picker-container { width: 300px }`）
2. **内容区域**：自定义内容区域的样式（如 `.my-modal-content`）

### 现有弹窗示例

#### 日期选择器
```vue
<view class="modal-container date-picker-container">
  <view class="modal-header">...</view>
  <view class="date-picker-content">
    <!-- 日期步进器 -->
  </view>
  <view class="modal-actions">...</view>
</view>
```

特定样式：
```css
.date-picker-container {
  width: 300px;
}

.date-picker-content {
  padding: 16px 0;
}

.date-stepper { /* 步进器样式 */ }
```

#### 备注输入弹窗
```vue
<view class="modal-container remark-popup-container">
  <view class="modal-header">...</view>
  <view class="remark-popup-content">
    <textarea class="remark-textarea" />
  </view>
  <view class="modal-actions">...</view>
</view>
```

特定样式：
```css
.remark-popup-container {
  width: 320px;
}

.remark-popup-content {
  padding: 8px 0;
}

.remark-textarea { /* 文本框样式 */ }
```

---

## Best Practices

### ✅ DO - 应该做

1. **复用共享样式**
   - 新增弹窗时使用 `.modal-*` 共享类
   - 只定义特定的宽度和内容样式

2. **类组合**
   - 使用 `class="modal-container my-container"` 组合共享类和特定类
   - 特定类只覆盖需要自定义的属性

3. **遮罩层交互**
   - 遮罩层使用 `@click="onClose"` 点击关闭
   - 弹窗容器使用 `@click.stop=""` 阻止事件冒泡

4. **命名规范**
   - 特定类使用描述性名称（如 `.date-picker-container`）
   - 避免使用过于通用的名称（如 `.container`）

### ❌ DON'T - 不应该做

1. **不要重复定义共享样式**
   ```css
   /* ❌ 错误：重复定义头部样式 */
   .my-modal-header {
     flex-direction: row;
     justify-content: space-between;
     align-items: center;
     margin-bottom: 16px;
   }

   /* ✅ 正确：直接使用共享类 */
   <view class="modal-header">
   ```

2. **不要覆盖共享样式的核心属性**
   ```css
   /* ❌ 错误：覆盖共享样式 */
   .my-modal-container {
     padding: 20px; /* 覆盖了 modal-container 的 padding */
   }

   /* ✅ 正确：只定义特定属性 */
   .my-modal-container {
     width: 350px;
   }
   ```

3. **不要使用 ID 选择器或标签选择器**
   ```css
   /* ❌ 错误：ucss 不支持 */
   #modal { }
   div { }

   /* ✅ 正确：使用类选择器 */
   .modal-container { }
   ```

---

## Common Mistakes

| 错误 | 正确做法 |
|------|----------|
| 重复定义弹窗头部/按钮样式 | 使用 `.modal-header`、`.modal-actions` 共享类 |
| 使用 grid 布局 | 使用 flex 布局 |
| 使用 ID 选择器 | 使用类选择器 |
| 使用 rem、em 单位 | 使用 px 或 % |
| 使用伪类 `:hover` | 使用事件处理器（如 `@click`） |
| 覆盖共享样式的核心属性 | 只定义特定属性（如宽度） |

---

## Future Considerations

### 样式冲突预防

如果担心 `.modal-*` 类名过于通用可能冲突，可以考虑：

1. **添加项目前缀**
   ```css
   /* 当前 */
   .modal-container { }

   /* 添加前缀 */
   .pp-modal-container { }
   ```

2. **移到全局样式文件**
   - 如果多个页面都需要弹窗，可以将 `.modal-*` 移到全局样式文件
   - 目前项目结构不支持全局样式，暂时保留在页面内

### 样式覆盖策略

如果未来某个弹窗需要不同的头部间距或按钮大小：

1. **添加修饰符类**
   ```vue
   <view class="modal-header modal-header-compact">
   ```

   ```css
   .modal-header-compact {
     margin-bottom: 8px; /* 覆盖默认的 16px */
   }
   ```

2. **不要直接修改共享类**
   - 修改 `.modal-header` 会影响所有弹窗
   - 使用修饰符类局部覆盖

---

## References

- [uni-app X 样式文档](https://doc.dcloud.net.cn/uni-app-x/css/)
- [ucss 支持的 CSS 特性](https://doc.dcloud.net.cn/uni-app-x/css/supported.html)
