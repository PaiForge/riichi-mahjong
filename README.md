# Riichi Mahjong Library

[![npm version](https://img.shields.io/npm/v/@pai-forge/riichi-mahjong)](https://www.npmjs.com/package/@pai-forge/riichi-mahjong)


リーチ麻雀のロジック（シャンテン数計算、点数計算など）を提供するTypeScriptライブラリです。

> [!NOTE]
> This package is **Pure ESM**. Please use `import` (not `require`) to use this library.
<br>
本パッケージは **Pure ESM** です。利用する際は `require` ではなく `import` を使用してください。

## 対応仕様 (Supported Specifications)

- **手牌表記法**: [Extended MPSZ](https://github.com/PaiForge/extended-mpsz) **2.0（Draft）**
  - `parseMpsz` / `parseExtendedMpsz` が仕様どおりに解釈し、`formatMpsz` が第 7 節の正規形に変換します。
  - 旧仕様（Extended MSPZ 1.x）の表記（方向注釈のない `[123m]` など）は受理しません。移行手順は [CHANGELOG](CHANGELOG.md) を参照してください。

```ts
import {
  parseExtendedMpsz,
  formatMpsz,
  tehaiToHaiKindId,
} from "@pai-forge/riichi-mahjong";

// 赤 5p を上家からチー、中を対面からポンして加槓
const parsed = parseExtendedMpsz("123m789s11z[40-6p]{7=777^z}");
if (parsed.isOk()) {
  // 正規形（等値比較・保存用）
  formatMpsz(parsed.value); // => "123m789s11z[40-6p]{7=777^z}"
  // 役・点数計算に渡す前に牌種 ID へ変換する（赤属性を落とす）
  const tehai = tehaiToHaiKindId(parsed.value);
}
```

## 前提条件 (Prerequisites)

開発やテスト実行には以下のツールが必要です。

- **Node.js**: v20.0.0 以上
- **Docker**: 受け入れテスト（リファレンス実装との比較）を実行する場合は必要

## セットアップ (Setup)

依存パッケージをインストールします。

```bash
npm install @pai-forge/riichi-mahjong
```

## テストの実行 (Running Tests)

### ユニットテスト (Unit Tests)

`src` ディレクトリ内の主要なロジックに対するユニットテストを実行します。

```bash
npm test
```
または
```bash
npx vitest src
```

### 受け入れテスト (Acceptance Tests)

Pythonの [`mahjong`](https://github.com/MahjongRepository/mahjong) ライブラリをリファレンス実装として使用し、計算結果の相互検証を行います。
リファレンス実装は Docker イメージ `riichi-mahjong-verifier` 上で実行するため、ホストに Python は不要です。
イメージが無い場合は初回実行時に `docker/Dockerfile.verification` から自動的にビルドされます。
Docker が利用できない場合、受け入れテストはスキップされずに失敗します。

```bash
npm run test:acceptance
```

イメージを手動でビルドする場合:

```bash
docker build -t riichi-mahjong-verifier -f docker/Dockerfile.verification .
```

特定のテストファイルのみを実行する場合:

```bash
npx vitest run tests/acceptance/shanten.test.ts
```

詳細は [docs/testing-policy.md](docs/testing-policy.md) を参照してください。

## その他のコマンド (Other Commands)

- **ビルド**: `npm run build`
- **リント**: `npm run lint`
- **フォーマット**: `npm run format`
