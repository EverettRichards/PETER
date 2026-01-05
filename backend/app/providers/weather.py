from datetime import datetime

def get_weather_stub():
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
