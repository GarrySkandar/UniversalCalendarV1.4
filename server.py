#!/usr/bin/env python3
import json
import os
import sys
import platform
import argparse
import threading
import webbrowser
import datetime
from zoneinfo import ZoneInfo
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from providers.siusts import SIUSTimestamp
from providers.lunar_calendar import CalculationInput as LunarCalculationInput, calculate as calculate_lunar
from providers.mars_calendar.core import utc_to_mars, year_boundary_info

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

try:
    from providers.siusts.rp1_erfa import utc_fields_to_siust, siust_to_utc_fields
    SIUSTS_ERFA_OK = True
    SIUSTS_ERFA_ERROR = ""
except Exception as exc:
    utc_fields_to_siust = None
    siust_to_utc_fields = None
    SIUSTS_ERFA_OK = False
    SIUSTS_ERFA_ERROR = repr(exc)


def parse_utc_iso(value):
    raw = (value or "").strip()
    if not raw:
        return datetime.datetime.now(datetime.timezone.utc)
    dt = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc)


def format_utc_iso(dt):
    return dt.astimezone(datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def siust_payload(dt):
    if SIUSTS_ERFA_OK:
        second = dt.second + dt.microsecond / 1_000_000.0
        ts = utc_fields_to_siust(dt.year, dt.month, dt.day, dt.hour, dt.minute, second)
        profile = "SI-USTS-RP1 / PyERFA"
        conversion_status = "rp1-erfa"
    else:
        # Exact at the J2000 UTC epoch and continuous away from leap-second labels.
        # This fallback is suitable for calendar/UI use, not RP1 conformance.
        epoch = datetime.datetime(2000, 1, 1, 11, 58, 55, 816000, tzinfo=datetime.timezone.utc)
        total_ns = round((dt - epoch).total_seconds() * 1_000_000_000)
        ts = SIUSTimestamp.from_total_nanoseconds(total_ns)
        profile = "SI-USTS v0.5 UI fallback"
        conversion_status = "fallback-posix; install pyerfa for UTC/TAI/TT/TCB RP1"
    return {
        "type": "continuous-count",
        "system": "SI-USTS",
        "system_version": "0.5",
        "reference_profile": profile,
        "timestamp": ts.to_machine(),
        "human": ts.to_human(),
        "seconds": str(ts.seconds),
        "nanoseconds": ts.nanoseconds,
        "utc": format_utc_iso(dt),
        "utc_status": "official-known-era" if dt < datetime.datetime(2027, 7, 1, tzinfo=datetime.timezone.utc) else "future-utc-policy-not-final",
        "conversion_status": conversion_status,
        "uncertainty_ns": None,
        "trust_level": "T0_UNASSESSED",
        "erfa_available": SIUSTS_ERFA_OK,
    }


def lunar_payload(dt, lat, lon, height, offset, label):
    return calculate_lunar(LunarCalculationInput(dt, lat, lon, height, offset, label))


def mars_payload(dt, longitude):
    second = dt.second + dt.microsecond / 1_000_000.0
    result = utc_to_mars(dt.year, dt.month, dt.day, dt.hour, dt.minute, second, longitude).to_dict()
    result["type"] = "continuous-count"
    result["calendar"] = "mars-calendar-v0.4"
    result["boundary"] = year_boundary_info(result["local_mars_year_internal"])
    return result

try:
    import sxtwl
    SXTWL_OK = True
    SXTWL_ERROR = ""
    SXTWL_PATH = getattr(sxtwl, "__file__", "")
except Exception as exc:
    SXTWL_OK = False
    SXTWL_ERROR = repr(exc)
    SXTWL_PATH = ""

try:
    from pythaidate import CsDate
    THAI_OK = True
    THAI_ERROR = ""
    THAI_PATH = getattr(sys.modules.get("pythaidate"), "__file__", "")
except Exception as exc:
    THAI_OK = False
    THAI_ERROR = repr(exc)
    THAI_PATH = ""


try:
    from timezonefinder import TimezoneFinder
    TZF = TimezoneFinder(in_memory=True)
    TIMEZONE_OK = True
    TIMEZONE_ERROR = ""
except Exception as exc:
    TZF = None
    TIMEZONE_OK = False
    TIMEZONE_ERROR = repr(exc)


try:
    from lunar_python import Solar as LunarPySolar, Tao as LunarPyTao
    LUNAR_PY_OK = True
    LUNAR_PY_ERROR = ""
except Exception as exc:
    LunarPySolar = None
    LunarPyTao = None
    LUNAR_PY_OK = False
    LUNAR_PY_ERROR = repr(exc)


try:
    import caltib
    TIBETAN_OK = True
    TIBETAN_ERROR = ""
except Exception as exc:
    caltib = None
    TIBETAN_OK = False
    TIBETAN_ERROR = repr(exc)

GEOCODE_CACHE = {}
REVERSE_CACHE = {}

GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
SHX = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"]
JQ = ["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪"]
THAI_ZODIAC_ZH = {
    "ปีชวด":"鼠", "ปีฉลู":"牛", "ปีขาล":"虎", "ปีเถาะ":"兔", "ปีมะโรง":"龙", "ปีมะเส็ง":"蛇",
    "ปีมะเมีย":"马", "ปีมะแม":"羊", "ปีวอก":"猴", "ปีระกา":"鸡", "ปีจอ":"狗", "ปีกุน":"猪"
}


def gregorian_to_jdn(y, m, d):
    a = (14 - m) // 12
    y2 = y + 4800 - a
    m2 = m + 12 * a - 3
    return d + (153 * m2 + 2) // 5 + 365 * y2 + y2 // 4 - y2 // 100 + y2 // 400 - 32045


def jdn_to_gregorian(jdn):
    # Fliegel-Van Flandern, proleptic Gregorian, astronomical year numbering compatible with frontend.
    a = jdn + 32044
    b = (4 * a + 3) // 146097
    c = a - (146097 * b) // 4
    d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4
    m = (5 * e + 2) // 153
    day = e - (153 * m + 2) // 5 + 1
    month = m + 3 - 12 * (m // 10)
    year = 100 * b + d - 4800 + (m // 10)
    return year, month, day


def gz(obj):
    return GAN[obj.tg] + ZHI[obj.dz]


def chinese_day(y, m, d):
    day = sxtwl.fromSolar(int(y), int(m), int(d))
    ygz_spring = day.getYearGZ(True)
    ygz_lichun = day.getYearGZ(False)
    mgz = day.getMonthGZ()
    dgz = day.getDayGZ()
    out = {
        "solar": [day.getSolarYear(), day.getSolarMonth(), day.getSolarDay()],
        "lunar": {
            "year": day.getLunarYear(),
            "month": day.getLunarMonth(),
            "day": day.getLunarDay(),
            "leap": bool(day.isLunarLeap()),
            "month_days": int(sxtwl.getLunarMonthNum(day.getLunarYear(), day.getLunarMonth(), bool(day.isLunarLeap()))),
        },
        "ganzhi": {
            "year_chunjie": gz(ygz_spring),
            "year_lichun": gz(ygz_lichun),
            "month": gz(mgz),
            "day": gz(dgz),
        },
        "zodiac": SHX[ygz_spring.dz],
        "week": int(day.getWeek()),
        "term": None,
    }
    if day.hasJieQi():
        idx = int(day.getJieQi())
        jd = float(day.getJieQiJD())
        t = sxtwl.JD2DD(jd)
        out["term"] = {
            "index": idx,
            "name": JQ[idx % 24],
            "jd": jd,
            "time": [int(t.Y), int(t.M), int(t.D), int(t.h), int(t.m), int(round(t.s))],
        }
    return out


def thai_festival_for(cs):
    """Thai Theravada religious dates using the Thai lunisolar month/phase rules."""
    month = int(cs.month)
    raw_day = int(cs.day)
    waxing = raw_day <= 15
    phase_day = raw_day if waxing else raw_day - 15
    leap_month = bool(cs.leap_month)
    festivals = []

    def match(target_month, target_waxing, target_day, name, en):
        if month == target_month and waxing == target_waxing and phase_day == target_day:
            festivals.append({"name": name, "en": en})

    # In Thai official practice Makha and Visakha shift one lunar month in athikamas years.
    match(4 if leap_month else 3, True, 15, "万佛节（มาฆบูชา）", "Makha Bucha")
    match(7 if leap_month else 6, True, 15, "卫塞节（วิสาขบูชา）", "Visakha Bucha")
    match(7 if leap_month else 6, False, 8, "佛灭后第八日纪念（อัฏฐมีบูชา）", "Atthami Bucha")
    # In athikamas years the second eighth month is encoded as 88 by pythaidate.
    match(88 if leap_month else 8, True, 15, "三宝节（อาสาฬหบูชา）", "Asalha Bucha")
    match(88 if leap_month else 8, False, 1, "入雨安居（เข้าพรรษา）", "Khao Phansa")
    match(11, True, 15, "出雨安居（ออกพรรษา）", "Ok Phansa")
    return festivals


def thai_day(y, m, d):
    if not THAI_OK:
        raise RuntimeError("pythaidate not installed")
    jdn = gregorian_to_jdn(int(y), int(m), int(d))
    cs = CsDate.fromjulianday(jdn)
    raw_day = int(cs.day)
    waxing = raw_day <= 15
    phase_day = raw_day if waxing else raw_day - 15
    month = int(cs.month)
    yearnaksatr = str(cs.yearnaksatr)
    return {
        "solar": [int(y), int(m), int(d)],
        "jdn": jdn,
        "buddhist_year": int(y) + 543,
        "chulasakarat_year": int(cs.year),
        "month": month,
        "month_display": "后八月" if month == 88 else str(month),
        "raw_day": raw_day,
        "phase": "waxing" if waxing else "waning",
        "phase_zh": "上弦月期（ขึ้น）" if waxing else "下弦月期（แรม）",
        "phase_day": phase_day,
        "leap_month_year": bool(cs.leap_month),
        "leap_day_year": bool(cs.leap_day),
        "zodiac_th": yearnaksatr,
        "zodiac_zh": THAI_ZODIAC_ZH.get(yearnaksatr, ""),
        "text_th": str(cs),
        "festivals": thai_festival_for(cs),
    }


def thai_from_be_lunar(be, month, phase, phase_day, second8=False):
    if not THAI_OK:
        raise RuntimeError("pythaidate not installed")
    be = int(be); month = int(month); phase_day = int(phase_day)
    if month < 1 or month > 12 or phase_day < 1 or phase_day > 15:
        raise ValueError("泰国阴阳历月份或月相日超出范围")
    raw_month = 88 if (month == 8 and second8) else month
    raw_day = phase_day if phase == "waxing" else 15 + phase_day
    results = []
    # Chulasakarat new year is not Jan 1; search nearby CS years and select dates inside requested BE solar year.
    for cs_year in range(be - 1185, be - 1177):
        try:
            cs = CsDate(cs_year, raw_month, raw_day)
            jdn = int(cs.julianday)
            gy, gm, gd = jdn_to_gregorian(jdn)
            if gy + 543 != be:
                continue
            info = thai_day(gy, gm, gd)
            if info["month"] == raw_month and info["phase"] == phase and info["phase_day"] == phase_day:
                results.append(info)
        except Exception:
            continue
    # de-duplicate by JDN
    uniq = []
    seen = set()
    for x in results:
        if x["jdn"] not in seen:
            seen.add(x["jdn"]); uniq.append(x)
    return uniq

TIME_PERIOD_STARTS = (
    ("子", 23), ("丑", 1), ("寅", 3), ("卯", 5), ("辰", 7), ("巳", 9),
    ("午", 11), ("未", 13), ("申", 15), ("酉", 17), ("戌", 19), ("亥", 21),
)


def chinese_time_periods(y, m, d):
    """Return the 12 traditional double-hours for one Chinese almanac date."""
    periods = []
    for branch, hour in TIME_PERIOD_STARTS:
        solar = LunarPySolar.fromYmdHms(int(y), int(m), int(d), hour, 0, 0)
        lunar = solar.getLunar()

        def safe(name, default=""):
            try:
                return getattr(lunar, name)()
            except Exception:
                return default

        def safe_list(name):
            value = safe(name, [])
            return list(value) if isinstance(value, (list, tuple)) else ([] if value in (None, "") else [str(value)])

        periods.append({
            "branch": safe("getTimeZhi", branch) or branch,
            "start_hour": hour,
            "ganzhi": safe("getTimeInGanZhi"),
            "tian_shen": safe("getTimeTianShen"),
            "tian_shen_type": safe("getTimeTianShenType"),
            "luck": safe("getTimeTianShenLuck"),
            "yi": safe_list("getTimeYi"),
            "ji": safe_list("getTimeJi"),
        })
    return periods


def chinese_almanac(y, m, d, hour=12, minute=0, second=0):
    if not LUNAR_PY_OK:
        raise RuntimeError("lunar_python not installed")
    solar = LunarPySolar.fromYmdHms(int(y), int(m), int(d), int(hour), int(minute), int(second))
    lunar = solar.getLunar()
    bazi = lunar.getEightChar()
    tao = LunarPyTao.fromLunar(lunar) if LunarPyTao is not None else None
    def safe(name, default=""):
        try:
            v = getattr(lunar, name)()
            return v
        except Exception:
            return default
    def safe_list(name):
        v=safe(name, [])
        return list(v) if isinstance(v,(list,tuple)) else ([] if v in (None,"") else [str(v)])
    return {
        "rule_set":"6tail lunar-python / traditional almanac rule set",
        "solar": solar.toYmdHms(),
        "lunar": lunar.toString(),
        "full": lunar.toFullString(),
        "ganzhi": {
            "year": safe("getYearInGanZhiByLiChun"),
            "month": safe("getMonthInGanZhi"),
            "day": safe("getDayInGanZhi"),
            "time": safe("getTimeInGanZhi"),
        },
        "bazi": [bazi.getYear(), bazi.getMonth(), bazi.getDay(), bazi.getTime()],
        "wuxing": [bazi.getYearWuXing(), bazi.getMonthWuXing(), bazi.getDayWuXing(), bazi.getTimeWuXing()],
        "nayin": [lunar.getYearNaYin(), lunar.getMonthNaYin(), lunar.getDayNaYin(), lunar.getTimeNaYin()],
        "zhi_xing": safe("getZhiXing"),
        "tian_shen": safe("getDayTianShen"),
        "tian_shen_type": safe("getDayTianShenType"),
        "tian_shen_luck": safe("getDayTianShenLuck"),
        "xiu": safe("getXiu"),
        "xiu_luck": safe("getXiuLuck"),
        "xiu_gong": safe("getGong"),
        "xiu_animal": safe("getAnimal"),
        "pengzu": [safe("getPengZuGan"), safe("getPengZuZhi")],
        "chong": safe("getDayChongDesc"),
        "sha": safe("getDaySha"),
        "yi": safe_list("getDayYi"),
        "ji": safe_list("getDayJi"),
        "ji_shen": safe_list("getDayJiShen"),
        "xiong_sha": safe_list("getDayXiongSha"),
        "positions": {
            "xi": safe("getDayPositionXiDesc"),
            "fu": safe("getDayPositionFuDesc"),
            "cai": safe("getDayPositionCaiDesc"),
            "yang_gui": safe("getDayPositionYangGuiDesc"),
            "yin_gui": safe("getDayPositionYinGuiDesc"),
            "tai_sui": safe("getDayPositionTaiSuiDesc"),
            "tai_shen": safe("getDayPositionTai"),
        },
        "nine_star": {
            "year": str(safe("getYearNineStar")),
            "month": str(safe("getMonthNineStar")),
            "day": str(safe("getDayNineStar")),
        },
        "festivals": safe_list("getFestivals"),
        "other_festivals": safe_list("getOtherFestivals"),
        "moon_phase": safe("getYueXiang"),
        "xun": {
            "year": safe("getYearXun"), "year_kong": safe("getYearXunKong"),
            "month": safe("getMonthXun"), "month_kong": safe("getMonthXunKong"),
            "day": safe("getDayXun"), "day_kong": safe("getDayXunKong"),
            "time": safe("getTimeXun"), "time_kong": safe("getTimeXunKong"),
        },
        "time_periods": chinese_time_periods(y, m, d),
        "tao": ({
            "date": tao.toString(),
            "full": tao.toFullString(),
            "festivals": [str(x) for x in tao.getFestivals()],
            "san_hui": bool(tao.isDaySanHui()),
            "san_yuan": bool(tao.isDaySanYuan()),
            "ba_jie": bool(tao.isDayBaJie()),
            "wu_la": bool(tao.isDayWuLa()),
            "ba_hui": bool(tao.isDayBaHui()),
            "wu_day": bool(tao.isDayWu()),
            "ming_wu": bool(tao.isDayMingWu()),
            "an_wu": bool(tao.isDayAnWu()),
            "tian_she": bool(tao.isDayTianShe()),
        } if tao is not None else None),
    }


def tibetan_day(y, m, d, engine="phugpa"):
    if not TIBETAN_OK:
        raise RuntimeError("caltib not installed")
    engine = str(engine or "phugpa").lower()
    if engine not in ("phugpa", "tsurphu", "mongol"):
        raise ValueError("unsupported Tibetan engine")
    gdate = datetime.date(int(y), int(m), int(d))
    info = caltib.day_info(gdate, engine=engine)
    t = info.tibetan
    return {
        "engine": engine,
        "gregorian": gdate.isoformat(),
        "jdn": int(info.jdn),
        "tibetan": {
            "year": int(t.year),
            "month": int(t.month),
            "day": int(t.tithi),
            "leap_month": bool(t.is_leap_month),
            "leap_day": bool(t.is_leap_day),
            "skipped_preceding": bool(t.is_skipped),
        },
        "text": f"{t.year}年 {'闰' if t.is_leap_month else ''}{t.month}月 {t.tithi}日" + ("（重日）" if t.is_leap_day else "") + ("（前一藏历日缺）" if t.is_skipped else ""),
        "rule_set": f"caltib 0.3.x / {engine}",
    }


def _nominatim_get(endpoint, params):
    url = "https://nominatim.openstreetmap.org/" + endpoint + "?" + urlencode(params)
    req = Request(url, headers={
        "User-Agent": "UniversalCivilizationCalendar/1.4.0 (local educational calendar app)",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7"
    })
    with urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode("utf-8"))


def geocode_search(query):
    key=str(query).strip().lower()
    if not key: return []
    if key in GEOCODE_CACHE: return GEOCODE_CACHE[key]
    raw=_nominatim_get("search", {"q":query,"format":"jsonv2","addressdetails":1,"namedetails":1,"limit":8})
    out=[]
    for r in raw:
        a=r.get("address") or {}
        out.append({
            "display_name":r.get("display_name", ""),
            "name":(r.get("namedetails") or {}).get("name") or r.get("name") or a.get("city") or a.get("town") or a.get("village") or "",
            "lat":float(r["lat"]), "lon":float(r["lon"]),
            "type":r.get("type"), "category":r.get("category"),
            "country":a.get("country",""), "country_code":(a.get("country_code") or "").upper(),
            "state":a.get("state") or a.get("province") or "",
            "city":a.get("city") or a.get("town") or a.get("municipality") or a.get("village") or "",
        })
    GEOCODE_CACHE[key]=out
    return out


def geocode_reverse(lat, lon):
    key=(round(float(lat),5),round(float(lon),5))
    if key in REVERSE_CACHE: return REVERSE_CACHE[key]
    r=_nominatim_get("reverse", {"lat":lat,"lon":lon,"format":"jsonv2","addressdetails":1,"zoom":10})
    a=r.get("address") or {}
    out={
        "display_name":r.get("display_name", ""),
        "name":a.get("city") or a.get("town") or a.get("municipality") or a.get("village") or a.get("county") or "自定义地点",
        "country":a.get("country", ""), "country_code":(a.get("country_code") or "").upper(),
        "state":a.get("state") or a.get("province") or "",
        "lat":float(r.get("lat",lat)), "lon":float(r.get("lon",lon))
    }
    REVERSE_CACHE[key]=out
    return out


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Development/local app: never reuse HTML/JS/CSS from an older extracted version.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, payload, status=200):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            self.send_json({
                "ok": True,
                "app_version": "1.4.0",
                "si_usts": True,
                "si_usts_erfa": SIUSTS_ERFA_OK,
                "si_usts_erfa_error": SIUSTS_ERFA_ERROR,
                "lunar_calendar": True,
                "mars_calendar": True,
                "sxtwl": SXTWL_OK,
                "sxtwl_error": SXTWL_ERROR,
                "sxtwl_path": SXTWL_PATH,
                "thai": THAI_OK,
                "thai_error": THAI_ERROR,
                "thai_path": THAI_PATH,
                "python": platform.python_version(),
                "executable": sys.executable,
                "platform": platform.platform(),
                "recommended_windows_python": "3.11",
                "timezonefinder": TIMEZONE_OK,
                "lunar_python": LUNAR_PY_OK,
                "lunar_python_error": LUNAR_PY_ERROR,
                "tibetan": TIBETAN_OK,
                "tibetan_error": TIBETAN_ERROR,
                "timezone_error": TIMEZONE_ERROR,
                "packages": ["sxtwl==2.0.7", "pythaidate==0.2.0", "lunar_python>=1.4.8 (recommended almanac)", "caltib==0.3.2 (optional Tibetan versioned engine)", "timezonefinder>=6.5,<9 (optional)", "pyerfa>=2.0 (optional SI-USTS RP1 engine)"],
            })
            return
        if parsed.path == "/api/si-usts/from-utc":
            q = parse_qs(parsed.query)
            try:
                self.send_json({"ok": True, "data": siust_payload(parse_utc_iso(q.get("time", [""])[0]))})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/lunar-calendar/calculate":
            q = parse_qs(parsed.query)
            try:
                dt = parse_utc_iso(q.get("time", [""])[0])
                lat = float(q.get("lat", ["0.67409"])[0]); lon = float(q.get("lon", ["23.47298"])[0])
                height = float(q.get("height", ["0"])[0]); offset = float(q.get("offset", ["8"])[0])
                label = q.get("label", ["基地民用时间"])[0]
                self.send_json({"ok": True, "data": lunar_payload(dt, lat, lon, height, offset, label)})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/mars-calendar/calculate":
            q = parse_qs(parsed.query)
            try:
                dt = parse_utc_iso(q.get("time", [""])[0])
                lon = float(q.get("lon", ["0"])[0])
                self.send_json({"ok": True, "data": mars_payload(dt, lon)})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/geocode/search":
            q=parse_qs(parsed.query).get("q",[""])[0].strip()
            if len(q)<2:
                self.send_json({"ok":True,"data":[]}); return
            try:
                self.send_json({"ok":True,"data":geocode_search(q),"source":"OpenStreetMap Nominatim"})
            except Exception as exc:
                self.send_json({"ok":False,"error":str(exc),"data":[]}, 502)
            return
        if parsed.path == "/api/geocode/reverse":
            q=parse_qs(parsed.query)
            try:
                lat=float(q.get("lat",[""])[0]); lon=float(q.get("lon",[""])[0])
                self.send_json({"ok":True,"data":geocode_reverse(lat,lon),"source":"OpenStreetMap Nominatim"})
            except Exception as exc:
                self.send_json({"ok":False,"error":str(exc)}, 502)
            return
        if parsed.path == "/api/chinese/almanac":
            if not LUNAR_PY_OK:
                self.send_json({"ok":False,"error":"lunar_python not installed","detail":LUNAR_PY_ERROR},503); return
            q=parse_qs(parsed.query)
            try:
                y=int(q.get("y",[""])[0]); m=int(q.get("m",[""])[0]); d=int(q.get("d",[""])[0]); h=int(q.get("h",["12"])[0]); minute=int(q.get("min",["0"])[0]); second=int(q.get("sec",["0"])[0])
                self.send_json({"ok":True,"data":chinese_almanac(y,m,d,h,minute,second)})
            except Exception as exc:
                self.send_json({"ok":False,"error":str(exc)},400)
            return
        if parsed.path == "/api/tibetan/day":
            if not TIBETAN_OK:
                self.send_json({"ok":False,"error":"caltib not installed","detail":TIBETAN_ERROR},503); return
            q=parse_qs(parsed.query)
            try:
                y=int(q.get("y",[""])[0]); m=int(q.get("m",[""])[0]); d=int(q.get("d",[""])[0]); engine=q.get("engine",["phugpa"])[0]
                self.send_json({"ok":True,"data":tibetan_day(y,m,d,engine)})
            except Exception as exc:
                self.send_json({"ok":False,"error":str(exc)},400)
            return
        if parsed.path == "/api/location/resolve":
            q = parse_qs(parsed.query)
            try:
                lat = float(q.get("lat", [""])[0]); lon = float(q.get("lon", [""])[0])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    raise ValueError("latitude/longitude out of range")
                approx_minutes = int(round((lon / 15.0) * 4) * 15)
                zone = None; source = "longitude_approx"; offset_minutes = approx_minutes
                if TIMEZONE_OK and TZF is not None:
                    zone = TZF.timezone_at(lng=lon, lat=lat)
                    if zone:
                        source = "timezonefinder"
                        try:
                            now_utc = datetime.datetime.now(datetime.timezone.utc)
                            off = now_utc.astimezone(ZoneInfo(zone)).utcoffset()
                            offset_minutes = int(off.total_seconds() // 60) if off else 0
                        except Exception:
                            pass
                self.send_json({"ok": True, "data": {"lat": lat, "lon": lon, "timezone": zone, "utc_offset_minutes": offset_minutes, "source": source}})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/chinese/day":
            if not SXTWL_OK:
                self.send_json({"ok": False, "error": "sxtwl not installed", "detail": SXTWL_ERROR}, 503); return
            q = parse_qs(parsed.query)
            try:
                y = int(q.get("y", [""])[0]); m = int(q.get("m", [""])[0]); d = int(q.get("d", [""])[0])
                self.send_json({"ok": True, "data": chinese_day(y, m, d)})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/chinese/month":
            if not SXTWL_OK:
                self.send_json({"ok": False, "error": "sxtwl not installed", "detail": SXTWL_ERROR}, 503); return
            q = parse_qs(parsed.query)
            try:
                y = int(q.get("y", [""])[0]); m = int(q.get("m", [""])[0]); n = int(q.get("days", ["31"])[0])
                rows = []
                for d in range(1, n + 1):
                    try: rows.append(chinese_day(y, m, d))
                    except Exception: break
                self.send_json({"ok": True, "data": rows})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/chinese/from-lunar":
            if not SXTWL_OK:
                self.send_json({"ok": False, "error": "sxtwl not installed", "detail": SXTWL_ERROR}, 503); return
            q = parse_qs(parsed.query)
            try:
                y = int(q.get("y", [""])[0]); m = int(q.get("m", [""])[0]); d = int(q.get("d", [""])[0])
                leap = q.get("leap", ["0"])[0] in ("1","true","True","yes")
                day = sxtwl.fromLunar(y, m, d, leap)
                self.send_json({"ok": True, "data": chinese_day(day.getSolarYear(), day.getSolarMonth(), day.getSolarDay())})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/thai/day":
            if not THAI_OK:
                self.send_json({"ok": False, "error": "pythaidate not installed", "detail": THAI_ERROR}, 503); return
            q = parse_qs(parsed.query)
            try:
                y = int(q.get("y", [""])[0]); m = int(q.get("m", [""])[0]); d = int(q.get("d", [""])[0])
                self.send_json({"ok": True, "data": thai_day(y, m, d)})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/thai/month":
            if not THAI_OK:
                self.send_json({"ok": False, "error": "pythaidate not installed", "detail": THAI_ERROR}, 503); return
            q = parse_qs(parsed.query)
            try:
                y = int(q.get("y", [""])[0]); m = int(q.get("m", [""])[0]); n = int(q.get("days", ["31"])[0])
                rows=[]
                for d in range(1,n+1):
                    try: rows.append(thai_day(y,m,d))
                    except Exception as exc: rows.append({"solar":[y,m,d],"error":str(exc)})
                self.send_json({"ok": True, "data": rows})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
            return
        if parsed.path == "/api/thai/from-lunar":
            if not THAI_OK:
                self.send_json({"ok": False, "error": "pythaidate not installed", "detail": THAI_ERROR}, 503); return
            q=parse_qs(parsed.query)
            try:
                be=int(q.get("be",[""])[0]); month=int(q.get("month",[""])[0]); phase=q.get("phase",["waxing"])[0]
                phase_day=int(q.get("day",[""])[0]); second8=q.get("second8",["0"])[0] in ("1","true","True","yes")
                rows=thai_from_be_lunar(be,month,phase,phase_day,second8)
                self.send_json({"ok":True,"data":rows})
            except Exception as exc:
                self.send_json({"ok":False,"error":str(exc)},400)
            return
        super().do_GET()


def main():
    parser = argparse.ArgumentParser(description="Universal Calendar local web server")
    parser.add_argument("--port", type=int, default=None, help="TCP port; use 0 to choose a free port automatically")
    parser.add_argument("--open-browser", action="store_true", help="Open the actual bound URL after the server starts")
    args = parser.parse_args()
    port = args.port if args.port is not None else int(os.environ.get("PORT", "8765"))
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    actual_port = int(httpd.server_address[1])
    url = f"http://127.0.0.1:{actual_port}/?v=1.4.0"
    print(f"Universal Civilization Calendar v1.4.0 running at {url}")
    print(f"Python: {platform.python_version()} | {sys.executable}")
    print(f"Chinese calendar engine: {'OK' if SXTWL_OK else 'UNAVAILABLE'}")
    print(f"Thai lunisolar engine: {'OK' if THAI_OK else 'UNAVAILABLE'}")
    print(f"Timezone resolver: {'OK' if TIMEZONE_OK else 'FALLBACK'}")
    print(f"Traditional almanac engine: {'OK' if LUNAR_PY_OK else 'OPTIONAL/MISSING'}")
    print(f"Tibetan versioned engine: {'OK' if TIBETAN_OK else 'OPTIONAL/MISSING'}")
    print(f"SI-USTS RP1 adapter: {'ERFA' if SIUSTS_ERFA_OK else 'UI FALLBACK'}")
    print("Lunar calendar provider: OK")
    print("Mars calendar provider: OK")
    if SXTWL_OK:
        try:
            test = chinese_day(2026, 8, 9)
            print("Chinese self-test: OK | lunar", test["lunar"])
        except Exception as exc:
            print("Chinese self-test: FAILED |", repr(exc))
    if THAI_OK:
        try:
            test = thai_day(2026, 5, 31)
            print("Thai self-test: OK |", test["text_th"], "|", [x["en"] for x in test["festivals"]])
        except Exception as exc:
            print("Thai self-test: FAILED |", repr(exc))
    if args.open_browser:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()
    httpd.serve_forever()


if __name__ == "__main__":
    main()
