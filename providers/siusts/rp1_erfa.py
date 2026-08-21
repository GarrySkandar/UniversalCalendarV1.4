\
"""
SI-USTS RP1 time-scale adapter using PyERFA/ERFA.

This module intentionally delegates the IAU/SOFA-derived time-scale
transformations to ERFA instead of reimplementing those algorithms.

Dependency:
    pip install pyerfa

RP1 convention:
    Epoch E0 is the geocentric J2000.0 event:
        JD(TT) = 2451545.0
    SI-UST(E) = TCB(E) - TCB(E0)

UTC inputs are interpreted as geocentric UTC-labelled events.

NOTE:
    ERFA is derived from the IAU SOFA software. It is not the IAU SOFA
    distribution itself. Production conformance should be checked against
    the designated SI-USTS reference-profile implementation and test vectors.
"""
from __future__ import annotations
from dataclasses import dataclass
from .timestamp import SIUSTimestamp, NS_PER_S

try:
    import erfa
except ImportError as exc:
    raise ImportError("rp1_erfa requires PyERFA: pip install pyerfa") from exc

DAYSEC = 86400.0
E0_TT1 = 2451545.0
E0_TT2 = 0.0

def _tt_to_tcb_geocentric(tt1: float, tt2: float):
    # u=v=0 removes topocentric terms. UT fraction and longitude are then
    # irrelevant for the site terms; 0 is used as the RP1 convention.
    dtr = float(erfa.dtdb(tt1, tt2, 0.0, 0.0, 0.0, 0.0))
    tdb1, tdb2 = erfa.tttdb(tt1, tt2, dtr)
    return erfa.tdbtcb(tdb1, tdb2)

def _epoch_tcb():
    return _tt_to_tcb_geocentric(E0_TT1, E0_TT2)

E0_TCB1, E0_TCB2 = _epoch_tcb()

def _diff_days(a1, a2, b1, b2) -> float:
    # Keep the two-part-JD structure as long as possible.
    return (float(a1) - float(b1)) + (float(a2) - float(b2))

def utc_fields_to_siust(
    year: int, month: int, day: int,
    hour: int, minute: int, second: float
) -> SIUSTimestamp:
    utc1, utc2 = erfa.dtf2d("UTC", year, month, day, hour, minute, second)
    tai1, tai2 = erfa.utctai(utc1, utc2)
    tt1, tt2 = erfa.taitt(tai1, tai2)
    tcb1, tcb2 = _tt_to_tcb_geocentric(tt1, tt2)
    delta_seconds = _diff_days(tcb1, tcb2, E0_TCB1, E0_TCB2) * DAYSEC
    total_ns = round(delta_seconds * NS_PER_S)  # Python: ties-to-even
    return SIUSTimestamp.from_total_nanoseconds(total_ns)

def siust_to_utc_fields(ts: SIUSTimestamp):
    delta_days = ts.total_nanoseconds / NS_PER_S / DAYSEC
    tcb1 = E0_TCB1
    tcb2 = E0_TCB2 + delta_days

    tdb1, tdb2 = erfa.tcbtdb(tcb1, tcb2)

    # TDB -> TT needs TDB-TT evaluated at TT. Iterate to consistency.
    tt1, tt2 = tdb1, tdb2
    for _ in range(4):
        dtr = float(erfa.dtdb(tt1, tt2, 0.0, 0.0, 0.0, 0.0))
        tt1, tt2 = erfa.tdbtt(tdb1, tdb2, dtr)

    tai1, tai2 = erfa.tttai(tt1, tt2)
    utc1, utc2 = erfa.taiutc(tai1, tai2)

    year, month, day, ihmsf = erfa.d2dtf("UTC", 9, utc1, utc2)
    hour, minute, second, nanosecond = [int(x) for x in ihmsf]
    return {
        "year": int(year),
        "month": int(month),
        "day": int(day),
        "hour": hour,
        "minute": minute,
        "second": second,
        "nanosecond": nanosecond,
    }
