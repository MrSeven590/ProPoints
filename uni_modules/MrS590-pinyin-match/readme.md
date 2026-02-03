# MrSeven590-pinyin-match

为 uni-app-x（以及 uni-app Web 构建）提供的纯 UTS 拼音匹配插件。

本插件基于 `pinyin-match` 的核心匹配逻辑，使用纯 UTS 重新实现，并内置简体拼音字典。

原作者 xmflswood，项目地址：https://github.com/xmflswood/pinyin-match

## API

### `pinyinMatch(input: string, keyword: string): boolean`

支持的匹配模式：
- 原文包含匹配（忽略大小写）
- 拼音全拼匹配（如 `zhang` 匹配 `张`）
- 拼音首字母匹配（如 `zs` 匹配 `张三`）

### `getInitials(cn: string): string`

获取中文字符串的拼音首字母（如 `张三` -> `zs`）。

## 使用方式（uni-app x / `.uvue`）

```ts
import { pinyinMatch, getInitials } from '@/uni_modules/MrS590-pinyin-match'

const a = pinyinMatch('张三', 'zhang') // true
const b = pinyinMatch('张三', 'zs')    // true
const c = getInitials('张三')         // 'zs'
```
