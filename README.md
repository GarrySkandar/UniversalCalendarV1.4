# Universal Civilization Calendar v1.4.0

> GitHub open-source edition of v1.4.0. This repository contains source code and
> documentation only; local virtual environments, caches, and installation logs
> are intentionally excluded.

通用文明历法（Universal Civilization Calendar）是一个本地运行的多文明、跨行星历法应用，整合公历、中华传统历法、藏历、泰历、玛雅周期、月球历、火星历以及天文与地点能力。项目无需注册账户，主要数据与设置保存在本地浏览器中。

## 快速开始 / Quick start

### Windows

需要 64 位 Python 3.11。双击：

```text
start_windows.bat
```

启动器会创建 `.venv311`、安装核心依赖，并在本地浏览器中打开应用。

### Linux / macOS

需要 Python 3：

```bash
chmod +x start_unix.sh
./start_unix.sh
```

也可以手动运行：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python server.py --port 8765 --open-browser
```

服务默认仅监听 `127.0.0.1`，不会向局域网或公网开放。地点搜索使用 OpenStreetMap Nominatim，地图图层使用 OpenStreetMap；其余核心历法计算在本地完成。

## 开源版说明

- 功能基线：v1.4.0；
- 仓库不包含虚拟环境、缓存、日志、密钥或用户数据；
- 第三方算法、数据来源与许可说明见 [`SOURCES.md`](SOURCES.md)；
- 参与贡献前请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)；
- 安全问题请按 [`SECURITY.md`](SECURITY.md) 私下报告；
- 项目代码按 [`MIT License`](LICENSE) 发布。

> **v1.4.0 planetary calendar integration:** This release is created from the complete v1.3.3 application and keeps its core architecture intact. SI-USTS v0.5, Lunar Calendar Engine v0.1, and Mars Calendar v0.4 are integrated through isolated providers and executable calendar plugins. World Calendars is now the third Calendar page after Today and Month.

V1.4.0 以 V1.3.3 为完整底座，不替换现有地球历法核心。新增功能通过 Provider + Plugin ABI 接入：SI-USTS 作为跨行星科学时间轴，月球历和火星历作为独立行星历法页面。主导航顺序为：日历、天文、月球历、火星历、地点、转换、引擎架构、关于我们、捐赠。

详细改动参见 `CHANGELOG_v1.4.0.md` 与 `ARCHITECTURE_PLUGIN_HANDOFF_v1.4.0.md`。

---

## V1.3.3 基础说明

> v1.3.3 restored the detailed civilization/tradition hierarchy while retaining the v1.2.x Temporal Core, Plugin ABI, Provider, I18n, Terminology, and Renderer architecture.


**通用文明历法引擎 / Universal Civilization Calendar Engine**

v1.3.3 是 **Civilization Calendar UI / 文明历法页面恢复版**。它不改变 v1.2.x 已建立的 Temporal Core、Plugin ABI、Provider、I18n、Terminology 与 Renderer 架构，而是在这些稳定模块之上恢复详细文明层级，并重新整理 Today 页面信息顺序。

本版重点：

- 主导航固定为 **日历 / 天文 / 地点 / 历法转换 / 世界历法 / 引擎架构 / 关于我们 / 捐赠**；
- “今天 / 月历”成为同一日历入口中的直接切换；
- 不使用简洁 / 文明 / 专业显示模式，复杂度由文明历法树和页面层级控制；
- Today 页面顺序为：公历 Hero + 今日天文 → 纪年 → 不同文明中的今天 → 文明纪念；
- 新增“不同文明中的今天”摘要；
- 中国黄历、皇极经世、三元九运、玛雅周期等增加面向普通用户的简要结果卡；
- 右侧文明传统选择器默认只显示“当前启用”，点击 **+ 添加文明传统** 后才展开完整纵向分组列表；
- 各文明历法面板提供 **全选 / 全取消**，一次同步父级系统、可选子项与 Today / Month 联动内容；
- 宗教/文明传统使用折叠分组，避免几十个复选框同时铺满屏幕；
- 中国黄历采用左侧半宽模块，皇极经世与三元九运堆叠在右侧；Panchanga 保持在其后；
- 中国黄历增加十二时辰吉凶表，显示天神、吉凶、宜忌并高亮当前时辰；
- 民国纪年并入中华历史纪年；纪年层按中华历史纪年、日本年号顺序显示；道教日历显示六十甲子年名与农历月日，例如“丙午年六月三十日”；
- 三元九运显示当前元、当前运、运星、卦象、五行、运内年份、180 年周期进度和 RuleSet；
- 右侧文明历法选择器仅出现在 Today / Month Calendar；
- Today 页面支持拖拽调整模块顺序、拖拽右下角调整模块大小、模块内子模块排序，并可恢复默认布局；配置保存在浏览器 `localStorage`，无需注册；
- 月历选中日期的中华历史纪年独立于顶部“纪年”标注开关，随月历年份和选中日期更新对应年号；
- `ui/traditional-time.js`、`ui/civilization-calendar-selector.js` 与 `ui/pages/today-human-page.js` 共同负责日期页面的传统层级；
- `app.js` 继续控制在 450 行以内。

项目的根仍然是：

> **Planet + Instant + Location → Astronomy → Calendar → Civilization → Interpretation**

---

## 1. 五层时间架构

```text
Physical Time
  Planetary / Temporal / Location Core
        ↓
Astronomical Time
  Astronomy Engine
        ↓
Calendar Time
  Calendar Rules + Regional Variants + Special Plugins
        ↓
Civilizational Time
  Era + Religion + Country + History + External Data
        ↓
Interpretive Time
  Almanac + Auspicious + Cycles + Astrology + Cosmology
        ↓
Civilization Calendar
```

Presentation 不属于计算五层，而是横向服务：

```text
I18n Core + Terminology Registry + Renderer Registry
```

它们只负责“如何显示”，不改变计算结果。

---

## 2. V1.2.x 插件 ABI（v1.2.0 建立，v1.3.0 延续）

正式插件包由以下部分组成：

```text
Plugin
├─ manifest      我是谁 / 类型 / RuleSet / 状态 / 依赖
├─ engine        我怎么算
├─ renderer      我如何显示（可省略，使用通用 Renderer）
├─ terminology   文明原生术语 / 转写 / 可选译名
├─ locales       插件自己的说明文字语言包
├─ sources       规则来源
└─ tests         锚点 / 边界 / 回归测试
```

注册示例：

```js
PluginManager.register({
  manifest: {
    id: 'example-calendar',
    type: 'calendar',
    name: '示例历法',
    status: 'versioned',
    representation: 'custom',
    dependsOn: ['temporal-core'],
    ruleSet: { id: 'example-v1', name: 'Example RuleSet' },
    ui: { renderer: 'generic-key-value' }
  },
  engine: {
    async compute(input, context) {
      return { type: 'custom', value: '...' };
    }
  }
});
```

执行：

```js
const result = await PluginManager.execute('example-calendar', {
  jdn,
  location
});
```

显示：

```js
const html = PluginManager.render('example-calendar', result);
```

---

## 3. Provider 与 Plugin 分开

第三方库或后端算法不是插件本身，而是 Provider。

```text
Chinese Almanac Plugin
        ↓
CalendarApiClient / Provider
        ↓
lunar-python
```

```text
Tibetan Calendar Plugin
        ↓
CalendarApiClient / Provider
        ↓
caltib
```

因此未来替换 Provider 时：

- 插件 ID 不变；
- UI 不变；
- Terminology 不变；
- I18n 不变；
- 能力矩阵不需要重新设计。

---

## 4. 当前正式 ABI 插件样例

### Calendar

- `gregorian` — Full
- `chinese` — Full（现代中华传统阴阳历声明范围）
- `tibetan` — Versioned（Phugpa / Tsurphu / Mongol provider）

### Interpretation

- `chinese-almanac` — Versioned
- `huangji-jingshi` — Versioned
- `maya-ritual` — Full / GMT 584283
- `pawukon-cycles` — Versioned structural
- `indian-panchanga` — Experimental
- `indian-yuga` — Versioned

v1.1.0 仍未迁移的 Metadata Plugin 会通过 **Legacy Adapter** 自动进入 Plugin Manager，因此不会因为 ABI 升级丢失。

---

## 5. I18n 与文明术语

`i18n` = internationalization（国际化）。

V1.3.0 建立：

```text
presentation/i18n/
```

当前内置 UI Shell 语言：

- 简体中文 `zh-CN`
- English `en`
- 日本語 `ja`
- 한국어 `ko`
- Español `es`
- Français `fr`

其中简中/英文覆盖最完整；日/韩/西/法已覆盖主 UI、月历和核心操作，较长的技术说明在尚未本地化时安全回退到英文。文明专有术语仍保持原文优先。

### UI 文字与文明术语严格分开

系统公共文字：

```text
I18n Core
```

例如：

```text
世界历法 → Calendars
地球选点 → Location
```

文明专业术语：

```text
Terminology Registry
```

例如中国黄历：

```text
建
井宿
丙午
天河水
```

默认保留原文。英文界面可以显示：

```text
建 · Jiàn
井宿 · Jǐng Xiù
```

而不是强制把所有区域性术语翻译成英语。

原则：

> **UI 可以翻译，文明原生数据不因 UI Locale 改变。**

---

## 6. Renderer Registry

插件计算结果不直接拼主页面 DOM。

当前通用 Renderer：

```text
generic-key-value
hierarchical-chronology
cycle-grid
almanac
```

例如：

```text
皇极经世 → hierarchical-chronology
玛雅 / Pawukon → cycle-grid
```

复杂插件可注册自己的 Renderer。

---

## 7. app.js 拆分

V1.1.0 的 `app.js` 同时承担 API、缓存、格式化、状态、页面与插件显示。

V1.3.0 已拆出：

```text
core/
  plugin-contract.js
  plugin-manager.js

state/
  app-state.js

services/
  api-client.js

presentation/
  i18n/
  terminology/
  renderers/

ui/
  formatters.js
  pages/
    interpretation-page.js
    capabilities-page.js
```

`app.js` 继续承担旧页面兼容和总协调，但已经不再直接管理 API 缓存，也不再直接实现时间文化页/能力矩阵页全部逻辑。

后续版本可继续逐页迁移：

```text
TodayPage
EarthPage
AstronomyPage
CalendarPage
ConverterPage
...
```

这是**渐进式拆分**，不是一次推翻重写。

---

## 8. 当前目录核心结构

```text
universal-calendar-web-v1.4.0-github/
│
├─ core/
│  ├─ plugin-contract.js
│  └─ plugin-manager.js
│
├─ state/
│  └─ app-state.js
│
├─ services/
│  └─ api-client.js
│
├─ presentation/
│  ├─ i18n/
│  ├─ terminology/
│  └─ renderers/
│
├─ ui/
│  ├─ formatters.js
│  └─ pages/
│
├─ plugins/
│  ├─ calendars/
│  ├─ almanacs/
│  ├─ cosmology/
│  └─ cycles/
│
├─ calendar-core.js
├─ temporal-core.js
├─ universal-engine.js
├─ calendar-registry.js          # Legacy metadata registry
├─ civilization-registry.js      # Legacy metadata registry
├─ advanced-systems.js           # Legacy/transition providers
├─ earth-map.js
├─ app.js
└─ server.py
```

---

## 9. 地图 / 地点

仍使用：

```text
地点搜索 → Nominatim → 候选 → Leaflet 地图 → 点击/拖动 → 经纬度 → IANA 时区 → LocationContext
```

注意：

> **经度不是行政时区。**

中国大陆等已保留行政时区回退规则；`timezonefinder` 缺失不会把北京民用时间误算成 UTC+7:45。

---

## 10. 状态体系

| 状态 | 含义 |
|---|---|
| Core | 核心稳定能力 |
| Full | 对声明 RuleSet / 版本 / 有效范围完整 |
| Versioned | 有多个并行版本，当前实现明确版本 |
| External | 最终现实采用结果需外部确认 |
| Historical | 历史文献 / 重建体系 |
| Experimental | 实验 / 近似 |
| Planned | 尚未实现 |
| Partial | 开发过程过渡状态 |

`Plugin` 不再作为成熟度本身；Plugin 是接入形式，成熟度由 `status` 独立声明。

---

## 11. 依赖

核心：

```text
sxtwl==2.0.7
pythaidate==0.2.0
```

可选：

```text
timezonefinder>=6.5,<9
lunar_python>=1.4.8,<2
caltib==0.3.2
```

可选 Provider 失败不得阻止核心服务启动。

---

## 12. Windows 启动

```text
start_windows.bat
```

启动器继续使用 Python 3.11 虚拟环境策略，并非阻塞安装可选 Provider。

---

## 13. 测试

```bash
node tests_core.js
node tests_v02.js
node tests_v10.js
node tests_v101.js
node tests_v110.js
node tests_v120.js
node tests_v121.js
python -m py_compile server.py
```

`tests_v120.js` 检查：

- Plugin Contract / Plugin Manager；
- Legacy Adapter；
- Calendar Plugin 执行；
- composite cycle / hierarchy 插件执行；
- dependency graph；
- I18n locale 切换；
- Terminology 原文保持；
- Renderer Registry；
- app.js 模块委托；
- V1.3.0 脚本装载。

---


`tests_v121.js` 检查：

- 月历标题、星期、月份动态国际化；
- 月历日期详情与转换器字段国际化；
- Moon/Season 等动态天文文字；
- UI Literal Catalog 与 Registry English metadata；
- native-first 文明术语策略；
- v1.3.3 资源版本与后端版本。

## 14. 新插件开发

详见：

- `PLUGIN_GUIDE.md`
- `ARCHITECTURE_PLUGIN_HANDOFF_v1.3.3.md`
- `SOURCES.md`

## v1.3.3 Today 页面布局

```text
公历日期 Hero + 今日天文
↓
纪年
↓
不同文明中的今天
↓
文明纪念
↓
┌─ 中国传统黄历 ─────┬─ 皇极经世 ─┐
│                    │ 三元九运   │
└────────────────────┴────────────┘
↓
Indian Panchanga
```

最重要的原则：

> **新增文明时间体系默认新增 Plugin，不修改 Temporal Core。**

## v1.3.3 修正与恢复

- 修复 `/api/status` 顶层 JSON 被前端错误按 `data` 字段读取的问题。该缺陷会导致所有 Python Provider 被误判为“未连接”。
- 历法不可用提示拆分为 Provider 未连接、API 请求失败、当前日期无结果，不再统一显示“未连接或超出范围”。
- 皇极经世面板新增并列的“三元九运”状态。内部仍为独立 `sanyuan-jiuyun` Plugin，避免把玄空三元九运误认为邵雍《皇极经世》原典的一部分。
- 常用 1864 纪元 RuleSet 下：2026 = 下元九运（2024–2043），运星九紫右弼。

## License

Copyright (c) 2026 Universal Civilization Calendar contributors.

Released under the [MIT License](LICENSE).
