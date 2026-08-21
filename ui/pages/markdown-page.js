(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function inline(s){
    let x=esc(s);
    x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>');
    return x;
  }
  function renderMarkdown(md){
    const lines=String(md||'').replace(/\r/g,'').split('\n'),out=[];let para=[],list=[];
    const flushPara=()=>{if(para.length){out.push(`<p>${inline(para.join(' '))}</p>`);para=[];}};
    const flushList=()=>{if(list.length){out.push(`<ul>${list.map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`);list=[];}};
    for(const raw of lines){const line=raw.trimEnd();
      if(!line.trim()){flushPara();flushList();continue;}
      const h=line.match(/^(#{1,4})\s+(.+)$/);if(h){flushPara();flushList();const n=h[1].length;out.push(`<h${n}>${inline(h[2])}</h${n}>`);continue;}
      const li=line.match(/^[-*]\s+(.+)$/);if(li){flushPara();list.push(li[1]);continue;}
      if(/^---+$/.test(line.trim())){flushPara();flushList();out.push('<hr>');continue;}
      para.push(line.trim());
    }
    flushPara();flushList();return out.join('\n');
  }
  async function loadLocalized(base,locale){
    const langs=[];if(locale)langs.push(locale);if(locale?.startsWith('zh'))langs.push('zh-CN');else langs.push('en','zh-CN');
    for(const lang of [...new Set(langs)]){try{const r=await fetch(`${base}/${lang}.md?v=1.3.2`);if(r.ok)return await r.text();}catch(_){}}
    return '# Content unavailable';
  }
  async function renderAbout(el,locale){if(!el)return;const md=await loadLocalized('content/about',locale);el.innerHTML=renderMarkdown(md);}
  async function renderDonation(el,locale){
    if(!el)return;const md=await loadLocalized('content/donation',locale);let methods=[];
    try{const r=await fetch('config/donation.json?v=1.3.2');if(r.ok){const j=await r.json();methods=Array.isArray(j.methods)?j.methods:[];}}catch(_){}
    let extra='';
    if(methods.length){extra=`<section class="donation-methods"><h2>${locale?.startsWith('zh')?'捐赠方式':'Donation methods'}</h2>${methods.map(m=>`<article class="donation-method"><b>${esc(m.label||m.type||'')}</b>${m.address?`<code>${esc(m.address)}</code>`:''}${m.url?`<a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${esc(m.url)}</a>`:''}${m.note?`<p>${inline(m.note)}</p>`:''}</article>`).join('')}</section>`;}
    else extra=`<div class="donation-empty">${locale?.startsWith('zh')?'捐赠收款方式暂未开放。后续只需编辑 config/donation.json 即可加入收款账号。':'Donation methods are not open yet. Add accounts later in config/donation.json.'}</div>`;
    el.innerHTML=renderMarkdown(md)+extra;
  }
  root.MarkdownPage={renderMarkdown,renderAbout,renderDonation};
})(window);
