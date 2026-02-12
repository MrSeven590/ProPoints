# 工分录入自动保存

## 目标

在工分录入页面 (`pages/work/entry.uvue`) 实现自动保存功能,防止用户数据丢失。

## 需求

### 功能需求

1. **自动保存触发**
   - 用户修改任何数据后,自动触发保存
   - 使用防抖机制,避免频繁保存
   - 防抖延迟: 1200ms

2. **保存时机**
   - 数据变更事件触发 (防抖)
   - 页面隐藏时立即保存 (`onHide`)
   - 页面卸载时立即保存 (`onUnload`)

3. **状态限制**
   - 仅对 `status == 'draft'` 的会话自动保存
   - 已提交的会话 (`status == 'submitted'`) 不自动保存
   - 提交过程中 (`isSubmitting == true`) 不自动保存

4. **避免冲突**
   - 手动保存草稿时,取消自动保存定时器
   - 提交时,取消自动保存定时器

### 非功能需求

1. **性能**
   - 使用防抖减少保存频率
   - 仅在数据变更时保存 (通过 revision 比对)

2. **用户体验**
   - 静默保存,不显示 toast
   - 保存失败时才显示错误提示

3. **代码质量**
   - 遵循 UTS 语言规范
   - 遵循项目状态管理规范
   - 复用现有的 `buildSessionData()` 和 `saveSession()` 方法

## 验收标准

- [ ] 用户修改数据后 1.2 秒自动保存
- [ ] 页面隐藏/卸载时立即保存
- [ ] 已提交会话不会被自动保存
- [ ] 提交过程中不会触发自动保存
- [ ] 手动保存和提交时取消自动保存定时器
- [ ] 定时器在页面卸载时正确清理
- [ ] 保存失败时显示错误提示

## 技术方案

### 数据变更触发点

在以下方法末尾调用 `scheduleAutoSave()`:
- `onBinsChange()`
- `onCrossBinChange()`
- `onBinCardChange()`
- `onBinKojiChange()`
- `onAddCrossBin()`
- `onRemoveCrossBin()`
- `onConfirmDatePicker()`

### 状态管理

添加以下状态:
```uts
data() {
  return {
    // 现有状态...
    autoSaveTimer: 0 as number,
    autoSaveDebounceMs: 1200 as number,
    draftRevision: 0 as number,
    savedRevision: 0 as number,
    isSubmitting: false as boolean
  }
}
```

### 核心方法

1. `scheduleAutoSave()` - 防抖调度自动保存
2. `doAutoSave()` - 执行自动保存
3. `cancelAutoSave()` - 取消自动保存定时器

### 生命周期处理

- `onHide()` - 立即保存并取消定时器
- `onUnload()` - 立即保存并取消定时器

## 参考

- Codex 建议: 混合策略 (事件驱动 + 生命周期刷新)
- 现有代码: `saveDraft()` 方法 (行 814-830)
- 定时器模式: `components/biz-worker-selector-pinyin/biz-worker-selector-pinyin.uvue`
