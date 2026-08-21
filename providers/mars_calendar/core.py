"""Mars Calendar v0.4 reference implementation.

Core formulas follow NASA GISS Mars24 (Allison/McEwen timing recipes).
Calendar rules follow SPEC_v0.4.md bundled with this package.

This implementation is dependency-free and intended as a reproducible
reference backend. A future SPICE backend can replace the Ls/year-boundary
solver without changing the calendar layer.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from math import cos, sin, floor, radians
from typing import Optional, Dict, Any, Tuple
from .piqueux_table import PIQUEUX_DAYS_FROM_J2000

SOL_TO_EARTH_DAYS = 1.0274912517
SECONDS_PER_EARTH_DAY = 86400.0
MARS24_MSD_OFFSET = 44796.0 - 0.0009626
J2000_JD = 2451545.0
MSD_REF_JD_TT = 2451549.5
MEAN_MARS_YEAR_SOL_ESTIMATE = 668.5906
MEAN_MARS_YEAR_EARTH_DAYS_ESTIMATE = MEAN_MARS_YEAR_SOL_ESTIMATE * SOL_TO_EARTH_DAYS

WEEKDAYS_EN = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
WEEKDAYS_ZH = ("星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日")

# Leap second table: effective UTC date (astronomical Gregorian Y,M,D), TAI-UTC seconds.
# Covers the full leap-second era through the most recent leap second (2017-01-01).
UTC_LEAP_DATA_VERSION = "IERS_BULLETIN_C_72_2026-07-06"
UTC_TAI37_VERIFIED_UNTIL_EXCLUSIVE = (2027,7,1)

LEAP_SECONDS = [
    ((1972,1,1),10), ((1972,7,1),11), ((1973,1,1),12), ((1974,1,1),13),
    ((1975,1,1),14), ((1976,1,1),15), ((1977,1,1),16), ((1978,1,1),17),
    ((1979,1,1),18), ((1980,1,1),19), ((1981,7,1),20), ((1982,7,1),21),
    ((1983,7,1),22), ((1985,7,1),23), ((1988,1,1),24), ((1990,1,1),25),
    ((1991,1,1),26), ((1992,7,1),27), ((1993,7,1),28), ((1994,7,1),29),
    ((1996,1,1),30), ((1997,7,1),31), ((1999,1,1),32), ((2006,1,1),33),
    ((2009,1,1),34), ((2012,7,1),35), ((2015,7,1),36), ((2017,1,1),37),
]

MONTH_LENGTHS_COMMON = [31,30,31,30,31,30,31,31,30,31,30,31,30,30,30,31,30,30,30,30,30,30]


def floor_mod(x: float, m: float) -> float:
    return x - m * floor(x / m)


def normalize180(deg: float) -> float:
    return floor_mod(deg + 180.0, 360.0) - 180.0


def normalize360(deg: float) -> float:
    return floor_mod(deg, 360.0)


def gregorian_to_jd(year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: float = 0.0) -> float:
    """Proleptic Gregorian calendar to Julian Date (astronomical year numbering)."""
    y, m = year, month
    if m <= 2:
        y -= 1
        m += 12
    a = floor(y / 100)
    b = 2 - a + floor(a / 4)
    jd0 = floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + day + b - 1524.5
    frac = (hour + minute / 60.0 + second / 3600.0) / 24.0
    return jd0 + frac


def jd_to_gregorian(jd: float) -> Tuple[int,int,int,int,int,float]:
    """Julian Date to proleptic Gregorian date, astronomical year numbering."""
    zf = jd + 0.5
    z = floor(zf)
    f = zf - z
    alpha = floor((z - 1867216.25) / 36524.25)
    a = z + 1 + alpha - floor(alpha / 4)
    b = a + 1524
    c = floor((b - 122.1) / 365.25)
    d = floor(365.25 * c)
    e = floor((b - d) / 30.6001)
    day_float = b - d - floor(30.6001 * e) + f
    day = floor(day_float)
    frac_day = day_float - day
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    total_seconds = frac_day * 86400.0
    hour = floor(total_seconds / 3600.0)
    total_seconds -= hour * 3600.0
    minute = floor(total_seconds / 60.0)
    second = total_seconds - minute * 60.0
    # absorb floating rounding overflows
    if second >= 59.9999995:
        second = 60.0
    return int(year), int(month), int(day), int(hour), int(minute), second


def _date_key_from_jd(jd_utc: float) -> Tuple[int,int,int]:
    y,m,d,_,_,_ = jd_to_gregorian(jd_utc)
    return y,m,d


def tai_minus_utc_for_jd(jd_utc: float) -> Tuple[float, str]:
    """Return TAI-UTC and status.

    Before 1972, caller should use Mars24's polynomial for TT-UTC instead.
    After last known leap-second entry, value is held constant and status is
    'assumed-no-future-leap-seconds'.
    """
    key = _date_key_from_jd(jd_utc)
    if key < (1972,1,1):
        raise ValueError("TAI-UTC table not used before 1972")
    val = 10.0
    for d, v in LEAP_SECONDS:
        if key >= d:
            val = float(v)
        else:
            break
    status = "known"
    if key >= UTC_TAI37_VERIFIED_UNTIL_EXCLUSIVE:
        status = "assumed-no-future-leap-seconds"
    return val, status


def tt_minus_utc_seconds(jd_utc: float) -> Tuple[float, str]:
    if jd_utc >= gregorian_to_jd(1972,1,1):
        tai_utc, status = tai_minus_utc_for_jd(jd_utc)
        return tai_utc + 32.184, status
    # NASA Mars24 revised empirical formula for pre-1972 UTC -> TT.
    t = (jd_utc - 2451545.0) / 36525.0
    dt = 64.184 + 59.0*t - 51.2*t*t - 67.1*t**3 - 16.4*t**4
    return dt, "mars24-pre-1972-polynomial"


def utc_jd_to_tt_jd(jd_utc: float) -> Tuple[float, str]:
    delta, status = tt_minus_utc_seconds(jd_utc)
    return jd_utc + delta / 86400.0, status


def tt_jd_to_utc_jd(jd_tt: float) -> Tuple[float, str]:
    # Fixed-point solve because TT-UTC depends weakly/stepwise on UTC date.
    jd_utc = jd_tt - 69.184 / 86400.0
    status = ""
    for _ in range(8):
        delta, status = tt_minus_utc_seconds(jd_utc)
        new = jd_tt - delta / 86400.0
        if abs(new - jd_utc) < 1e-12:
            jd_utc = new
            break
        jd_utc = new
    return jd_utc, status


def jd_tt_to_msd(jd_tt: float) -> float:
    return (jd_tt - MSD_REF_JD_TT) / SOL_TO_EARTH_DAYS + MARS24_MSD_OFFSET


def msd_to_jd_tt(msd: float) -> float:
    return (msd - MARS24_MSD_OFFSET) * SOL_TO_EARTH_DAYS + MSD_REF_JD_TT


def mars24_parameters_from_jd_tt(jd_tt: float) -> Dict[str, float]:
    """NASA Mars24 orbital/time parameters from JD_TT."""
    dt = jd_tt - J2000_JD
    M = 19.3871 + 0.52402073 * dt
    alpha_fms = 270.3871 + 0.524038496 * dt
    A = (0.0071,0.0057,0.0039,0.0037,0.0021,0.0020,0.0018)
    tau = (2.2353,2.7543,1.1177,15.7866,2.1354,2.4694,32.8493)
    phi = (49.409,168.173,191.837,21.736,15.704,95.528,49.095)
    pbs = sum(a * cos(radians(0.985626 * dt / t + p)) for a,t,p in zip(A,tau,phi))
    Mr = radians(M)
    center = ((10.691 + 3.0e-7 * dt) * sin(Mr)
              + 0.623 * sin(2*Mr)
              + 0.050 * sin(3*Mr)
              + 0.005 * sin(4*Mr)
              + 0.0005 * sin(5*Mr)
              + pbs)
    ls = normalize360(alpha_fms + center)
    eot_deg = (2.861 * sin(radians(2*ls))
               - 0.071 * sin(radians(4*ls))
               + 0.002 * sin(radians(6*ls))
               - center)
    msd = jd_tt_to_msd(jd_tt)
    amt_hours = floor_mod(24.0 * msd, 24.0)
    return {
        "delta_t_j2000_days": dt,
        "mean_anomaly_deg": normalize360(M),
        "alpha_fms_deg": normalize360(alpha_fms),
        "pbs_deg": pbs,
        "equation_of_center_deg": center,
        "ls_deg": ls,
        "eot_deg": eot_deg,
        "msd": msd,
        "amt_hours": amt_hours,
    }


def ls_deg_from_jd_tt(jd_tt: float) -> float:
    return mars24_parameters_from_jd_tt(jd_tt)["ls_deg"]


def _ls_signed_near_zero(jd_tt: float) -> float:
    # Around Ls=0, 359.x becomes negative and 0.x positive.
    return normalize180(ls_deg_from_jd_tt(jd_tt))


def find_ls0_jd_tt(guess_jd_tt: float, search_half_window_days: float = 20.0) -> float:
    """Find nearest Ls=0 crossing around guess using scan + bisection."""
    start = guess_jd_tt - search_half_window_days
    end = guess_jd_tt + search_half_window_days
    step = 0.5
    x0 = start
    y0 = _ls_signed_near_zero(x0)
    brackets = []
    x = x0 + step
    while x <= end + 1e-12:
        y = _ls_signed_near_zero(x)
        # A genuine zero crossing near 0 has small signed values on both sides.
        if y0 <= 0.0 <= y and abs(y0) < 30.0 and abs(y) < 30.0:
            brackets.append((x-step, x))
        x0, y0 = x, y
        x += step
    if not brackets:
        raise ValueError(f"No Ls=0 crossing found within ±{search_half_window_days} d")
    bracket = min(brackets, key=lambda ab: abs((ab[0]+ab[1])/2.0 - guess_jd_tt))
    lo, hi = bracket
    flo, fhi = _ls_signed_near_zero(lo), _ls_signed_near_zero(hi)
    for _ in range(80):
        mid = (lo + hi) / 2.0
        fm = _ls_signed_near_zero(mid)
        if abs(fm) < 1e-11 or (hi-lo) < 1e-11:
            return mid
        if fm >= 0:
            hi, fhi = mid, fm
        else:
            lo, flo = mid, fm
    return (lo + hi) / 2.0


# MY1 anchor guess (PDS: 1955-04-11 at Ls=0). Compute exact Mars24 root lazily.
MY1_GUESS_JD_UTC = gregorian_to_jd(1955,4,11,12,0,0)
MY1_GUESS_JD_TT = utc_jd_to_tt_jd(MY1_GUESS_JD_UTC)[0]
MY1_MARS24_ROOT_JD_TT = find_ls0_jd_tt(MY1_GUESS_JD_TT, 5.0)
MY1_PIQUEUX_JD_REF = J2000_JD + PIQUEUX_DAYS_FROM_J2000[1]
MY1_LS0_JD_TT = utc_jd_to_tt_jd(MY1_PIQUEUX_JD_REF)[0]
MY1_LS0_MSD = jd_tt_to_msd(MY1_LS0_JD_TT)
MY1_YEAR_START_INDEX = floor(MY1_LS0_MSD)


def year_boundary_info(mars_year: int) -> Dict[str, Any]:
    """Return the selected Ls=0 boundary source and time for a Mars year.

    MY0..MY100: locked published Piqueux et al. (2015) table.
    Outside that range: Mars24 analytic root, explicitly marked approximate.
    """
    if mars_year in PIQUEUX_DAYS_FROM_J2000:
        jd_ref = J2000_JD + PIQUEUX_DAYS_FROM_J2000[mars_year]
        # Table is published as a Julian-date offset without sub-minute time-scale
        # precision. Interpret as UTC-like civil JD for conversion to TT; this is
        # sufficient for the AMT-sol boundary and preserves the published epoch.
        jd_tt, status = utc_jd_to_tt_jd(jd_ref)
        return {
            "mars_year": mars_year,
            "source": "PIQUEUX_2015_TABLE1",
            "precision_class": "published_table_0.001_day",
            "jd_reference": jd_ref,
            "jd_tt": jd_tt,
            "earth_utc": format_utc_jd(jd_ref,3),
            "utc_status": status,
            "days_from_j2000": PIQUEUX_DAYS_FROM_J2000[mars_year],
        }
    guess = MY1_LS0_JD_TT + (mars_year - 1) * MEAN_MARS_YEAR_EARTH_DAYS_ESTIMATE
    jd_tt = find_ls0_jd_tt(guess, 15.0)
    jd_utc, status = tt_jd_to_utc_jd(jd_tt)
    return {
        "mars_year": mars_year,
        "source": "MARS24_ANALYTIC_FALLBACK",
        "precision_class": "approximate",
        "jd_reference": jd_utc,
        "jd_tt": jd_tt,
        "earth_utc": format_utc_jd(jd_utc,3),
        "utc_status": status,
        "days_from_j2000": jd_utc - J2000_JD,
    }


def year_ls0_jd_tt(mars_year: int) -> float:
    return year_boundary_info(mars_year)["jd_tt"]


def year_start_index(mars_year: int) -> int:
    return floor(jd_tt_to_msd(year_ls0_jd_tt(mars_year)))


def year_length(mars_year: int) -> int:
    return year_start_index(mars_year + 1) - year_start_index(mars_year)


def display_year(internal_year: int) -> Dict[str, Any]:
    if internal_year >= 1:
        return {"era":"MY", "year":internal_year, "zh":f"火星历{internal_year}年", "en":f"MY {internal_year}"}
    bme = 1 - internal_year
    return {"era":"BME", "year":bme, "zh":f"火星纪元前{bme}年", "en":f"{bme} BME"}


def estimate_year_from_global_sol(global_sol_index: int) -> int:
    y = floor((global_sol_index - MY1_YEAR_START_INDEX) / MEAN_MARS_YEAR_SOL_ESTIMATE) + 1
    while global_sol_index < year_start_index(y):
        y -= 1
    while global_sol_index >= year_start_index(y + 1):
        y += 1
    return int(y)


def month_lengths(mars_year: int) -> list[int]:
    lengths = MONTH_LENGTHS_COMMON.copy()
    yl = year_length(mars_year)
    if yl == 669:
        lengths[-1] = 31
    elif yl != 668:
        raise ValueError(f"Unexpected Mars civil year length {yl}; specification expects 668/669")
    return lengths


def day_of_year_to_month_day(mars_year: int, day_of_year: int) -> Tuple[int,int]:
    if not 1 <= day_of_year <= year_length(mars_year):
        raise ValueError("day_of_year out of range")
    remain = day_of_year
    for i, length in enumerate(month_lengths(mars_year), start=1):
        if remain <= length:
            return i, remain
        remain -= length
    raise AssertionError("month conversion failed")


def month_day_to_day_of_year(mars_year: int, month: int, day: int) -> int:
    lengths = month_lengths(mars_year)
    if not 1 <= month <= 22:
        raise ValueError("month out of range")
    if not 1 <= day <= lengths[month-1]:
        raise ValueError("day out of range")
    return sum(lengths[:month-1]) + day


def _hours_to_hms(hours: float) -> Tuple[int,int,float]:
    hours = floor_mod(hours,24.0)
    h = floor(hours)
    x = (hours-h)*60.0
    m = floor(x)
    s = (x-m)*60.0
    return int(h), int(m), s


def hms_string(hours: float, precision: int = 0) -> str:
    h,m,s = _hours_to_hms(hours)
    # round display only after date calculation
    s = round(s, precision)
    if s >= 60:
        s = 0.0; m += 1
    if m >= 60:
        m = 0; h = (h+1)%24
    if precision == 0:
        return f"{h:02d}:{m:02d}:{int(s):02d}"
    width = 3 + precision
    return f"{h:02d}:{m:02d}:{s:0{width}.{precision}f}"


def earth_weekday_from_jd_utc(jd_utc: float) -> Tuple[str,str]:
    # Julian-day weekday convention: floor(JD+1.5)%7 -> 0 Sunday ... 6 Saturday.
    sunday_index = int(floor(jd_utc + 1.5)) % 7
    monday_index = (sunday_index + 6) % 7
    return WEEKDAYS_EN[monday_index], WEEKDAYS_ZH[monday_index]


def format_utc_jd(jd_utc: float, precision: int = 3) -> str:
    """Format proleptic Gregorian UTC-like JD with stable rounding."""
    midnight = floor(jd_utc + 0.5) - 0.5
    sec_of_day = (jd_utc - midnight) * 86400.0
    sec_of_day = round(sec_of_day, precision)
    if sec_of_day >= 86400.0:
        midnight += 1.0
        sec_of_day = 0.0
    if sec_of_day < 0:
        midnight -= 1.0
        sec_of_day += 86400.0
    y,m,d,_,_,_ = jd_to_gregorian(midnight)
    hh = int(sec_of_day // 3600)
    sec_of_day -= hh * 3600
    mm = int(sec_of_day // 60)
    ss = sec_of_day - mm * 60
    if precision == 0:
        sec = f"{int(round(ss)):02d}"
    else:
        sec = f"{ss:0{3+precision}.{precision}f}"
    sign = "" if y >= 0 else "-"
    ys = f"{abs(y):04d}"
    return f"{sign}{ys}-{m:02d}-{d:02d}T{hh:02d}:{mm:02d}:{sec}Z"


@dataclass
class MarsDateResult:
    # Primary aliases follow the local civil date for backward compatibility.
    mars_year_internal: int
    era: str
    era_year: int
    year_length: int
    is_leap_year: bool

    global_mars_year_internal: int
    global_era: str
    global_era_year: int
    global_year_length: int
    global_day_of_year: int
    global_weekday_en: str
    global_weekday_zh: str
    global_reference_month: int
    global_reference_month_day: int

    local_mars_year_internal: int
    local_era: str
    local_era_year: int
    local_year_length: int
    local_day_of_year: int
    local_weekday_en: str
    local_weekday_zh: str
    local_reference_month: int
    local_reference_month_day: int

    # Legacy reference-month aliases are local-civil values.
    reference_month: int
    reference_month_day: int

    msd: float
    global_sol_index: int
    local_sol_index: int
    amt: str
    lmst: str
    longitude_east_360: float
    longitude_signed: float
    ls_deg: float
    earth_utc: str
    earth_reference_utc_date: str
    earth_reference_weekday_en: str
    earth_reference_weekday_zh: str
    utc_status: str

    def to_dict(self) -> Dict[str,Any]:
        return asdict(self)


def utc_to_mars(year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: float = 0.0,
                longitude_east: float = 0.0) -> MarsDateResult:
    jd_utc = gregorian_to_jd(year,month,day,hour,minute,second)
    jd_tt, utc_status = utc_jd_to_tt_jd(jd_utc)
    params = mars24_parameters_from_jd_tt(jd_tt)
    msd = params["msd"]
    global_idx = floor(msd)
    lon360 = normalize360(longitude_east)
    lon = normalize180(lon360)
    local_idx = floor(msd + lon/360.0)

    global_y = estimate_year_from_global_sol(global_idx)
    local_y = estimate_year_from_global_sol(local_idx)
    global_ystart = year_start_index(global_y)
    local_ystart = year_start_index(local_y)
    global_doy = global_idx - global_ystart + 1
    local_doy = local_idx - local_ystart + 1

    anchor = MY1_YEAR_START_INDEX
    gw = (global_idx - anchor) % 7
    lw = (local_idx - anchor) % 7
    gm,gmd = day_of_year_to_month_day(global_y, global_doy)
    lm,lmd = day_of_year_to_month_day(local_y, local_doy)
    lmst_hours = 24.0 * floor_mod(msd + lon/360.0, 1.0)

    # Reference Earth date = AMT noon of the GLOBAL Mars day.
    ref_msd = global_idx + 0.5
    ref_jd_tt = msd_to_jd_tt(ref_msd)
    ref_jd_utc, _ = tt_jd_to_utc_jd(ref_jd_tt)
    ry,rm,rd,_,_,_ = jd_to_gregorian(ref_jd_utc)
    ref_date = f"{ry:04d}-{rm:02d}-{rd:02d}" if ry >= 0 else f"-{abs(ry):04d}-{rm:02d}-{rd:02d}"
    ref_w_en,ref_w_zh=earth_weekday_from_jd_utc(ref_jd_utc)

    local_era_obj = display_year(local_y)
    global_era_obj = display_year(global_y)
    local_yl = year_length(local_y)
    global_yl = year_length(global_y)
    return MarsDateResult(
        mars_year_internal=local_y,
        era=local_era_obj["era"], era_year=local_era_obj["year"],
        year_length=local_yl, is_leap_year=(local_yl==669),

        global_mars_year_internal=global_y,
        global_era=global_era_obj["era"], global_era_year=global_era_obj["year"],
        global_year_length=global_yl, global_day_of_year=global_doy,
        global_weekday_en=WEEKDAYS_EN[gw], global_weekday_zh=WEEKDAYS_ZH[gw],
        global_reference_month=gm, global_reference_month_day=gmd,

        local_mars_year_internal=local_y,
        local_era=local_era_obj["era"], local_era_year=local_era_obj["year"],
        local_year_length=local_yl, local_day_of_year=local_doy,
        local_weekday_en=WEEKDAYS_EN[lw], local_weekday_zh=WEEKDAYS_ZH[lw],
        local_reference_month=lm, local_reference_month_day=lmd,

        reference_month=lm, reference_month_day=lmd,
        msd=msd, global_sol_index=global_idx, local_sol_index=local_idx,
        amt=hms_string(params["amt_hours"],0), lmst=hms_string(lmst_hours,0),
        longitude_east_360=lon360, longitude_signed=lon,
        ls_deg=params["ls_deg"], earth_utc=format_utc_jd(jd_utc,3),
        earth_reference_utc_date=ref_date,
        earth_reference_weekday_en=ref_w_en, earth_reference_weekday_zh=ref_w_zh,
        utc_status=utc_status,
    )


def mars_to_utc(mars_year_internal: int, day_of_year: int, hour: int = 0, minute: int = 0, second: float = 0.0,
                longitude_east: float = 0.0, time_kind: str = "LMST") -> Dict[str,Any]:
    """Convert a Mars civil date/time to Earth UTC.

    day_of_year is interpreted as local civil day when time_kind='LMST'; as
    global AMT day when time_kind='AMT'.
    """
    yl = year_length(mars_year_internal)
    if not 1 <= day_of_year <= yl:
        raise ValueError(f"day_of_year must be 1..{yl}")
    if not (0 <= hour < 24 and 0 <= minute < 60 and 0 <= second < 60):
        raise ValueError("invalid Mars civil time")
    frac = (hour + minute/60.0 + second/3600.0) / 24.0
    ystart = year_start_index(mars_year_internal)
    local_or_global_idx = ystart + day_of_year - 1
    lon = normalize180(normalize360(longitude_east))
    kind = time_kind.upper()
    if kind == "AMT":
        msd = local_or_global_idx + frac
    elif kind == "LMST":
        # LocalSolIndex = floor(MSD + lon/360); same for fractional local day.
        msd = local_or_global_idx + frac - lon/360.0
    else:
        raise ValueError("time_kind must be AMT or LMST")
    jd_tt = msd_to_jd_tt(msd)
    jd_utc, utc_status = tt_jd_to_utc_jd(jd_tt)
    # Round trip validation payload.
    y,m,d,hh,mm,ss = jd_to_gregorian(jd_utc)
    return {
        "earth_utc": format_utc_jd(jd_utc,3),
        "jd_utc": jd_utc,
        "jd_tt": jd_tt,
        "msd": msd,
        "utc_status": utc_status,
        "input": {
            "mars_year_internal": mars_year_internal,
            "day_of_year": day_of_year,
            "time": f"{hour:02d}:{minute:02d}:{second:06.3f}",
            "time_kind": kind,
            "longitude_signed": lon,
        },
        "gregorian_components": [y,m,d,hh,mm,ss],
    }


def mars_day_earth_interval(mars_year_internal: int, day_of_year: int) -> Dict[str,Any]:
    """Earth UTC interval corresponding to a GLOBAL AMT Mars day."""
    start_idx = year_start_index(mars_year_internal) + day_of_year - 1
    if day_of_year < 1 or day_of_year > year_length(mars_year_internal):
        raise ValueError("day_of_year out of range")
    start_tt = msd_to_jd_tt(start_idx)
    end_tt = msd_to_jd_tt(start_idx + 1)
    start_utc, s1 = tt_jd_to_utc_jd(start_tt)
    end_utc, s2 = tt_jd_to_utc_jd(end_tt)
    mid_utc, s3 = tt_jd_to_utc_jd(msd_to_jd_tt(start_idx + 0.5))
    y,m,d,_,_,_ = jd_to_gregorian(mid_utc)
    return {
        "interval_semantics":"[start,end)",
        "earth_utc_start": format_utc_jd(start_utc,3),
        "earth_utc_end": format_utc_jd(end_utc,3),
        "earth_reference_date": f"{y:04d}-{m:02d}-{d:02d}" if y >= 0 else f"-{abs(y):04d}-{m:02d}-{d:02d}",
        "duration_si_seconds": (end_tt-start_tt)*86400.0,
        "utc_status": s1 if s1==s2==s3 else [s1,s2,s3],
    }


def my1_epoch_info() -> Dict[str,Any]:
    mars24_utc, mars24_status = tt_jd_to_utc_jd(MY1_MARS24_ROOT_JD_TT)
    return {
        "selected_boundary_source": "PIQUEUX_2015_TABLE1",
        "my1_piqueux_days_from_j2000": PIQUEUX_DAYS_FROM_J2000[1],
        "my1_ls0_jd_tt_selected": MY1_LS0_JD_TT,
        "my1_ls0_msd_selected": MY1_LS0_MSD,
        "my1_year_start_index": MY1_YEAR_START_INDEX,
        "my1_piqueux_reference_utc": format_utc_jd(MY1_PIQUEUX_JD_REF,3),
        "my1_mars24_root_utc": format_utc_jd(mars24_utc,3),
        "mars24_ls_at_piqueux_reference_deg": ls_deg_from_jd_tt(MY1_LS0_JD_TT),
        "utc_status": mars24_status,
        "note": "MY1 civil boundary is locked to Piqueux et al. 2015 Table 1; Mars24 root is retained as an independent analytic cross-check.",
    }
