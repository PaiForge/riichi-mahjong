import type { HaiId, HaiKindId, Tehai, Tehai13 } from "../types";
import { validateTehai13 } from "../core/tehai";

/**
 * テスト用の Tehai13 オブジェクトを作成します。
 * 作成時に validateTehai13 を実行し、不正な場合はエラーをスローします。
 * これにより、テストデータが正しい Tehai13 であることを保証します。
 */
export function createTehai13<T extends HaiKindId | HaiId>(
  closed: readonly T[],
): Tehai13<T> {
  const tehai: Tehai<T> = {
    closed,
    exposed: [],
  };

  validateTehai13(tehai);

  return tehai;
}
