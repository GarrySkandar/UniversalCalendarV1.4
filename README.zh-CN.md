# 通用文明历法 v1.4.0

[English](README.md) · [简体中文](README.zh-CN.md) · [MIT License](LICENSE)

通用文明历法（Universal Civilization Calendar）是一个本地优先的 Web 应用，用于探索民用、文明、天文、月球与行星时间体系。它整合公历、中华传统历法、藏历与泰历 Provider、玛雅周期、实时天文、月球历和火星历页面。

应用在本地浏览器中运行，无需注册账户；界面偏好保存在浏览器本地存储中。

## 主要功能

- 日历工作区：今天、月历和世界历法三个页面。
- 实时天文、当地平均太阳时、地图选点和 IANA 时区支持。
- 文明历法、纪年、节日纪念、黄历信息和传统记时显示。
- Provider + Plugin ABI 架构：新增历法 RuleSet 时无需修改 Temporal Core。
- SI-USTS、月球历引擎和火星历的科学/行星集成。
- 内置简体中文、英语、日语、韩语、西班牙语和法语 UI Shell。

## 快速开始

### Windows

请使用 64 位 Python 3.11，然后运行：

```text
start_windows.bat
```

启动器会创建 `.venv311`、安装核心 Provider，并在浏览器中打开应用。

### Linux 与 macOS

请使用 Python 3：

```bash
chmod +x start_unix.sh
./start_unix.sh
```

或手动运行：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python server.py --port 8765 --open-browser
```

服务默认仅监听 `127.0.0.1`。除非你主动修改配置，否则不会向局域网或公网开放。

## 架构

项目的核心模型为：

```text
Planet + Instant + Location
  → Astronomy
  → Calendar
  → Civilization
  → Interpretation
```

展示层是横向服务：国际化、文明术语和 Renderer 只决定计算结果如何呈现，不改变计算本身。

历法通过 Provider 与可执行 Plugin 接入。每个插件可声明其 RuleSet、状态、依赖、表示形式、术语和 Renderer。详见 [插件开发指南](PLUGIN_GUIDE.md) 与 [v1.4.0 架构交接文档](ARCHITECTURE_PLUGIN_HANDOFF_v1.4.0.md)。

## 数据、隐私与依赖

大部分历法计算在本地运行。地图图层来自 OpenStreetMap，地点搜索使用 OpenStreetMap Nominatim。第三方算法、数据来源、覆盖范围和许可证详见 [SOURCES.md](SOURCES.md)。

本仓库不会收录虚拟环境、缓存、安装日志、凭据或用户数据。核心 Python 依赖在 `requirements.txt` 中，可选增强功能在 `requirements-optional.txt` 中。

## 测试

提交前请运行 JavaScript 回归测试与 Python 检查：

```bash
for test in tests_*.js; do node "$test"; done
python -m py_compile server.py
python tests_lunar_cultural_label.py
```

GitHub Actions 会在每次推送和 Pull Request 时执行同一组检查。

## 文档

- [English README](README.md)
- [v1.4.0 更新日志](CHANGELOG_v1.4.0.md)
- [插件开发指南](PLUGIN_GUIDE.md)
- [架构交接文档](ARCHITECTURE_PLUGIN_HANDOFF_v1.4.0.md)
- [时间源与 API 策略](TIME_SOURCE_AND_API_STRATEGY_v1.4.0.md)
- [贡献指南](CONTRIBUTING.md)
- [安全策略](SECURITY.md)

## 许可证

Copyright (c) 2026 Universal Civilization Calendar contributors.

项目以 [MIT License](LICENSE) 发布。
