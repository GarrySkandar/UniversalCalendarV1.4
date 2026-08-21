(function(root){
  'use strict';
  const continents=[
    [[-168,72],[-150,70],[-140,60],[-128,54],[-124,48],[-118,34],[-110,28],[-97,19],[-83,10],[-79,9],[-81,24],[-75,35],[-66,45],[-61,55],[-72,61],[-90,68],[-110,72],[-135,70],[-150,75]],
    [[-82,12],[-74,8],[-66,4],[-55,2],[-48,-5],[-43,-18],[-50,-30],[-58,-39],[-66,-50],[-72,-53],[-74,-42],[-70,-28],[-76,-14],[-81,-2]],
    [[-73,83],[-20,82],[-16,72],[-30,60],[-50,58],[-62,66]],
    [[-10,36],[-17,28],[-15,15],[-8,5],[4,-5],[12,-15],[20,-35],[32,-35],[39,-22],[45,-10],[51,12],[43,25],[32,31],[20,34],[8,37]],
    [[-10,36],[0,44],[12,45],[20,55],[32,60],[50,70],[75,74],[105,72],[140,60],[165,60],[180,50],[170,42],[145,44],[135,34],[120,25],[105,8],[92,12],[82,22],[72,18],[60,24],[45,30],[32,31],[20,34],[8,37]],
    [[113,-21],[115,-34],[130,-38],[145,-39],[154,-29],[151,-18],[137,-12],[123,-14]],
    [[166,-34],[176,-40],[174,-47],[168,-46]],
    [[-180,-68],[-140,-72],[-90,-75],[-40,-72],[10,-70],[60,-73],[110,-70],[160,-72],[180,-68],[180,-90],[-180,-90]]
  ];

  class EarthMap{
    constructor(canvas,opts={}){
      this.canvas=canvas; this.host=document.getElementById('earthLeafletMap'); this.markerData=opts.marker||{lat:39.9,lon:116.4};
      this.onPick=opts.onPick||(()=>{}); this.profiles=opts.profiles||[]; this.sun=null; this.map=null; this.leafletMarker=null; this.fallback=null;
      if(root.L && this.host){ this.initLeaflet(); } else { this.initFallback(); }
    }
    initLeaflet(){
      try{
        this.map=L.map(this.host,{worldCopyJump:true,zoomControl:true,minZoom:2,maxZoom:18}).setView([this.markerData.lat,this.markerData.lon],5);
        const tile=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'});
        tile.addTo(this.map);
        this.leafletMarker=L.marker([this.markerData.lat,this.markerData.lon],{draggable:true}).addTo(this.map);
        this.leafletMarker.on('dragend',()=>{const p=this.leafletMarker.getLatLng();this.markerData={lat:p.lat,lon:p.lng};this.onPick({lat:p.lat,lon:p.lng},{source:'marker-drag'});});
        this.map.on('click',e=>{this.setMarker(e.latlng.lat,e.latlng.lng,false);this.onPick({lat:e.latlng.lat,lon:e.latlng.lng},{source:'map-click'});});
        tile.on('tileerror',()=>{this.host.classList.add('tiles-degraded');});
        if(this.canvas)this.canvas.style.display='none';
        setTimeout(()=>this.map.invalidateSize(),80);
      }catch(e){console.warn('Leaflet init failed',e);this.initFallback();}
    }
    initFallback(){
      if(!this.canvas)return;
      this.canvas.style.display='block';
      const c=this.canvas,ctx=c.getContext('2d');
      this.fallback={ctx};
      this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(c.parentElement);
      c.addEventListener('click',e=>this.pickFallback(e));this.resize();
    }
    resize(){if(!this.fallback||!this.canvas)return;const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(640,Math.round(r.width*dpr));this.canvas.height=Math.max(320,Math.round(r.height*dpr));this.dpr=dpr;this.drawFallback();}
    xy(lon,lat){return [(lon+180)/360*this.canvas.width,(90-lat)/180*this.canvas.height];}
    lonlat(x,y){return {lon:x/this.canvas.width*360-180,lat:90-y/this.canvas.height*180};}
    setMarker(lat,lon,pan=true){
      this.markerData={lat:Number(lat),lon:Number(lon)};
      if(this.map&&this.leafletMarker){this.leafletMarker.setLatLng([lat,lon]);if(pan)this.map.flyTo([lat,lon],Math.max(this.map.getZoom(),6),{duration:.55});}
      else this.drawFallback();
    }
    flyTo(lat,lon,zoom=9){this.setMarker(lat,lon,false);if(this.map)this.map.flyTo([lat,lon],zoom,{duration:.7});}
    setSun(s){this.sun=s;if(!this.map)this.drawFallback();}
    invalidateSize(){if(this.map)setTimeout(()=>this.map.invalidateSize(),20);}
    pickFallback(e){const r=this.canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*this.canvas.width,y=(e.clientY-r.top)/r.height*this.canvas.height,p=this.lonlat(x,y);this.setMarker(p.lat,p.lon,false);this.onPick(p,{source:'fallback-map'});}
    drawFallback(){if(!this.fallback)return;const c=this.fallback.ctx,w=this.canvas.width,h=this.canvas.height,d=this.dpr||1;c.clearRect(0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#071c31');g.addColorStop(.55,'#0d3550');g.addColorStop(1,'#08243b');c.fillStyle=g;c.fillRect(0,0,w,h);
      c.save();c.strokeStyle='rgba(180,220,230,.13)';c.lineWidth=1*d;for(let lon=-150;lon<=150;lon+=30){const [x]=this.xy(lon,0);c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let lat=-60;lat<=60;lat+=30){const [,y]=this.xy(0,lat);c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}c.restore();
      c.fillStyle='#547c6f';c.strokeStyle='rgba(206,232,218,.45)';c.lineWidth=.8*d;for(const poly of continents){c.beginPath();poly.forEach(([lon,lat],i)=>{const [x,y]=this.xy(lon,lat);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.fill();c.stroke();}
      c.fillStyle='rgba(226,239,232,.65)';for(const p of this.profiles){const [x,y]=this.xy(p.lon,p.lat);c.beginPath();c.arc(x,y,1.55*d,0,Math.PI*2);c.fill();}
      const [mx,my]=this.xy(this.markerData.lon,this.markerData.lat);c.strokeStyle='#ffd76a';c.fillStyle='#ffd76a';c.lineWidth=2*d;c.beginPath();c.arc(mx,my,5*d,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx,my,10*d,0,Math.PI*2);c.stroke();
    }
  }
  root.EarthMap=EarthMap;
})(window);
