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
