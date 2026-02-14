# 修复 AppStore 收敛遗留问题

## Goal

修复 Codex 审查发现的架构绕过问题，确保三层存储架构的完整性和安全性。

## Background

Codex 审查发现了以下问题：
1. DuiQuBaseService 和 BinService 直接使用 `uni.getStorageSync/getStorageInfoSync` 绕过 repository
2. AppStore 暴露了不安全的通用 API (`loadData/saveData`)
3. 缺少对直接使用 storage API 和原始 key 字符串的检查规则

## Requirements

### 1. 修复 DuiQuBaseService 的直接存储访问

**当前问题**：
- `domain/services/DuiQuBaseService.uts:242` 使用 `uni.getStorageInfoSync()`
- `domain/services/DuiQuBaseService.uts:252` 使用 `uni.getStorageSync()`
- `domain/services/DuiQuBaseService.uts:248` 依赖原始 key 字符串 `':AN_QU:'`

**修复方案**：
- 在 `storage-repository.uts` 添加 `findAnQuSessionByBinId(binId: string): UTSJSONObject | null`
- 在 AppStore 暴露该方法
- 修改 DuiQuBaseService 使用 AppStore 方法

### 2. 修复 BinService 的直接存储访问

**当前问题**：
- `domain/services/BinService.uts:38, 125` 使用 `uni.getStorageInfoSync()`
- `domain/services/BinService.uts:44, 130` 依赖原始 key 前缀 `'pp:session:'`

**修复方案**：
- 在 `storage-repository.uts` 添加 `listAllSessionKeys(): string[]`
- 在 AppStore 暴露该方法
- 修改 BinService 使用 AppStore 方法

### 3. 隔离不安全的通用 API

**当前问题**：
- AppStore 暴露 `loadData(key)` 和 `saveData(key, data)` 让调用者可以绕过 repository 约束

**修复方案**：
- 创建 `domain/stores/StorageUnsafe.uts` 模块
- 将 `loadData/saveData` 移到该模块
- 添加明确的警告文档
- 更新 PenaltyService 的 import

### 4. 添加架构检查规则

**新增验证命令**：
```bash
# 禁止在 storage/** 之外直接使用 storage API
rg "uni\.(getStorageSync|getStorageInfoSync|setStorageSync|removeStorageSync|clearStorageSync)" --glob "!storage/**"

# 禁止在 storage/** 之外使用原始 key 字符串
rg "pp:(session|idx|cfg|data):" --glob "!storage/**"
```

### 5. 更新文档

- 更新 `.trellis/spec/frontend/storage-architecture.md`
- 将"已知绕过点"改为"历史记录"
- 添加新的检查规则

## Acceptance Criteria

- [ ] DuiQuBaseService 不再直接使用 `uni.getStorage*` API
- [ ] BinService 不再直接使用 `uni.getStorage*` API
- [ ] 不安全的 API 已隔离到 `StorageUnsafe.uts`
- [ ] 验证命令通过：
  - `rg "uni\.(getStorageSync|getStorageInfoSync|setStorageSync|removeStorageSync|clearStorageSync)" --glob "!storage/**"` → 无匹配
  - `rg "pp:(session|idx|cfg|data):" --glob "!storage/**"` → 无匹配
- [ ] 文档已更新
- [ ] 代码编译通过

## Technical Notes

**命名约定**：
- repository 层方法：`findAnQuSessionByBinId`, `listAllSessionKeys`
- AppStore 方法：保持相同命名

**实现原则**：
- 所有存储扫描逻辑必须在 `storage-repository.uts` 中
- domain/services 只能通过 AppStore 访问存储
- 不安全的 API 必须有明确的警告文档
