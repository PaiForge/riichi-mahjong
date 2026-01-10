/**
 * riichi-mahjong ライブラリの基本エラークラス
 * 全てのカスタムエラーはこのクラスを継承します。
 */
export class MahjongError extends Error {
  /**
   *
   */
  constructor(message: string) {
    super(message);
    this.name = "MahjongError";

    // TypeScriptでカスタムエラーを正しく動作させるためのハック
    // TypeScriptでカスタムエラーを正しく動作させるためのハック
    Object.setPrototypeOf(this, MahjongError.prototype);
  }
}

/**
 * ツモれなかった場合のエラー (少牌)
 * 手牌が規定枚数（13枚）より少ない場合にスローされます。
 */
export class ShoushaiError extends MahjongError {
  /**
   *
   */
  constructor(message = "手牌が規定枚数（13枚）より少ないです。") {
    super(message);
    this.name = "ShoushaiError";

    Object.setPrototypeOf(this, ShoushaiError.prototype);
  }
}

/**
 * 切り忘れの場合のエラー (多牌)
 * 手牌が規定枚数（13枚）より多い場合にスローされます。
 */
export class TahaiError extends MahjongError {
  /**
   *
   */
  constructor(message = "手牌が規定枚数（13枚）より多いです。") {
    super(message);
    this.name = "TahaiError";

    Object.setPrototypeOf(this, TahaiError.prototype);
  }
}

/**
 * 引数が不正な場合のエラー
 * 必要なパラメータが不足している、または不正な値の場合にスローされます。
 */
export class MahjongArgumentError extends MahjongError {
  /**
   *
   */
  constructor(message: string) {
    super(message);
    this.name = "MahjongArgumentError";

    Object.setPrototypeOf(this, MahjongArgumentError.prototype);
  }
}

/**
 * 牌IDが重複している場合のエラー
 * (物理的な牌IDは一意である必要があります)
 */
export class DuplicatedHaiIdError extends MahjongError {
  /**
   *
   */
  constructor(message = "牌IDが重複しています。") {
    super(message);
    this.name = "DuplicatedHaiIdError";

    Object.setPrototypeOf(this, DuplicatedHaiIdError.prototype);
  }
}

/**
 * 牌の枚数が不正な場合のエラー
 * (同種の牌は最大4枚までです)
 */
export class InvalidHaiQuantityError extends MahjongError {
  /**
   *
   */
  constructor(message = "同種の牌が5枚以上存在します。") {
    super(message);
    this.name = "InvalidHaiQuantityError";

    Object.setPrototypeOf(this, InvalidHaiQuantityError.prototype);
  }
}
