"""
Provider for San Diego MTS (SDMTS) real-time transit data.
Fetches vehicle positions for buses and trolleys.
"""
import requests
from google.transit import gtfs_realtime_pb2
from typing import List, Dict, Any

SDMTS_API_URL = "https://realtime.sdmts.com/api/api/gtfs_realtime/vehicle-positions-for-agency/MTS.pb"
API_KEY = "90662cf7-2951-4fd4-9cdd-7c9cedadb247"

# Trolley route IDs (based on SDMTS system)
TROLLEY_ROUTES = {"510", "520", "530", "532"}


def get_vehicle_positions() -> Dict[str, Any]:
    """
    Fetch current vehicle positions from SDMTS API.
    Returns a dict with vehicle data including position, route, and vehicle type.
    """
    try:
        url = f"{SDMTS_API_URL}?key={API_KEY}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Parse the protobuf response
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)
        
        vehicles = []
        for entity in feed.entity:
            if entity.HasField('vehicle'):
                vehicle = entity.vehicle
                
                # Extract position data
                if vehicle.HasField('position'):
                    position = vehicle.position
                    
                    # Determine if this is a bus or trolley
                    route_id = vehicle.trip.route_id if vehicle.HasField('trip') else "unknown"
                    vehicle_type = "trolley" if route_id in TROLLEY_ROUTES else "bus"
                    
                    vehicle_data = {
                        "id": entity.id,
                        "latitude": position.latitude,
                        "longitude": position.longitude,
                        "route_id": route_id,
                        "vehicle_type": vehicle_type,
                        "vehicle_id": vehicle.vehicle.id if vehicle.HasField('vehicle') else None,
                        "timestamp": vehicle.timestamp if vehicle.HasField('timestamp') else None,
                    }
                    vehicles.append(vehicle_data)
        
        return {
            "success": True,
            "vehicles": vehicles,
            "count": len(vehicles),
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Failed to fetch vehicle positions: {str(e)}",
            "vehicles": [],
            "count": 0,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error processing vehicle data: {str(e)}",
            "vehicles": [],
            "count": 0,
        }
