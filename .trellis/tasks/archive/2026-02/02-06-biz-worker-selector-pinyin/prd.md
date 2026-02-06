# 人员选择器组件（拼音搜索）

## Goal

实现 `biz-worker-selector-pinyin` 组件，支持拼音快速搜索人员，用于工分录入页面的人员选择。

## Requirements

### 核心功能

1. **拼音快速搜索**
   - 支持中文、全拼、首字母匹配（例：输入 `ZS` → `张三`、`张四`）
   - 搜索防抖处理（300ms）
   - 无搜索关键词时按拼音首字母分组展示

2. **人员互斥机制**
   - 接收 `occupiedIds` 属性，已被占用的人员置灰不可选
   - 防止同一会话内重复录入同一人员

3. **选择交互**
   - 单选模式：点击人员即选中并触发 `select` 事件
   - 支持清空当前选择

### Props 定义

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedPersonId` | `number \| null` | `null` | 当前选中的人员 ID |
| `occupiedIds` | `number[]` | `[]` | 已被占用的人员 ID 列表（置灰不可选） |
| `placeholder` | `string` | `'搜索姓名/拼音'` | 搜索框占位文本 |

### Events 定义

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `{ id: number, name: string }` | 选中人员时触发 |
| `clear` | - | 清空选择时触发 |

### UI 结构

```
┌─────────────────────────────────────┐
│ 🔍 [搜索姓名/拼音____________]      │  搜索栏
├─────────────────────────────────────┤
│ A                                   │  字母索引（无搜索时显示）
│ ├─ 艾小明                           │
│ └─ 安琪                             │
│ B                                   │
│ ├─ 白小飞 ✓                         │  ✓ = 当前选中
│ └─ 包子强 (灰)                      │  灰 = 已被占用
│ ...                                 │
└─────────────────────────────────────┘
```

## Technical Notes

### 复用现有服务

- `PersonSearchService.uts` - 搜索和分组功能
  - `searchPersons(keyword, persons)` - 搜索人员
  - `filterAvailablePersons(keyword, allPersons, occupiedIds)` - 过滤已占用
  - `groupByPinyinInitial(persons)` - 按拼音首字母分组
  - `getNonEmptyGroupKeys(groups)` - 获取非空分组字母

### 数据源

- 从 `storage-repository.uts` 的 `loadPersons()` 获取人员列表
- 转换为 `SearchablePerson` 类型用于搜索

### 组件位置

```
components/
  biz-worker-selector-pinyin/
    biz-worker-selector-pinyin.uvue
```

### UTS 约束

- 使用 `type` 而非 `interface`
- 条件语句必须使用布尔值
- 使用 `null` 而非 `undefined`
- 使用 Options API（参考 biz-bin-selector）

## Acceptance Criteria

- [ ] 支持中文、全拼、首字母三种搜索方式
- [ ] 搜索有 300ms 防抖
- [ ] 无搜索时按拼音首字母 A-Z 分组展示
- [ ] 已占用人员（occupiedIds）置灰且不可点击
- [ ] 点击可用人员触发 select 事件
- [ ] 当前选中人员有视觉高亮
- [ ] 样式与 biz-bin-selector 风格一致
