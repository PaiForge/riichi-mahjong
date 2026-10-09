import { Result, ok, err } from "neverthrow";
import { isTuple3, isTuple4 } from "../../utils/assertions";
import { isValidShuntsu } from "../../core/mentsu";
import { compareHaiCode, haiCodeToKindId } from "../../core/hai";
import { MpszParseError } from "../../errors";
import {
  type CompletedMentsu,
  type Furo,
  type HaiCode,
  Tacha,
} from "../../types";
import type { Annotation, ScannedBlock, ScannedTile } from "./mpsz-scanner";
import { digitToHaiCode } from "./mpsz-hai";

/** 方向注釈 → 鳴き元 */
const TACHA_OF_DIRECTION: ReadonlyMap<Annotation, Tacha> = new Map([
  ["-", Tacha.Kamicha],
  ["=", Tacha.Toimen],
  ["+", Tacha.Shimocha],
]);

/** 牌コードに変換済みの、注釈付きの牌 */
interface AnnotatedHai {
  readonly code: HaiCode;
  readonly annotation: Annotation | undefined;
}

/**
 * ブロック内の牌を牌コードへ変換する。1 枚でも無効な数字があれば Err。
 */
function toAnnotatedHais(
  tiles: readonly ScannedTile[],
  block: ScannedBlock,
): Result<readonly AnnotatedHai[], MpszParseError> {
  return Result.combine(
    tiles.map((tile) =>
      digitToHaiCode(tile.digit, block.suit).map((code) => ({
        code,
        annotation: tile.annotation,
      })),
    ),
  );
}

/**
 * 注釈の内訳。方向注釈が付いた牌と `^` が付いた牌をそれぞれ取り出す。
 */
interface AnnotationSummary {
  readonly directed: readonly AnnotatedHai[];
  readonly added: readonly AnnotatedHai[];
}

/**
 * ブロック内の注釈を集計する。
 */
function summarizeAnnotations(
  hais: readonly AnnotatedHai[],
): AnnotationSummary {
  return {
    directed: hais.filter(
      (h) => h.annotation !== undefined && TACHA_OF_DIRECTION.has(h.annotation),
    ),
    added: hais.filter((h) => h.annotation === "^"),
  };
}

/**
 * 牌コードの列が同一牌種（赤属性は無視）かを判定する。
 */
function isAllSameKind(codes: readonly HaiCode[]): boolean {
  const kinds = codes.map(haiCodeToKindId);
  return kinds.every((k) => k === kinds[0]);
}

/**
 * 面子の牌を正規形の整列順（SPEC 7.1）に並べる。
 */
function sortCodes(hais: readonly AnnotatedHai[]): HaiCode[] {
  return hais.map((h) => h.code).sort(compareHaiCode);
}

/**
 * 方向注釈 1 つから鳴き元と鳴いた牌を取り出す。
 */
function resolveDirection(
  directed: readonly AnnotatedHai[],
  blockText: string,
): Result<
  {
    readonly from: Tacha;
    readonly nakiHai: HaiCode;
    readonly annotation: Annotation;
  },
  MpszParseError
> {
  const [only] = directed;
  if (only?.annotation === undefined || directed.length !== 1) {
    return err(
      new MpszParseError(
        `方向注釈（- = +）はちょうど 1 つ必要です: ${blockText}`,
      ),
    );
  }
  const from = TACHA_OF_DIRECTION.get(only.annotation);
  if (from === undefined) {
    return err(new MpszParseError(`方向注釈ではありません: ${blockText}`));
  }
  return ok({ from, nakiHai: only.code, annotation: only.annotation });
}

/**
 * 暗槓 `(...)`: 同一牌種 4 枚。注釈は走査の段階で拒否済み。
 */
function buildAnkan(
  hais: readonly AnnotatedHai[],
  blockText: string,
): Result<CompletedMentsu<HaiCode>, MpszParseError> {
  const codes = sortCodes(hais);
  if (!isTuple4(codes) || !isAllSameKind(codes)) {
    return err(
      new MpszParseError(
        `暗槓は同一牌種 4 枚でなければなりません: ${blockText}`,
      ),
    );
  }
  const mentsu: CompletedMentsu<HaiCode> = { type: "Kantsu", hais: codes };
  return ok(mentsu);
}

/**
 * 副露 `[...]`: チー・ポン・大明槓。方向注釈ちょうど 1 つ、`^` は不可。
 */
function buildOpenMeld(
  hais: readonly AnnotatedHai[],
  blockText: string,
): Result<CompletedMentsu<HaiCode>, MpszParseError> {
  const { directed, added } = summarizeAnnotations(hais);
  if (added.length > 0) {
    return err(new MpszParseError(`副露に ^ は書けません: ${blockText}`));
  }
  return resolveDirection(directed, blockText).andThen(({ from, nakiHai }) => {
    const codes = sortCodes(hais);

    if (isTuple4(codes) && isAllSameKind(codes)) {
      const furo: Furo<HaiCode> = { type: "Daiminkan", from, nakiHai };
      const mentsu: CompletedMentsu<HaiCode> = {
        type: "Kantsu",
        hais: codes,
        furo,
      };
      return ok(mentsu);
    }
    if (isTuple3(codes) && isAllSameKind(codes)) {
      const furo: Furo<HaiCode> = { type: "Pon", from, nakiHai };
      const mentsu: CompletedMentsu<HaiCode> = {
        type: "Koutsu",
        hais: codes,
        furo,
      };
      return ok(mentsu);
    }
    if (isTuple3(codes) && isValidShuntsu(codes.map(haiCodeToKindId))) {
      if (from !== Tacha.Kamicha) {
        return err(
          new MpszParseError(`チーは上家（-）からしか行えません: ${blockText}`),
        );
      }
      const furo: Furo<HaiCode> = { type: "Chi", from, nakiHai };
      const mentsu: CompletedMentsu<HaiCode> = {
        type: "Shuntsu",
        hais: codes,
        furo,
      };
      return ok(mentsu);
    }
    return err(
      new MpszParseError(
        `チー・ポン・大明槓のいずれにも当たらない構成です: ${blockText}`,
      ),
    );
  });
}

/**
 * 加槓 `{...}`: 同一牌種 4 枚。方向注釈と `^` を別の牌に 1 つずつ。
 */
function buildKakan(
  hais: readonly AnnotatedHai[],
  blockText: string,
): Result<CompletedMentsu<HaiCode>, MpszParseError> {
  const { directed, added } = summarizeAnnotations(hais);
  const [kakan] = added;
  if (kakan === undefined || added.length !== 1) {
    return err(
      new MpszParseError(`加槓には ^ がちょうど 1 つ必要です: ${blockText}`),
    );
  }
  return resolveDirection(directed, blockText).andThen(({ from, nakiHai }) => {
    const codes = sortCodes(hais);
    if (!isTuple4(codes) || !isAllSameKind(codes)) {
      return err(
        new MpszParseError(
          `加槓は同一牌種 4 枚でなければなりません: ${blockText}`,
        ),
      );
    }
    const furo: Furo<HaiCode> = {
      type: "Kakan",
      from,
      nakiHai,
      kakanHai: kakan.code,
    };
    const mentsu: CompletedMentsu<HaiCode> = {
      type: "Kantsu",
      hais: codes,
      furo,
    };
    return ok(mentsu);
  });
}

/**
 * 走査したブロックを表記に戻す（エラーメッセージ用）。
 */
function blockToText(block: ScannedBlock): string {
  const body =
    block.tiles.map((t) => `${t.digit}${t.annotation ?? ""}`).join("") +
    block.suit;
  switch (block.kind) {
    case "open":
      return `[${body}]`;
    case "kakan":
      return `{${body}}`;
    case "ankan":
      return `(${body})`;
    case "closed":
      return body;
  }
}

/**
 * 面子ブロック（副露・加槓・暗槓）を完成面子 (CompletedMentsu) に変換する。
 *
 * SPEC 第 4 節（数字の範囲・赤 5）と第 6 節（面子ブロックの枚数・構成・注釈）を
 * ここで検証する。面子の牌は正規形の整列順（SPEC 7.1）に並べて返す。
 *
 * @param block 走査済みの面子ブロック（`kind` が closed 以外）
 * @returns 完成面子。面子として不正なら Err
 */
export function parseMentsuBlock(
  block: ScannedBlock,
): Result<CompletedMentsu<HaiCode>, MpszParseError> {
  const blockText = blockToText(block);
  return toAnnotatedHais(block.tiles, block).andThen((hais) => {
    switch (block.kind) {
      case "ankan":
        return buildAnkan(hais, blockText);
      case "open":
        return buildOpenMeld(hais, blockText);
      case "kakan":
        return buildKakan(hais, blockText);
      case "closed":
        return err(
          new MpszParseError(`面子ブロックではありません: ${blockText}`),
        );
    }
  });
}
