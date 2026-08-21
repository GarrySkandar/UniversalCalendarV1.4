from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import math

J2000 = 2451545.0

# UTC leap-second table: effective UTC date -> TAI-UTC seconds.
# Current through IERS Bulletin C 72 (2026-07-06): 37 s remains in force.
LEAP_SECONDS = [
    (datetime(1972, 1, 1, tzinfo=timezone.utc), 10),
    (datetime(1972, 7, 1, tzinfo=timezone.utc), 11),
    (datetime(1973, 1, 1, tzinfo=timezone.utc), 12),
    (datetime(1974, 1, 1, tzinfo=timezone.utc), 13),
    (datetime(1975, 1, 1, tzinfo=timezone.utc), 14),
    (datetime(1976, 1, 1, tzinfo=timezone.utc), 15),
    (datetime(1977, 1, 1, tzinfo=timezone.utc), 16),
    (datetime(1978, 1, 1, tzinfo=timezone.utc), 17),
    (datetime(1979, 1, 1, tzinfo=timezone.utc), 18),
    (datetime(1980, 1, 1, tzinfo=timezone.utc), 19),
    (datetime(1981, 7, 1, tzinfo=timezone.utc), 20),
    (datetime(1982, 7, 1, tzinfo=timezone.utc), 21),
    (datetime(1983, 7, 1, tzinfo=timezone.utc), 22),
    (datetime(1985, 7, 1, tzinfo=timezone.utc), 23),
    (datetime(1988, 1, 1, tzinfo=timezone.utc), 24),
    (datetime(1990, 1, 1, tzinfo=timezone.utc), 25),
    (datetime(1991, 1, 1, tzinfo=timezone.utc), 26),
    (datetime(1992, 7, 1, tzinfo=timezone.utc), 27),
    (datetime(1993, 7, 1, tzinfo=timezone.utc), 28),
    (datetime(1994, 7, 1, tzinfo=timezone.utc), 29),
    (datetime(1996, 1, 1, tzinfo=timezone.utc), 30),
    (datetime(1997, 7, 1, tzinfo=timezone.utc), 31),
    (datetime(1999, 1, 1, tzinfo=timezone.utc), 32),
    (datetime(2006, 1, 1, tzinfo=timezone.utc), 33),
    (datetime(2009, 1, 1, tzinfo=timezone.utc), 34),
    (datetime(2012, 7, 1, tzinfo=timezone.utc), 35),
    (datetime(2015, 7, 1, tzinfo=timezone.utc), 36),
    (datetime(2017, 1, 1, tzinfo=timezone.utc), 37),
]
LEAP_TABLE_VALID_THROUGH = datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def gregorian_to_jd(dt: datetime) -> float:
    """Gregorian UTC-like calendar to Julian Date (same coordinate labeling)."""
    dt = ensure_utc(dt)
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + (dt.minute + (dt.second + dt.microsecond / 1e6) / 60.0) / 60.0) / 24.0
    if m <= 2:
        y -= 1
        m += 12
    a = math.floor(y / 100)
    b = 2 - a + math.floor(a / 4)
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5


def jd_to_gregorian(jd: float) -> datetime:
    """Julian Date to proleptic Gregorian datetime, labeled UTC."""
    z = math.floor(jd + 0.5)
    f = (jd + 0.5) - z
    if z < 2299161:
        a = z
    else:
        alpha = math.floor((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - math.floor(alpha / 4)
    b = a + 1524
    c = math.floor((b - 122.1) / 365.25)
    d = math.floor(365.25 * c)
    e = math.floor((b - d) / 30.6001)
    day = b - d - math.floor(30.6001 * e) + f
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    day_int = math.floor(day)
    frac = day - day_int
    total_us = int(round(frac * 86400 * 1_000_000))
    if total_us >= 86400 * 1_000_000:
        # Rare rounding at day boundary.
        base = datetime(year, month, day_int, tzinfo=timezone.utc) + timedelta(days=1)
        return base
    hh, rem = divmod(total_us, 3600 * 1_000_000)
    mm, rem = divmod(rem, 60 * 1_000_000)
    ss, us = divmod(rem, 1_000_000)
    return datetime(year, month, day_int, int(hh), int(mm), int(ss), int(us), tzinfo=timezone.utc)


def tai_minus_utc(dt: datetime) -> int | None:
    dt = ensure_utc(dt)
    if dt < LEAP_SECONDS[0][0]:
        return None
    value = None
    for effective, seconds in LEAP_SECONDS:
        if dt >= effective:
            value = seconds
        else:
            break
    return value


def utc_to_tt_jd(dt: datetime) -> tuple[float, str]:
    """Convert UTC to TT Julian Date where leap-second relation is known.

    For pre-1972 UTC, uses Delta-T approximation (UT1-like) because historical UTC
    had rate adjustments. For dates after the leap table validity horizon, assumes
    TAI-UTC=37 s and marks the result provisional.
    """
    dt = ensure_utc(dt)
    jd_utc = gregorian_to_jd(dt)
    tai_utc = tai_minus_utc(dt)
    if tai_utc is not None:
        status = "known UTC↔TAI table" if dt <= LEAP_TABLE_VALID_THROUGH else "provisional: assumes TAI-UTC remains 37 s"
        return jd_utc + (tai_utc + 32.184) / 86400.0, status
    # Pre-1972: use TT = UT1 + ΔT approximately.
    dec_year = dt.year + (dt.timetuple().tm_yday - 0.5) / (366 if is_leap(dt.year) else 365)
    return jd_utc + delta_t_seconds(dec_year) / 86400.0, "historical approximation: TT from UT1-like Delta-T model"


def tt_jd_to_utc(jd_tt: float) -> tuple[datetime, str]:
    """Convert TT JD to a human UTC label.

    Iterates leap seconds for modern dates. Outside reliable UTC history/future,
    returns a UT1-like approximation using Delta-T and labels it accordingly.
    """
    # First rough calendar assuming same JD label.
    rough = jd_to_gregorian(jd_tt)
    if rough.year >= 1972:
        # Fixed point: TT = UTC + (TAI-UTC + 32.184)s
        guess = rough - timedelta(seconds=69.184)
        for _ in range(4):
            leap = tai_minus_utc(guess)
            if leap is None:
                break
            guess = jd_to_gregorian(jd_tt - (leap + 32.184) / 86400.0)
        status = "known UTC↔TAI table" if guess <= LEAP_TABLE_VALID_THROUGH else "provisional UTC: assumes TAI-UTC remains 37 s"
        return guess, status
    # Historical pre-1972: derive UT1-like label from ΔT.
    y = rough.year + (rough.timetuple().tm_yday - 0.5) / (366 if is_leap(rough.year) else 365)
    dtsec = delta_t_seconds(y)
    return jd_to_gregorian(jd_tt - dtsec / 86400.0), "historical UT1-like approximation; pre-1972 UTC was non-uniform"


def is_leap(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def delta_t_seconds(year: float) -> float:
    """NASA/Espenak-Meeus style polynomial approximation for TT-UT1.

    Good enough for calendar/phase labeling and historical UTC-like display;
    not a substitute for IERS EOP in precision work.
    """
    y = year
    if y < -500:
        u = (y - 1820) / 100
        return -20 + 32 * u * u
    if y < 500:
        u = y / 100
        return (10583.6 - 1014.41*u + 33.78311*u**2 - 5.952053*u**3 - 0.1798452*u**4 + 0.022174192*u**5 + 0.0090316521*u**6)
    if y < 1600:
        u = (y - 1000) / 100
        return (1574.2 - 556.01*u + 71.23472*u**2 + 0.319781*u**3 - 0.8503463*u**4 - 0.005050998*u**5 + 0.0083572073*u**6)
    if y < 1700:
        t = y - 1600
        return 120 - 0.9808*t - 0.01532*t*t + t**3/7129
    if y < 1800:
        t = y - 1700
        return 8.83 + 0.1603*t - 0.0059285*t*t + 0.00013336*t**3 - t**4/1174000
    if y < 1860:
        t = y - 1800
        return (13.72 - 0.332447*t + 0.0068612*t**2 + 0.0041116*t**3 - 0.00037436*t**4 + 0.0000121272*t**5 - 0.0000001699*t**6 + 0.000000000875*t**7)
    if y < 1900:
        t = y - 1860
        return 7.62 + 0.5737*t - 0.251754*t**2 + 0.01680668*t**3 - 0.0004473624*t**4 + t**5/233174
    if y < 1920:
        t = y - 1900
        return -2.79 + 1.494119*t - 0.0598939*t**2 + 0.0061966*t**3 - 0.000197*t**4
    if y < 1941:
        t = y - 1920
        return 21.20 + 0.84493*t - 0.076100*t**2 + 0.0020936*t**3
    if y < 1961:
        t = y - 1950
        return 29.07 + 0.407*t - t**2/233 + t**3/2547
    if y < 1986:
        t = y - 1975
        return 45.45 + 1.067*t - t**2/260 - t**3/718
    if y < 2005:
        t = y - 2000
        return 63.86 + 0.3345*t - 0.060374*t**2 + 0.0017275*t**3 + 0.000651814*t**4 + 0.00002373599*t**5
    if y < 2050:
        t = y - 2000
        return 62.92 + 0.32217*t + 0.005589*t*t
    if y < 2150:
        return -20 + 32*((y-1820)/100)**2 - 0.5628*(2150-y)
    u = (y - 1820) / 100
    return -20 + 32*u*u


def format_iso(dt: datetime, timespec: str = "seconds") -> str:
    dt = ensure_utc(dt)
    s = dt.isoformat(timespec=timespec).replace("+00:00", "Z")
    return s


def fixed_offset(offset_hours: float) -> timezone:
    return timezone(timedelta(hours=offset_hours))


def format_offset_time(dt_utc: datetime, offset_hours: float) -> str:
    dt = ensure_utc(dt_utc).astimezone(fixed_offset(offset_hours))
    sign = "+" if offset_hours >= 0 else "-"
    ah = abs(offset_hours)
    hh = int(ah)
    mm = int(round((ah - hh) * 60))
    return f"{dt:%Y-%m-%d %H:%M:%S} UTC{sign}{hh:02d}:{mm:02d}"
