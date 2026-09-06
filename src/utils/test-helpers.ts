import type {
  HaiId,
  HaiKindId,
  Tehai,
  Tehai13,
  Tehai14,
  Mentsu,
  MentsuType,
} from "../types";
import type { Result } from "neverthrow";
import { validateTehai13 } from "../core/tehai";
import {
  isExtendedMspz,
  parseExtendedMspz,
  parseMspz,
} from "../features/parser";
import { isValidShuntsu } from "../core/mentsu";
import { getHouraStructuresForMentsuTe } from "../features/yaku/lib/structures/mentsu-te";
import { getHouraStructuresForChiitoitsu } from "../features/yaku/lib/structures/chiitoitsu";
import { isTuple2, isTuple3 } from "./assertions";
import type { HouraContext } from "../features/yaku/types";
import { HaiKind } from "../types";
import type {
  Shuntsu,
  Koutsu,
  Toitsu,
  CompletedMentsu,
  HouraStructure,
  MentsuHouraStructure,
  ChiitoitsuHouraStructure,
} from "../types";

/**
 * Result から値を取り出します。Err の場合はそのエラーをスローします。
 *
 * テストでは失敗が即座にテストの失敗であるべきなので、Err を握り潰さず
 * スローする。プロダクションコードでは使用しないこと（Result を返す設計を
 * 崩すため）。
 *
 * @param result 取り出し対象の Result
 * @returns Ok の場合の値
 */
export function unwrapOrThrow<T, E extends Error>(
  // Result は neverthrow のクラスであり readonly 化できないため許容する
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  result: Result<T, E>,
): T {
  if (result.isErr()) throw result.error;
  return result.value;
}

/**
 * MSPZ形式の文字列を牌種IDの配列に変換する内部ヘルパー。
 * パースに失敗した場合はエラーをスローします。
 */
function parseToKindIds(mspz: string): HaiKindId[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return unwrapOrThrow(parseMspz(mspz)).closed as HaiKindId[];
}

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

  return unwrapOrThrow(validateTehai13(tehai));
}

/**
 * MSPZ形式の文字列からテスト用の Tehai13 オブジェクトを作成します。
 * 13枚の手牌をMSPZ形式で指定できる便利関数です。
 *
 * @param mspzString MSPZ形式の文字列 (例: "123m456p789s11z22z")
 * @returns Tehai13 オブジェクト
 */
export function createTehai13FromMspz(mspzString: string): Tehai13 {
  const ids = parseToKindIds(mspzString);
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
  const tehai = unwrapOrThrow(
    isExtendedMspz(mspzString)
      ? parseExtendedMspz(mspzString)
      : parseMspz(mspzString),
  );

  // ファクトリ関数内での as 使用は許容
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return tehai as Tehai14;
}

/**
 * MSPZ形式の文字列から七対子の和了構造を作成します。
 * 七対子として成立しない牌姿を渡した場合はエラーをスローします。
 *
 * @param mspzString MSPZ形式の文字列 (例: "11223344556677m")
 * @returns 七対子の和了構造
 */
export function createChiitoitsuStructureFromMspz(
  mspzString: string,
): ChiitoitsuHouraStructure {
  const hands = getHouraStructuresForChiitoitsu(createTehai(mspzString));
  const hand = hands[0];
  if (hand === undefined) {
    throw new Error(`七対子として構造化できません: ${mspzString}`);
  }
  return hand;
}

/**
 * テスト用の面子手の和了構造 (MentsuHouraStructure) を作成します。
 * 牌姿から分解させるのではなく、面子の内訳を指定して構造を直接組み立てたい
 * 場合（副露の有無を作り分けるテストなど）に使用します。
 *
 * @param fourMentsu 4つの面子
 * @param jantou 雀頭
 * @returns 面子手の和了構造
 */
export function createMentsuStructure(
  fourMentsu: readonly [
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
    CompletedMentsu,
  ],
  jantou: Toitsu,
): MentsuHouraStructure {
  return { type: "Mentsu", fourMentsu, jantou };
}

/**
 * テスト用の和了コンテキスト (HouraContext) を作成します。
 *
 * 役判定テストの大半は「門前・東場・南家・ドラなし」を前提に、判定対象の役に
 * 関係するフィールドだけを差し替えるため、それらを既定値として与える。
 * `agariHai` は待ちの形に依存しない役の判定では使われないダミー値。
 *
 * @param overrides 既定値から差し替えるフィールド
 * @returns 和了コンテキスト
 */
export function createHouraContext(
  overrides: Partial<HouraContext> = {},
): HouraContext {
  return {
    isMenzen: true,
    agariHai: HaiKind.ManZu1,
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    doraMarkers: [],
    ...overrides,
  };
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
  return parseToKindIds(mspzString);
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
  const ids = parseToKindIds(mspz);

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
  const ids = parseToKindIds(mspz);
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
  const ids = parseToKindIds(mspz);
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
  const ids = parseToKindIds(mspz);
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
