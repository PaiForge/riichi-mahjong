---
trigger: always_on
---

# コーディング規約 (Code Style & Conventions)

## インポートパス (Import Paths)
**ルール:** `src/` 内では **相対パス** (`../utils` 等) を使用してください。
**理由:** `tsc` 標準ビルドでの互換性確保（エイリアス解決不要化）と、過度なネスト構造の防止。

## Null vs Undefined
**ルール:** `undefined` を排他的に使用してください（`null` は避ける）。
**理由:** JSエンジンのデフォルト値との統一。[Reference](https://typescriptbook.jp/reference/values-types-variables/undefined-vs-null)

## Enum 型の実装
**ルール:** `enum` ではなく **const オブジェクト + Union 型** を使用してください。
```typescript
// ✅ 推奨
export const Direction = { Up: 0, Down: 1 } as const;
export type Direction = typeof Direction[keyof typeof Direction];
```
**理由:** バンドルサイズ削減（Tree-shaking有効化）と型安全性の向上。

## 命名規約 (Naming Conventions)
### ドメイン用語のローマ字化
**ルール:** 麻雀用語は **ローマ字** を使用してください（例: `Tehai`, `Shanten`, `Agari`）。
**理由:** 英語翻訳による意味の曖昧さを排除し、ドメイン概念を正確に表現するため。

### 関数名パターン
**ルール:** `英動詞` + `ローマ字名詞` の形式としてください（例: `calculateAgari`, `decomposeTehai`）。
**理由:** 操作（英語）と対象（ドメイン語）を明確に区別し、可読性を高めるため。
