from datetime import datetime, timezone
import re

from providers.lunar_calendar.engine import CalculationInput, calculate
from providers.lunar_calendar.chinese_calendar import chinese_lunar_month_label
from providers.lunar_calendar.timeutils import utc_to_tt_jd


result = calculate(
    CalculationInput(
        utc=datetime(2026, 8, 14, 9, 0, tzinfo=timezone.utc),
        latitude_deg=0.0,
        longitude_deg=0.0,
    )
)
cultural = result["cultural"]

assert re.fullmatch(
    r"月球纪元\d+年第(?:[1-9]|1[0-3])个月球自然日",
    cultural["display"],
)
assert cultural["natural_day_ordinal"] in range(1, 14)
assert cultural["note"] == "按照中华农历的阴阳合历方式，一年12-13个月球自然昼夜日。"

regular_sixth_month = chinese_lunar_month_label(
    utc_to_tt_jd(datetime(2025, 7, 1, tzinfo=timezone.utc))[0]
)
leap_sixth_month = chinese_lunar_month_label(
    utc_to_tt_jd(datetime(2025, 8, 1, tzinfo=timezone.utc))[0]
)
assert (regular_sixth_month.month, regular_sixth_month.leap, regular_sixth_month.natural_day_ordinal) == (6, False, 6)
assert (leap_sixth_month.month, leap_sixth_month.leap, leap_sixth_month.natural_day_ordinal) == (6, True, 7)

print("Lunar cultural label checks passed.")
