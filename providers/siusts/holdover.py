\
from __future__ import annotations
from dataclasses import dataclass
from math import sqrt
from .timestamp import SIUSTimestamp, NS_PER_S

@dataclass(frozen=True)
class HoldoverEstimate:
    timestamp: SIUSTimestamp
    uncertainty_ns: int
    mode: str
    elapsed_local_seconds: float

@dataclass
class HoldoverState:
    """
    Application-level holdover model.

    Definitions:
      anchor_siust:
          Best SI-UST estimate at the last trusted synchronization.
      anchor_monotonic_seconds:
          Reading of a monotonic local clock at the same instant.
      frequency_error_ppm:
          Estimated fractional rate error of the local monotonic clock,
          where +1 ppm means the local oscillator runs fast by 1e-6.
      frequency_uncertainty_ppm:
          Conservative 1-sigma (or policy-bound) uncertainty of that rate.
      anchor_uncertainty_ns:
          Time uncertainty at the anchor.

    The elapsed true time is estimated as:
        dt_true = dt_local / (1 + frequency_error)

    Uncertainty grows at least linearly with the conservative frequency
    uncertainty. An optional random-walk term can be supplied to model
    oscillator noise/temperature/aging more conservatively.
    """

    anchor_siust: SIUSTimestamp
    anchor_monotonic_seconds: float
    frequency_error_ppm: float = 0.0
    frequency_uncertainty_ppm: float = 1.0
    anchor_uncertainty_ns: int = 0
    random_walk_ns_per_sqrt_s: float = 0.0

    def estimate(self, monotonic_now_seconds: float) -> HoldoverEstimate:
        dt_local = monotonic_now_seconds - self.anchor_monotonic_seconds
        if dt_local < 0:
            raise ValueError("monotonic clock moved backwards or anchor is invalid")

        eps = self.frequency_error_ppm * 1e-6
        dt_true = dt_local / (1.0 + eps)

        elapsed_ns = round(dt_true * NS_PER_S)
        ts = SIUSTimestamp.from_total_nanoseconds(
            self.anchor_siust.total_nanoseconds + elapsed_ns
        )

        rate_bound = abs(self.frequency_uncertainty_ppm) * 1e-6
        linear_ns = dt_true * rate_bound * NS_PER_S
        rw_ns = self.random_walk_ns_per_sqrt_s * sqrt(max(dt_true, 0.0))

        uncertainty_ns = math_ceil_nonnegative(
            self.anchor_uncertainty_ns + linear_ns + rw_ns
        )

        return HoldoverEstimate(
            timestamp=ts,
            uncertainty_ns=uncertainty_ns,
            mode="HOLDOVER",
            elapsed_local_seconds=dt_local,
        )

def math_ceil_nonnegative(value: float) -> int:
    import math
    return max(0, int(math.ceil(value)))
