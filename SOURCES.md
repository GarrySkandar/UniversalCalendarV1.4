# Sources / RuleSet Notes — v1.3.3

本项目把“来源”和“算法状态”分开记录。界面中的 Full/Versioned/Experimental 只针对声明范围。

## 中国现代农历

- GB/T 33661-2017《农历的编算和颁行》：全国标准信息公共服务平台，现行标准；归口/主管中国科学院，主要起草单位中国科学院紫金山天文台。
- 运行引擎：sxtwl 2.0.7。
- 历史历法不在现代 Full 范围内。

## 中国传统黄历

- `6tail/lunar-python`：MIT；Python >=3.8；作为 v1.2.x 的 Versioned Almanac RuleSet。
- 接入字段包括干支、五行、纳音、建除、值日天神、二十八宿、彭祖、冲煞、宜忌、吉神/凶煞、方位、九星等。
- 其它通书/流派应另注册 RuleSet，不覆盖当前版本。

## 地图与地理编码

- Leaflet 1.9.4：浏览器地图交互。
- OpenStreetMap 标准瓦片：地图底图。
- Nominatim Search/Reverse API：中英文自由文本地理编码与反向地理编码。
- `timezonefinder`：可选本地 IANA 时区解析；缺失时回退经度近似/最近城市 Profile。


## 藏历

- `caltib 0.3.2`：MIT；Python >=3.9；核心零外部依赖；提供 Phugpa、Tsurphu、Mongol 等明确传统引擎及藏历日期 ↔ 公历转换。
- 藏历日期算法与“藏族传统历书 / 每日吉凶解释”分层：前者可以 Versioned 实现，后者仍需按具体传统和资料继续接入。
- 规则研究参考 Svante Janson 的 Tibetan Calendar Mathematics 等现代形式化研究；不同传统不得压成单一近似规则。

## 玛雅

- Long Count 与复合周期采用 GMT 584283 correlation 的当前 RuleSet。
- 其它相关常数可注册为并列版本。

## 皇极经世

- 结构锚点采用《皇极经世书》卷五所列“经世之子二千一百五十七，甲子＝公元前2337年”，用于元/会/运/世层级定位。
- 值年卦 RuleSet：`hjys-fuxi-circle-60-hierarchy-lichun-v1`。先天圆图去除乾、坤、坎、离，保留60卦；每个大周天卦经两级爻变确定一个甲子的起卦，再与60干支逐年配位。六十甲子仅是基本排布单元，上级卦序继续进位。
- 现代校验坐标：1984甲子为“大过 → 姤 → 鼎”，2025立春后为泽火革，2026立春后为天火同人；2044甲子重新取“大过 → 姤 → 大过”，不能沿用1984的固定映射。
- 年界采用太阳视黄经315°（立春）的天文时刻，不按公历1月1日或固定2月4日零时切换。
- 参考：《皇极经世书》及《皇极经世书传》；先天圆图与后世层级推步存在传本/解释差异，因此保持 RuleSet 版本号，不宣称所有流派唯一一致。

## 印度 Panchanga

- 当前内置的是五支展示的 Experimental approximation。
- 不宣称等同印度政府 Rashtriya Panchang 或任一地区 Drik Panchanga 的精确交界时刻。

## 火星

- Mars24 / NASA GISS：MSD、MST/AMT、LMST/LTST、Ls 和季节算法。
- Mars24 本身不采用任何一套提议中的火星民用年月历，因此本项目也只把 Mars 当前实现标为 Experimental Temporal System。

## 三元九运 / Three Cycles and Nine Periods

- 作为独立的中华传统宏观时间解释 RuleSet 接入，不与邵雍《皇极经世》的“元会运世”合并为同一算法。
- 当前采用常见 1864 纪元的 180 年周期：三元各 60 年、九运各 20 年；2024–2043 为下元九运。
- Huangji Jingshi source tradition: Chinese Text Project / 正统道藏本数字文本（用于区分《皇极经世》原典的元会运世结构）。
- Three Cycles and Nine Periods reference: Global Feng Shui Alliance reviewed knowledge entry; academic literature on Xuan Kong temporal systems is used to maintain the distinction between 三元九运 and 邵雍元会运世。

> 文化解释说明：三元九运属于传统玄空/风水时间体系。本项目将其作为历史文化/时间解释系统展示，不把相关吉凶解释表述为现代自然科学因果结论。

## v1.3.3 Traditional Time UI RuleSets

### Chinese shichen + ke
- Current UI implementation: 96-ke/day RuleSet, 12 shichen/day, 8 ke/shichen, 15 minutes/ke.
- Historical boundary: earlier Chinese timekeeping also used 100-ke/day systems; do not present the 96-ke mapping as universal for all dynasties.
- Reference notes: traditional histories including the calendrical treatises of *Sui Shu*; modern historical overviews of the transition to the 96-ke system in early Qing.

### Indian/Buddhist six times
- Xuanzang, *Da Tang Xiyu Ji* (大唐西域记), juan 2: 5 muhurtas = 1 time; 6 times = day and night (3 daytime, 3 nighttime), with the finer chain lava / tatksana / ksana.
- v1.3.3 UI convention: six equal four-hour mean-clock blocks beginning at 06:00. This 06:00 anchor is an application RuleSet and is not claimed as a universal historical regional civil-time convention.
