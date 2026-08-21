# Changelog — Universal Civilization Calendar v1.4.0

V1.4.0 is created from the preserved V1.3.3 baseline.

## Navigation

- Main order: Calendar, Astronomy, Lunar Calendar, Mars Calendar, Location, Convert, Architecture, About Us, Donate.
- World Calendars moves under Calendar as the third tab after Today and Month.

## Scientific and planetary calendars

- Adds SI-USTS v0.5 as a `continuous-count` calendar plugin backed by an optional PyERFA RP1 provider.
- Adds Lunar Calendar Rules v0.3 as an executable calendar plugin and dedicated page.
- Adds Mars Calendar v0.4 as an executable calendar plugin and dedicated page.
- Keeps `CalendarCore`, `TemporalCore`, `selectedJdn`, existing Earth locations, calendar conversion, and all V1.3.3 civilization plugins intact.

## Compatibility

- SI-USTS, Moon, and Mars providers are additive.
- If PyERFA is unavailable, SI-USTS returns a clearly marked calendar/UI fallback; existing Earth calendar functions continue normally.
- Moon and Mars use their own planetary-coordinate inputs and do not reuse the Earth IANA-timezone location object.
