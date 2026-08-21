# Universal Civilization Calendar v1.4.0

[English](README.md) · [简体中文](README.zh-CN.md) · [MIT License](LICENSE)

Universal Civilization Calendar is a local-first web application for exploring civil, cultural, astronomical, lunar, and planetary time systems. It brings together the Gregorian calendar, Chinese traditional calendars, Tibetan and Thai calendar providers, Maya cycles, real-time astronomy, and dedicated Moon and Mars calendar pages.

The application runs locally in a browser. It does not require an account, and interface preferences are stored in the browser's local storage.

## Highlights

- Calendar workspace with Today, Month Calendar, and World Calendars views.
- Real-time astronomy, local solar time, map-based location selection, and IANA time-zone support.
- Civilizational calendars, eras, observances, almanac information, and traditional time displays.
- Isolated Provider + Plugin ABI architecture for adding rule sets without changing the Temporal Core.
- Scientific/planetary integrations for SI-USTS, the Lunar Calendar Engine, and Mars Calendar.
- Built-in UI shells in Simplified Chinese, English, Japanese, Korean, Spanish, and French.

## Quick start

### Windows

Use 64-bit Python 3.11, then run:

```text
start_windows.bat
```

The launcher creates `.venv311`, installs the core providers, and opens the application in your browser.

### Linux and macOS

Use Python 3:

```bash
chmod +x start_unix.sh
./start_unix.sh
```

Or start it manually:

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python server.py --port 8765 --open-browser
```

The server listens on `127.0.0.1` by default. It is not exposed to your local network or the public internet unless you deliberately change that configuration.

## Architecture

The core model is:

```text
Planet + Instant + Location
  → Astronomy
  → Calendar
  → Civilization
  → Interpretation
```

Presentation is a cross-cutting layer: internationalization, terminology, and renderers determine how results are displayed without changing their calculation.

Calendar systems are added through Providers and executable Plugins. Each plugin can declare its rule set, status, dependencies, representation, terminology, and renderer. See the [Plugin Guide](PLUGIN_GUIDE.md) and the v1.4.0 [architecture handoff](ARCHITECTURE_PLUGIN_HANDOFF_v1.4.0.md).

## Data, privacy, and dependencies

Most calendar calculations run locally. Map tiles are provided by OpenStreetMap, and place search uses OpenStreetMap Nominatim. Third-party algorithms, data sources, coverage notes, and licenses are documented in [SOURCES.md](SOURCES.md).

This repository intentionally excludes virtual environments, caches, installer logs, credentials, and user data. The core Python dependencies are listed in `requirements.txt`; optional enhancements are listed in `requirements-optional.txt`.

## Testing

Run the JavaScript regression tests and Python checks before contributing:

```bash
for test in tests_*.js; do node "$test"; done
python -m py_compile server.py
python tests_lunar_cultural_label.py
```

Continuous integration runs the same checks on every push and pull request.

## Documentation

- [Chinese README](README.zh-CN.md)
- [v1.4.0 changelog](CHANGELOG_v1.4.0.md)
- [Plugin guide](PLUGIN_GUIDE.md)
- [Architecture handoff](ARCHITECTURE_PLUGIN_HANDOFF_v1.4.0.md)
- [Time source and API strategy](TIME_SOURCE_AND_API_STRATEGY_v1.4.0.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

Copyright (c) 2026 Universal Civilization Calendar contributors.

Released under the [MIT License](LICENSE).
