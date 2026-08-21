(function(root){
  'use strict';
  const catalog=[
    {id:'christianity',label:'基督教相关（格里高利历，国际公历）',en:'Christianity (Gregorian / International Civil Calendar)',kind:'system',children:[
      {id:'julian',label:'儒略历（东正教旧历）',en:'Julian Calendar (Eastern Orthodox Old Calendar)',kind:'calendar'},
      {id:'revised-julian',label:'修订儒略历（东正教新历）',en:'Revised Julian Calendar (Eastern Orthodox New Calendar)',kind:'calendar'},
      {id:'armenian',label:'亚美尼亚使徒教会传统',en:'Armenian Apostolic tradition',kind:'tradition'},
      {id:'coptic',label:'科普特历 · 科普特正教传统',en:'Coptic Calendar · Coptic Orthodox tradition',kind:'tradition'},
      {id:'ethiopian',label:'埃塞俄比亚历 · 埃塞俄比亚正教传统',en:'Ethiopic Calendar · Ethiopian Orthodox tradition',kind:'tradition'}
    ]},
    {id:'islamic',label:'伊斯兰历',en:'Islamic Calendar',kind:'system'},
    {id:'chinese',label:'中华农历',en:'Chinese Lunisolar Calendar',kind:'system',children:[
      {id:'taoist',label:'道教',en:'Daoist tradition',kind:'tradition'},
      {id:'han_buddhist',label:'汉传佛教',en:'Han Buddhism',kind:'tradition'},
      {id:'chinese-almanac',label:'中国传统黄历',en:'Chinese Almanac',kind:'plugin'},
      {id:'huangji-jingshi',label:'皇极经世',en:'Huangji Jingshi',kind:'plugin'},
      {id:'sanyuan-jiuyun',label:'三元九运',en:'Sanyuan Jiuyun',kind:'plugin'}
    ]},
    {id:'indian',label:'印度传统历法',en:'Indian Traditional Calendars',kind:'system',children:[
      {id:'hindu',label:'印度教传统',en:'Hindu traditions',kind:'tradition'},
      {id:'sikh',label:'锡克教',en:'Sikh tradition',kind:'tradition'},
      {id:'jain',label:'耆那教',en:'Jain tradition',kind:'tradition'},
      {id:'indian-panchanga',label:'Panchanga',en:'Panchanga',kind:'plugin'}
    ]},
    {id:'theravada',label:'南传佛历',en:'Theravada Buddhist Calendar',kind:'system'},
    {id:'japanese',label:'日本传统',en:'Japanese Tradition',kind:'system',children:[
      {id:'japanese-era',label:'日本年号',en:'Japanese Era Name',kind:'era'}
    ]},
    {id:'jewish',label:'犹太教',en:'Judaism / Hebrew Calendar',kind:'system',children:[
      {id:'jewish_israel',label:'以色列传统',en:'Israel observance tradition',kind:'tradition'},
      {id:'jewish_diaspora',label:'散居地传统',en:'Diaspora observance tradition',kind:'tradition'}
    ]},
    {id:'zoroastrian',label:'琐罗亚斯德教',en:'Zoroastrian Calendars',kind:'system'},
    {id:'bahai',label:'巴哈伊教',en:'Baháʼí Calendar',kind:'system'},
    {id:'silicon',label:'硅基文明',en:'Silicon Civilization',kind:'system'}
  ];

  const defaultSystems=new Set(['christianity','islamic','chinese','indian','theravada','japanese','jewish','silicon']);
  const defaultChildren=new Set([
    'taoist','han_buddhist','chinese-almanac','huangji-jingshi','sanyuan-jiuyun',
    'indian-panchanga','japanese-era','jewish_israel'
  ]);

  const pluginIds=new Set();
  const childParent={};
  const byId={};
  function walk(items,systemId=null,parentId=null){
    for(const item of items){
      byId[item.id]=item;
      if(parentId)childParent[item.id]=parentId;
      if(item.kind==='plugin')pluginIds.add(item.id);
      const nextSystem=item.kind==='system'?item.id:systemId;
      if(item.children)walk(item.children,nextSystem,item.id);
    }
  }
  walk(catalog);
  function label(item,isEnglish){return isEnglish?(item.en||item.label):item.label;}
  function isDescendantOf(id,ancestor){let p=childParent[id];while(p){if(p===ancestor)return true;p=childParent[p];}return false;}
  function isEffectiveChild(childId,systems,children){if(!children.has(childId))return false;let p=childParent[childId];while(p){const parent=byId[p];if(parent?.kind==='system')return systems.has(p);if(!children.has(p))return false;p=childParent[p];}return false;}
  function selectedUnder(systemId,children){return [...children].filter(id=>isDescendantOf(id,systemId));}
  function selectableDescendants(item){
    const out=[];(function dive(xs){for(const x of xs||[]){if(x.kind!=='group')out.push(x);if(x.children)dive(x.children);}})(item.children);return out;
  }
  root.CivilizationCalendarSelector={catalog,defaultSystems,defaultChildren,pluginIds,childParent,byId,label,isEffectiveChild,selectedUnder,selectableDescendants};
})(window);
