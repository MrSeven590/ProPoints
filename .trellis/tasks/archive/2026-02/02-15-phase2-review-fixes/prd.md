# 修复 Codex 第二阶段审查问题

## Goal

修复 Codex 第二阶段审查发现的问题，进一步完善三层存储架构的安全性和正确性。

## Background

Codex 第二阶段审查发现了以下问题：
1. AppStore 仍然暴露 `loadData()` - 与文档矛盾
2. `findAnQuSessionByBinId()` 缺少确定性的选择规则
3. `listAllSessionKeys()` 不应该通过 AppStore 暴露
4. 架构检查规则需要加强
5. 性能问题：`getBinKojiCountsFromAnQu()` 循环扫描
6. 文档问题：历史遗留列表已过时

## Requirements

### 1. 从 AppStore 移除 `loadData()`

**当前问题**：
- `domain/stores/AppStore.uts:413` 仍然导出 `loadData()`
- 与文档声称"已移到 StorageUnsafe"矛盾
- pages/components 仍可以通过 AppStore 绕过约束

**修复方案**：
- 从 AppStore 移除 `loadData()` 导出
- 更新 BinService 从 StorageUnsafe 导入 `loadData`

### 2. 修复 `findAnQuSessionByBinId()` 的选择规则

**当前问题**：
- 返回第一个匹配的 session，没有排序规则
- 可能返回旧的或草稿状态的 session

**修复方案**：
- 实现确定性的选择规则：
  1. 优先选择 `status == 'submitted'`
  2. 然后选择最新的 `session_date`
  3. 最后选择最新的 `updated_at`（如果有）
- 更新 JSDoc 说明选择规则

### 3. 将 `listAllSessionKeys()` 移到 StorageUnsafe

**当前问题**：
- 通过 AppStore 暴露 key 列表会诱导调用者写基于 key 的逻辑

**修复方案**：
- 从 AppStore 移除 `listAllSessionKeys()`
- 将其移到 StorageUnsafe
- 更新 BinService 从 StorageUnsafe 导入

### 4. 加强架构检查规则

**当前问题**：
- 未包含异步 API
- 未限制到代码文件（包含文档噪音）
- 缺少禁止 pages/components 引用 StorageUnsafe 的规则

**修复方案**：
- 扩展检查规则包含异步 API：`uni.getStorage`, `uni.setStorage`, `uni.removeStorage`, `uni.clearStorage`, `uni.getStorageInfo`
- 限制到代码文件：`--glob "*.uts" --glob "*.uvue" --glob "!storage/**"`
- 添加新规则：`rg "StorageUnsafe\.uts" --glob "pages/**" --glob "components/**"` → 应为空

### 5. 优化 `getBinKojiCountsFromAnQu()` 性能

**当前问题**：
- 在循环中调用 `getBinKojiCountFromAnQu()`，每次都扫描全部存储

**修复方案**：
- 在 storage-repository 添加批量方法：`findAnQuSessionsByBinIds(binIds: number[]): Map<number, UTSJSONObject>`
- 修改 DuiQuBaseService 使用批量方法
- 一次扫描返回所有匹配的 session

### 6. 更新文档

**当前问题**：
- "仍存在的历史遗留"列表已过时
- 有重复的标题行

**修复方案**：
- 移除已修复的历史遗留列表
- 修复重复的标题行
- 更新检查规则为加强版

## Acceptance Criteria

- [ ] AppStore 不再导出 `loadData()`
- [ ] `findAnQuSessionByBinId()` 有确定性的选择规则并在 JSDoc 中说明
- [ ] `listAllSessionKeys()` 已移到 StorageUnsafe
- [ ] BinService 从 StorageUnsafe 导入 `loadData` 和 `listAllSessionKeys`
- [ ] 新增批量方法 `findAnQuSessionsByBinIds()`
- [ ] DuiQuBaseService 使用批量方法
- [ ] 架构检查规则已加强（3条规则）
- [ ] 所有检查规则通过验证
- [ ] 文档已更新
- [ ] 代码编译通过

## Technical Notes

**选择规则优先级**：
1. `status == 'submitted'` > `status == 'draft'`
2. `session_date` 降序（最新优先）
3. `updated_at` 降序（如果存在）

**批量方法设计**：
- 一次扫描所有存储 key
- 返回 Map<binId, session>
- 每个 binId 只返回最佳匹配的 session

**检查规则格式**：
```bash
# 规则1：禁止直接使用 storage API（同步+异步）
rg "uni\.(getStorage|setStorage|removeStorage|clearStorage|getStorageInfo)" --glob "*.uts" --glob "*.uvue" --glob "!storage/**"

# 规则2：禁止使用原始 key 字符串
rg "pp:(session|idx|cfg|data):" --glob "*.uts" --glob "*.uvue" --glob "!storage/**"

# 规则3：禁止 pages/components 引用 StorageUnsafe
rg "StorageUnsafe\.uts" --glob "pages/**" --glob "components/**"
```
