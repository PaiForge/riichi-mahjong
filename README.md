# Riichi Mahjong Library

リーチ麻雀のロジック（シャンテン数計算、点数計算など）を提供するTypeScriptライブラリです。

> [!NOTE]
> This package is **Pure ESM**. Please use `import` (not `require`) to use this library.
<br>
本パッケージは **Pure ESM** です。利用する際は `require` ではなく `import` を使用してください。

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
実行時に自動的に検証用のDockerイメージ (`riichi-mahjong-verifier`) がビルドされます。

```bash
npx vitest tests/acceptance
```

特定のテストファイルのみを実行する場合:

```bash
npx vitest tests/acceptance/shanten.test.ts
```

## その他のコマンド (Other Commands)

- **ビルド**: `npm run build`
- **リント**: `npm run lint`
- **フォーマット**: `npm run format`
