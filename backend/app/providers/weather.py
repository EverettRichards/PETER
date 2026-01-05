from datetime import datetime

def get_weather_payload():
    # Replace with real provider later (Open-Meteo, NWS, etc.)
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "locations": [
            {
                "name": "San Diego",
                "temp_f": 67,
                "condition": "Partly cloudy",
                "high_f": 71,
                "low_f": 58,
            },
            {
                "name": "Worcester, MA",
                "temp_f": 29,
                "condition": "Clear",
                "high_f": 33,
                "low_f": 20,
            }
        ]
    }

def nws_to_tile(forecast_json):
    periods = forecast_json["properties"]["periods"]
    today = periods[0]

    return {
        "name": "San Diego",
        "temp_f": today["temperature"],
        "condition": today["shortForecast"],
        "high_f": today["temperature"],
        "low_f": None,
    }
