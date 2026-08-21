from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any

from .timeutils import utc_to_tt_jd, tt_jd_to_utc, format_iso, format_offset_time
from .astronomy import moon_cycle_phase, local_solar_geometry, find_solar_event
from .chinese_calendar import chinese_lunar_month_label, APOLLO_11_LANDING_UTC


@dataclass
class CalculationInput:
    utc: datetime
    latitude_deg: float
    longitude_deg: float
    height_m: float = 0.0
    civil_offset_hours: float = 8.0
    civil_label: str = "基地民用时间"


def calculate(inp: CalculationInput) -> dict[str, Any]:
    utc=inp.utc.astimezone(timezone.utc) if inp.utc.tzinfo else inp.utc.replace(tzinfo=timezone.utc)
    if not (-90<=inp.latitude_deg<=90):
        raise ValueError("纬度必须在 -90..90°")
    if not (-180<=inp.longitude_deg<=180):
        raise ValueError("经度必须在 -180..180°")
    jd_tt, time_status=utc_to_tt_jd(utc)
    phase_frac,phase_deg,nm0,nm1=moon_cycle_phase(jd_tt)
    geom=local_solar_geometry(jd_tt,inp.latitude_deg,inp.longitude_deg)
    label=chinese_lunar_month_label(jd_tt)
    nm0_utc,nm0_status=tt_jd_to_utc(nm0)
    nm1_utc,nm1_status=tt_jd_to_utc(nm1)
    rise_jd=find_solar_event(jd_tt,inp.latitude_deg,inp.longitude_deg,"sunrise")
    set_jd=find_solar_event(jd_tt,inp.latitude_deg,inp.longitude_deg,"sunset")
    rise_utc=tt_jd_to_utc(rise_jd)[0] if rise_jd else None
    set_utc=tt_jd_to_utc(set_jd)[0] if set_jd else None
    next_event=None
    if rise_utc and set_utc:
        next_event=("日出",rise_utc) if rise_utc<set_utc else ("日落",set_utc)
    elif rise_utc: next_event=("日出",rise_utc)
    elif set_utc: next_event=("日落",set_utc)

    post_epoch=utc>=APOLLO_11_LANDING_UTC
    cultural = {
        "era": label.era_label if post_epoch else "Apollo 11 月球纪元事件之前",
        "lunar_year_reference": label.lunar_year,
        "moon_day_name": f"{label.month_name}月球日",
        "leap_month": label.leap,
        "natural_day_ordinal": label.natural_day_ordinal,
        "display": (
            f"月球纪元{label.le_year}年第{label.natural_day_ordinal}个月球自然日"
            if post_epoch
            else f"月球纪元事件前第{label.natural_day_ordinal}个月球自然日"
        ),
        "note": "按照中华农历的阴阳合历方式，一年12-13个月球自然昼夜日。",
    }
    science = {
        "jd_tt": jd_tt,
        "time_scale": "TT-like computational axis for offline astronomical formulas",
        "time_conversion_status": time_status,
        "cycle_phase_fraction": phase_frac,
        "cycle_phase_percent": phase_frac*100.0,
        "cycle_phase_deg": phase_deg,
        "current_new_moon_tt_jd": nm0,
        "next_new_moon_tt_jd": nm1,
        "current_new_moon_utc": format_iso(nm0_utc),
        "next_new_moon_utc": format_iso(nm1_utc),
        "new_moon_utc_status": nm0_status if nm0_status==nm1_status else f"{nm0_status}; {nm1_status}",
    }
    natural = {
        "astronomical_state": geom.astronomical_state,
        "sun_altitude_deg": geom.altitude_deg,
        "sun_azimuth_deg": geom.azimuth_deg,
        "subsolar_longitude_deg": geom.subsolar_lon_deg,
        "subsolar_latitude_deg": geom.subsolar_lat_deg,
        "terrain_illumination": "未计算（本离线核心未内置 DEM；天文昼夜不等于实际地形直照）",
        "next_sunrise_utc": format_iso(rise_utc) if rise_utc else None,
        "next_sunset_utc": format_iso(set_utc) if set_utc else None,
        "next_event": {"name":next_event[0],"utc":format_iso(next_event[1])} if next_event else None,
    }
    civil = {
        "utc": format_iso(utc),
        "label": inp.civil_label,
        "offset_hours": inp.civil_offset_hours,
        "local": format_offset_time(utc,inp.civil_offset_hours),
    }
    metadata={
        "engine_version":"0.1.0",
        "rules":"月球历规则草案 v0.3 + 后续确认项",
        "offline":"纯 Python 标准库，无网络依赖",
        "precision_note":"月球自然光照为球形月面+IAU周期姿态近似；适合历法/作业规划原型，不用于导航、着陆或安全关键任务。",
        "height_m":inp.height_m,
    }
    return {"cultural":cultural,"civil":civil,"science":science,"natural":natural,"metadata":metadata}
