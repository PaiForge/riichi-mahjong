import { Result, ok, err } from "neverthrow";
import { isTuple3, isTuple4 } from "../../utils/assertions";
import { isValidShuntsu } from "../../core/mentsu";
import { MspzParseError } from "../../errors";
import {
  CompletedMentsu,
  FuroType,
  MentsuType,
  Tacha,
  type HaiKindId,
} from "../../types";
import { asMspz, type ExtendedMspzString } from "./mspz-string";
import { parseMspzToHaiKindIds } from "./mspz-tokenizer";

/** 囲みブロックの解釈モード（副露 or 暗槓） */
interface EnclosedBlock {
  readonly mode: "open" | "ankan";
  readonly content: string;
}

/**
 * 囲みブロック文字列から囲み種別と中身を取り出す。
 */
function stripEnclosure(
  block: ExtendedMspzString,
): Result<EnclosedBlock, MspzParseError> {
  if (block.startsWith("[") && block.endsWith("]")) {
    return ok({ mode: "open", content: block.slice(1, -1) });
  }
  if (block.startsWith("(") && block.endsWith(")")) {
    return ok({ mode: "ankan", content: block.slice(1, -1) });
  }
  return err(
    new MspzParseError(
      `Invalid Extended MSPZ block: ${block} (must be [...] or (...))`,
    ),
  );
}

/**
 * 牌ID列と囲み種別から面子種別を判定して CompletedMentsu を生成する。
 *
 * - 暗槓 `(...)`: 同一4枚のみ許容（furo情報なし）
 * - 副露 `[...]`: 同一4枚=大明槓、同一3枚=ポン、連続する3枚=チーとして解釈
 *
 * 鳴き元はデフォルト値（チー=上家、ポン/大明槓=対面）を設定する。
 */
function classifyMentsu(
  ids: readonly HaiKindId[],
  mode: EnclosedBlock["mode"],
  block: ExtendedMspzString,
): Result<CompletedMentsu, MspzParseError> {
  const isAllSame = ids.every((id) => id === ids[0]);

  if (mode === "ankan") {
    if (!isTuple4(ids) || !isAllSame) {
      return err(
        new MspzParseError(
          `Invalid Ankan: ${block} (must be 4 identical tiles)`,
        ),
      );
    }
    return ok({ type: MentsuType.Kantsu, hais: ids });
  }

  if (isTuple4(ids) && isAllSame) {
    return ok({
      type: MentsuType.Kantsu,
      hais: ids,
      furo: { type: FuroType.Daiminkan, from: Tacha.Toimen },
    });
  }
  if (isTuple3(ids) && isAllSame) {
    return ok({
      type: MentsuType.Koutsu,
      hais: ids,
      furo: { type: FuroType.Pon, from: Tacha.Toimen },
    });
  }
  if (isTuple3(ids)) {
    // チーは同色の連続3枚に限る（拡張MSPZの仕様）
    if (!isValidShuntsu(ids)) {
      return err(
        new MspzParseError(
          `Invalid Chi: ${block} (must be 3 consecutive tiles of the same suit)`,
        ),
      );
    }
    // 表記上の並び順に意味はないため、順子は昇順に正規化する。
    // 待ちの判定など、順子がソート済みであることを前提とする処理があるため。
    const sorted = [...ids].sort((a, b) => a - b);
    if (!isTuple3(sorted)) {
      return err(new MspzParseError(`Invalid Chi: ${block}`));
    }
    return ok({
      type: MentsuType.Shuntsu,
      hais: sorted,
      furo: { type: FuroType.Chi, from: Tacha.Kamicha },
    });
  }

  return err(
    new MspzParseError(
      `Invalid Mentsu specification: ${block} (must be 3 or 4 tiles)`,
    ),
  );
}

/**
 * 副露・暗槓のブロック文字列（例: "[123m]", "(11z)"）を解析してCompletedMentsuを生成する。
 * 括弧の種類（[] / ()）と牌の枚数・構成から、副露か暗槓か、ポン/チー/カンの種別を判定します。
 */
export function parseMentsuFromExtendedMspz(
  block: ExtendedMspzString,
): Result<CompletedMentsu, MspzParseError> {
  return stripEnclosure(block).andThen(({ mode, content }) =>
    asMspz(content).andThen((mspz) => {
      const ids = parseMspzToHaiKindIds(mspz);
      if (ids.length === 0) {
        return err(new MspzParseError("Empty mentsu specification"));
      }
      return classifyMentsu(ids, mode, block);
    }),
  );
}
