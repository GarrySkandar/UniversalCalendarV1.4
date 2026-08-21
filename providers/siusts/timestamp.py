\
from __future__ import annotations
from dataclasses import dataclass
import re

NS_PER_S = 1_000_000_000
S_PER_DAY = 86_400

_MACHINE_RE = re.compile(
    r"^SI-UST/1:(?P<sign>[+-])(?P<sec>\d+)\.(?P<ns>\d{9})s$"
)
_HUMAN_RE = re.compile(
    r"^SI-UST D(?P<day>-?\d+) "
    r"(?P<hh>\d{2}):(?P<mm>\d{2}):(?P<ss>\d{2})\.(?P<ns>\d{9})$"
)

@dataclass(frozen=True, order=True)
class SIUSTimestamp:
    """
    Canonical SI-UST timestamp.

    Internal invariant:
        value = seconds + nanoseconds / 1e9
        0 <= nanoseconds < 1e9

    Negative fractional values use floor-normalized representation:
        -0.5 s => seconds=-1, nanoseconds=500_000_000
    """
    seconds: int
    nanoseconds: int = 0

    def __post_init__(self):
        total_ns = self.seconds * NS_PER_S + self.nanoseconds
        sec, ns = divmod(total_ns, NS_PER_S)
        object.__setattr__(self, "seconds", int(sec))
        object.__setattr__(self, "nanoseconds", int(ns))

    @classmethod
    def from_total_nanoseconds(cls, total_ns: int) -> "SIUSTimestamp":
        sec, ns = divmod(int(total_ns), NS_PER_S)
        return cls(sec, ns)

    @property
    def total_nanoseconds(self) -> int:
        return self.seconds * NS_PER_S + self.nanoseconds

    def to_machine(self) -> str:
        total_ns = self.total_nanoseconds
        sign = "+" if total_ns >= 0 else "-"
        a = abs(total_ns)
        sec, ns = divmod(a, NS_PER_S)
        return f"SI-UST/1:{sign}{sec}.{ns:09d}s"

    def to_human(self) -> str:
        total_ns = self.total_nanoseconds
        day_ns = S_PER_DAY * NS_PER_S
        day, sod_ns = divmod(total_ns, day_ns)
        sod_s, ns = divmod(sod_ns, NS_PER_S)
        hh, rem = divmod(sod_s, 3600)
        mm, ss = divmod(rem, 60)
        return f"SI-UST D{day} {hh:02d}:{mm:02d}:{ss:02d}.{ns:09d}"

    @classmethod
    def parse_machine(cls, text: str) -> "SIUSTimestamp":
        m = _MACHINE_RE.fullmatch(text)
        if not m:
            raise ValueError("invalid SI-UST machine format")
        sec = int(m.group("sec"))
        ns = int(m.group("ns"))
        total_ns = sec * NS_PER_S + ns
        if m.group("sign") == "-":
            total_ns = -total_ns
        return cls.from_total_nanoseconds(total_ns)

    @classmethod
    def parse_human(cls, text: str) -> "SIUSTimestamp":
        m = _HUMAN_RE.fullmatch(text)
        if not m:
            raise ValueError("invalid SI-UST human format")
        day = int(m.group("day"))
        hh = int(m.group("hh"))
        mm = int(m.group("mm"))
        ss = int(m.group("ss"))
        ns = int(m.group("ns"))
        if hh > 23 or mm > 59 or ss > 59:
            raise ValueError("invalid time-of-day")
        total_ns = (
            (day * S_PER_DAY + hh * 3600 + mm * 60 + ss) * NS_PER_S + ns
        )
        return cls.from_total_nanoseconds(total_ns)
