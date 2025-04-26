from typing import Optional, Tuple
from shapely import wkb

def wkb_point_to_lat_lng(location_wkb_hex: str) -> Optional[Tuple[float, float]]:
    """Convert PostGIS WKB hex string to (latitude, longitude) tuple or return None if invalid."""
    try:
        point = wkb.loads(bytes.fromhex(location_wkb_hex))
        return point.y, point.x
    except Exception:
        return None
