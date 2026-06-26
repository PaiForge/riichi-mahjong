import { Result, ok, err } from "neverthrow";
import { isTuple3, isTuple4 } from "../../utils/assertions";
import { MspzParseError } from "../../errors";
import {
  CompletedMentsu,
  FuroType,
  Kantsu,
  Koutsu,
  MentsuType,
  Shuntsu,
  Tacha,
} from "../../types";
import { asMspz, type ExtendedMspzString } from "./mspz-string";
import { parseMspzToHaiKindIds } from "./mspz-tokenizer";

/**
 * 副露・暗槓のブロック文字列（例: "[123m]", "(11z)"）を解析してCompletedMentsuを生成する。
 * 括弧の種類（[] / ()）と牌の枚数・構成から、副露か暗槓か、ポン/チー/カンの種別を判定します。
 */
export function parseMentsuFromExtendedMspz(
  block: ExtendedMspzString,
): Result<CompletedMentsu, MspzParseError> {
  let mode: "open" | "ankan";
  let content: string;

  if (block.startsWith("[") && block.endsWith("]")) {
    mode = "open";
    content = block.slice(1, -1);
  } else if (block.startsWith("(") && block.endsWith(")")) {
    mode = "ankan";
    content = block.slice(1, -1);
  } else {
    return err(
      new MspzParseError(
        `Invalid Extended MSPZ block: ${block} (must be [...] or (...))`,
      ),
    );
  }

  // 中身は標準MSPZ形式である必要がある
  const mspzRes = asMspz(content);
  if (mspzRes.isErr()) return err(mspzRes.error);

  const ids = parseMspzToHaiKindIds(mspzRes.value);
  if (ids.length === 0) {
    return err(new MspzParseError("Empty mentsu specification"));
  }

  // 枚数チェック & 種類判定
  const count = ids.length;
  const isAllSame = ids.every((id) => id === ids[0]);

  // 暗槓 (Ankan)
  if (mode === "ankan") {
    if (count !== 4 || !isAllSame) {
      return err(
        new MspzParseError(
          `Invalid Ankan: ${block} (must be 4 identical tiles)`,
        ),
      );
    }
    if (!isTuple4(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: ids,
      // Ankan has no furo info (or minimal)
    };
    return ok(kantsu);
  }

  // 副露 (Open)
  if (count === 4 && isAllSame) {
    // Daiminkan
    if (!isTuple4(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const kantsu: Kantsu = {
      type: MentsuType.Kantsu,
      hais: ids,
      furo: { type: FuroType.Daiminkan, from: Tacha.Toimen }, // Default
    };
    return ok(kantsu);
  } else if (count === 3 && isAllSame) {
    // Pon
    if (!isTuple3(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const koutsu: Koutsu = {
      type: MentsuType.Koutsu,
      hais: ids,
      furo: { type: FuroType.Pon, from: Tacha.Toimen }, // Default
    };
    return ok(koutsu);
  } else if (count === 3) {
    // Chi (Should check continuity, strictly speaking but relying on user for now or implicit check)
    // Minimal check: sorted? mspzStringToHaiKindIds sorts by default?
    // mspzStringToHaiKindIds does NOT sort across different suits, but "123m" results in sorted array.
    // Let's assume valid sequence for now.
    if (!isTuple3(ids)) {
      return err(
        new MspzParseError("Internal Error: ids length check mismatch"),
      );
    }
    const shuntsu: Shuntsu = {
      type: MentsuType.Shuntsu,
      hais: ids,
      furo: { type: FuroType.Chi, from: Tacha.Kamicha }, // Default
    };
    return ok(shuntsu);
  }

  return err(
    new MspzParseError(
      `Invalid Mentsu specification: ${block} (must be 3 or 4 tiles)`,
    ),
  );
}
