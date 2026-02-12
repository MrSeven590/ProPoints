# 实现全局草稿索引机制

## Goal
实现全局草稿索引，替代首页的全量扫描，符合项目"支持快速查询和索引"的存储架构设计原则。

## Requirements
1. 在 `storage-keys.uts` 中添加草稿索引 Key 定义
2. 修改 `storage-repository.uts` 中的 `saveSession()` 自动维护草稿索引
3. 修改 `storage-repository.uts` 中的 `deleteSession()` 自动清理草稿索引
4. 添加 `getDraftSessionKeys()` 查询接口
5. 修改首页 `pages/index/index.uvue` 使用新接口替代全量扫描

## Acceptance Criteria
- [ ] 添加 `getDraftIndexKey()` 函数返回 `pp:idx:draft`
- [ ] `saveSession()` 根据 status 自动维护草稿索引（draft 加入，非 draft 移除）
- [ ] `deleteSession()` 自动从草稿索引移除
- [ ] 添加 `getDraftSessionKeys()` 返回所有草稿 key
- [ ] 首页使用 `getDraftSessionKeys()` + `parseSessionKey()` 获取草稿列表
- [ ] 移除首页的 `uni.getStorageInfoSync()` 全量扫描
- [ ] 草稿列表功能正常（显示、删除、跳转）

## Technical Notes

### 参考 Codex 方案（简化版，不含迁移和自愈）

**1. storage-keys.uts 添加：**
```ts
export function getDraftIndexKey(): string {
  return `${KEY_PREFIX}:idx:draft`
}
```

**2. storage-repository.uts 修改 saveSession()：**
```ts
// 在现有日期索引维护后添加
const status = sessionData['status'] != null ? (sessionData['status'] as string) : ''
if (status == 'draft') {
  addToIndex(getDraftIndexKey(), key)
} else {
  removeFromIndex(getDraftIndexKey(), key)
}
```

**3. storage-repository.uts 修改 deleteSession()：**
```ts
// 在现有日期索引清理后添加
removeFromIndex(getDraftIndexKey(), key)
```

**4. storage-repository.uts 添加查询接口：**
```ts
export function getDraftSessionKeys(): string[] {
  return getIndexList(getDraftIndexKey())
}
```

**5. pages/index/index.uvue 修改 loadSessions()：**
- 使用 `getDraftSessionKeys()` 获取草稿 key 列表
- 使用 `parseSessionKey()` 解析 key 获取日期、环节、轮次
- 移除 `uni.getStorageInfoSync()` 和 `isSessionKey()` 的使用
- 移除 `loadData()` 的导入（不再需要加载完整数据）

## Constraints
- 不实现迁移逻辑（项目未投产）
- 不实现自愈逻辑（避免冗余代码）
- 保持现有排序逻辑（按日期倒序）
