# Riichi Mahjong Library

[![npm version](https://img.shields.io/npm/v/@pai-forge/riichi-mahjong)](https://www.npmjs.com/package/@pai-forge/riichi-mahjong)


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
