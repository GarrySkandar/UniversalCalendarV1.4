#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
if [ ! -d .venv ]; then
  "$PY" -m venv .venv
fi
VPY=.venv/bin/python
"$VPY" -m ensurepip --upgrade >/dev/null 2>&1 || true
"$VPY" -m pip install --disable-pip-version-check -r requirements.txt

# Recommended extensions are deliberately non-blocking.
"$VPY" -c 'import timezonefinder' >/dev/null 2>&1 || "$VPY" -m pip install --disable-pip-version-check 'timezonefinder>=6.5,<9' >/dev/null 2>&1 || true
"$VPY" -c 'import lunar_python' >/dev/null 2>&1 || "$VPY" -m pip install --disable-pip-version-check 'lunar_python>=1.4.8,<2' >/dev/null 2>&1 || true
"$VPY" -c 'import caltib' >/dev/null 2>&1 || "$VPY" -m pip install --disable-pip-version-check 'caltib==0.3.2' >/dev/null 2>&1 || true
"$VPY" -c 'import erfa' >/dev/null 2>&1 || "$VPY" -m pip install --disable-pip-version-check 'pyerfa>=2.0' >/dev/null 2>&1 || true

exec "$VPY" server.py
