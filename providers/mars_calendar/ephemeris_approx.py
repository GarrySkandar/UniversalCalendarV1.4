"""JPL approximate planetary positions for Earth-Mars communication estimates.

Implements JPL SSD 'Approximate Positions of the Planets', Table 1 elements,
valid 1800 AD - 2050 AD. Positions are heliocentric J2000 ecliptic, AU.
This is not a replacement for Horizons/SPICE navigation ephemerides.
"""
from __future__ import annotations
from math import sin, cos, sqrt, radians, degrees, atan2, acos, pi
from typing import Tuple, Dict

AU_M = 149_597_870_700.0
C_M_S = 299_792_458.0
J2000_JD = 2451545.0

# a, e, I, L, long_peri, long_node and rates per Julian century.
ELEMENTS_1800_2050 = {
    "EARTH": {
        "base": (1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0),
        "rate": (0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0),
    },
    "MARS": {
        "base": (1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891),
        "rate": (0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343),
    },
}


def _wrap180(x: float) -> float:
    return (x + 180.0) % 360.0 - 180.0


def _kepler_eccentric_anomaly_deg(M_deg: float, e: float) -> float:
    M = _wrap180(M_deg)
    e_star = degrees(1.0) * e  # 180/pi * e
    E = M + e_star * sin(radians(M))
    for _ in range(30):
        dM = M - (E - e_star * sin(radians(E)))
        dE = dM / (1.0 - e * cos(radians(E)))
        E += dE
        if abs(dE) <= 1e-10:
            break
    return E


def heliocentric_ecliptic_au(body: str, jd_tdb: float) -> Tuple[float,float,float]:
    key = body.upper()
    if key not in ELEMENTS_1800_2050:
        raise ValueError("body must be EARTH or MARS")
    T = (jd_tdb - J2000_JD) / 36525.0
    base = ELEMENTS_1800_2050[key]["base"]
    rate = ELEMENTS_1800_2050[key]["rate"]
    a,e,I,L,varpi,Omega = [b+r*T for b,r in zip(base,rate)]
    omega = varpi - Omega
    M = L - varpi
    E = radians(_kepler_eccentric_anomaly_deg(M,e))
    xp = a * (cos(E) - e)
    yp = a * sqrt(1-e*e) * sin(E)
    w, O, inc = map(radians, (omega, Omega, I))
    x = (cos(w)*cos(O)-sin(w)*sin(O)*cos(inc))*xp + (-sin(w)*cos(O)-cos(w)*sin(O)*cos(inc))*yp
    y = (cos(w)*sin(O)+sin(w)*cos(O)*cos(inc))*xp + (-sin(w)*sin(O)+cos(w)*cos(O)*cos(inc))*yp
    z = (sin(w)*sin(inc))*xp + (cos(w)*sin(inc))*yp
    return x,y,z


def _norm(v):
    return sqrt(sum(x*x for x in v))


def _sub(a,b):
    return tuple(x-y for x,y in zip(a,b))


def _dot(a,b):
    return sum(x*y for x,y in zip(a,b))


def instantaneous_earth_mars_distance_au(jd_tdb: float) -> float:
    e = heliocentric_ecliptic_au("EARTH", jd_tdb)
    m = heliocentric_ecliptic_au("MARS", jd_tdb)
    return _norm(_sub(m,e))


def direct_light_time(jd_tdb_emit: float, direction: str = "MARS_TO_EARTH") -> Dict[str,float|str]:
    """Iterative one-way direct light time using approximate JPL positions.

    The emitter is evaluated at emission epoch; receiver is iterated at receive
    epoch. TDB/TT differences are negligible compared with this approximation's
    stated planetary-position accuracy.
    """
    direction = direction.upper()
    if direction not in ("MARS_TO_EARTH", "EARTH_TO_MARS"):
        raise ValueError("direction must be MARS_TO_EARTH or EARTH_TO_MARS")
    emitter = "MARS" if direction == "MARS_TO_EARTH" else "EARTH"
    receiver = "EARTH" if emitter == "MARS" else "MARS"
    r_emit = heliocentric_ecliptic_au(emitter, jd_tdb_emit)
    lt = instantaneous_earth_mars_distance_au(jd_tdb_emit) * AU_M / C_M_S
    for _ in range(10):
        jd_recv = jd_tdb_emit + lt / 86400.0
        r_recv = heliocentric_ecliptic_au(receiver, jd_recv)
        new_lt = _norm(_sub(r_recv, r_emit)) * AU_M / C_M_S
        if abs(new_lt-lt) < 1e-6:
            lt = new_lt
            break
        lt = new_lt
    dist_au = lt * C_M_S / AU_M
    return {
        "direction": direction,
        "one_way_light_time_seconds": lt,
        "one_way_light_time_minutes": lt/60.0,
        "light_path_distance_au": dist_au,
        "receive_jd_tdb_approx": jd_tdb_emit + lt/86400.0,
        "ephemeris_method": "JPL_APPROX_PLANET_POSITIONS_TABLE1",
        "validity": "1800-2050",
        "precision_class": "planning/reference; not navigation-grade",
    }


def solar_elongation_deg_as_seen_from_earth(jd_tdb: float) -> float:
    """Angle Sun-Earth-Mars, useful as conjunction geometry context."""
    earth = heliocentric_ecliptic_au("EARTH", jd_tdb)
    mars = heliocentric_ecliptic_au("MARS", jd_tdb)
    sun_from_earth = tuple(-x for x in earth)
    mars_from_earth = _sub(mars,earth)
    c = _dot(sun_from_earth,mars_from_earth)/(_norm(sun_from_earth)*_norm(mars_from_earth))
    c=max(-1.0,min(1.0,c))
    return degrees(acos(c))
