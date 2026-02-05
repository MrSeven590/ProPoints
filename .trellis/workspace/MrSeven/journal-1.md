# Journal - MrSeven (Part 1)

> AI development session journal
> Started: 2026-02-02

---


## Session 1: Phase 1: 基础架构搭建

**Date**: 2026-02-02
**Task**: Phase 1: 基础架构搭建

### Summary

(Add summary)

### Main Changes

## 完成内容

### 存储方案变更
- 从 SQLite 改为 `uni.*Storage`（key-value 本地持久化）
- 按"日期/环节/轮次"拆分 Key，适配小程序端容量限制

### 新增目录结构

| 目录 | 说明 |
|------|------|
| `storage/` | 存储层（storage-keys、storage-repository、oplog、init） |
| `domain/models/` | 类型定义（types、ferment、person、stage-session、assignment） |
| `domain/services/` | 业务服务（ScoreCalculator、ScoreAllocator、Validator） |
| `domain/stores/` | 状态管理（AppStore - EventBus + Storage） |

### 新增页面骨架

- 工作台：`pages/index/index.uvue`
- 工分录入：`pages/work/entry.uvue`
- 统计：`pages/stats/index.uvue`、`date-detail.uvue`、`person-detail.uvue`、`bin-detail.uvue`
- 我的：`pages/mine/index.uvue`、`settings.uvue`、`class-config.uvue`、`roster-import.uvue`

### 配置更新

- TabBar：工作台 | 统计 | 我的
- 更新 PRD 和方案总结：明确一期使用 `uni.*Storage` 存储方案

## 技术要点

- 使用 `type` 而非 `interface`（UTS 规范）
- 使用 `null` 而非 `undefined`
- 对象字面量使用 `as UTSJSONObject` 类型断言
- 预留同步字段：`uuid/version/sync_status/updated_at/deleted_at/device_id`

### Git Commits

| Hash | Message |
|------|---------|
| `c177753` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 2: 实现纯 UTS 拼音匹配服务

**Date**: 2026-02-04
**Task**: 实现纯 UTS 拼音匹配服务

### Summary

(Add summary)

### Main Changes

## 完成内容

| 功能 | 说明 |
|------|------|
| PinyinMatchService | 纯 UTS 实现的拼音匹配服务，解决 uni-app-x 无法使用 npm 库问题 |
| PersonSearchService | 人员搜索服务，支持中文/全拼/首字母匹配 |
| 花名册导入页面 | roster-import.uvue 集成拼音搜索 |

## 技术要点

- **问题**: uni-app-x App 端编译为原生 Kotlin/Swift，无法使用 npm 的 pinyin-match 库
- **方案**: 参考 pinyin-match 源码，用纯 UTS 重新实现
- **实现**: 内置完整简体中文拼音字典（840行），支持全拼和首字母匹配

## 新增文件

- `domain/services/PinyinMatchService.uts` - 拼音匹配核心服务
- `domain/services/PersonSearchService.uts` - 人员搜索服务

## API

```typescript
// 拼音匹配（支持中文、全拼、首字母）
pinyinMatch(input: string, keyword: string): boolean

// 获取拼音首字母
getInitials(cn: string): string
```

### Git Commits

| Hash | Message |
|------|---------|
| `7fbdd0b` | (see git log) |
| `8341d78` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 3: 实现纯 UTS 拼音匹配服务

**Date**: 2026-02-04
**Task**: 实现纯 UTS 拼音匹配服务

### Summary

(Add summary)

### Main Changes

## 本次完成

| 功能 | 说明 |
|------|------|
| PinyinMatchService | 纯 UTS 实现的拼音匹配服务，解决 uni-app-x 无法使用 npm 库问题 |
| PersonSearchService | 人员搜索服务，支持中文/全拼/首字母匹配 |
| 花名册导入 | 集成拼音匹配的花名册导入功能 |

## 关键发现

- **uni-app-x App 端不支持普通 npm 库**（编译为原生 Kotlin/Swift）
- `pinyin-match` 是 npm 库，无法在 App 端使用
- 解决方案：参考 pinyin-match 源码，用纯 UTS 重新实现

## 新增文件

- `domain/services/PinyinMatchService.uts` - 840行，内置完整拼音字典
- `domain/services/PersonSearchService.uts` - 人员搜索服务

## API

\`\`\`typescript
// 拼音匹配（支持中文、全拼、首字母）
pinyinMatch(input: string, keyword: string): boolean

// 获取拼音首字母
getInitials(cn: string): string
\`\`\`

### Git Commits

| Hash | Message |
|------|---------|
| `7fbdd0b` | (see git log) |
| `8341d78` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 4: 轮次管理与管理员追溯功能

**Date**: 2026-02-05
**Task**: 轮次管理与管理员追溯功能

### Summary

(Add summary)

### Main Changes

## 完成内容

| 功能 | 描述 |
|------|------|
| 轮次管理服务 | 新增 RoundService.uts，支持首次初始化、修正、冲突检测 |
| 首次初始化弹窗 | 用户首次使用时选择年度/轮次/计分权（默认26年1轮次） |
| 修正功能 | 原地更新当前轮次状态，不创建新记录 |
| 管理员追溯 | StageSession/Assignment 添加 created_by_manager/updated_by_manager |
| 存储架构统一 | settings.uvue 改用 AppStore，更新 storage-keys 注释 |
| 文档同步 | 方案总结.md 与代码一致性（Codex 审查） |

## 关键文件

**新增**:
- `domain/services/RoundService.uts` - 轮次管理服务

**修改**:
- `domain/models/ferment.uts` - FermentRound 添加 year 字段
- `domain/models/assignment.uts` - 添加管理员追溯字段
- `domain/models/stage-session.uts` - 添加管理员追溯字段
- `pages/mine/class-config.uvue` - 初始化/修正弹窗 UI
- `pages/mine/settings.uvue` - 改用 AppStore
- `.claude/方案总结.md` - 数据模型同步更新

## Codex 审查要点

1. ferment_round 唯一约束改为 `UNIQUE(class_no, year, round_no)`
2. 所有实体明确列出 created_at 字段
3. 移除 jsonToRound() 旧数据兼容代码

### Git Commits

| Hash | Message |
|------|---------|
| `6d9daeb` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 5: 性能优化与发酵仓选择器组件

**Date**: 2026-02-06
**Task**: 性能优化与发酵仓选择器组件

### Summary

(Add summary)

### Main Changes

## 本次会话完成内容

### 新增组件
| 组件 | 说明 |
|------|------|
| `biz-bin-selector` | 发酵仓选择器，支持楼层切换、网格选择、长按范围选 |
| `BinService` | 仓位服务，智能推断下一批仓位 |

### 性能优化
| 模块 | 优化点 | 效果 |
|------|--------|------|
| 花名册导入 | Map 替代 indexOf | O(n²) → O(n) |
| 花名册导入 | validCount 缓存 | 避免重复计算 |
| 花名册导入 | 搜索防抖 120ms | 减少渲染 |
| 发酵仓选择器 | selectedSeqLookup | O(n) → O(1) |

### Bug 修复
- v-for 浮点数警告：seqMax 添加 Math.floor()

### 变更文件
- `components/biz-bin-selector/biz-bin-selector.uvue` (新增)
- `domain/services/BinService.uts` (新增)
- `pages/mine/roster-import.uvue` (优化)
- `pages/work/entry.uvue` (接入选择器)

### Git Commits

| Hash | Message |
|------|---------|
| `7282265` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
