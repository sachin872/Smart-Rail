import networkx as nx
import math
from typing import Dict, Any, List, Optional, Tuple
from backend.app.core.db import get_db_connection

class RailwayGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.stations: Dict[str, Dict[str, Any]] = {}
        self.segments: Dict[str, Dict[str, Any]] = {}
        self.signals: Dict[str, Dict[str, Any]] = {}
        self.platforms: Dict[str, List[str]] = {}
        self.reload_from_db()

    def reload_from_db(self):
        conn = get_db_connection()
        cursor = conn.cursor()

        # Load stations
        cursor.execute("SELECT * FROM stations")
        self.stations = {row["code"]: dict(row) for row in cursor.fetchall()}

        # Load segments
        cursor.execute("SELECT * FROM segments")
        self.segments = {row["block_id"]: dict(row) for row in cursor.fetchall()}

        # Load signals
        cursor.execute("SELECT * FROM signals")
        self.signals = {row["signal_id"]: dict(row) for row in cursor.fetchall()}

        # Load platforms
        cursor.execute("SELECT * FROM platforms")
        self.platforms = {}
        for row in cursor.fetchall():
            st = row["station_code"]
            self.platforms.setdefault(st, []).append(row["platform_id"])

        conn.close()

        # Build NetworkX DiGraph
        self.graph.clear()
        for st_code, st_data in self.stations.items():
            self.graph.add_node(st_code, **st_data)

        for blk_id, blk_data in self.segments.items():
            u = blk_data["from_station"]
            v = blk_data["to_station"]
            self.graph.add_edge(
                u, v,
                block_id=blk_id,
                length_km=blk_data["length_km"],
                max_speed=blk_data["max_speed"],
                line=blk_data["line"],
                track_count=blk_data["track_count"],
                is_single_track=bool(blk_data["is_single_track"])
            )
            # If bidirectional / single track or DOWN line enabled
            if blk_data.get("is_single_track", 0):
                self.graph.add_edge(
                    v, u,
                    block_id=f"{blk_id}_REV",
                    base_block_id=blk_id,
                    length_km=blk_data["length_km"],
                    max_speed=blk_data["max_speed"],
                    line="DOWN",
                    track_count=1,
                    is_single_track=True
                )

    def get_corridor_stations(self) -> List[Dict[str, Any]]:
        return list(self.stations.values())

    def get_station(self, code: str) -> Optional[Dict[str, Any]]:
        return self.stations.get(code)

    def get_segment(self, block_id: str) -> Optional[Dict[str, Any]]:
        if block_id.endswith("_REV"):
            base = block_id.replace("_REV", "")
            seg = self.segments.get(base)
            if seg:
                rev = dict(seg)
                rev["from_station"], rev["to_station"] = seg["to_station"], seg["from_station"]
                rev["block_id"] = block_id
                return rev
        return self.segments.get(block_id)

    def get_route_between(self, from_st: str, to_st: str) -> List[str]:
        try:
            return nx.shortest_path(self.graph, source=from_st, target=to_st)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def calculate_geo_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # Haversine distance in km
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def snap_to_track(self, lat: float, lon: float) -> Tuple[float, float, float, Optional[str]]:
        # Finds nearest segment on corridor and returns (snapped_lat, snapped_lon, distance_m, block_id)
        best_dist = float('inf')
        best_point = (lat, lon)
        best_block = None

        for blk_id, seg in self.segments.items():
            st1 = self.stations.get(seg["from_station"])
            st2 = self.stations.get(seg["to_station"])
            if not st1 or not st2:
                continue

            # Linear interpolation closest point
            p1 = (st1["lat"], st1["lon"])
            p2 = (st2["lat"], st2["lon"])

            # Sample 10 points along the line segment
            for i in range(11):
                t = i / 10.0
                clat = p1[0] + t * (p2[0] - p1[0])
                clon = p1[1] + t * (p2[1] - p1[1])
                dist_km = self.calculate_geo_distance(lat, lon, clat, clon)
                dist_m = dist_km * 1000.0
                if dist_m < best_dist:
                    best_dist = dist_m
                    best_point = (clat, clon)
                    best_block = blk_id

        return best_point[0], best_point[1], best_dist, best_block

rail_graph = RailwayGraph()
