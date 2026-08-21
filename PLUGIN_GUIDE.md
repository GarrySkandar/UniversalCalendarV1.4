# Plugin Guide — Universal Civilization Calendar v1.3.3

## 1. 插件契约

V1.3.0 正式插件使用：

```js
PluginManager.register({
  manifest,
  engine,
  renderer,      // optional
  terminology,   // optional
  locales        // optional
});
```

最低可执行插件必须有：

```text
manifest
engine.compute()
```

---

## 2. Manifest

```js
{
  id: 'my-plugin',
  type: 'calendar',
  name: '原生名称',
  en: 'Optional English Name',
  civilization: '...',
  status: 'versioned',
  version: '1.0.0',
  representation: 'custom',
  dependsOn: ['temporal-core'],
  coverage: '...',
  ruleSet: {
    id: 'my-rules-v1',
    name: 'My RuleSet'
  },
  ui: {
    selectable: true,
    group: 'interpretation',
    renderer: 'generic-key-value'
  }
}
```

---

## 3. Plugin Type

```text
calendar
almanac
religion
era
country
history
auspicious
cycle
astrology
cosmology
personal
```

判断方法：

- “今天是哪一天？” → calendar
- “今天有什么传统属性？” → almanac
- “今天适合做什么？” → auspicious
- “今天处于什么周期？” → cycle / cosmology
- “某宗教如何标记今天？” → religion

---

## 4. Representation

支持：

```text
year-month-day
continuous-count
concurrent-cycles
composite-cycles
hierarchical-chronology
hierarchical-cycle
observation-result
almanac-properties
five-limb-almanac
activity-timing
religious-observances
regional-almanac
ritual-cycle
astral-interpretation
historical-almanac
person-temporal-context
custom
```

未知体系可以使用：

```text
custom
```

或扩展名：

```text
x-my-representation
```

不要为了兼容框架强行变成 `YYYY-MM-DD`。

---

## 5. Engine

```js
engine: {
  async compute(input, context) {
    // input: jdn / g / location / ruleSet ...
    // context: core / services / i18n / terms / renderers / pluginManager
    return {
      type: 'custom',
      ...
    };
  }
}
```

Engine：

- 不直接操作 DOM；
- 不读取当前 UI 语言决定计算结果；
- 优先消费已有 Core / Provider；
- 不重复实现其它插件已经提供的基础规则。

---

## 6. Provider

第三方库属于 Provider，不属于 Plugin 身份。

例如：

```text
chinese-almanac Plugin
    ↓
CalendarApiClient
    ↓
lunar-python provider
```

未来可替换 Provider，不更改插件 ID。

---

## 7. Renderer

若结果简单：

```js
ui: { renderer: 'generic-key-value' }
```

当前通用 Renderer：

```text
generic-key-value
hierarchical-chronology
cycle-grid
almanac
```

复杂插件可提供：

```js
renderer(payload, context) {
  return '<div>...</div>';
}
```

Renderer 只能负责展示，不修改计算结果。

---

## 8. Terminology

文明专有术语放在插件自己的 terminology 中：

```js
{
  'term.example': {
    native: '原文',
    romanization: { en: 'Romanization' },
    translation: { en: 'Optional translation' }
  }
}
```

使用：

```js
TerminologyRegistry.format({
  pluginId: 'my-plugin',
  termId: 'term.example'
});
```

原则：

> 区域性术语原文永远可保留；没有可靠译名时不强制翻译。

---

## 9. I18n

插件自己的说明文字：

```js
locales: {
  'zh-CN': {
    title: '...'
  },
  'en': {
    title: '...'
  }
}
```

系统公共导航由：

```text
presentation/i18n/locales/
```

维护。

插件开发者不需要为了新增一种区域历法修改全局英文语言包。

---

## 10. Dependency

```js
dependsOn: [
  'temporal-core',
  'astronomy-engine',
  'chinese'
]
```

Plugin Manager 会检查依赖。

可选 Provider 缺失时应返回清晰错误，而不是让整个应用崩溃。

---

## 11. Full / Versioned

`Full` 必须限定：

```text
RuleSet
版本
有效时间范围
地区
来源
测试基准
```

如果存在多个传统：

```text
Versioned
```

不是把多个传统强行合并成唯一算法。

---

## 12. External

以下情况使用 External：

- 实际月见；
- 政府节假日公告；
- 宗教机构临时确认。

算法预测不等于现实最终采用结果。

---

## 13. 新插件推荐目录

```text
plugins/<category>/<plugin-id>/
├─ plugin.js
├─ rules/
├─ sources.md
└─ tests.js
```

当前 v1.3.3 为无构建步骤的浏览器项目，因此示范插件暂时使用 `plugin.js` 自包含 bundle。

如果以后引入构建系统，可进一步拆成：

```text
manifest.js
engine.js
renderer.js
terminology.json
locales/
```

ABI 不需要改变。

---

## 14. Legacy Adapter

V1.1.0 的：

```text
civilization-registry.js
```

仍会先把 Metadata 注册到 `UniversalTemporalEngine`。

V1.3.0 启动时：

```js
PluginManager.syncLegacy();
```

把尚未迁移的插件作为 metadata-only record 接入。

因此可以逐个迁移，而不是一次性重写全部插件。

---

## 15. 测试要求

每个新插件至少：

```text
anchor test
boundary test
dependency test
representation test
```

支持反算时增加：

```text
round-trip test
```

测试不得只验证“函数没有报错”，必须验证已知锚点。
