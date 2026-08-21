from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Callable

from .timeutils import J2000

RAD = math.pi / 180.0
DEG = 180.0 / math.pi
SYNODIC_MONTH = 29.530588853


def norm360(x: float) -> float:
    return x % 360.0


def sind(x: float) -> float:
    return math.sin(x * RAD)


def cosd(x: float) -> float:
    return math.cos(x * RAD)


def solar_apparent_longitude(jd: float) -> float:
    """Approximate apparent geocentric solar ecliptic longitude, degrees.

    Sufficient for calendar principal-term assignment and lunar-lighting UI.
    """
    T = (jd - J2000) / 36525.0
    L0 = norm360(280.46646 + 36000.76983*T + 0.0003032*T*T)
    M = norm360(357.52911 + 35999.05029*T - 0.0001537*T*T + T**3/24490000.0)
    C = ((1.914602 - 0.004817*T - 0.000014*T*T) * sind(M)
         + (0.019993 - 0.000101*T) * sind(2*M)
         + 0.000289 * sind(3*M))
    true_long = L0 + C
    omega = 125.04 - 1934.136*T
    return norm360(true_long - 0.00569 - 0.00478*sind(omega))


def mean_obliquity(jd: float) -> float:
    T = (jd - J2000) / 36525.0
    seconds = 21.448 - 46.8150*T - 0.00059*T*T + 0.001813*T**3
    return 23.0 + 26.0/60.0 + seconds/3600.0


def apparent_obliquity(jd: float) -> float:
    T = (jd - J2000) / 36525.0
    omega = 125.04 - 1934.136*T
    return mean_obliquity(jd) + 0.00256*cosd(omega)


def sun_radec_of_date(jd: float) -> tuple[float, float]:
    lam = solar_apparent_longitude(jd) * RAD
    eps = apparent_obliquity(jd) * RAD
    ra = math.atan2(math.cos(eps)*math.sin(lam), math.cos(lam))
    dec = math.asin(math.sin(eps)*math.sin(lam))
    return ra, dec


def precess_radec_to_j2000(ra: float, dec: float, jd_from: float) -> tuple[float, float]:
    """Meeus precession, equator/equinox of date -> J2000."""
    T = (jd_from - J2000) / 36525.0
    t = (J2000 - jd_from) / 36525.0
    zeta = (((2306.2181 + 1.39656*T - 0.000139*T*T)*t
             + (0.30188 - 0.000344*T)*t*t + 0.017998*t**3) / 3600.0) * RAD
    z = (((2306.2181 + 1.39656*T - 0.000139*T*T)*t
          + (1.09468 + 0.000066*T)*t*t + 0.018203*t**3) / 3600.0) * RAD
    theta = (((2004.3109 - 0.85330*T - 0.000217*T*T)*t
              - (0.42665 + 0.000217*T)*t*t - 0.041833*t**3) / 3600.0) * RAD
    A = math.cos(dec) * math.sin(ra + zeta)
    B = math.cos(theta)*math.cos(dec)*math.cos(ra + zeta) - math.sin(theta)*math.sin(dec)
    C = math.sin(theta)*math.cos(dec)*math.cos(ra + zeta) + math.cos(theta)*math.sin(dec)
    return math.atan2(A, B) + z, math.asin(max(-1.0, min(1.0, C)))


def lunar_orientation_iau(jd: float) -> tuple[float, float, float]:
    """IAU-style lunar pole RA/Dec and prime meridian W (degrees, ICRF-like).

    Uses the standard 13 periodic arguments commonly distributed in IAU/SPICE PCK
    models. Adequate for sub-degree illumination geometry in this offline package.
    """
    d = jd - J2000
    T = d / 36525.0
    E = [0.0,
         125.045 - 0.0529921*d,
         250.089 - 0.1059842*d,
         260.008 + 13.0120009*d,
         176.625 + 13.3407154*d,
         357.529 + 0.9856003*d,
         311.589 + 26.4057084*d,
         134.963 + 13.0649930*d,
         276.617 + 0.3287146*d,
         34.226 + 1.7484877*d,
         15.134 - 0.1589763*d,
         119.743 + 0.0036096*d,
         239.961 + 0.1643573*d,
         25.053 + 12.9590088*d]
    ra = (269.9949 + 0.0031*T - 3.8787*sind(E[1]) - 0.1204*sind(E[2])
          + 0.0700*sind(E[3]) - 0.0172*sind(E[4]) + 0.0072*sind(E[6])
          - 0.0052*sind(E[10]) + 0.0043*sind(E[13]))
    dec = (66.5392 + 0.0130*T + 1.5419*cosd(E[1]) + 0.0239*cosd(E[2])
           - 0.0278*cosd(E[3]) + 0.0068*cosd(E[4]) - 0.0029*cosd(E[6])
           + 0.0009*cosd(E[7]) + 0.0008*cosd(E[10]) - 0.0009*cosd(E[13]))
    W = (38.3213 + 13.17635815*d - 1.4e-12*d*d + 3.5610*sind(E[1])
         + 0.1208*sind(E[2]) - 0.0642*sind(E[3]) + 0.0158*sind(E[4])
         + 0.0252*sind(E[5]) - 0.0066*sind(E[6]) - 0.0047*sind(E[7])
         - 0.0046*sind(E[8]) + 0.0028*sind(E[9]) + 0.0052*sind(E[10])
         + 0.0040*sind(E[11]) + 0.0019*sind(E[12]) - 0.0044*sind(E[13]))
    return norm360(ra), dec, norm360(W)


def _r3_passive(deg: float, v: tuple[float, float, float]) -> tuple[float, float, float]:
    a = deg*RAD; c, s = math.cos(a), math.sin(a)
    x, y, z = v
    return c*x + s*y, -s*x + c*y, z


def _r1_passive(deg: float, v: tuple[float, float, float]) -> tuple[float, float, float]:
    a = deg*RAD; c, s = math.cos(a), math.sin(a)
    x, y, z = v
    return x, c*y + s*z, -s*y + c*z


def subsolar_point(jd: float) -> tuple[float, float]:
    """Approximate selenographic subsolar longitude/latitude in degrees.

    The Sun-Moon parallax is neglected (~0.15 deg max); lunar orientation periodic
    terms are included. This is intended for natural-day and UI calculations, not
    precision landing/navigation.
    """
    ra, dec = sun_radec_of_date(jd)
    ra, dec = precess_radec_to_j2000(ra, dec, jd)
    v = (math.cos(dec)*math.cos(ra), math.cos(dec)*math.sin(ra), math.sin(dec))
    pole_ra, pole_dec, W = lunar_orientation_iau(jd)
    body = _r3_passive(W, _r1_passive(90.0-pole_dec, _r3_passive(90.0+pole_ra, v)))
    x, y, z = body
    r = math.sqrt(x*x+y*y+z*z)
    return math.atan2(y, x)*DEG, math.asin(z/r)*DEG


@dataclass(frozen=True)
class SolarGeometry:
    subsolar_lon_deg: float
    subsolar_lat_deg: float
    altitude_deg: float
    azimuth_deg: float
    astronomical_state: str


def local_solar_geometry(jd: float, lat_deg: float, lon_deg: float) -> SolarGeometry:
    slon, slat = subsolar_point(jd)
    p, l = lat_deg*RAD, lon_deg*RAD
    ps, ls = slat*RAD, slon*RAD
    sun = (math.cos(ps)*math.cos(ls), math.cos(ps)*math.sin(ls), math.sin(ps))
    east = (-math.sin(l), math.cos(l), 0.0)
    north = (-math.sin(p)*math.cos(l), -math.sin(p)*math.sin(l), math.cos(p))
    up = (math.cos(p)*math.cos(l), math.cos(p)*math.sin(l), math.sin(p))
    dot = lambda a,b: a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
    alt = math.asin(max(-1.0,min(1.0,dot(sun,up))))*DEG
    az = norm360(math.atan2(dot(sun,east), dot(sun,north))*DEG)
    return SolarGeometry(slon, slat, alt, az, "月球昼" if alt >= 0.0 else "月球夜")


def _new_moon_jde_for_k(k: int) -> float:
    """Meeus true new-moon JDE (TT), Chapter 49-style series."""
    T = k / 1236.85
    T2, T3, T4 = T*T, T*T*T, T*T*T*T
    jde = 2451550.09765 + SYNODIC_MONTH*k + 0.0001337*T2 - 0.000000150*T3 + 0.00000000073*T4
    E = 1 - 0.002516*T - 0.0000074*T2
    M = norm360(2.5534 + 29.10535670*k - 0.0000014*T2 - 0.00000011*T3)
    Mp = norm360(201.5643 + 385.81693528*k + 0.0107582*T2 + 0.00001238*T3 - 0.000000058*T4)
    F = norm360(160.7108 + 390.67050284*k - 0.0016118*T2 - 0.00000227*T3 + 0.000000011*T4)
    Om = norm360(124.7746 - 1.56375588*k + 0.0020672*T2 + 0.00000215*T3)
    corr = (-0.40720*sind(Mp) + 0.17241*E*sind(M) + 0.01608*sind(2*Mp)
            + 0.01039*sind(2*F) + 0.00739*E*sind(Mp-M) - 0.00514*E*sind(Mp+M)
            + 0.00208*E*E*sind(2*M) - 0.00111*sind(Mp-2*F) - 0.00057*sind(Mp+2*F)
            + 0.00056*E*sind(2*Mp+M) - 0.00042*sind(3*Mp) + 0.00042*E*sind(M+2*F)
            + 0.00038*E*sind(M-2*F) - 0.00024*E*sind(2*Mp-M) - 0.00017*sind(Om)
            - 0.00007*sind(Mp+2*M) + 0.00004*sind(2*Mp-2*F) + 0.00004*sind(3*M)
            + 0.00003*sind(Mp+M-2*F) + 0.00003*sind(2*Mp+2*F) - 0.00003*sind(Mp+M+2*F)
            + 0.00003*sind(Mp-M+2*F) - 0.00002*sind(Mp-M-2*F) - 0.00002*sind(3*Mp+M)
            + 0.00002*sind(4*Mp))
    A = [
        299.77 + 0.107408*k - 0.009173*T2,
        251.88 + 0.016321*k,
        251.83 + 26.651886*k,
        349.42 + 36.412478*k,
        84.66 + 18.206239*k,
        141.74 + 53.303771*k,
        207.14 + 2.453732*k,
        154.84 + 7.306860*k,
        34.52 + 27.261239*k,
        207.19 + 0.121824*k,
        291.34 + 1.844379*k,
        161.72 + 24.198154*k,
        239.56 + 25.513099*k,
        331.55 + 3.592518*k,
    ]
    coeff = [0.000325,0.000165,0.000164,0.000126,0.000110,0.000062,0.000060,0.000056,0.000047,0.000042,0.000040,0.000037,0.000035,0.000023]
    corr += sum(c*sind(a) for c,a in zip(coeff,A))
    return jde + corr


def new_moon_before_after(jd_tt: float) -> tuple[float, float, int]:
    k0 = math.floor((jd_tt - 2451550.09765) / SYNODIC_MONTH)
    candidates = [(k, _new_moon_jde_for_k(k)) for k in range(k0-2, k0+4)]
    prev = max((item for item in candidates if item[1] <= jd_tt), key=lambda x:x[1])
    nxt = min((item for item in candidates if item[1] > jd_tt), key=lambda x:x[1])
    return prev[1], nxt[1], prev[0]


def new_moon_near(jd_tt: float) -> tuple[float, int]:
    k0 = round((jd_tt - 2451550.09765) / SYNODIC_MONTH)
    vals = [(abs(_new_moon_jde_for_k(k)-jd_tt), _new_moon_jde_for_k(k), k) for k in range(k0-2,k0+3)]
    _, jd, k = min(vals)
    return jd, k


def moon_cycle_phase(jd_tt: float) -> tuple[float, float, float, float]:
    prev, nxt, _ = new_moon_before_after(jd_tt)
    frac = (jd_tt-prev)/(nxt-prev)
    return frac, frac*360.0, prev, nxt


def _angle_diff(a: float, b: float) -> float:
    return (a-b+180.0)%360.0-180.0


def _bisect_angle(target_deg: float, a: float, b: float, iterations: int=60) -> float:
    fa = _angle_diff(solar_apparent_longitude(a), target_deg)
    for _ in range(iterations):
        m=(a+b)/2
        fm=_angle_diff(solar_apparent_longitude(m), target_deg)
        # A valid bracket stays away from the +/-180 discontinuity.
        if fa == 0 or (fa < 0 <= fm) or (fa > 0 >= fm):
            b=m
        else:
            a=m; fa=fm
    return (a+b)/2


def solar_longitude_crossing(target_deg: float, guess_jd: float, window_days: float=8.0) -> float:
    step=0.25
    a=guess_jd-window_days
    fa=_angle_diff(solar_apparent_longitude(a),target_deg)
    x=a+step
    while x<=guess_jd+window_days:
        fx=_angle_diff(solar_apparent_longitude(x),target_deg)
        if abs(fx-fa)<180 and ((fa<=0<=fx) or (fa>=0>=fx)):
            return _bisect_angle(target_deg,x-step,x)
        a=x;fa=fx;x+=step
    raise RuntimeError("solar longitude crossing not bracketed")


def winter_solstice_jd_tt(year: int) -> float:
    # Gregorian Dec 21 12:00 approximate, interpreted as TT-like JD.
    from .timeutils import gregorian_to_jd
    from datetime import datetime, timezone
    guess=gregorian_to_jd(datetime(year,12,21,12,tzinfo=timezone.utc))
    return solar_longitude_crossing(270.0,guess,5.0)


def month_contains_principal_term(start_jd: float, end_jd: float) -> bool:
    """Whether solar longitude crosses a multiple of 30° in [start,end)."""
    # Sample endpoints just inside. Sun advances < 31 deg per synodic month.
    a=solar_apparent_longitude(start_jd+1e-7)
    b=solar_apparent_longitude(end_jd-1e-7)
    delta=(b-a)%360.0
    # unwrap and count integer multiples of 30 between a and a+delta
    au=a
    bu=a+delta
    first=math.ceil((au-1e-10)/30.0)*30.0
    return first < bu-1e-10 or abs(first-au)<1e-8



def principal_terms_between(jd_start: float, jd_end: float) -> list[float]:
    """Return solar-longitude crossings at multiples of 30° in [start,end]."""
    out=[]
    step=0.5
    t=jd_start
    lon0=solar_apparent_longitude(t)
    un0=lon0
    while t < jd_end:
        t1=min(t+step,jd_end)
        lon1=solar_apparent_longitude(t1)
        delta=(lon1-lon0)%360.0
        # Sun's apparent longitude increases slowly; choose the small forward arc.
        un1=un0+delta
        m=math.floor(un0/30.0)*30.0+30.0
        while m <= un1+1e-12:
            target=m%360.0
            try:
                root=_bisect_angle(target,t,t1)
                if jd_start-1e-9 <= root <= jd_end+1e-9:
                    if not out or abs(root-out[-1])>1e-5:
                        out.append(root)
            except Exception:
                pass
            m+=30.0
        t=t1; lon0=lon1; un0=un1
    return out

def find_solar_event(jd_start: float, lat_deg: float, lon_deg: float, want: str, max_days: float=35.0) -> float | None:
    """Find next geometric sunrise or sunset after jd_start.

    want: 'sunrise' or 'sunset'. Uses spherical horizon and bisection.
    """
    if want not in {"sunrise","sunset"}:
        raise ValueError("want must be sunrise or sunset")
    step=2/24.0
    t0=jd_start
    a0=local_solar_geometry(t0,lat_deg,lon_deg).altitude_deg
    t=t0+step
    while t<=jd_start+max_days:
        a=local_solar_geometry(t,lat_deg,lon_deg).altitude_deg
        crossed=(a0<0<=a) if want=="sunrise" else (a0>=0>a)
        if crossed:
            lo,hi=t-step,t
            for _ in range(50):
                mid=(lo+hi)/2
                am=local_solar_geometry(mid,lat_deg,lon_deg).altitude_deg
                if want=="sunrise":
                    if am>=0: hi=mid
                    else: lo=mid
                else:
                    if am<0: hi=mid
                    else: lo=mid
            return (lo+hi)/2
        t0=t;a0=a;t+=step
    return None
