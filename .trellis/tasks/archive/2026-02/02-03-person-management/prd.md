# 人员管理：花名册导入与拼音搜索

## Goal

实现人员花名册的导入、管理和拼音快速搜索功能，为工分录入页的人员选择提供基础支撑。

## Requirements

### 1. 花名册导入页面 (pages/mine/roster-import.uvue)

#### 1.1 导入方式
- **粘贴导入**：从 Excel 复制姓名后粘贴（支持换行符/空格/逗号分隔）
- OCR 功能暂不实现（二期）

#### 1.2 校对列表
- 展示识别出的姓名列表
- 支持：删除错误项、编辑错别字
- 一键去重（重复项高亮提示）
- 与现有花名册对比，标记"新增"/"已存在"

#### 1.3 确认入库
- 写入花名册并自动生成拼音索引
- 使用 `pinyin-match` 库进行拼音匹配（无需预计算存储拼音）

### 2. 人员列表管理

#### 2.1 展示
- 显示当前花名册所有人员
- 按拼音首字母分组（A-Z）
- 显示人员状态（在职/停用）

#### 2.2 操作
- 手工新增单个人员
- 编辑人员姓名
- 停用/启用人员（软删除）

### 3. 拼音快速搜索服务 (domain/services/PersonSearchService.uts)

#### 3.1 搜索能力
- 使用 `pinyin-match` 库实现
- 支持：中文、全拼、首字母匹配
- 示例：输入 `ZS` → 匹配 `张三`、`张四`

#### 3.2 API 设计
```typescript
// 搜索人员
function searchPersons(keyword: string, persons: Person[]): Person[]

// 过滤已占用人员（用于工分录入页）
function filterAvailablePersons(
  keyword: string,
  allPersons: Person[],
  occupiedIds: number[]
): Person[]
```

## Technical Notes

### pinyin-match 用法
```javascript
import PinyinMatch from 'pinyin-match'
// 返回匹配位置 [start, end] 或 false
PinyinMatch.match('张三', 'zs')  // [0, 1]
PinyinMatch.match('张三', 'zhangsan')  // [0, 1]
PinyinMatch.match('张三', 'abc')  // false
```

### 存储
- 人员数据：`pp:data:persons`（已有）
- Person 模型已有 `name_pinyin_full` 和 `name_pinyin_initials` 字段，但本次使用 pinyin-match 实时匹配，无需预存拼音

### UTS 注意事项
- 使用 `type` 而非 `interface`
- 使用 `null` 而非 `undefined`
- 对象字面量使用 `as UTSJSONObject` 类型断言

## Acceptance Criteria

- [ ] 粘贴导入：支持换行符/空格/逗号分隔的姓名批量导入
- [ ] 校对列表：可删除、编辑、去重
- [ ] 确认入库：写入存储并可在列表查看
- [ ] 人员列表：按拼音首字母分组展示
- [ ] 手工新增：可添加单个人员
- [ ] 停用/启用：可切换人员状态
- [ ] 拼音搜索：输入关键词可实时过滤匹配人员
- [ ] 搜索支持：中文、全拼、首字母三种匹配方式

## Out of Scope

- OCR 图片识别（二期）
- 人员分组/班组管理
- 人员头像
