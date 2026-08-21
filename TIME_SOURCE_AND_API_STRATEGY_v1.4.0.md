# Universal Calendar V1.4.0 时间源、校准与开放 API 规划

> 文档性质：产品与技术讨论稿
> 适用版本：Universal Calendar Web V1.4.0 及后续版本
> 更新日期：2026-08-15
> 本文整理网站时间源、设备校准、API 协议、可开放内容、同类服务与后续优化方向。文中的“建议接口”不代表当前版本已经实现。

## 1. 核心结论

1. 历法算法的准确性与“现在几点”的可信度是两个不同问题。
2. 全球统一参考是 UTC，但 UTC 不是来自一台“世界唯一时钟”，而是由国际计量体系综合各国原子钟数据形成，并由各国的 `UTC(k)` 实现向外分发。
3. V1.4.0 当前实时模式主要读取用户设备的系统时钟；浏览器本身无法证明该设备是否已经同步、偏差多少，也不能直接修改操作系统时间。
4. 网站可以通过 HTTPS 时间 API 检测设备偏差，并在网站内部建立“校准后的虚拟时钟”。这足以满足历法、真太阳时、月球历和火星历等普通应用。
5. 公共 API 应以“调用者明确提交时间”为主，以保证结果可复现；只有 `/time/now` 一类接口才使用服务器当前时间。
6. 所有高可信响应都应说明时间源、时间尺度、时区库、闰秒表、规则集版本和估计不确定度，避免只返回一个看似绝对准确的时间。
7. 产品差异化不应只是“历法种类更多”，而应是：多文明历法、宗教节日、地球与行星时间、地理位置、规则版本和来源可追溯性统一在一个协议中。

## 2. 时间源的完整链条

```text
各国原子钟实验室与天文台
          ↓ 提交钟差数据
国际计量局 BIPM
          ↓ 形成 TAI、UTC 等国际时间尺度
各国 UTC(k) 物理实现
          ↓ NTP / NTS / PTP / GNSS / 广播授时
网站服务器或用户操作系统
          ↓ JavaScript Date / 系统 API
历法、天文、月球与火星计算
```

### 2.1 国际标准层

- `TAI`：国际原子时，是连续的原子时间尺度。
- `UTC`：协调世界时，由 TAI 结合闰秒机制形成，是全球民用时间的主要国际参考。
- `UT1`：与地球自转角有关，天文定位、恒星时等计算可能需要。
- `TT`：地球时，许多天文历表和动力学计算使用。
- `TDB`：太阳系质心动力学时，精密行星星历可能使用。

BIPM 负责国际时间尺度的实现与发布。各国计量院和天文台维护自己的 `UTC(k)`，并通过 BIPM Circular T 等结果与 UTC 比较。参考：[BIPM Time Metrology](https://www.bipm.org/en/time-metrology)。

### 2.2 时间分发层

常见分发方式包括：

- `NTP/SNTP`：互联网和普通设备最常见，典型精度为毫秒级到更低，最终效果受网络影响。
- `NTS`：在 NTP 基础上增加安全认证，可降低来源伪造和中间人篡改风险。
- `PTP`：适用于局域网、机房和硬件时间戳场景，可达到微秒甚至更高等级。
- `GNSS`：GPS、北斗、Galileo、GLONASS 等卫星系统可提供高精度时间信号。
- 国家授时广播、光纤和专线：用于计量、科研、电力、通信和金融等高要求场景。

即使服务端时间能够追溯到 UTC，用户收到的时间仍会受到网络路径与设备影响。NIST 明确指出，服务器端时间可以追溯到 `UTC(NIST)`，但用户端准确度通常主要受网络稳定性和路径对称性影响。参考：[NIST Internet Time Service](https://www.nist.gov/pml/time-and-frequency-division/time-distribution/internet-time-service-its)。

### 2.3 民用时区层

UTC 只回答“统一时刻是什么”，当地民用时间还需要：

- IANA 时区名称，例如 `Asia/Shanghai`；
- 当地政府规定的 UTC 偏移；
- 夏令时规则；
- 历史时区变更；
- 地理位置与行政边界。

IANA Time Zone Database 会随各国政策变化定期更新。它是软件行业通用数据库，但未来规则可能因政府决定而改变。参考：[IANA Time Zone Database](https://www.iana.org/time-zones)。

## 3. V1.4.0 当前时间来源

### 3.1 浏览器实时模式

当前共享参考时间控制器在实时模式下使用 JavaScript `new Date()`。它读取用户电脑或手机的系统时钟。

这意味着当前网站继承了设备的时间状态，但无法直接知道：

- 设备使用了哪个授时服务器；
- 上次成功同步的时间；
- 当前偏差与漂移；
- 用户是否手工修改过时间；
- NTP 消息是否经过认证；
- 设备是否处于长期离线状态。

### 3.2 服务端当前行为

现有 Python 服务端主要接收或解析调用者传入的 UTC，然后执行 SI-USTS、月球历、火星历及其他历法计算。服务端当前没有一套对外公布的“标准授时状态”，也没有向前端证明其系统时钟的同步来源。

现有主要接口包括：

- `/api/status`
- `/api/si-usts/from-utc`
- `/api/lunar-calendar/calculate`
- `/api/mars-calendar/calculate`
- `/api/location/resolve`
- `/api/chinese/almanac`
- `/api/chinese/day`
- `/api/chinese/month`
- `/api/chinese/from-lunar`
- `/api/tibetan/day`
- `/api/thai/day`
- `/api/thai/month`
- `/api/thai/from-lunar`

### 3.3 时区与闰秒

- 浏览器本地时区转换依赖 `Intl.DateTimeFormat` 及设备附带的时区数据。
- 服务端可使用 Python `zoneinfo`、`timezonefinder` 等组件解析地点和时区。
- 月球历 Provider 包含 UTC、TAI、TT 和闰秒换算信息；已知区间之外应标记为暂定假设。
- 火星历同样需要明确输入时间尺度、闰秒处理和采用的火星时间算法版本。

### 3.4 当前可信度定位

当前适合标记为：

```text
设备时间 · 未独立校验
```

这不表示结果一定不准。开启系统自动同步的现代设备往往已经足够准确，但网站目前不能对该准确度作出独立证明。

## 4. 用户设备时间校准方案

### 4.1 能做什么与不能做什么

普通网页可以：

- 检测设备时钟与服务器 UTC 的偏差；
- 估算网络往返延迟和不确定度；
- 在网站内部使用校准后的时间；
- 提醒用户系统时间可能不正确；
- 在计算结果中标明时间来源。

普通网页通常不能：

- 修改 iOS、Android、Windows 或 macOS 的系统时钟；
- 直接通过浏览器访问 UDP 123 端口查询 NTP；
- 保证网络请求的上下行延迟完全对称；
- 把普通 HTTPS 校准声明为实验室级授时。

原生应用、系统应用、企业受管设备或具备管理员权限的桌面程序可能拥有更高权限，但不应作为普通网页的默认能力。

### 4.2 建议端点

```http
GET /api/v1/time/now
GET /api/v1/time/status
```

浏览器在每次请求中记录四个时间点：

```text
t1：客户端发送请求
t2：服务器收到请求
t3：服务器发送响应
t4：客户端收到响应
```

可使用类似 NTP 的方法估算：

```text
设备时钟偏差 θ ≈ ((t2 - t1) + (t3 - t4)) / 2
网络往返延迟 δ ≈ (t4 - t1) - (t3 - t2)
```

建议连续采样 5～9 次，优先选择往返延迟较小的样本，并以中位数或稳健统计量抑制网络抖动。

### 4.3 网站内部虚拟时钟

完成校准后，不应继续在每个模块里直接调用 `new Date()`。应建立统一的 `calibratedNow()`：

```text
校准后的当前时间
= 服务器基准 UTC
+ 自校准完成后 performance.now() 的单调增量
```

使用单调计时器推进，可以降低用户中途修改系统时间、夏令时切换或系统时钟跳变对页面的影响。

### 4.4 建议校准策略

- 页面启动时快速采样 5 次；
- 页面从后台恢复时重新校准；
- 正常使用中每 10～30 分钟重新采样；
- 网络切换后重新采样；
- 若偏差突然变化，暂时降级并重新确认；
- API 不可达时回退到设备时间，但必须显示“未校准”；
- 自定义历史或未来时间不参与实时校准。

### 4.5 UI 状态建议

```text
时间来源：服务器 UTC · 已同步
设备偏差：+38.420 秒
网络往返：42 毫秒
估计不确定度：±26 毫秒
最后校准：12 秒前
```

建议统一使用以下等级：

| 等级 | 建议标签 | 含义 |
|---|---|---|
| L0 | 设备时间·未校验 | 仅使用设备系统时钟 |
| L1 | HTTPS 校准时间 | 已与本站服务器比较，适合普通历法应用 |
| L2 | NTP 同步服务器时间 | 服务器已监控 NTP 状态并返回误差指标 |
| L3 | 可追溯标准时间 | 有明确 UTC(k) 链路、校准记录和服务承诺 |

## 5. 服务器授时来源建议

### 5.1 不建议首期自建公网 NTP 服务

首期可以让服务器通过 Chrony 或同等级时间守护进程同步多个可靠来源，再通过 HTTPS 向网页提供校准信息。这样比直接运营公网 NTP 服务更容易控制安全、流量和运维成本。

### 5.2 服务端最低要求

- 至少配置 3 个可用且政策一致的时间源；
- 监控 `stratum`、`offset`、`jitter`、`reach`、最后同步时间；
- 设置偏差阈值和失步告警；
- 服务端失去同步时不得继续返回“已校准”；
- 对外返回估计不确定度，而不是只返回毫秒数；
- 保留校准日志和配置版本；
- 有条件时优先采用经过认证的时间协议或可信内网时间源。

### 5.3 闰秒政策必须统一

Google Public NTP 使用 leap smear，把闰秒变化平滑分散到一段时间；传统 UTC 服务可能直接执行闰秒。Google 官方不建议把 smear 与非 smear 的来源混用。参考：[Google Public NTP](https://developers.google.com/time)。

本项目包含天文、月球和火星换算，建议明确采用：

```text
对外时间尺度：UTC
闰秒来源：IERS 公告
服务端策略：strict-utc 或明确声明的统一 smear
禁止无声明混合两类来源
```

如果部署平台自身采用 smear，应在 API 元数据中声明，并在进入严格天文时间链之前完成规范化或给出限制说明。

## 6. 当前主流设备的自动校准服务

| 平台 | 常见默认来源 | 说明 |
|---|---|---|
| Windows 家用设备 | Microsoft `time.windows.com` | 使用 Windows Time/NTP；企业域设备通常跟随 Active Directory 时间层级。 |
| Android/AOSP | Google `time.android.com` | AOSP 默认入口，是 Google Public NTP 的别名；设备厂商可以覆盖配置。Android 12 及以后通常优先网络时间，必要时回退到运营商 NITZ。 |
| iPhone/iPad | Apple `time-ios.apple.com`、`time.apple.com` | Apple 设备通过 UDP 123 设置时间；可用性也受网络、地区和设备管理策略影响。 |
| macOS | Apple `time-macos.apple.com`、`time.apple.com` | 用户或管理员可以配置区域网络时间服务器。 |
| Linux | 发行版、DHCP、网络管理员或云厂商 | 没有全球统一服务商；常由 systemd-timesyncd、Chrony 等使用配置或 DHCP 提供的 NTP。 |
| 企业 Windows | 域控制器时间层级 | 根域权威节点再连接外部 NTP、GPS 或其他可信源。 |
| 云服务器 | 云厂商内网 NTP/PTP | 阿里云、腾讯云、AWS 等一般提供低延迟内网时间服务，也可能提供公网 NTP。 |

官方参考：

- [Microsoft：Windows Time Service](https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/How-the-Windows-Time-Service-Works)
- [Android：Network Time Detection](https://source.android.com/docs/core/connect/time/network-time-detection)
- [Apple：企业网络所需的时间主机](https://support.apple.com/en-us/101555)
- [腾讯云：NTP 服务概述](https://cloud.tencent.com/document/product/213/30392)
- [阿里云：配置 NTP 服务](https://www.alibabacloud.com/help/zh/ecs/user-guide/alibaba-cloud-ntp-server/)

需要注意，手机厂商、运营商、企业管理员、云镜像和地区网络都可能覆盖系统默认值，因此不能仅凭操作系统名称推断某一台设备当前实际使用的时间源。

## 7. 公共 API 总体协议建议

### 7.1 协议基础

- 传输：仅 HTTPS；
- 风格：REST + JSON；
- 基础路径：`/api/v1`；
- 文档：OpenAPI 3.1；
- 编码：UTF-8；
- 时间格式：ISO 8601 / RFC 3339；
- 时间尺度必须显式，例如 `UTC`、`TAI`、`TT`、`UT1`；
- 时区使用 IANA 标识，例如 `Asia/Shanghai`；
- 国家与地区使用 ISO 3166；
- 语言使用 BCP 47，例如 `zh-CN`、`en`、`th`；
- 经纬度统一声明坐标系和正方向；
- 版本升级不得静默改变历法规则。

### 7.2 请求方式

- 简单、可缓存查询使用 `GET`；
- 参数复杂、包含多历法或批量任务时使用 `POST`；
- 同一输入应得到可复现结果；
- 不建议把“当前时间”作为普通转换接口的隐藏默认值；
- 如果允许省略时间，响应必须标记其采用了服务器当前时间。

### 7.3 认证与配额

- 开发阶段：允许本地或低频匿名调用；
- 公共服务：API Key 或 Bearer Token；
- 商业客户：项目级密钥、域名限制、IP 白名单、独立配额；
- 返回标准限流头；
- 超限返回 HTTP `429`；
- 提供批量接口，避免客户端逐日发送大量请求；
- 密钥不应作为前端公开页面中的长期明文参数。

### 7.4 统一成功响应

```json
{
  "ok": true,
  "request_id": "req_01J...",
  "api_version": "v1",
  "generated_at": "2026-08-15T09:20:31.235Z",
  "data": {},
  "meta": {
    "input_source": "caller",
    "timescale": "UTC",
    "time_source": "caller-supplied",
    "timezone": "Asia/Shanghai",
    "tzdb_version": "2026c",
    "leap_second_table": "IERS-C72",
    "rule_set": "universal-calendar-rules-1.0",
    "calculation_engine": "universal-calendar-web-1.4.0",
    "uncertainty_ms": null,
    "traceability": "deterministic-input"
  },
  "warnings": []
}
```

### 7.5 统一错误响应

```json
{
  "ok": false,
  "request_id": "req_01J...",
  "error": {
    "code": "INVALID_LOCAL_TIME",
    "message": "该当地时间处于夏令时跳变缺口中",
    "field": "local_datetime",
    "details": {
      "timezone": "America/New_York"
    }
  }
}
```

建议错误码至少覆盖：

- `INVALID_ARGUMENT`
- `INVALID_DATE`
- `INVALID_LOCAL_TIME`
- `AMBIGUOUS_LOCAL_TIME`
- `UNSUPPORTED_CALENDAR`
- `UNSUPPORTED_DATE_RANGE`
- `RULE_SET_REQUIRED`
- `TIME_SOURCE_UNSYNCHRONIZED`
- `PROVISIONAL_FUTURE_RESULT`
- `RATE_LIMITED`
- `DEPENDENCY_UNAVAILABLE`

## 8. 建议开放的 API 内容

### 8.1 时间与校准

```http
GET /api/v1/time/now
GET /api/v1/time/status
POST /api/v1/time/compare
```

提供：

- 当前服务器 UTC；
- 接收与发送时间戳；
- 同步协议与状态；
- stratum、offset、jitter、最后同步时间；
- 估计不确定度；
- 闰秒政策；
- 可追溯等级。

### 8.2 地点、时区与真太阳时

```http
GET  /api/v1/locations/resolve
POST /api/v1/time/true-solar
POST /api/v1/time/civil-to-utc
POST /api/v1/time/utc-to-civil
```

建议输入：

- 公历或其他受支持历法的年月日时分秒；
- 经度、纬度、高程；
- IANA 时区；
- DST 重叠时间的 `fold` 选择；
- 采用的真太阳时算法版本。

建议返回：

- UTC、当地民用时间、地方平太阳时、真太阳时；
- 时区偏移、经度修正、均时差；
- 日出、日落、太阳高度等可选数据；
- 输入地点解析来源和坐标精度。

这类接口可供八字、命理、天文、摄影、日晷和传统历法网站调用。API 只提供历法与天文计算，不对命理结论本身作背书。

### 8.3 统一历法转换

```http
POST /api/v1/calendars/convert
GET  /api/v1/calendars/supported
GET  /api/v1/calendars/rule-sets
```

一次输入可返回多个目标历法，例如：

- Gregorian / Julian；
- 中华农历；
- 藏历不同版本；
- 泰国阴阳历与佛历；
- 希伯来历；
- 伊斯兰历及不同算法；
- 波斯历、印度历等；
- 月球历；
- 火星历；
- SI-USTS 等科学时间系统。

每个结果必须携带自己的 `rule_set`、有效年份范围和警告，不能把所有历法包装成同一种确定性。

### 8.4 节日、纪念日与宗教事件

```http
GET  /api/v1/events
POST /api/v1/events/search
GET  /api/v1/events/{event_id}
```

建议覆盖：

- 国家法定节假日；
- 地区与民族节日；
- 基督宗教节期；
- 伊斯兰节日；
- 犹太节日与安息日相关时刻；
- 佛教、道教、印度教、锡克教等节日；
- 历法纪念日、节气、朔望、日月食；
- 月球和火星历纪念节点。

宗教类响应必须区分：

- 纯算法推算；
- 特定教派或机构规则；
- 当地观测后确认；
- 政府或宗教主管机构正式公告。

建议字段：

```json
{
  "event_id": "islamic.eid-al-fitr",
  "name": "开斋节",
  "tradition": "islam",
  "authority": "calculated",
  "rule_set": "umm-al-qura",
  "certainty": "provisional",
  "starts_at": "...",
  "ends_at": "...",
  "location_dependency": true,
  "observational_dependency": true
}
```

### 8.5 中华历法与传统时间服务

```http
POST /api/v1/chinese/calendar
POST /api/v1/chinese/almanac
POST /api/v1/chinese/bazi-time-context
```

可提供：

- 公历、农历双向转换；
- 干支、节气、朔望；
- 真太阳时与出生地点时间上下文；
- 八字所需的时间输入标准化；
- 道教节日、传统节日、宜忌等规则数据；
- 算法版本、历书来源和适用年代。

“八字时间上下文”只负责时间、地点和历法转换，不直接输出不可验证的人生断语，这有利于把基础数据 API 与上层文化应用解耦。

### 8.6 日月与天文现象

```http
POST /api/v1/astronomy/sun
POST /api/v1/astronomy/moon
POST /api/v1/astronomy/events
```

可返回：

- 日出、日落、曙暮光；
- 月出、月落、月相、照明比例；
- 太阳和月球方位、高度；
- 二十四节气、朔、望、食；
- 地球昼夜分界线；
- 输入时间尺度与星历来源。

### 8.7 月球历与月面选点

```http
POST /api/v1/lunar-calendar/calculate
POST /api/v1/moon/surface-context
POST /api/v1/moon/illumination
```

除已有月球历结果外，可增加：

- 月面经纬度选点；
- 月面当地太阳时；
- 当前昼夜状态；
- 日出、日落与连续光照时长；
- 面向地球的一侧和地球可见性；
- 月球同步自转与天平动说明；
- 地形高程、坐标参考系及数据集版本；
- “阴阳合历月球自然昼夜”等文化表达层。

月面坐标必须明确采用的 IAU 参考系、经度正方向和地形数据来源。

### 8.8 火星历与火星表面选点

```http
POST /api/v1/mars-calendar/calculate
POST /api/v1/mars/surface-context
POST /api/v1/mars/illumination
```

可增加：

- 火星表面经纬度选点；
- MTC、LMST、LTST；
- Mars Sol Date；
- 火星年、太阳经度 `Ls`、季节；
- 当地昼夜状态、日出和日落；
- 地形高程与坐标系版本；
- 算法与 NASA Mars24/JPL 等参考模型的对应关系。

### 8.9 批量与订阅

```http
POST /api/v1/batch
GET  /api/v1/feeds/events.ics
GET  /api/v1/feeds/events.json
```

批量接口适合：

- 一次计算一年节日；
- 一次转换多个人的出生时间；
- 获取整月日出日落或祈祷时刻；
- 生成 iCalendar 订阅；
- 为第三方网站预生成缓存。

## 9. API 输入规范示例

### 9.1 真太阳时请求

```http
POST /api/v1/time/true-solar
Content-Type: application/json
Authorization: Bearer <api-key>
```

```json
{
  "input": {
    "calendar": "gregorian",
    "local_datetime": "1990-06-12T08:30:00",
    "timezone": "Asia/Shanghai",
    "fold": 0
  },
  "location": {
    "latitude": 34.3416,
    "longitude": 108.9398,
    "elevation_m": 405
  },
  "options": {
    "include_mean_solar_time": true,
    "include_equation_of_time": true
  }
}
```

### 9.2 统一历法请求

```json
{
  "instant": "2026-08-15T09:20:31Z",
  "timescale": "UTC",
  "location": {
    "latitude": 31.2304,
    "longitude": 121.4737,
    "timezone": "Asia/Shanghai"
  },
  "targets": [
    "gregorian",
    "chinese-lunisolar",
    "hebrew",
    "islamic-tabular",
    "lunar-natural-day",
    "mars-calendar-v0.4"
  ],
  "locale": "zh-CN"
}
```

### 9.3 设计原则

- `instant` 表示同一个物理时刻；
- `local_datetime + timezone` 表示当地钟表时间；
- 不能用一个裸露的 `2026-08-15 12:00` 同时代表两者；
- 地点与时区应分开提供，因为同一时区内经度不同会影响真太阳时；
- 地球地点与月面、火星表面地点使用不同坐标对象，不能混用。

## 10. 同类服务目前提供什么

| 服务 | 主要公开能力 | 对本项目的启发 |
|---|---|---|
| timeanddate.com | 假日、时区、当地时间、天文、日期计算 | 综合性强，但重点仍是地球民用时间和常见天文服务；说明了聚合式 API 有市场。 |
| Calendarific | 全球国家、州和地区节假日，支持节日类型、语言、API Key 和配额 | 节假日数据可以独立商业化，地区层级、语言和稳定 ID 很重要。 |
| USNO Astronomical Applications | 月相、日月出没、恒星时、食、儒略日等天文计算 | 调用者明确提交日期、时间、地点；天文计算服务不等于授时服务。 |
| JPL Horizons | 太阳系天体星历、位置与观测几何 | 科学接口必须明确时间尺度、观测者、目标和参考系。 |
| Hebcal | 希伯来历转换、犹太节日、Torah reading、安息日、Zmanim、ICS/RSS | 宗教 API 的规则、地点、语言、订阅格式和开放许可都很重要。 |
| AlAdhan | 伊斯兰祈祷时间、回历月历、不同计算机构与法学学派、高纬度修正 | 同一宗教时间可能有多个权威方法，必须让调用者选择并返回免责声明。 |
| NIST Internet Time Service | 可追溯到 UTC(NIST) 的网络授时 | 时间服务应返回健康状态、来源和误差概念，而不仅是一串时间。 |
| Google Public NTP | 全球公共 NTP，采用 leap smear | 闰秒处理策略必须公开，不能把不同策略的时间源随意混合。 |

官方资料：

- [timeanddate API](https://www.timeanddate.com/services/api/)
- [Calendarific API](https://calendarific.com/api-documentation)
- [USNO Astronomical Applications API](https://aa.usno.navy.mil/data/api)
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [Hebcal Developer APIs](https://www.hebcal.com/home/developer-apis)
- [AlAdhan Prayer Times API](https://aladhan.engconsults.com/rest-api.html)
- [NIST Internet Time Service](https://www.nist.gov/pml/time-and-frequency-division/time-distribution/internet-time-service-its)
- [Google Public NTP](https://developers.google.com/time)

## 11. 本项目可形成的优势

### 11.1 从“单一日历 API”升级为“时间语义平台”

现有市场往往按类别分散：节假日一个 API、宗教时间一个 API、天文星历一个 API、时区又是另一个 API。本项目可以用统一的时间、地点、规则和来源模型连接它们。

### 11.2 中国文化与多文明并重

可重点形成：

- 中华农历、节气、干支、真太阳时；
- 道教、佛教和东亚文化节日；
- 藏历、泰国历法等版本化规则；
- 与犹太历、伊斯兰历、基督宗教节期等并列的多文明入口。

### 11.3 地球、月球与火星统一

把地球民用时间、月面自然昼夜和火星 Sol 放到同一个统一时刻轴上，并允许在三种天体表面选点，是普通节假日 API 很少覆盖的方向。

### 11.4 来源与不确定度透明

竞争优势不应依赖“绝对准确”宣传，而应依赖：

- 输入是否来自调用者、设备还是服务器；
- 服务器是否同步；
- 采用哪个时间尺度；
- 哪个时区数据库；
- 哪个闰秒表；
- 哪个历法或宗教规则集；
- 结果是确定、暂定还是依赖观测。

### 11.5 可复现与可审计

对于命理、宗教、天文和历史研究，返回版本化规则与输入回显，可以让第三方在未来重新计算同一结果。这比只返回一个日期字符串更有长期价值。

## 12. 几个重点优化方向

### 方向 A：统一时间上下文

建立全站唯一的 `ReferenceTimeContext`，包含：

- 当前模式：实时、日历选中、自定义；
- 原始 UTC；
- 校准偏差；
- 地球地点、时区和真太阳时；
- 月面地点；
- 火星表面地点；
- 时间源状态和更新时间。

所有页面和 Provider 从这一上下文读取时间，避免每个模块自行调用系统时间。

### 方向 B：统一来源元数据

把 `meta`、`warnings`、`rule_set`、`source`、`certainty` 纳入所有 API，而不是只在少数 Provider 中出现。

### 方向 C：规则集版本化

宗教历法、地方节日、阴阳历、闰秒表、时区库和火星历算法都应独立版本化。规则更新不应静默改写旧接口结果。

### 方向 D：地点模型分层

明确区分：

- 地球地点：WGS84 经纬度、高程、IANA 时区；
- 月球地点：IAU 月面坐标、地形模型；
- 火星地点：IAU 火星坐标、地形模型；
- 行政地点：国家、地区、城市与节假日适用范围。

### 方向 E：公开机器可读能力清单

增加：

```http
GET /api/v1/capabilities
GET /api/v1/metadata/versions
GET /api/v1/metadata/sources
```

让第三方在运行时知道支持哪些历法、年份范围、规则集、语言、地点依赖与精度等级。

### 方向 F：批量、缓存与成本控制

- 年度节日、整月天文事件允许长缓存；
- `/time/now` 禁止长缓存；
- 历法转换按输入和版本生成稳定缓存键；
- 提供批量端点降低请求量；
- 对高成本星历或大范围数据设置异步任务机制。

### 方向 G：OpenAPI、SDK 与示例

至少提供：

- OpenAPI 3.1 文件；
- JavaScript/TypeScript SDK；
- Python SDK；
- cURL 示例；
- 八字网站、宗教日历、月球基地和火星站点四类完整示例；
- 版本迁移说明与变更日志。

## 13. 分阶段实施建议

### P0：整理现有能力

- 为现有接口增加明确文档；
- 统一参数命名、响应外壳和错误码；
- 标明当前时间来自设备还是服务器；
- 建立 API 版本前缀，但保留旧接口兼容层。

### P1：完成网站时间校准

- 服务端接入并监控可靠时间源；
- 实现 `/api/v1/time/now` 与 `/api/v1/time/status`；
- 前端实现多次采样和虚拟时钟；
- 月球历、火星历和主日历统一使用校准时间；
- 页面显示时间源、偏差和降级状态。

### P2：建立公共 API 基础

- API Key、配额、CORS、请求 ID；
- OpenAPI 3.1；
- 统一 `meta` 和 `warnings`；
- 统一地点、时间尺度和规则集模型；
- 增加批量接口。

### P3：扩展内容服务

- 真太阳时与命理时间上下文；
- 多宗教节日和权威规则；
- 月面、火星表面选点；
- 月球和火星昼夜、日出日落；
- ICS/RSS/JSON Feed。

### P4：高可信与科研级能力

- NTS/PTP 或可追溯时间源；
- IERS 地球定向参数自动更新；
- 高精度星历与参考系；
- 签名响应、校准日志和服务等级协议；
- 面向科研或任务系统的独立精度等级。

## 14. 质量与合规边界

### 14.1 必须显式说明的限制

- 普通 HTTPS 校准不是操作系统授时，也不是计量校准证书；
- 网络不确定度不能假装为零；
- 政府可能临时修改时区、夏令时或节假日；
- 宗教节日可能依赖观测或当地权威公告；
- 历史时区和古代历法可能存在资料不完整；
- 未来闰秒和部分未来历法结果可能只能暂定；
- 行星时间结果取决于算法、星历、坐标系和地形数据版本。

### 14.2 推荐的可信度字段

```text
official-confirmed       官方公告已确认
calculated-deterministic 规则确定且输入完整
calculated-model         基于模型计算
provisional              未来政策或观测尚未确认
historical-uncertain     历史来源存在不确定性
device-unverified        设备时间未校验
server-synchronized      服务器已同步但非计量认证
metrology-traceable      有明确计量可追溯链
```

## 15. 建议的产品表述

推荐：

```text
本结果基于调用者提供的 UTC、地点和指定规则集计算，可复现。
```

```text
当前时间已通过服务器进行网络校准，估计不确定度为 ±26 毫秒。
```

```text
该宗教日期为算法推算，可能与当地宗教机构或观测公告不同。
```

不推荐：

```text
绝对标准时间
全球唯一准确
所有宗教和地区均官方认可
永远不会变化
```

## 16. 后续文档清单

本规划落地时建议继续拆分为：

1. `OPENAPI_v1.yaml`：机器可读 API 定义；
2. `TIME_SOURCE_OPERATIONS.md`：服务器授时配置、监控与故障降级；
3. `CALENDAR_RULESETS.md`：历法与宗教规则集登记表；
4. `DATA_SOURCES_AND_LICENSES.md`：时区、星历、地形和节日数据来源及许可证；
5. `API_SECURITY_AND_RATE_LIMITS.md`：密钥、签名、配额与滥用防护；
6. `API_EXAMPLES.md`：真太阳时、节日、月球和火星的调用示例。

---

本文档用于确定方向。正式实现前，还需要分别确定部署区域、服务器时间源、闰秒政策、API 认证方式、公开与付费配额以及各历法规则的授权和维护责任。
