# v1.3.0

## Fixed

1. **Engine status false-negative**
   - `/api/status` returns a top-level status object.
   - v1.2.2 incorrectly routed it through the business-payload helper that extracts `data`, producing `undefined`.
   - The UI consequently marked sxtwl / pythaidate / lunar_python / caltib as disconnected even when installed.
   - `CalendarApiClient.status()` now preserves top-level status fields.

2. **Ambiguous calendar error message**
   - Replaced the catch-all “历法引擎未连接或超出范围” path with distinct messages for provider missing, API failure, and no result.

## Added

### 三元九运 / Three Cycles and Nine Periods

- New independent cosmology plugin: `sanyuan-jiuyun`.
- Common 1864 epoch RuleSet.
- 180-year cycle / 3 × 60-year 元 / 9 × 20-year 运.
- Exposes current 元、运、period span、period star、year-in-period and 180-year-cycle progress.
- Huangji Jingshi renderer displays this state as a **parallel traditional time system**, not as part of Shao Yong's original Yuan-Hui-Yun-Shi algorithm.

For 2026 the plugin returns:

```text
下元
九运
2024–2043
九紫右弼 · 离 · 火
运内第 3 年 / 20
```
