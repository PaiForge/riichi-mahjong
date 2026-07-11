/**
 * riichi-mahjong ライブラリの基本エラークラス
 * 全てのカスタムエラーはこのクラスを継承します。
 */
export class MahjongError extends Error {
  /**
   * @param message エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = "MahjongError";

    // TypeScriptでカスタムエラーを正しく動作させるためのハック
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * ツモれなかった場合のエラー (少牌)
 * 手牌が規定枚数（13枚）より少ない場合にスローされます。
 */
export class ShoushaiError extends MahjongError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "手牌が規定枚数（13枚）より少ないです。") {
    super(message);
    this.name = "ShoushaiError";
  }
}

/**
 * 切り忘れの場合のエラー (多牌)
 * 手牌が規定枚数（13枚）より多い場合にスローされます。
 */
export class TahaiError extends MahjongError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "手牌が規定枚数（13枚）より多いです。") {
    super(message);
    this.name = "TahaiError";
  }
}

/**
 * 引数が不正な場合のエラー
 * 必要なパラメータが不足している、または不正な値の場合にスローされます。
 */
export class MahjongArgumentError extends MahjongError {
  /**
   * @param message エラーメッセージ
   */
  constructor(message: string) {
    super(message);
    this.name = "MahjongArgumentError";
  }
}

/**
 * 牌IDが重複している場合のエラー
 * (物理的な牌IDは一意である必要があります)
 */
export class DuplicatedHaiIdError extends MahjongError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "牌IDが重複しています。") {
    super(message);
    this.name = "DuplicatedHaiIdError";
  }
}

/**
 * 牌の枚数が不正な場合のエラー
 * (同種の牌は最大4枚までです)
 */
export class InvalidHaiQuantityError extends MahjongError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "同種の牌が5枚以上存在します。") {
    super(message);
    this.name = "InvalidHaiQuantityError";
  }
}

/**
 * チョンボ（錯和）の基底エラークラス
 *
 * 不正な和了宣言に関するエラーの基底クラス。
 * 具体的なチョンボ種別（役なし、フリテン等）はサブクラスで定義する。
 */
export class ChomboError extends MahjongError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "不正な和了です。") {
    super(message);
    this.name = "ChomboError";
  }
}

/**
 * 役なし和了のエラー
 *
 * 和了形は成立しているが、役が一つも成立していない場合にスローされます。
 */
export class NoYakuError extends ChomboError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "役が成立していません。") {
    super(message);
    this.name = "NoYakuError";
  }
}

/**
 * MSPZ文字列の解析エラー
 *
 * MSPZ形式の文字列が不正な場合にスローされます。
 */
export class MspzParseError extends MahjongError {
  /**
   * @param message エラーメッセージ（省略時は既定メッセージ）
   */
  constructor(message = "MSPZ文字列の解析に失敗しました。") {
    super(message);
    this.name = "MspzParseError";
  }
}
