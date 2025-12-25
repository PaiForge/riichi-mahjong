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
  constructor(message: string) {
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
  constructor(message: string) {
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
