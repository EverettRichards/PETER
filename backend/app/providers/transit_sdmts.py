"""
Provider for San Diego MTS (SDMTS) real-time transit data.
Fetches vehicle positions for buses and trolleys.
"""
import requests
import os
import re
from typing import List, Dict, Any

SDMTS_API_URL = "https://realtime.sdmts.com/api/api/gtfs_realtime/vehicle-positions-for-agency/MTS.pbtext"
API_KEY = "90662cf7-2951-4fd4-9cdd-7c9cedadb247"

# Trolley route IDs (based on SDMTS system)
TROLLEY_ROUTES = {"510", "520", "530", "532"}


def parse_pbtext_response(text: str) -> List[Dict[str, Any]]:
    """
    Parse the human-readable pbtext format response.
    
    Expected format:
    entity {
      id: "141"
      vehicle {
        trip {
          trip_id: "19098388"
          route_id: "5"
        }
        position {
          latitude: 32.71145
          longitude: -117.10533
        }
        timestamp: 1771373814
        vehicle {
          id: "2014"
        }
      }
    }
    """
    vehicles = []
    
    # Split into entity blocks
    entity_blocks = re.split(r'entity\s*{', text)
    
    for block in entity_blocks[1:]:  # Skip first empty split
        try:
            # Extract entity id
            entity_id_match = re.search(r'id:\s*"([^"]+)"', block)
            if not entity_id_match:
                continue
            entity_id = entity_id_match.group(1)
            
            # Extract route_id
            route_id_match = re.search(r'route_id:\s*"([^"]+)"', block)
            route_id = route_id_match.group(1) if route_id_match else "unknown"
            
            # Extract latitude
            lat_match = re.search(r'latitude:\s*([-\d.]+)', block)
            if not lat_match:
                continue
            latitude = float(lat_match.group(1))
            
            # Extract longitude
            lon_match = re.search(r'longitude:\s*([-\d.]+)', block)
            if not lon_match:
                continue
            longitude = float(lon_match.group(1))
            
            # Extract vehicle id (nested in vehicle { id: "..." })
            vehicle_id_match = re.search(r'vehicle\s*{\s*id:\s*"([^"]+)"', block)
            vehicle_id = vehicle_id_match.group(1) if vehicle_id_match else None
            
            # Extract timestamp
            timestamp_match = re.search(r'timestamp:\s*(\d+)', block)
            timestamp = int(timestamp_match.group(1)) if timestamp_match else None
            
            # Determine vehicle type
            vehicle_type = "trolley" if route_id in TROLLEY_ROUTES else "bus"
            
            vehicle_data = {
                "id": entity_id,
                "latitude": latitude,
                "longitude": longitude,
                "route_id": route_id,
                "vehicle_type": vehicle_type,
                "vehicle_id": vehicle_id,
                "timestamp": timestamp,
            }
            vehicles.append(vehicle_data)
            
        except (ValueError, AttributeError) as e:
            # Skip malformed entries
            continue
    
    return vehicles


def get_mock_vehicle_positions() -> Dict[str, Any]:
    """
    Return mock vehicle positions for testing when API is not accessible.
    """
    mock_vehicles = [
        # Buses
        {"id": "1", "latitude": 32.7157, "longitude": -117.1611, "route_id": "5", "vehicle_type": "bus", "vehicle_id": "2001", "timestamp": None},
        {"id": "2", "latitude": 32.7357, "longitude": -117.1411, "route_id": "10", "vehicle_type": "bus", "vehicle_id": "2002", "timestamp": None},
        {"id": "3", "latitude": 32.6957, "longitude": -117.1811, "route_id": "15", "vehicle_type": "bus", "vehicle_id": "2003", "timestamp": None},
        {"id": "4", "latitude": 32.7457, "longitude": -117.1211, "route_id": "20", "vehicle_type": "bus", "vehicle_id": "2004", "timestamp": None},
        # Trolleys
        {"id": "5", "latitude": 32.7057, "longitude": -117.1511, "route_id": "510", "vehicle_type": "trolley", "vehicle_id": "3001", "timestamp": None},
        {"id": "6", "latitude": 32.7257, "longitude": -117.1311, "route_id": "520", "vehicle_type": "trolley", "vehicle_id": "3002", "timestamp": None},
        {"id": "7", "latitude": 32.6857, "longitude": -117.1711, "route_id": "530", "vehicle_type": "trolley", "vehicle_id": "3003", "timestamp": None},
    ]
    
    return {
        "success": True,
        "vehicles": mock_vehicles,
        "count": len(mock_vehicles),
        "mock": True,
    }


def get_vehicle_positions() -> Dict[str, Any]:
    """
    Fetch current vehicle positions from SDMTS API.
    Returns a dict with vehicle data including position, route, and vehicle type.
    """
    # Check if we should use mock data (for testing)
    if os.environ.get("USE_MOCK_TRANSIT", "false").lower() == "true":
        return get_mock_vehicle_positions()
    
    try:
        url = f"{SDMTS_API_URL}?key={API_KEY}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Parse the text response
        vehicles = parse_pbtext_response(response.text)
        
        return {
            "success": True,
            "vehicles": vehicles,
            "count": len(vehicles),
        }
        
    except requests.exceptions.RequestException as e:
        # In production, return empty list with error
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
