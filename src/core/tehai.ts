import {
  DuplicatedHaiIdError,
  InvalidHaiQuantityError,
  ShoushaiError,
  TahaiError,
} from "../errors";
import { Result, ok, err } from "neverthrow";
import type { HaiId, HaiKindId, Tehai, Tehai13, Tehai14 } from "../types";
import { haiIdToKindId } from "./hai";

export type TehaiError =
  | ShoushaiError
  | TahaiError
  | InvalidHaiQuantityError
  | DuplicatedHaiIdError;

/**
 * 手牌の有効枚数を計算します。
 * 副露（槓子含む）は一律3枚として計算します。
 */
function calculateTehaiCount<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): number {
  return tehai.closed.length + tehai.exposed.length * 3;
}

/**
 * 手牌の有効枚数が [min, max] の範囲に収まっているか検証します。
 * 少なければ少牌 (ShoushaiError)、多ければ多牌 (TahaiError) を返します。
 */
function validateTehaiCount<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
  min: number,
  max: number,
): Result<Tehai<T>, ShoushaiError | TahaiError> {
  const count = calculateTehaiCount(tehai);
  if (count < min) return err(new ShoushaiError());
  if (count > max) return err(new TahaiError());
  return ok(tehai);
}

/**
 * 枚数検証と牌の整合性検証（重複ID・枚数超過）をまとめて行う共通処理。
 */
function validateTehaiStructure<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
  min: number,
  max: number,
): Result<Tehai<T>, TehaiError> {
  return validateTehaiCount(tehai, min, max).andThen((validated) =>
    validateHaiConsistency(validated).map(() => validated),
  );
}

/**
 * 手牌がTehai13（有効枚数13枚）であるか検証し、スマートコンストラクタとして機能します。
 * バリデーション成功後、Tehai13 型にナローイングされたオブジェクトをResultで返します。
 */
export function validateTehai13<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<Tehai13<T>, TehaiError> {
  return validateTehaiStructure(tehai, 13, 13).map(
    (validated) =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      validated as Tehai13<T>,
  );
}

/**
 * 手牌がTehai14（有効枚数14枚）であるか検証し、スマートコンストラクタとして機能します。
 * バリデーション成功後、Tehai14 型にナローイングされたオブジェクトをResultで返します。
 */
export function validateTehai14<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<Tehai14<T>, TehaiError> {
  return validateTehaiStructure(tehai, 14, 14).map(
    (validated) =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      validated as Tehai14<T>,
  );
}

/**
 * 手牌が有効枚数13〜14枚の範囲で整合しているか検証します。
 * ツモ前後どちらの手牌も受け入れる汎用バリデーションです。
 */
export function validateTehai<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<Tehai<T>, TehaiError> {
  return validateTehaiStructure(tehai, 13, 14);
}

/**
 * 手牌を構成する牌の整合性を検証します。
 * 物理牌ID (HaiId) 使用時はIDの重複を、また牌種ごとの枚数が4枚を超えないことを確認します。
 */
export function validateHaiConsistency<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): Result<void, DuplicatedHaiIdError | InvalidHaiQuantityError> {
  const allHais: number[] = [
    ...tehai.closed,
    ...tehai.exposed.flatMap((m) => m.hais),
  ];

  // 1. 物理牌ID (HaiId) モードの判定 (34以上のIDが含まれるか)
  const isHaiIdMode = allHais.some((h) => h > 33);

  if (isHaiIdMode) {
    // 物理牌IDは一意でなければならない
    const uniqueIds = new Set(allHais);
    if (uniqueIds.size !== allHais.length) {
      return err(new DuplicatedHaiIdError());
    }
  }

  // 2. 牌種ごとの枚数チェック (各種最大4枚)
  const counts = new Map<number, number>();
  for (const hai of allHais) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kind: number = isHaiIdMode ? haiIdToKindId(hai as HaiId) : hai;

    const current = counts.get(kind) ?? 0;
    if (current + 1 > 4) {
      return err(new InvalidHaiQuantityError());
    }
    counts.set(kind, current + 1);
  }
  return ok(undefined);
}

/**
 * Type Guard for Tehai13
 */
export function isTehai13<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): tehai is Tehai13<T> {
  return validateTehai13(tehai).isOk();
}

/**
 * Type Guard for Tehai14
 */
export function isTehai14<T extends HaiKindId | HaiId>(
  tehai: Tehai<T>,
): tehai is Tehai14<T> {
  return validateTehai14(tehai).isOk();
}
