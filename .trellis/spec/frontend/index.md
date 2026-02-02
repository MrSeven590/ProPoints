# Frontend Development Guidelines

> uni-app X 前端开发规范

---

## Overview

本项目基于 uni-app X 框架，使用 UTS 语言和 Vue 3 组合式 API 开发。

**技术栈：**
- 框架：uni-app X
- 语言：UTS (UniScript)
- 视图：Vue 3 组合式 API
- 样式：ucss (CSS 子集)
- 目标平台：Android

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | 目录结构与文件组织 | ✅ Done |
| [Component Guidelines](./component-guidelines.md) | 组件开发规范 | ✅ Done |
| [Hook Guidelines](./hook-guidelines.md) | 组合式函数规范 | ✅ Done |
| [State Management](./state-management.md) | 状态管理方案 | ✅ Done |
| [Quality Guidelines](./quality-guidelines.md) | 代码质量标准 | ✅ Done |
| [Type Safety](./type-safety.md) | UTS 类型安全规范 | ✅ Done |
| [Error Handling](./error-handling.md) | 错误处理规范 | ✅ Done |

---

## Quick Reference

### 关键约束

- 使用 `type` 而非 `interface` 定义对象类型
- 使用 `null` 而非 `undefined`
- 条件语句必须使用布尔值
- 样式仅支持 flex 布局和类选择器
- 不支持 pinia/vuex，使用 EventBus

### 文件后缀

| 类型 | 后缀 |
|------|------|
| 页面/组件 | `.uvue` |
| 逻辑文件 | `.uts` |

---

## References

- [uni-app X 官方文档](https://doc.dcloud.net.cn/uni-app-x/)
- [UTS 语言指南](https://doc.dcloud.net.cn/uni-app-x/uts/)
