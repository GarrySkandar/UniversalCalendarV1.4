(function(){
  const packs={
    'zh-CN':{
      'nav.human.worldCalendars':'世界历法','nav.human.astronomy':'天文','nav.human.aboutUs':'关于我们','nav.human.donation':'捐赠','view.capabilities.title':'世界历法','view.capabilities.subtitle':'查看已接入历法、RuleSet、覆盖范围、数据来源与实现状态。','view.calendar.subtitle':'选择月份与日期；点击日期后按当前时刻查看各文明历日、纪年与传统时间。',
      'view.siteAbout.title':'关于我们','view.siteAbout.subtitle':'项目介绍由 Markdown 文件维护，可直接修改内容而无需改动页面代码。',
      'view.donation.title':'捐赠','view.donation.subtitle':'用于网站运营、服务器与资料整理的自愿支持；收款方式可后续配置。',
      'human.civilizationCalendars':'各文明历法','human.civilizationCalendarsHint':'选择后联动纪年、历日与传统模块','human.selectAllCalendars':'全选','human.clearAllCalendars':'全取消',
      'human.sidebarLocation':'地点','human.system':'系统','action.changeLocation':'更改地点',
      'human.todayAstronomy':'今日天文','human.locationRelated':'地点相关','human.eraLayer':'纪年','human.eraLayerHint':'仅显示已添加文明对应的纪年','human.todayLayout':'今日布局','human.todayLayoutHint':'拖动调整顺序，拖拽右下角调整大小','human.resetTodayLayout':'恢复默认布局',
      'human.civilizationObservances':'文明纪念','human.civilizationObservancesHint':'不受右侧历法选择影响 · 预留 Wikipedia 链接',
      'human.todayAcrossCivilizationsHint2':'仅显示右侧已添加的文明历法','human.capabilityEntry':'世界历法','human.architectureEntry':'引擎架构'
    },
    en:{
      'nav.human.worldCalendars':'World Calendars','nav.human.astronomy':'Astronomy','nav.human.aboutUs':'About Us','nav.human.donation':'Donate','view.capabilities.title':'World Calendars','view.capabilities.subtitle':'Browse supported calendars, RuleSets, coverage, sources, and implementation status.','view.calendar.subtitle':'Choose a month and date, then inspect civilization dates, eras, and traditional time at the selected clock time.',
      'view.siteAbout.title':'About Us','view.siteAbout.subtitle':'Project information is maintained in Markdown files and can be edited without changing page code.',
      'view.donation.title':'Donate','view.donation.subtitle':'Voluntary support for hosting, operations, and research; payment accounts can be configured later.',
      'human.civilizationCalendars':'Civilization Calendars','human.civilizationCalendarsHint':'Selections control eras, calendar dates, and traditional modules','human.selectAllCalendars':'Select all','human.clearAllCalendars':'Clear all',
      'human.sidebarLocation':'Location','human.system':'System','action.changeLocation':'Change location',
      'human.todayAstronomy':'Today’s Astronomy','human.locationRelated':'Location-related','human.eraLayer':'Eras','human.eraLayerHint':'Only eras related to selected civilizations are shown','human.todayLayout':'Today layout','human.todayLayoutHint':'Drag to reorder; drag the lower-right corner to resize','human.resetTodayLayout':'Reset default layout',
      'human.civilizationObservances':'Civilization Observances','human.civilizationObservancesHint':'Independent of calendar selection · Wikipedia links supported',
      'human.todayAcrossCivilizationsHint2':'Only selected civilization calendars are shown','human.capabilityEntry':'World Calendars','human.architectureEntry':'Engine Architecture'
    },
    ja:{
      'nav.human.worldCalendars':'世界の暦','nav.human.astronomy':'天文','nav.human.aboutUs':'私たちについて','nav.human.donation':'寄付','view.capabilities.title':'世界の暦',
      'view.siteAbout.title':'私たちについて','view.donation.title':'寄付','human.civilizationCalendars':'各文明の暦','human.sidebarLocation':'場所','human.system':'システム','action.changeLocation':'場所を変更',
      'human.eraLayer':'紀年','human.civilizationObservances':'文明の記念日','human.todayAcrossCivilizationsHint2':'選択した文明の暦のみ表示','human.selectAllCalendars':'すべて選択','human.clearAllCalendars':'すべて解除','human.todayLayout':'今日のレイアウト','human.todayLayoutHint':'ドラッグで並べ替え、右下をドラッグしてサイズ変更','human.resetTodayLayout':'既定のレイアウトに戻す'
    },
    ko:{
      'nav.human.worldCalendars':'세계 달력','nav.human.astronomy':'천문','nav.human.aboutUs':'소개','nav.human.donation':'후원','view.capabilities.title':'세계 달력',
      'view.siteAbout.title':'소개','view.donation.title':'후원','human.civilizationCalendars':'문명별 달력','human.sidebarLocation':'위치','human.system':'시스템','action.changeLocation':'위치 변경',
      'human.eraLayer':'기년','human.civilizationObservances':'문명 기념일','human.todayAcrossCivilizationsHint2':'선택한 문명 달력만 표시','human.selectAllCalendars':'모두 선택','human.clearAllCalendars':'모두 해제','human.todayLayout':'오늘 레이아웃','human.todayLayoutHint':'드래그로 순서 변경, 오른쪽 아래를 드래그해 크기 조절','human.resetTodayLayout':'기본 레이아웃 복원'
    },
    es:{
      'nav.human.worldCalendars':'Calendarios del mundo','nav.human.astronomy':'Astronomía','nav.human.aboutUs':'Sobre nosotros','nav.human.donation':'Donar','view.capabilities.title':'Calendarios del mundo',
      'view.siteAbout.title':'Sobre nosotros','view.donation.title':'Donar','human.civilizationCalendars':'Calendarios de civilizaciones','human.sidebarLocation':'Ubicación','human.system':'Sistema','action.changeLocation':'Cambiar ubicación',
      'human.eraLayer':'Eras','human.civilizationObservances':'Conmemoraciones de civilizaciones','human.todayAcrossCivilizationsHint2':'Solo se muestran los calendarios seleccionados','human.selectAllCalendars':'Seleccionar todo','human.clearAllCalendars':'Borrar todo','human.todayLayout':'Diseño de hoy','human.todayLayoutHint':'Arrastra para ordenar y redimensionar desde la esquina inferior derecha','human.resetTodayLayout':'Restablecer diseño predeterminado'
    },
    fr:{
      'nav.human.worldCalendars':'Calendriers du monde','nav.human.astronomy':'Astronomie','nav.human.aboutUs':'À propos','nav.human.donation':'Faire un don','view.capabilities.title':'Calendriers du monde',
      'view.siteAbout.title':'À propos','view.donation.title':'Faire un don','human.civilizationCalendars':'Calendriers des civilisations','human.sidebarLocation':'Lieu','human.system':'Système','action.changeLocation':'Changer de lieu',
      'human.eraLayer':'Ères','human.civilizationObservances':'Commémorations des civilisations','human.todayAcrossCivilizationsHint2':'Seuls les calendriers sélectionnés sont affichés','human.selectAllCalendars':'Tout sélectionner','human.clearAllCalendars':'Tout désélectionner','human.todayLayout':'Mise en page du jour','human.todayLayoutHint':'Glissez pour réordonner et redimensionnez depuis le coin inférieur droit','human.resetTodayLayout':'Rétablir la mise en page par défaut'
    }
  };
  Object.entries(packs).forEach(([locale,dict])=>window.I18n.registerLocale(locale,dict));
})();
