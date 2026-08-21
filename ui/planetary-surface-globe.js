(function(root){
  'use strict';

  const DEG=Math.PI/180,RAD=180/Math.PI;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const wrapLon=value=>((Number(value)+180)%360+360)%360-180;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const vector=(lat,lon)=>{const p=lat*DEG,l=lon*DEG,c=Math.cos(p);return [c*Math.cos(l),c*Math.sin(l),Math.sin(p)];};
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const length=a=>Math.hypot(a[0],a[1],a[2]);
  const unit=a=>{const n=length(a)||1;return [a[0]/n,a[1]/n,a[2]/n];};
  const latLon=v=>({lat:Math.asin(clamp(v[2],-1,1))*RAD,lon:wrapLon(Math.atan2(v[1],v[0])*RAD)});
  const basis=(lat,lon)=>{
    const p=lat*DEG,l=lon*DEG;
    return {front:[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],right:[-Math.sin(l),Math.cos(l),0],up:[-Math.sin(p)*Math.cos(l),-Math.sin(p)*Math.sin(l),Math.cos(p)]};
  };
  function projectPoint(lat,lon,viewLat,viewLon){
    const v=vector(lat,lon),b=basis(viewLat,viewLon);
    return {x:dot(v,b.right),y:dot(v,b.up),z:dot(v,b.front)};
  }
  function unprojectPoint(x,y,viewLat,viewLon){
    const rr=x*x+y*y;if(rr>1)return null;
    const z=Math.sqrt(Math.max(0,1-rr)),b=basis(viewLat,viewLon);
    return latLon([b.right[0]*x+b.up[0]*y+b.front[0]*z,b.right[1]*x+b.up[1]*y+b.front[1]*z,b.right[2]*x+b.up[2]*y+b.front[2]*z]);
  }
  function illuminationAt(lat,lon,sunLat,sunLon){
    const cosine=dot(vector(lat,lon),vector(sunLat,sunLon));
    return {cosine,state:cosine>.06?'day':cosine<-.06?'night':'terminator'};
  }
  function parseHms(value){const p=String(value||'').split(':').map(Number);return Number.isFinite(p[0])?p[0]+(p[1]||0)/60+(p[2]||0)/3600:0;}
  function marsSubsolarPoint(amt,lsDeg){
    const hours=parseHms(amt),declination=Math.asin(Math.sin(25.19*DEG)*Math.sin(Number(lsDeg)*DEG))*RAD;
    return {lat:declination,lon:wrapLon((12-hours)*15)};
  }

  const MOON_FEATURES=[
    [8.5,31.4,19,-28],[32.8,-15.6,24,-24],[-20.4,17.5,16,-20],[-19,-95,15,-16],
    [-43.3,-11.2,7,24],[9.6,-20.1,6,18],[23.7,-47.4,4,26]
  ].map(([lat,lon,r,tone])=>({v:vector(lat,lon),edge:1-Math.cos(r*DEG),tone}));
  const MARS_FEATURES=[
    [-14.6,-70,28,-22],[18.7,-133.8,12,24],[22,145,22,-18],[0,70,20,-12],[40,-105,15,12]
  ].map(([lat,lon,r,tone])=>({v:vector(lat,lon),edge:1-Math.cos(r*DEG),tone}));

  function relief(features,v){
    let value=0;
    for(const feature of features){
      const q=(1-dot(v,feature.v))/feature.edge;
      if(q>=1)continue;
      const d=Math.sqrt(Math.max(0,q));
      value+=feature.tone*(1-smooth(.1,.95,d));
      if(feature.tone>0)value+=18*Math.exp(-Math.pow((d-.78)/.11,2));
    }
    return value;
  }
  function surfaceColor(body,lat,lon,v){
    const p=lat*DEG,l=lon*DEG;
    const noise=Math.sin(l*7+p*3)*7+Math.sin(l*17-p*11)*3+Math.cos(l*31+p*19)*1.8;
    if(body==='moon'){
      const value=clamp(153+noise+relief(MOON_FEATURES,v),74,205);
      return [value*1.02,value*1.04,value*1.08];
    }
    let height=noise+relief(MARS_FEATURES,v),r=181+height,g=91+height*.55,b=58+height*.28;
    const polar=smooth(67,84,Math.abs(lat));
    r=r*(1-polar)+224*polar;g=g*(1-polar)+210*polar;b=b*(1-polar)+190*polar;
    return [clamp(r,75,238),clamp(g,38,220),clamp(b,25,202)];
  }
  function formatCoordinate(lat,lon){return `${Math.abs(lat).toFixed(3)}° ${lat>=0?'N':'S'} · ${Math.abs(lon).toFixed(3)}° ${lon>=0?'E':'W'}`;}

  class SurfaceGlobe{
    constructor(canvas,options={}){
      this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.body=options.body==='mars'?'mars':'moon';
      this.selection={lat:clamp(Number(options.lat)||0,-90,90),lon:wrapLon(Number(options.lon)||0)};
      this.view={lat:clamp(Number(options.viewLat)||0,-80,80),lon:wrapLon(Number(options.viewLon)||0)};
      this.sun={lat:0,lon:0};this.onPick=options.onPick||(()=>{});this.drag=null;this.frame=0;
      canvas.style.touchAction='none';canvas.addEventListener('pointerdown',event=>this.pointerDown(event));
      canvas.addEventListener('pointermove',event=>this.pointerMove(event));canvas.addEventListener('pointerup',event=>this.pointerUp(event));canvas.addEventListener('pointercancel',()=>this.drag=null);
      canvas.addEventListener('keydown',event=>this.keyDown(event));
      this.resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>this.resize()):null;this.resizeObserver?.observe(canvas);
      this.resize();this.updateAccessibleLabel();
    }
    resize(){
      const rect=this.canvas.getBoundingClientRect(),width=Math.round(clamp(rect.width||560,340,680)),height=Math.round(clamp((rect.height||width*.68),300,480));
      if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
      this.queueDraw();
    }
    queueDraw(){if(this.frame)return;const raf=root.requestAnimationFrame||((fn)=>setTimeout(fn,0));this.frame=raf(()=>{this.frame=0;this.draw();});}
    setSelection(lat,lon,center=false){this.selection={lat:clamp(Number(lat)||0,-90,90),lon:wrapLon(Number(lon)||0)};if(center)this.view={lat:clamp(this.selection.lat,-70,70),lon:this.selection.lon};this.updateAccessibleLabel();this.queueDraw();return this.getState();}
    setSun(lat,lon){this.sun={lat:clamp(Number(lat)||0,-90,90),lon:wrapLon(Number(lon)||0)};this.queueDraw();return this.getState();}
    setView(lat,lon){this.view={lat:clamp(Number(lat)||0,-80,80),lon:wrapLon(Number(lon)||0)};this.queueDraw();return this.getState();}
    focusSelection(){return this.setView(clamp(this.selection.lat,-70,70),this.selection.lon);}
    getState(){
      const light=illuminationAt(this.selection.lat,this.selection.lon,this.sun.lat,this.sun.lon);
      return {body:this.body,selection:{...this.selection},view:{...this.view},sun:{...this.sun},illumination:light,earthSide:this.body==='moon'?(Math.cos(this.selection.lon*DEG)>=0?'near':'far'):null};
    }
    updateAccessibleLabel(){this.canvas.setAttribute('aria-label',`${this.body==='moon'?'月球':'火星'}表面选点球；当前选点 ${formatCoordinate(this.selection.lat,this.selection.lon)}；拖拽旋转，点击选点`);}
    metrics(){const w=this.canvas.width,h=this.canvas.height,r=Math.min(w,h)*.425;return {w,h,r,cx:w/2,cy:h/2};}
    eventPoint(event){const rect=this.canvas.getBoundingClientRect(),m=this.metrics();return {x:(event.clientX-rect.left)/rect.width*m.w,y:(event.clientY-rect.top)/rect.height*m.h};}
    pick(point){const m=this.metrics(),nx=(point.x-m.cx)/m.r,ny=(m.cy-point.y)/m.r;return unprojectPoint(nx,ny,this.view.lat,this.view.lon);}
    pointerDown(event){if(event.button!==0)return;const p=this.eventPoint(event);this.drag={id:event.pointerId,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,viewLat:this.view.lat,viewLon:this.view.lon,moved:false};this.canvas.setPointerCapture?.(event.pointerId);}
    pointerMove(event){if(!this.drag||this.drag.id!==event.pointerId)return;const p=this.eventPoint(event),dx=p.x-this.drag.startX,dy=p.y-this.drag.startY;if(Math.hypot(dx,dy)>4)this.drag.moved=true;this.drag.lastX=p.x;this.drag.lastY=p.y;if(this.drag.moved){this.view.lon=wrapLon(this.drag.viewLon-dx*.32);this.view.lat=clamp(this.drag.viewLat+dy*.25,-80,80);this.queueDraw();}}
    pointerUp(event){if(!this.drag||this.drag.id!==event.pointerId)return;const drag=this.drag;this.drag=null;if(!drag.moved){const picked=this.pick({x:drag.lastX,y:drag.lastY});if(picked){this.setSelection(picked.lat,picked.lon,false);this.onPick({...picked});}}}
    keyDown(event){
      const step=event.shiftKey?15:5;
      if(event.key==='ArrowLeft')this.view.lon=wrapLon(this.view.lon-step);else if(event.key==='ArrowRight')this.view.lon=wrapLon(this.view.lon+step);else if(event.key==='ArrowUp')this.view.lat=clamp(this.view.lat+step,-80,80);else if(event.key==='ArrowDown')this.view.lat=clamp(this.view.lat-step,-80,80);else if(event.key==='Enter'||event.key===' '){event.preventDefault();this.setSelection(this.view.lat,this.view.lon,false);this.onPick({...this.selection});return;}else return;
      event.preventDefault();this.queueDraw();
    }
    drawCurve(points,color,width=1,dash=[]){
      const ctx=this.ctx,m=this.metrics();ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();let drawing=false,last=null;
      for(const point of points){const p=projectPoint(point.lat,point.lon,this.view.lat,this.view.lon);if(p.z<=0){drawing=false;last=null;continue;}const x=m.cx+p.x*m.r,y=m.cy-p.y*m.r;if(!drawing||last&&Math.hypot(x-last[0],y-last[1])>m.r*.25){ctx.moveTo(x,y);drawing=true;}else ctx.lineTo(x,y);last=[x,y];}
      ctx.stroke();ctx.restore();
    }
    drawGrid(){
      for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lon=-180;lon<=180;lon+=3)pts.push({lat,lon});this.drawCurve(pts,lat===0?'rgba(216,239,240,.35)':'rgba(216,239,240,.16)',lat===0?1.2:.7);}
      for(let lon=-150;lon<=180;lon+=30){const pts=[];for(let lat=-90;lat<=90;lat+=3)pts.push({lat,lon});this.drawCurve(pts,lon===0?'rgba(216,239,240,.4)':'rgba(216,239,240,.15)',lon===0?1.2:.7);}
    }
    drawTerminator(){
      const s=vector(this.sun.lat,this.sun.lon),seed=Math.abs(s[2])<.9?[0,0,1]:[1,0,0],a=unit(cross(s,seed)),b=unit(cross(s,a)),pts=[];
      for(let i=0;i<=180;i++){const t=i/180*Math.PI*2;pts.push(latLon([a[0]*Math.cos(t)+b[0]*Math.sin(t),a[1]*Math.cos(t)+b[1]*Math.sin(t),a[2]*Math.cos(t)+b[2]*Math.sin(t)]));}
      this.drawCurve(pts,'rgba(255,220,137,.86)',1.5,[5,4]);
    }
    marker(lat,lon,color,label){
      const p=projectPoint(lat,lon,this.view.lat,this.view.lon);if(p.z<=0)return;const ctx=this.ctx,m=this.metrics(),x=m.cx+p.x*m.r,y=m.cy-p.y*m.r;
      ctx.save();ctx.strokeStyle='#fff';ctx.fillStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='600 10px system-ui';ctx.textAlign=x>m.cx?'right':'left';ctx.fillStyle='#f6fbfb';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=4;ctx.fillText(label,x+(x>m.cx?-10:10),y-8);ctx.restore();
    }
    draw(){
      const ctx=this.ctx,m=this.metrics();if(!ctx)return;const bg=ctx.createRadialGradient(m.cx,m.cy-m.r*.15,m.r*.1,m.cx,m.cy,m.r*1.45);bg.addColorStop(0,this.body==='moon'?'#183248':'#4a2725');bg.addColorStop(1,'#07131e');ctx.fillStyle=bg;ctx.fillRect(0,0,m.w,m.h);
      const image=ctx.createImageData(m.w,m.h),data=image.data,b=basis(this.view.lat,this.view.lon),sunV=vector(this.sun.lat,this.sun.lon),r2=m.r*m.r;
      const x0=Math.max(0,Math.floor(m.cx-m.r)),x1=Math.min(m.w-1,Math.ceil(m.cx+m.r)),y0=Math.max(0,Math.floor(m.cy-m.r)),y1=Math.min(m.h-1,Math.ceil(m.cy+m.r));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const nx=(x-m.cx)/m.r,ny=(m.cy-y)/m.r,q=nx*nx+ny*ny;if(q>1)continue;const z=Math.sqrt(1-q);
        const v=[b.right[0]*nx+b.up[0]*ny+b.front[0]*z,b.right[1]*nx+b.up[1]*ny+b.front[1]*z,b.right[2]*nx+b.up[2]*ny+b.front[2]*z],ll=latLon(v),color=surfaceColor(this.body,ll.lat,ll.lon,v);
        const solar=dot(v,sunV),day=.12+.88*smooth(-.055,.12,solar),limb=.58+.42*Math.pow(z,.35),shade=day*limb,index=(y*m.w+x)*4;
        data[index]=Math.round(color[0]*shade);data[index+1]=Math.round(color[1]*shade);data[index+2]=Math.round(color[2]*shade);data[index+3]=255;
      }
      ctx.putImageData(image,0,0);ctx.save();ctx.beginPath();ctx.arc(m.cx,m.cy,m.r,0,Math.PI*2);ctx.strokeStyle=this.body==='moon'?'rgba(218,233,239,.72)':'rgba(241,173,132,.72)';ctx.lineWidth=2;ctx.stroke();ctx.restore();
      this.drawGrid();this.drawTerminator();if(this.body==='moon')this.marker(0,0,'#52b9d0','对地面中心');this.marker(this.selection.lat,this.selection.lon,'#ffd166','当前选点');this.marker(this.sun.lat,this.sun.lon,'#ff9e57','太阳直射');
    }
  }

  root.PlanetarySurfaceGlobe={create:(canvas,options)=>new SurfaceGlobe(canvas,options),SurfaceGlobe,wrapLon,projectPoint,unprojectPoint,illuminationAt,marsSubsolarPoint,formatCoordinate};
})(window);
