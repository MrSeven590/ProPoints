# 更新日志

## 1.0.2（2026-05-27）

- 修复 iOS 编译报错：`uni_modules/MrS590-pinyin-match/utssdk/app-iosc/index.swift` 出现 `expressions are not allowed at the top level`。
- 将 iOS 入口 `uni_modules/MrS590-pinyin-match/utssdk/app-ios/index.uts` 中的 `export const name: Type = function (...) {}` 改为 `export function name(...)`，避免 HBuilderX 生成 Swift 顶层表达式。

## 1.0.1（2026-04-07）

- 修复字典误映射：`uni_modules/MrS590-pinyin-match/utssdk/pinyin-match.uts:32`
- 从 `SIMPLIFIED_DICT.set("an", "...厂广")` 改为 `SIMPLIFIED_DICT.set("an", "...厂")`，避免 `getInitials("广州")` 因为“取第一个拼音”而变成 `az`。

## 1.0.0（2026-02-03）

- 首次发布：`pinyinMatch` + `getInitials`（纯 UTS 实现，内置简体拼音字典）。
