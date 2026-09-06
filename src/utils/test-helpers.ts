import type {
  HaiId,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
  Mentsu,
  MentsuType,
} from "../types";
import { validateTehai13 } from "../core/tehai";
import {
  isExtendedMspz,
  parseExtendedMspz,
  parseMspz,
} from "../features/parser";
import { isValidShuntsu } from "../core/mentsu";
import { getHouraStructuresForMentsuTe } from "../features/yaku/lib/structures/mentsu-te";
import { isTuple2, isTuple3 } from "./assertions";
import type {
  Shuntsu,
  Koutsu,
  Toitsu,
  CompletedMentsu,
  HouraStructure,
  MentsuHouraStructure,
} from "../types";

/**
 * テスト用の Tehai13 オブジェクトを作成します。
 * 作成時に assertTehai13 を実行し、不正な場合はエラーをスローします。
 * これにより、テストデータが正しい Tehai13 であることを保証します。
 */
export function createTehai13<T extends HaiKindId | HaiId>(
  closed: readonly T[],
): Tehai13<T> {
  const tehai: Tehai<T> = {
    closed,
    exposed: [],
  };

  const res = validateTehai13(tehai);
  if (res.isErr()) throw res.error;

  return res.value;
}

/**
 * MSPZ形式の文字列からテスト用の Tehai13 オブジェクトを作成します。
 * 13枚の手牌をMSPZ形式で指定できる便利関数です。
 *
 * @param mspzString MSPZ形式の文字列 (例: "123m456p789s11z22z")
 * @returns Tehai13 オブジェクト
 */
export function createTehai13FromMspz(mspzString: string): Tehai13 {
  const parseRes = parseMspz(mspzString);
  if (parseRes.isErr()) throw parseRes.error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ids = parseRes.value.closed as HaiKindId[];
  return createTehai13(ids);
}

/**
 * テスト用の Mentsu オブジェクトを作成します。
 */
export function createMentsu<T extends HaiKindId | HaiId>(
  type: MentsuType,
  hais: readonly T[],
): Mentsu<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { type, hais } as unknown as Mentsu<T>;
}

/**
 * テスト用の Tehai14 (和了手など) オブジェクトを作成します。
 * Extended MSPZ形式の文字列をサポートし、副露や暗槓を含む手牌を簡単に作成できます。
 *
 * @param mspzString Extended MSPZ形式、または通常のMSPZ形式の文字列
 * @returns Tehai14 オブジェクト
 */
export function createTehai(mspzString: string): Tehai14 {
  let parseRes;
  if (isExtendedMspz(mspzString)) {
    parseRes = parseExtendedMspz(mspzString);
  } else {
    parseRes = parseMspz(mspzString);
  }
  if (parseRes.isErr()) throw parseRes.error;
  const tehai = parseRes.value;

  // ファクトリ関数内での as 使用は許容
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return tehai as Tehai14;
}

/**
 * Extended MSPZ形式の文字列から面子手（4面子1雀頭）の和了構造を作成します。
 * 面子分解が複数ありうる場合は最初の解釈を返します。
 * 構造化できない牌姿を渡した場合はエラーをスローします。
 *
 * @param mspzString Extended MSPZ形式、または通常のMSPZ形式の文字列
 * @returns 面子手の和了構造
 */
export function createMentsuStructureFromMspz(
  mspzString: string,
): MentsuHouraStructure {
  const hands = getHouraStructuresForMentsuTe(createTehai(mspzString));
  const hand = hands[0];
  if (hand === undefined) {
    throw new Error(`面子手として構造化できません: ${mspzString}`);
  }
  return hand;
}

/**
 * MSPZ形式の文字列から HaiKindId の配列を作成します。
 * テストデータの期待値作成などで使用します。
 *
 * @param mspzString MSPZ形式の文字列 (例: "123m")
 * @returns HaiKindId の配列
 */
export function createHaiKindIds(mspzString: string): HaiKindId[] {
  const parseRes = parseMspz(mspzString);
  if (parseRes.isErr()) throw parseRes.error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return parseRes.value.closed as HaiKindId[];
}

/**
 * テスト用の順子 (Shuntsu) を作成します。
 * isValidShuntsu によるバリデーションを行います。
 */
/**
 * テスト用の順子 (Shuntsu) を作成します。
 * isValidShuntsu によるバリデーションを行います。
 */
export function createShuntsu(mspz: string): Shuntsu {
  const parseRes = parseMspz(mspz);
  if (parseRes.isErr()) throw parseRes.error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ids = parseRes.value.closed as HaiKindId[];

  // Use core validation
  if (!isValidShuntsu(ids)) {
    throw new Error(`Invalid Shuntsu: ${mspz}`);
  }

  // isValidShuntsu ensures it is a valid Tuple3 of HaiKindId
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  const validIds = ids as unknown as [HaiKindId, HaiKindId, HaiKindId];

  return {
    type: "Shuntsu",
    hais: validIds,
  };
}

/**
 * テスト用の刻子 (Koutsu) を作成します。
 */
export function createKoutsu(mspz: string): Koutsu {
  const parseRes = parseMspz(mspz);
  if (parseRes.isErr()) throw parseRes.error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ids = parseRes.value.closed as HaiKindId[];
  if (!isTuple3(ids)) throw new Error(`Invalid Koutsu: ${mspz}`);
  return {
    type: "Koutsu",
    hais: ids,
  };
}

/**
 * テスト用の対子 (Toitsu) を作成します。
 */
export function createToitsu(mspz: string): Toitsu {
  const parseRes = parseMspz(mspz);
  if (parseRes.isErr()) throw parseRes.error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ids = parseRes.value.closed as HaiKindId[];
  if (!isTuple2(ids)) throw new Error(`Invalid Toitsu: ${mspz}`);
  return {
    type: "Toitsu",
    hais: ids,
  };
}

/**
 * テスト用の HaiKindId を取得します。
 */
export function getHaiKindId(mspz: string): HaiKindId {
  const parseRes = parseMspz(mspz);
  if (parseRes.isErr()) throw parseRes.error;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ids = parseRes.value.closed as HaiKindId[];
  if (ids.length === 0) throw new Error(`Invalid HaiKindId: ${mspz}`);
  const id = ids[0];
  if (id === undefined) throw new Error(`Internal Error: id is undefined`);
  return id;
}

/**
 * テスト用のモック手牌 (HouraStructure) を作成します。
 * 指定された面子と雀頭を使用し、残りはダミーの順子で埋めます。
 */
export function createMockHand(
  targetMentsu: CompletedMentsu,
  jantou: Toitsu,
): HouraStructure {
  // Fill rest with dummy
  const dummyShuntsu = createShuntsu("123s");
  return {
    type: "Mentsu",
    fourMentsu: [targetMentsu, dummyShuntsu, dummyShuntsu, dummyShuntsu],
    jantou,
  };
}
