## 0.9.0 (2026-09-07)

`uraDoraMarkers`（裏ドラ表示牌）を公開 API から削除しました。渡していた場合は
コンパイルエラーになりますが、この値は従来から点数計算に反映されていなかったため、
指定を消しても点数は変わりません。裏ドラを点数に乗せていた利用側は、立直の翻と
セットで加算する形に移してください。移行手順は「移行ガイド」を参照してください。

### 移行ガイド (0.8.x → 0.9.0)

`uraDoraMarkers` を渡していた場合はその指定を削除し、立直と裏ドラの加算を呼び出し側に移してください。
渡していなかった場合、点数計算の結果は変わりません（従来から無視されていたため）。

```ts
// Before: 渡しても効いていなかった
const result = calculateScoreForTehai(tehai, {
  agariHai,
  isTsumo,
  bakaze,
  jikaze,
  doraMarkers,
  uraDoraMarkers, // 無視されていた
});

// After: 表ドラまでをライブラリが計算し、立直と裏ドラは利用側で足して点数を再計算する
const scored = calculateScoreForTehai(tehai, {
  agariHai,
  isTsumo,
  bakaze,
  jikaze,
  doraMarkers,
  ruleConfig,
});

const result = scored.map((base) => {
  if (!isRiichi) return base;
  const riichiHan = isDoubleRiichi ? 2 : 1;
  const uraDoraHan = countDora(tehai, uraDoraMarkers);
  // 符と役満単位は翻を足しても変わらないため元の結果から引き継ぐ。
  // 点数区分（満貫・数え役満・切り上げ満貫）はライブラリが再判定する
  return calculateScore(base.han + riichiHan + uraDoraHan, base.fu, {
    isOya: jikaze === HaiKind.Ton,
    isTsumo,
    ruleConfig,
    yakumanMultiplier: base.yakumanMultiplier,
  });
});
```

`calculateScore` の結果は構造解釈の詳細（`detail`）を持たないため、符の内訳や待ちの形は元の結果（上記の `base`）から参照してください。

### Added

- `MspzString` / `ExtendedMspzString` 型をエクスポートするようにした
  - 型ガード `isMspz` / `isExtendedMspz` は公開されていた一方、絞り込み先の型が公開されていなかった。そのため利用側は絞り込みはできても、その値を変数や関数の引数として型付けできなかった（型に名前を付けられない状態だった）
  - 追加のみで既存の型・関数に変更はない

### Changed

- 拡張MSPZ の解析で、囲みの構造が壊れている入力のエラーメッセージが変わる場合がある
  - `parseExtendedMspz` を「囲みの切り分け」と「各ブロックの面子解釈」に分割した内部リファクタリングに伴う変更
  - 影響するのは**二重に不正な入力**のみ（例: `"[135m]abc["` は非連続のチーであり、かつ囲みが閉じていない）。従来は面子のエラー、現在は構造のエラーを返す
  - `Err` を返すこと・エラーの型が `MspzParseError` であることは変わらない。単独の不正（`"[135m]"` / `"[135m"` / `"123m]"` / `"[[123m]]"`）ではメッセージも従来どおり

### Removed

- `uraDoraMarkers`（裏ドラ表示牌）を公開 API から削除した（`DetectYakuConfig` / `ScoreCalculationConfig`）
  - このフィールドは値がコンテキストに詰め替えられるだけで、点数計算からは一度も参照されていなかった。裏ドラ表示牌を渡しても翻は増えず、エラーも警告も出ないまま黙って無視されていた
  - 実装を足すのではなく削除を選んだのは、本ライブラリが立直を役として数えないため。立直を扱わないまま裏ドラだけを受け取ると「立直の翻は付かないのに裏ドラの翻は乗る」という、実際の和了には存在しない結果を返すことになる。裏ドラを扱うなら立直・ダブル立直・一発を役として数える設計とセットでなければ整合せず、それは責務範囲を変える別の判断になる（詳細は [docs/scope.md](docs/scope.md) を参照）
  - 立直の翻と裏ドラの翻は利用側でセットで加算すること。表示牌からドラを求める `getDoraNext`、手牌中の枚数を数える `countDora`、翻数と符から点数を求める `calculateScore` は引き続き公開しているため、そのまま流用できる

## 0.8.0 (2026-09-04)

場風・自風の役牌を役として判定するようになりました。`YakuName` にキーが増えるため、
役名を網羅する対応表を持つ利用側はコンパイルエラーになります。移行手順は
「移行ガイド」を参照してください。

### 移行ガイド (0.7.x → 0.8.0)

#### 1. `YakuName` に `"Bakaze"` / `"Jikaze"` が増えた

`Record<YakuName, ...>` のように役名を網羅する対応表には 2 つのキーを追加してください。

```ts
const YAKU_NAME_JA: Record<YakuName, string> = {
  // ...
  Haku: "白",
  Hatsu: "發",
  Chun: "中",
  Bakaze: "場風牌", // 追加
  Jikaze: "自風牌", // 追加
};
```

#### 2. 利用側で風牌の役牌を補完していた場合は削除する

0.7.x までは `detectYaku` が風牌の役牌を返さなかったため、利用側で手牌の風牌を
数えて翻を足していた場合があります。0.8.0 では `detectYaku` の結果と
`calculateScoreForTehai` の翻数に含まれるので、そのままでは二重に数えます。

```ts
// 0.7.x: 利用側で補完していた
const yaku = detectYaku(tehai, config);
const kazeHan = countKoutsu(tehai, config.bakaze) > 0 ? 1 : 0; // 削除する

// 0.8.0: ライブラリが返す
const yaku = detectYaku(tehai, config);
// 東場・東家で東の刻子があれば [["Bakaze", 1], ["Jikaze", 1], ...]
```

### Added

- 場風・自風の役牌を役として判定するようにした（`YakuName` に `"Bakaze"` / `"Jikaze"` を追加）
  - 場風の刻子・槓子で `Bakaze` 1翻、自風で `Jikaze` 1翻。連風牌（場風＝自風）の刻子は両方が成立して合計 2翻になる
  - 従来は三元牌（白・發・中）だけが役牌として判定され、風牌の役牌は `detectYaku` の結果にも翻数にも含まれていなかった。一方で雀頭の役牌判定（平和の不成立・雀頭符）では場風・自風を役牌として扱っており、ライブラリ内で扱いが食い違っていた
  - この結果、風牌の役牌だけが役の手は `calculateScoreForTehai` が `NoYakuError` ではなく点数を返すようになり、風牌の役牌を含む手は翻数がその分増える。高点法の解釈選択にも風牌の翻が反映される
  - 利用側で風牌の役牌を補完していた場合は二重に数えないよう削除すること。`YakuName` を網羅する対応表（`Record<YakuName, ...>` など）には 2 つのキーを追加する必要がある
- `Yakuhai` 型を三元牌（`Sangenpai`）と風牌（`KazeYakuhai`）の合併に拡張し、両方の型をエクスポートした

## 0.7.0 (2026-09-04)

破壊的変更を3件含みます。移行手順は「移行ガイド」を参照してください。

### 移行ガイド (0.6.x → 0.7.0)

#### 1. `calculateScoreForTehai` が `Result` を返す

役なし（形式和了）は例外ではなく `Err` で返るようになりました。

```ts
// 0.6.x
try {
  const score = calculateScoreForTehai(tehai, config);
  console.log(score.han, score.fu);
} catch (e) {
  // NoYakuError
}

// 0.7.0
const result = calculateScoreForTehai(tehai, config);
if (result.isErr()) {
  // result.error は NoYakuError
} else {
  const score = result.value;
  console.log(score.han, score.fu);
}
```

`result.match(...)` / `result.map(...)` など neverthrow の API も使えます。
エラー型は `NoYakuError` として公開済みです。

#### 2. `detectYaku` の `bakaze` / `jikaze` が必須

```ts
// 0.6.x（省略できたが、平和判定に到達すると MahjongArgumentError が投げられた）
detectYaku(tehai, { agariHai });

// 0.7.0
detectYaku(tehai, { agariHai, bakaze: HaiKind.Ton, jikaze: HaiKind.Nan });
```

雀頭が役牌かどうか（平和の判定）と連風牌の雀頭符の算出に必要なため、
型で必須にしました。`calculateScoreForTehai` の `config` は元から必須です。

#### 3. `Fu` 型の上限が 170 に拡張

`Fu` を網羅的に扱っている場合（`switch` や独自の符テーブルなど）は
120〜170 の分岐を追加してください。么九牌の暗槓を複数含む手で実際に
110符を超えます。

```ts
// 0.6.x: 20 | 25 | 30 | ... | 110
// 0.7.0: 20 | 25 | 30 | ... | 110 | 120 | 130 | 140 | 150 | 160 | 170
```

### Changed

- **破壊的変更**: `calculateScoreForTehai` が `Result<ScoreResult, NoYakuError>` を返すようになった（[#3](https://github.com/PaiForge/riichi-mahjong/issues/3)）
  - 役なし（形式和了）は呼び出し側が必ず扱うべきドメイン上の失敗であり、シグネチャに現れない例外ではハンドリング漏れを招くため
  - 移行: `const result = calculateScoreForTehai(...)` → `if (result.isErr()) { ... } else { result.value }`
- **破壊的変更**: `detectYaku` の `config` で `bakaze` / `jikaze` が必須になった（[#3](https://github.com/PaiForge/riichi-mahjong/issues/3)）
  - 雀頭が役牌かどうか（平和）と連風牌の雀頭符の判定に必要。従来は未指定でも型は通り、平和判定に到達した時点で `MahjongArgumentError` が投げられていた
- **破壊的変更**: `Fu` 型の上限を110符から170符に拡張した（120〜170を追加）
- 公開されていなかったエラー型 `TehaiError`（`calculateShanten` / `validateTehai*` の Err 型）をエクスポートした

### Fixed

- 拡張MSPZパーサーがチー（順子副露）の連続性を検証していなかった問題を修正（[#4](https://github.com/PaiForge/riichi-mahjong/issues/4)）
  - `[135m]` `[123z]` `[12m3p]` のような非連続・異色の3枚がチーとして受理されていたが、`MspzParseError` を返すようになった
  - あわせて、チーの牌の並びを昇順に正規化するようにした（表記上の並び順に意味はなく、順子がソート済みであることを前提とする処理があるため）
- 110符を超える手で例外が投げられていた問題を修正（么九牌の暗槓を複数含む形。例: `(1111m)(9999m)(1111z)[999p]22z` ツモ = 130符）
- 公開APIの型シグネチャテストが型チェックされておらず、実装と食い違ったまま通っていた問題を修正（`typecheck` の対象に `tests/` を追加）

## 0.6.0 (2026-09-04)

### Added

- 切り上げ満貫 `ruleConfig.kiriageMangan` を追加（既定 false・[#5](https://github.com/PaiForge/riichi-mahjong/issues/5)）
  - 基本点1920（30符4翻・60符3翻）を満貫の支払いに切り上げる（子ロン 7700 → 8000、親ロン 11600 → 12000、子ツモ 2000/3900 → 2000/4000、親ツモ 3900オール → 4000オール）
  - 翻数・符は変わらず、点数区分（`scoreLevel`）と支払いだけが満貫になる
- `calculateScore(han, fu, config)` を公開（点数表の生成など、手牌を伴わず翻数と符だけが分かっている場面向け）
- ルール差分設定の型を整理し、`RuleConfig`（= `FuRuleConfig` + `ScoreLevelRuleConfig` + `YakumanRuleConfig`）を共有の型として公開
  - 切り上げ満貫は符のルールではないため `ScoreLevelRuleConfig` を新設。`FuRuleConfig` / `YakumanRuleConfig` は従来どおり利用可能（定義位置の移動のみ・後方互換）

### Fixed

- 高点法の判定をライブラリ内で一意にした（[#6](https://github.com/PaiForge/riichi-mahjong/issues/6)）
  - `detectYaku` と `calculateScoreForTehai` が別々の評価軸（前者は翻数の合計、後者は支払い点数）で和了構造を選んでいたため、同一の和了手でも役リスト・翻数・符・待ちが食い違っていた問題を修正
  - 採用する解釈の決定を `selectHouraInterpretation` に集約し、両APIはその結果を参照するだけにした
  - 解釈の比較を「点数（基本点）→ 翻数 → 符」の辞書式に変更し、同点時のタイブレークを決定的にした（従来は面子分解の列挙順に依存）
  - この結果、`detectYaku` は「翻数は同じだが点数の低い解釈」を返さなくなった（例: `677778888999m + 55p` ロン `6m` は平和+一盃口(2翻30符)ではなく三暗刻(2翻50符)を採用）

### Changed

- `DetectYakuConfig.ruleConfig` が `RuleConfig` 全体（符・点数区分のルールを含む）を受け付けるようになった（型の拡大のみ・後方互換）
  - 符と点数が高点法の解釈選択に影響するため、点数計算と同じ解釈を得るには両APIに同じルール設定を渡す

## 0.5.0 (2026-09-03)

### Added

- 役満ルール設定 `YakumanRuleConfig` を追加（`DetectYakuConfig.ruleConfig` / `ScoreCalculationConfig.ruleConfig`）
  - 形によるダブル役満の採否をフラグで指定: 四暗刻単騎 (`suuankouTanki`)・大四喜 (`daisuushii`)・国士無双十三面待ち (`kokushiMusouJuusanmen`)・純正九蓮宝燈 (`junseiChuurenPoutou`)
  - 複合役満の合算 (`fukugouYakuman`): 複数役満の同時成立時に役満単位を合算して支払う（トリプル以上も表現可能）
- `ScoreResult.yakumanMultiplier` を追加（支払いが役満何個分か。0 = 役満役なし）
- `getYakumanMultiplier` を公開（役満単位の集計ルールの実装）
- `RuleConfig` 型を追加（`FuRuleConfig` + `YakumanRuleConfig` の統合。`ScoreCalculationConfig.ruleConfig` の型）

### Changed

- **破壊的変更**: ダブル役満は既定で無効になった
  - 四暗刻単騎はルール未指定なら 13 翻（従来はハードコードで 26 翻）
  - `getScoreLevel` が `DoubleYakuman` を返さなくなった（26 翻以上でも `Yakuman`。数え役満は役満止まり。`DoubleYakuman` は役満単位が 2 以上のときに点数計算側で付く）
  - 役満役なしで 26 翻以上に達した手（リーチ+裏+ドラ等）が誤ってダブル役満の支払いになる問題もこれで解消

## 0.4.2 (2026-07-12)

### Changed

- 内部リファクタリング（公開APIの変更なし・後方互換）
  - core定数の集約（風牌・三元牌・么九牌ID）とドラ循環判定のデータ駆動化
  - 手牌バリデーション（Tehai13/14）の重複排除、Result合成による宣言的な記述への変更
  - 拡張MSPZパーサーの囲みブロック（`[...]`/`(...)`）走査ロジックの統一
  - シャンテン計算から無効化していたバリデーション呼び出しを削除し、探索処理を整理
  - YakuBuilder をミューテーションするクラスから不変なファクトリ関数へ置換
  - 役判定ヘルパー（順子ペア数、一色系判定など）の集約と役定義の重複排除
  - 符計算ロジックを構成要素（面子符・雀頭符・待ち符・和了符）ごとの純関数に分割

## 0.4.1 (2026-06-27)

### Changed

- 内部リファクタリング（公開APIの変更なし・後方互換）
  - コード重複の除去: 役定義のボイラープレート、字牌/色算出、刻子・順子・ブロック抽出、三色判定、固定符計算の共通化
  - 責務分離・モジュール分割: 点数の純粋計算（calculation.ts）、MSPZ パーサ、型定義（types/）の分割、countHaiKind の分離、和了解釈の最良選択（selectBestInterpretation）の共通化
  - 未使用コード（factory.ts）の削除と役定義生成機構の統一

## 0.4.0 (2026-06-25)

### Added

- 連風牌の雀頭符を FuRuleConfig で 2符/4符 選択可能にする

## 0.3.6 (2026-03-02)

### Fixed

- 役の判定ロジックの共通化と不要コードの削除
- カスタム例外パターンの廃止と Result 型への移行

## 0.3.5 (2026-02-25)

### Fixed

- 公開APIのI/F改善(多すぎる引数を設定の形状に集約)

## 0.3.4 (2026-02-23)

### Fixed

- 最高得点を算出したコンテキストを明示的に返すインターフェースに変更

## 0.3.3 (2026-02-14)

### Fixed

- 一盃口と二盃口が複合するバグを修正

## 0.3.2 (2026-02-14)

### Fixed

- 役満成立時に通常役が不正に複合するバグを修正

## 0.3.1 (2026-01-14)

### Changed

- ESM 互換性向上（vitest/vite-node で動作するように）を目的としてtsc → Vite バンドルに変更

## 0.3.0 (2026-01-11)

### Added

- バリデーション関数や型ガードなど汎用的なI/Fを公開APIに追加
- AIのメモリ調整
- 符を型定義する
- カスタム例外を追加

### Changed

- 点数計算関数を改善
  - I/Fを変更
  - 責務過多になっていたため関数分割
- 不正な手牌を使ったテストを修正

## 0.2.0 (2026-01-10)

### Added

- 手牌バリデーションに牌種枚数チェックを追加

### Changed

- 術語表記を統一
- ドキュメント更新

## 0.1.0 (2025-12-20)

- 初回リリース
