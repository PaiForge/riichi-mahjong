
import sys
import json
from mahjong.tile import TilesConverter
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.meld import Meld
from mahjong.constants import EAST, SOUTH, WEST, NORTH

def get_wind(wind_str):
    if wind_str == "Ton": return EAST
    if wind_str == "Nan": return SOUTH
    if wind_str == "Sha": return WEST
    if wind_str == "Pei": return NORTH
    return EAST

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"error": f"入力JSONのパースに失敗しました: {str(e)}"}))
        return

    calculator = HandCalculator()
    results = []

    for case in input_data:
        try:
            # 入力をパース
            # 期待される入力フィールド:
            # - mspz: 文字列 (ツモの場合は和了牌を含む完全な手牌、ロンの場合は手牌+和了牌？)
            #   mspz文字列にはツモの場合は14枚、ロンの場合は13+1枚が含まれると仮定します。
            #   実際には `TilesConverter` は文字列を指定された通りの牌として扱います。
            #   正確を期すなら手牌と和了牌を分けるか、14枚渡して和了牌のインデックスを特定する必要があります。
            #   シンプルなアプローチ: mspz文字列 (13枚) + agariHai文字列 (1枚)。
            tehai_str = case["tehai"] # 13枚 (和了牌を含めると14枚？ここでは13枚+別枠の和了牌と仮定)
            agari_str = case["agariHai"] # 例: "1m"
            is_tsumo = case.get("isTsumo", False)
            is_riichi = case.get("isRiichi", False)
            is_oya = case.get("isOya", False)
            dora_indicators = case.get("doraMarkers", []) # array of strings like ["1m"]
            bakaze = get_wind(case.get("bakaze", "Ton"))
            jikaze = get_wind(case.get("jikaze", "Ton"))
            
            # 牌の変換
            # 計算には136枚形式の配列が必要です
            # 注意: Pythonライブラリのmspzパーサーは "123m456p..." 形式を扱えます。
            # しかし標準の `TilesConverter` は "123m" のような形式を必要とする場合があります。
            # 私の内部MSPZフォーマットは互換性があります。
            
            # "1m" を136形式のインデックスに変換するヘルパー
            def str_to_136(s):
                return TilesConverter.one_line_string_to_136_array(s)[0]

            # 完全な手牌 (14枚) をパース
            full_str = tehai_str + agari_str
            tiles = TilesConverter.one_line_string_to_136_array(full_str)
            all_tiles = tiles # tiles は現在14枚
            
            # all_tiles の中から和了牌を見つける
            target_proto = str_to_136(agari_str)
            target_type = target_proto // 4
            
            win_tile = None
            
            for t in all_tiles:
                if (t // 4) == target_type:
                    win_tile = t
                    # 取り除く必要があるかチェック
                    # "winning_tile_not_in_hand" エラーは、和了牌が手牌に含まれている必要があることを示唆しています。
                    # 14枚渡しているので、手牌には含まれています。
                    break
            
            if win_tile is None:
                raise Exception(f"パースされた牌の中に和了牌 {agari_str} が見つかりません")
                
            # ドラ表示牌 (これらは表示牌であり手牌には含まれないため、個別にパースして問題ありません)
            dora_ind_136 = [str_to_136(d) for d in dora_indicators]

            # 設定 (Config)
            config = HandConfig(
                is_tsumo=is_tsumo,
                is_riichi=is_riichi,
                is_ippatsu=False,
                is_rinshan=False,
                is_chankan=False,
                is_haitei=False,
                is_houtei=False,
                is_daburu_riichi=False,
                is_nagashi_mangan=False,
                is_tenhou=False,
                is_renhou=False,
                is_chiihou=False,
                player_wind=jikaze,
                round_wind=bakaze,
            )

            # 計算
            # calculate_hand_score(tiles, win_tile, melds=None, dora_indicators=None, config=None)
            # 副露 (Melds): mspzに副露が含まれる場合はそれもパースする必要があります。
            # verify_shanten.py は副露を明示的に扱っていませんでした (すべて門前として処理?)。
            # 正確なスコア計算には副露を渡す必要があります。
            # ユーザーの `tehai` 文字列に副露が含まれている場合 (例: 私のパーサーの `[ ]` 表記など)、
            # `TilesConverter` はおそらく括弧をサポートしていません。
            # 制限事項: 現状、スクリプトの単純化のため門前手 (CLOSED hands) のみテスト対象とします。
            # この制限事項についてはドキュメント化するか、後でパースロジックを改善します。
            # まずは門前手のテストが良い第一歩です。
            
            # デバッグ情報
            # sys.stderr.write(f"ID: {case.get('id')}\n")

            result = calculator.estimate_hand_value(
                tiles,
                win_tile,
                melds=[], 
                dora_indicators=dora_ind_136,
                config=config
            )

            if result.error:
                 sys.stderr.write(f"Result Error for {case.get('id')}: {result.error}\n")
                 results.append({
                    "id": case.get("id"),
                    "error": str(result.error)
                 })
                 continue

            results.append({
                "id": case.get("id"),
                "han": result.han,
                "fu": result.fu,
                "points": result.cost['main'] + (result.cost['additional'] * 2 if is_tsumo else 0), 
                "cost": result.cost,
                "yaku": [y.name for y in result.yaku],
                "error": None
            })

        except Exception as e:
            results.append({
                "id": case.get("id"),
                "error": str(e)
            })

    print(json.dumps(results))

if __name__ == "__main__":
    main()
