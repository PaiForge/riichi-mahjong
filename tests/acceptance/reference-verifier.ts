import { spawnSync, type SpawnSyncReturns } from "child_process";
import fs from "fs";
import path from "path";

/**
 * 参照実装（Python 製 `mahjong` ライブラリ）を同梱した検証用 Docker イメージ名。
 */
export const VERIFIER_IMAGE = "riichi-mahjong-verifier";

/**
 * 検証用 Docker イメージの Dockerfile（プロジェクトルートからの相対パス）。
 */
export const VERIFIER_DOCKERFILE = "docker/Dockerfile.verification";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SCRIPTS_DIR = path.resolve(__dirname, "scripts");
const SCRIPTS_MOUNT_POINT = "/app/scripts";

/**
 * 参照実装を呼び出す検証スクリプト（`tests/acceptance/scripts/` 配下）の名前。
 */
export type VerifierScript = "verify_shanten.py" | "verify_score.py";

/**
 * 参照実装の呼び出しに失敗したことを表すエラー。
 * 受け入れテストでは本エラーを握りつぶさず、テスト失敗として扱う。
 */
export class ReferenceVerifierError extends Error {
  /**
   * @param message 失敗の内容（原因となった docker コマンドの出力を含む）
   */
  constructor(message: string) {
    super(message);
    this.name = "ReferenceVerifierError";
  }
}

function describeSpawnFailure(
  // SpawnSyncReturns は Node 側の型で readonly 化できないため許容する
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  result: SpawnSyncReturns<string>,
): string {
  if (result.error) {
    const code = "code" in result.error ? String(result.error.code) : "";
    if (code === "ENOENT") {
      return "docker コマンドが見つかりません。Docker をインストールして PATH を通してください。";
    }
    return `docker コマンドの起動に失敗しました: ${result.error.message}`;
  }
  const stderr = result.stderr.trim();
  return `docker コマンドが終了コード ${result.status} で失敗しました。${
    stderr ? `\n--- stderr ---\n${stderr}` : ""
  }`;
}

function runDocker(
  args: readonly string[],
  options: Readonly<{ input?: string; inherit?: boolean }> = {},
): SpawnSyncReturns<string> {
  return spawnSync("docker", [...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    ...(options.input !== undefined ? { input: options.input } : {}),
    ...(options.inherit ? { stdio: "inherit" } : {}),
  });
}

/**
 * 検証用 Docker イメージ（{@link VERIFIER_IMAGE}）が存在することを保証する。
 * 存在しなければ {@link VERIFIER_DOCKERFILE} からビルドし、
 * Docker が利用できない・ビルドに失敗した場合は {@link ReferenceVerifierError} を投げる。
 */
export function ensureVerifierImage(): void {
  // タグを明示し、別タグの同名イメージを「存在する」と誤判定しないようにする
  const lookup = runDocker(["images", "-q", `${VERIFIER_IMAGE}:latest`]);
  if (lookup.error || lookup.status !== 0) {
    throw new ReferenceVerifierError(
      `Docker を実行できないため参照実装を呼び出せません。Docker が起動しているか確認してください。\n${describeSpawnFailure(lookup)}`,
    );
  }
  if (lookup.stdout.trim()) return;

  console.log(
    `Docker イメージ '${VERIFIER_IMAGE}' が見つかりません。${VERIFIER_DOCKERFILE} からビルドします...`,
  );
  const build = runDocker(
    ["build", "-t", VERIFIER_IMAGE, "-f", VERIFIER_DOCKERFILE, "."],
    { inherit: true },
  );
  if (build.error || build.status !== 0) {
    throw new ReferenceVerifierError(
      `Docker イメージ '${VERIFIER_IMAGE}' のビルドに失敗しました。\n${describeSpawnFailure(build)}`,
    );
  }
}

/**
 * 参照実装の検証スクリプトを Docker コンテナ内で実行し、結果の配列を返す。
 *
 * 入力は JSON 配列として stdin へ渡し、スクリプトが stdout へ出力した JSON 配列を返す。
 * 実行失敗・stdout が JSON 配列でない場合は {@link ReferenceVerifierError} を投げる。
 * 事前に {@link ensureVerifierImage} を呼び出しておくこと。
 *
 * @param script 実行する検証スクリプト名
 * @param inputs スクリプトへ渡す入力（1 要素 = 1 ケース）
 * @returns スクリプトが返した結果の配列
 */
export function runReferenceVerifier<TOutput>(
  script: VerifierScript,
  inputs: readonly unknown[],
): TOutput[] {
  if (!fs.existsSync(path.join(SCRIPTS_DIR, script))) {
    throw new ReferenceVerifierError(
      `検証スクリプトが見つかりません: ${path.join(SCRIPTS_DIR, script)}`,
    );
  }

  const result = runDocker(
    [
      "run",
      "-i",
      "--rm",
      "-v",
      `${SCRIPTS_DIR}:${SCRIPTS_MOUNT_POINT}:ro`,
      VERIFIER_IMAGE,
      "python",
      `${SCRIPTS_MOUNT_POINT}/${script}`,
    ],
    { input: JSON.stringify(inputs) },
  );
  if (result.error || result.status !== 0) {
    throw new ReferenceVerifierError(
      `参照実装 (${script}) の実行に失敗しました。\n${describeSpawnFailure(result)}`,
    );
  }
  if (result.stderr.trim()) {
    // スクリプト側の診断メッセージは握りつぶさず、そのまま可視化する
    process.stderr.write(`[${script}] ${result.stderr}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new ReferenceVerifierError(
      `参照実装 (${script}) の出力を JSON として解釈できません: ${
        error instanceof Error ? error.message : String(error)
      }\n--- stdout ---\n${result.stdout}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new ReferenceVerifierError(
      `参照実装 (${script}) の出力が配列ではありません: ${JSON.stringify(parsed)}`,
    );
  }
  // 出力の各要素の形はスクリプトとの取り決めに依存するため、呼び出し側の型を信頼する
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return parsed as TOutput[];
}
