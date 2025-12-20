
import sys
import json
from mahjong.tile import TilesConverter
from mahjong.shanten import Shanten

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input JSON: {str(e)}"}))
        return

    shanten_calculator = Shanten()
    results = []

    for case in input_data:
        try:
            tehai_str = case["tehai"]
            # Shanten calculation uses 34 array
            tiles_34 = TilesConverter.one_line_string_to_34_array(tehai_str)
            # Calculate minimum shanten (regular + chiitoitsu + kokushi)
            result = shanten_calculator.calculate_shanten(tiles_34)
            results.append({
                "id": case.get("id", "unknown"),
                "shanten": result,
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
