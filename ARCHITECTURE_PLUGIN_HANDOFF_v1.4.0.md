# Universal Civilization Calendar v1.4.0 — Architecture Handoff

V1.4.0 preserves the V1.3.3 calendar/civilization foundation and adds a lower scientific-time provider path without replacing existing date behavior.

```text
SI-USTS Provider (optional RP1 / PyERFA)
        ↓
SI-USTS continuous-count plugin
        ├─ Lunar Calendar v0.3 plugin
        └─ Mars Calendar v0.4 plugin

V1.3.3 CalendarCore / TemporalCore / selectedJdn
        ↓
Existing Earth calendars and civilization plugins
```

The two paths coexist. A civil date remains a JDN/date context; a physical event remains an instant with time-scale metadata. Do not silently equate them.

## Navigation contract

```text
Calendar
Astronomy
Lunar Calendar
Mars Calendar
Location
Convert
Architecture
About Us
Donate
```

Calendar tabs are Today, Month, World Calendars.

## Provider contract

- `providers/siusts`: SI-UST timestamp and optional ERFA RP1 conversion.
- `providers/lunar_calendar`: Lunar Calendar Engine v0.1 / Rules v0.3.
- `providers/mars_calendar`: Mars Calendar v0.4.
- `/api/si-usts/from-utc`
- `/api/lunar-calendar/calculate`
- `/api/mars-calendar/calculate`

No website deployment is authorized by this local release task.
