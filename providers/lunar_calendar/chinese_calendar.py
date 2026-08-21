from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import math

from .astronomy import _new_moon_jde_for_k, SYNODIC_MONTH, winter_solstice_jd_tt, principal_terms_between
from .timeutils import jd_to_gregorian, tt_jd_to_utc

MONTH_NAMES = {1:"正月",2:"二月",3:"三月",4:"四月",5:"五月",6:"六月",7:"七月",8:"八月",9:"九月",10:"十月",11:"十一月",12:"十二月"}
APOLLO_11_LANDING_UTC = datetime(1969,7,20,20,17,43,tzinfo=timezone.utc)

@dataclass(frozen=True)
class LunarMonthLabel:
    lunar_year: int
    month: int
    leap: bool
    natural_day_ordinal: int
    month_name: str
    start_tt_jd: float
    end_tt_jd: float
    le_year: int | None
    era_label: str


def _beijing_date(jd_tt: float):
    utc,_=tt_jd_to_utc(jd_tt)
    return (utc+timedelta(hours=8)).date()


def _month11_start_for_solstice(ws_jd: float) -> tuple[float,int]:
    """Chinese civil-calendar rule: month containing winter-solstice Beijing date is month 11."""
    k0=round((ws_jd-2451550.09765)/SYNODIC_MONTH)
    vals=[(_new_moon_jde_for_k(k),k) for k in range(k0-3,k0+4)]
    ws_date=_beijing_date(ws_jd)
    eligible=[x for x in vals if _beijing_date(x[0])<=ws_date]
    return max(eligible,key=lambda x:_beijing_date(x[0]))


def _contains_principal_term_civil(start_jd: float, end_jd: float) -> bool:
    start_date=_beijing_date(start_jd)
    end_date=_beijing_date(end_jd)
    terms=principal_terms_between(start_jd-2.0,end_jd+2.0)
    return any(start_date <= _beijing_date(t) < end_date for t in terms)


def _months_between_solstices(solstice_year: int):
    ws0=winter_solstice_jd_tt(solstice_year)
    ws1=winter_solstice_jd_tt(solstice_year+1)
    m11,k0=_month11_start_for_solstice(ws0)
    next_m11,k1=_month11_start_for_solstice(ws1)
    n=k1-k0
    starts=[_new_moon_jde_for_k(k0+i) for i in range(n+1)]
    if abs(starts[-1]-next_m11)>1e-5:
        raise RuntimeError("new moon sequence mismatch")
    leap_idx=None
    if n==13:
        for i in range(1,n):
            if not _contains_principal_term_civil(starts[i],starts[i+1]):
                leap_idx=i
                break
        if leap_idx is None:
            raise RuntimeError("leap year detected but no leap month found")
    elif n!=12:
        raise RuntimeError(f"unexpected lunar month count between solstices: {n}")
    rows=[]
    num=11
    for i in range(n):
        leap=(i==leap_idx)
        if i==0:
            num=11
        elif not leap:
            num=1 if num==12 else num+1
        rows.append({"start":starts[i],"end":starts[i+1],"month":num,"leap":leap})
    month1=next((r for r in rows if r["month"]==1 and not r["leap"]),None)
    if month1 is None:
        raise RuntimeError("month 1 not found")
    month1_year=_beijing_date(month1["start"]).year
    for r in rows:
        r["lunar_year"] = month1_year if r["start"] >= month1["start"] else month1_year-1
    return rows

def chinese_lunar_month_label(jd_tt: float) -> LunarMonthLabel:
    rough_year=jd_to_gregorian(jd_tt).year
    candidates=[]
    for sy in range(rough_year-2,rough_year+2):
        candidates.extend(_months_between_solstices(sy))
    row=next((r for r in candidates if r["start"]<=jd_tt<r["end"]),None)
    if row is None:
        raise RuntimeError("could not assign lunar month")
    month_name=("闰" if row["leap"] else "")+MONTH_NAMES[row["month"]]
    lunar_year=row["lunar_year"]
    # A lunisolar year has 12 or 13 lunar natural day/night cycles. Use the
    # chronological position so a leap month gets its own distinct ordinal.
    lunar_year_rows = sorted(
        {
            round(candidate["start"], 8): candidate
            for candidate in candidates
            if candidate["lunar_year"] == lunar_year
        }.values(),
        key=lambda candidate: candidate["start"],
    )
    natural_day_ordinal = next(
        index
        for index, candidate in enumerate(lunar_year_rows, start=1)
        if abs(candidate["start"] - row["start"]) < 1e-5
    )
    # LE1 corresponds to lunar year 1969 after the Apollo event; LE2 starts at 1970 month 1.
    # For post-epoch timestamps, this simple relation is stable.
    le_year=lunar_year-1968 if lunar_year>=1969 else None
    era=f"月球纪元 {le_year} 年" if le_year and le_year>=1 else "月球纪元前/纪元事件前"
    return LunarMonthLabel(
        lunar_year=lunar_year,
        month=row["month"],
        leap=row["leap"],
        natural_day_ordinal=natural_day_ordinal,
        month_name=month_name,
        start_tt_jd=row["start"],
        end_tt_jd=row["end"],
        le_year=le_year,
        era_label=era,
    )
