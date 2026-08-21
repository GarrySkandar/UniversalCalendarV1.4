"""Communication-delay helpers.

Calendar conversion is independent of communications. This module provides a
clean data model for direct or multi-segment links. Exact Earth-Mars OWLT should
be supplied by a JPL SPICE/Horizons ephemeris backend in production.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Iterable, Optional

C_M_S = 299_792_458.0

@dataclass
class LinkSegment:
    origin: str
    destination: str
    distance_m: Optional[float] = None
    light_time_seconds: Optional[float] = None
    network_delay_seconds: float = 0.0
    queue_relay_delay_seconds: float = 0.0
    status: str = "AVAILABLE"

    def resolved_light_time(self) -> float:
        if self.light_time_seconds is not None:
            return float(self.light_time_seconds)
        if self.distance_m is not None:
            return float(self.distance_m) / C_M_S
        raise ValueError("segment needs light_time_seconds or distance_m")

    def to_dict(self):
        d = asdict(self)
        d["resolved_light_time_seconds"] = self.resolved_light_time()
        return d


def summarize_link(segments: Iterable[LinkSegment]):
    segs = list(segments)
    light = sum(s.resolved_light_time() for s in segs)
    network = sum(s.network_delay_seconds for s in segs)
    relay = sum(s.queue_relay_delay_seconds for s in segs)
    statuses = [s.status for s in segs]
    overall = "AVAILABLE" if all(x == "AVAILABLE" for x in statuses) else "LIMITED_OR_UNAVAILABLE"
    return {
        "segments": [s.to_dict() for s in segs],
        "physics_light_time_seconds": light,
        "network_delay_seconds": network,
        "queue_relay_delay_seconds": relay,
        "estimated_total_delay_seconds": light + network + relay,
        "communication_status": overall,
    }


def earth_mars_communication_from_utc(year:int, month:int, day:int, hour:int=0, minute:int=0, second:float=0.0, direction:str="MARS_TO_EARTH"):
    """Approximate direct Earth-Mars communication geometry for 1800-2050.

    Uses JPL SSD approximate planetary elements; for navigation/mission-grade
    results replace with Horizons/SPICE.
    """
    from .core import gregorian_to_jd, utc_jd_to_tt_jd, format_utc_jd, tt_jd_to_utc_jd
    from .ephemeris_approx import direct_light_time, solar_elongation_deg_as_seen_from_earth
    jd_utc=gregorian_to_jd(year,month,day,hour,minute,second)
    jd_tt,utc_status=utc_jd_to_tt_jd(jd_utc)
    # Approximation uses JDTDB; TT is adequate at the stated positional accuracy.
    out=direct_light_time(jd_tt,direction)
    recv_tt=out["receive_jd_tdb_approx"]
    recv_utc,recv_status=tt_jd_to_utc_jd(recv_tt)
    out.update({
        "emit_earth_utc": format_utc_jd(jd_utc,3),
        "estimated_receive_earth_utc_if_receiver_is_earth": format_utc_jd(recv_utc,3) if direction.upper()=="MARS_TO_EARTH" else None,
        "solar_elongation_deg_as_seen_from_earth": solar_elongation_deg_as_seen_from_earth(jd_tt),
        "round_trip_light_time_seconds_simple": 2*out["one_way_light_time_seconds"],
        "utc_status": utc_status if utc_status==recv_status else [utc_status,recv_status],
        "communication_status": "GEOMETRY_ONLY",
        "note": "Solar elongation is reported but no mission-specific conjunction cutoff is imposed."
    })
    return out
