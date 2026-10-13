import {lidGeometry,roundedLidGeometry,inwardLidGeometry,droopingLidGeometry,binocularGazeOffset,clamp} from './model.js';
export const PEARL='#e8e7e2';
export const CLASSIC='#79b8ac';
export const HIGHLIGHTS=Object.freeze({round:'丸1点（従来）',double:'大小2点',window:'柔らかな窓反射',star:'星',heart:'ハート',sparkle:'小さなきらめき',crescent:'弧の反射',none:'なし'});
export function drawHighlight(c,s,r,options){
 const pattern=options.highlight in HIGHLIGHTS?options.highlight:'round';if(pattern==='none')return;
 const size=clamp(options.highlightSize??1,.4,1.8),brightness=clamp(options.highlightBrightness??1,0,1);if(!brightness)return;
 c.save();c.beginPath();c.arc(0,0,r-4,0,Math.PI*2);c.clip();
 c.translate(76-s.x*23,-55-s.y*20);c.scale(size,size);c.globalAlpha=brightness;
 const dot=(x,y,radius)=>{const g=c.createRadialGradient(x,y,2,x,y,radius);g.addColorStop(0,'#fffdf5f0');g.addColorStop(.65,'#fffdf5ce');g.addColorStop(1,'#fffdf500');c.fillStyle=g;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();};
 c.fillStyle='#fffdf5d9';c.strokeStyle='#fffdf5c9';c.lineJoin='round';c.lineCap='round';
 if(pattern==='round')dot(0,0,16);
 if(pattern==='double'){dot(0,0,15);dot(-26,26,7);}
 if(pattern==='window'){c.globalAlpha*=.68;c.shadowColor='#fffdf5';c.shadowBlur=4;for(const x of [-17,2])for(const y of [-15,2]){c.beginPath();c.roundRect(x,y,15,13,4);c.fill();}}
 if(pattern==='star'){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?8:18;c[i?'lineTo':'moveTo'](Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();}
 if(pattern==='heart'){c.beginPath();c.moveTo(0,15);c.bezierCurveTo(-30,-2,-14,-25,0,-11);c.bezierCurveTo(14,-25,30,-2,0,15);c.fill();}
 if(pattern==='sparkle'){const spark=(x,y,r)=>{c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x+3,y-3,x+r,y);c.quadraticCurveTo(x+3,y+3,x,y+r);c.quadraticCurveTo(x-3,y+3,x-r,y);c.quadraticCurveTo(x-3,y-3,x,y-r);c.fill();};spark(0,0,18);spark(-26,24,8);dot(22,20,4);}
 if(pattern==='crescent'){c.lineWidth=6;c.beginPath();c.ellipse(0,0,20,15,-.4,Math.PI*1.12,Math.PI*1.85);c.stroke();}
 c.restore();
}
export function isNeutral(color){if(!/^#[0-9a-f]{6}$/i.test(color))return false;const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));return Math.max(...rgb)-Math.min(...rgb)<28;}
// Original procedural artwork. Both render styles share the same state.
export class EyeRenderer {
  constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.color=CLASSIC; this.lidColor='#f1ead6'; }
  drawIntegrated(c,s,r,composition=false,shape=false,options={}){
    // Our procedural design, not an implementation of LOVOT's image layers.
    // Cache the feathered iris field; pupil and reflection remain animated.
    const key=this.color+':'+r+':'+composition;
    if(this.irisKey!==key){
      this.irisKey=key;
      this.irisCanvas??=this.canvas.ownerDocument.createElement('canvas');
      this.irisCanvas.width=this.irisCanvas.height=410;
      const t=this.irisCanvas.getContext('2d');t.translate(205,205);
      const neutral=isNeutral(this.color),rgb=[1,3,5].map(i=>parseInt(this.color.slice(i,i+2),16));
      const dim=`rgb(${rgb.map(v=>Math.round(v*.48)).join(',')})`;
      const g=t.createLinearGradient(0,-r,0,r);
      g.addColorStop(0,composition?'#0b1417':'#142023');g.addColorStop(.32,composition?'#0d181b':'#1b292d');g.addColorStop(.58,neutral?'#707a80':dim);g.addColorStop(.84,this.color);g.addColorStop(1,neutral?'#c2c8c6':this.color);
      t.fillStyle=g;t.fillRect(-205,-205,410,410);
      // Outer transition blends into the sclera without an outline stroke.
      t.globalCompositeOperation='destination-in';
      const mask=t.createRadialGradient(0,0,r-10,0,0,r+3);mask.addColorStop(0,'#000');mask.addColorStop(1,'#0000');
      t.fillStyle=mask;t.fillRect(-205,-205,410,410);
    }
    c.drawImage(this.irisCanvas,-205,-205);
    const p=r*Math.min(.86,s.pupil+(composition?.28:.2)),py=shape?-2:composition?-9:0;
    const pupil=c.createRadialGradient(0,py-2,0,0,py,p+8);
    pupil.addColorStop(0,'#0b1417');pupil.addColorStop(.84,'#0b1417');pupil.addColorStop(.94,'#102026eb');pupil.addColorStop(1,'#10202600');
    c.fillStyle=pupil;c.beginPath();c.ellipse(0,py,(p+8)*(shape?.97:1),p+8,0,0,Math.PI*2);c.fill();
    if(!options.suppressHighlight){
    const hx=(composition?76:48)-s.x*23,hy=-55-s.y*20,lr=composition?16:28;
    const light=c.createRadialGradient(hx,hy,4,hx,hy,lr);light.addColorStop(0,'#fffdf4f0');light.addColorStop(.63,'#fffdf4ca');light.addColorStop(1,'#fffdf400');
    c.fillStyle=light;c.beginPath();c.arc(hx,hy,lr,0,Math.PI*2);c.fill();
    if(composition){
      // Sparse, dim lower reflections; no repeated circular outline.
      for(const [dx,dy,size,alpha] of [[-78,111,4,.7],[-62,124,2,.4],[-40,136,2,.25]]){
        c.fillStyle=`rgba(240,255,249,${alpha})`;c.beginPath();c.arc(dx-s.x*8,dy-s.y*8,size,0,Math.PI*2);c.fill();
      }
    }
  }
  }
  draw(s, options={material:true,lids:true,integrated:true,composition:true,shape:true}) {
    const c=this.ctx, W=this.canvas.width,neutral=isNeutral(this.color);
    const tone=(colored,gray)=>neutral?gray:colored;
    c.save(); c.scale(W/466,W/466); c.clearRect(0,0,466,466);
    c.beginPath();c.arc(233,233,233,0,Math.PI*2);c.clip();
    const improvedLids=lidGeometry(s.openness??s.open,s.blink);
    const rounded=options.lids&&options.shape;
    const side=options.side===-1?-1:1;
    const rg=options.droop?droopingLidGeometry(s.openness??s.open,s.blink,side):options.inward?inwardLidGeometry(s.openness??s.open,s.blink,side):roundedLidGeometry(s.openness??s.open,s.blink);
    const upperPath=()=>{c.moveTo(...rg.left);c.bezierCurveTo(...rg.upper[0],...rg.upper[1],...rg.right);};
    if(options.lids){
      c.save();const {edge,upper,lower}=improvedLids;
      c.beginPath();if(rounded){upperPath();c.bezierCurveTo(...rg.lower[1],...rg.lower[0],...rg.left);}else{c.moveTo(-20,edge);c.quadraticCurveTo(233,upper,486,edge);c.quadraticCurveTo(233,lower,-20,edge);}c.closePath();c.clip();
    }
    c.fillStyle='#181e1c';c.fillRect(0,0,466,466);
    const bg=c.createRadialGradient(195,168,15,233,233,244);
    const integrated=options.material&&options.integrated;
    const composition=integrated&&options.composition;
    bg.addColorStop(0,composition?'#fffdf4':integrated?'#f0f0e8':tone('#d9dfcb','#f0eee5'));bg.addColorStop(.63,composition?'#f4f5ec':integrated?'#dce1da':tone('#b4c6af','#deded8'));bg.addColorStop(1,composition?'#cad5ce':integrated?'#a8b3ad':tone('#526e5e','#9da4a4'));
    c.fillStyle=bg;c.fillRect(0,0,466,466);
    // Reference-informed placement, drawn entirely from procedural geometry.
    // Upper bias preserves a broad lower sclera instead of concentric discs.
    const x=(composition?rounded?244:240:233)+binocularGazeOffset(s.x,options.convergence,side),y=(composition?rounded?211:196:236)+s.y*30,r=composition?172:193;
    c.save();c.translate(x,y);
    // Scale the iris, pupil and their reflections together, never the sclera.
    const irisScale=clamp(options.irisScale??1,.7,1.15);c.scale(irisScale,irisScale);
    const customHighlight=options.highlight&&(options.highlight!=='round'||options.highlightSize!==1||options.highlightBrightness!==1);
    if(integrated){this.drawIntegrated(c,s,r,composition,rounded,{suppressHighlight:customHighlight});}else if(options.material){
      // Broad tonal fields instead of filaments and concentric dark rings.
      const iris=c.createLinearGradient(0,-r,0,r);
      iris.addColorStop(0,tone('#264844','#8b9196'));iris.addColorStop(.42,this.color);iris.addColorStop(1,tone('#e2dbab','#f6f3eb'));
      c.fillStyle=iris;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
      const shade=c.createLinearGradient(0,-r,0,r);
      shade.addColorStop(0,tone('#12302b80','#41464d35'));shade.addColorStop(.48,tone('#1c3b321c','#747a8010'));shade.addColorStop(1,tone('#faf4c02b','#fffaf015'));
      c.fillStyle=shade;c.fill();
      if(neutral){c.strokeStyle='#929ca066';c.lineWidth=1.5;c.stroke();}
      const p=r*Math.min(.78,s.pupil+.12);
      c.fillStyle=tone('#102725','#111719');c.beginPath();c.ellipse(0,0,p*.96,p,0,0,Math.PI*2);c.fill();
      // Reflection follows the eye only partially, unlike an attached sticker.
      if(!customHighlight){const hx=-43-s.x*23,hy=-54-s.y*20;
      const light=c.createRadialGradient(hx,hy,3,hx,hy,31);
      light.addColorStop(0,'#fffbeddf');light.addColorStop(.65,'#fffbedbf');light.addColorStop(1,'#fffbed00');
      c.fillStyle=light;c.beginPath();c.arc(hx,hy,31,0,Math.PI*2);c.fill();}
    }else{
    c.shadowColor=tone('#18352faa','#313b40aa');c.shadowBlur=23;c.shadowOffsetY=8;
    c.fillStyle=tone('#1f3935','#737c82');c.beginPath();c.arc(0,0,r+4,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
    const iris=c.createRadialGradient(-26,-39,15,0,0,r);
    iris.addColorStop(0,tone('#e1d29b','#f2efe5'));iris.addColorStop(.45,this.color);iris.addColorStop(.8,this.color);iris.addColorStop(.94,tone('#3a6157','#a6adb0'));iris.addColorStop(1,tone('#203d37','#758087'));
    c.fillStyle=iris;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
    // Soft radial filaments generated mathematically, never sampled from an image.
    c.save();c.beginPath();c.arc(0,0,r-5,0,Math.PI*2);c.clip();
    for(let i=0;i<180;i++) {
      const a=i*2.39996323,inner=65+Math.sin(i*4.17)*12,outer=144+Math.sin(i*1.7)*9;
      c.strokeStyle=i%3===0?tone('#eef1bf32','#ffffff32'):tone('#133c3829','#5a616829');c.lineWidth=1+(i%3)*.65;
      c.beginPath();c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
      c.quadraticCurveTo(Math.cos(a+.028)*115,Math.sin(a+.028)*115,Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();
    }
    const glow=c.createRadialGradient(0,90,0,0,70,140);glow.addColorStop(0,tone('#e8eeb047','#f8f5ed47'));glow.addColorStop(1,'#d2ebbd00');c.fillStyle=glow;c.fillRect(-r,-r,r*2,r*2);c.restore();
    const p=r*Math.min(.78,s.pupil+.12);
    const ring=c.createRadialGradient(0,0,p*.9,0,0,p+16);ring.addColorStop(0,tone('#09191b','#111719'));ring.addColorStop(.7,tone('#18332deb','#3e464beb'));ring.addColorStop(1,'#234d3d00');
    c.fillStyle=ring;c.beginPath();c.arc(0,0,p+16,0,Math.PI*2);c.fill();
    const pupil=c.createRadialGradient(-15,-20,0,0,0,p);pupil.addColorStop(0,tone('#071316','#0d1316'));pupil.addColorStop(1,tone('#102827','#171d20'));
    c.fillStyle=pupil;c.beginPath();c.ellipse(0,0,p*.96,p,0,0,Math.PI*2);c.fill();
    if(!customHighlight){c.save();c.rotate(-.3);c.fillStyle='#fffef0df';c.shadowColor='#fffde8';c.shadowBlur=13;c.beginPath();c.ellipse(-49,-66,31,21,-.4,0,Math.PI*2);c.fill();c.shadowBlur=3;c.fillStyle='#ffffffa0';c.beginPath();c.arc(41,39,10,0,Math.PI*2);c.fill();c.restore();}
    }
    if(customHighlight)drawHighlight(c,s,r,options);
    c.restore();
    const shade=c.createLinearGradient(0,25,0,310);shade.addColorStop(0,composition?'#10231c40':tone('#10231cc0','#3d464d70'));shade.addColorStop(.55,'#10231c00');shade.addColorStop(1,'#10231c00');c.fillStyle=shade;c.fillRect(0,0,466,466);
    if(options.lids){
      // Transparent outside the opening lets the actual face show through.
      c.restore();const {edge,upper}=improvedLids;
      c.strokeStyle=s.blink>.8?'#52624a99':rounded?'#35463e70':'#68837230';c.lineWidth=s.blink>.8?5:rounded?4:2;c.beginPath();if(rounded)upperPath();else{c.moveTo(-20,edge);c.quadraticCurveTo(233,upper,486,edge);}c.stroke();
    }else{
    // Original geometry retained for direct comparison.
    const open=Math.max(0,Math.min(1,s.open));
    const geometry=options.lids?lidGeometry(s.openness??open,s.blink):{edge:233,upper:233-open*460,lower:233+open*424};
    const {edge,upper,lower}=geometry;
    c.fillStyle=this.lidColor;c.shadowColor='#384b3540';c.shadowBlur=10;
    c.beginPath();c.moveTo(-20,-20);c.lineTo(486,-20);c.lineTo(486,edge);c.quadraticCurveTo(233,upper,-20,edge);c.closePath();c.fill();
    c.beginPath();c.moveTo(-20,486);c.lineTo(486,486);c.lineTo(486,edge);c.quadraticCurveTo(233,lower,-20,edge);c.closePath();c.fill();c.shadowBlur=0;
    c.strokeStyle=options.lids?'#68837230':'#68837255';c.lineWidth=options.lids?2:3;c.beginPath();c.moveTo(-20,edge);c.quadraticCurveTo(233,upper,486,edge);c.stroke();
    }
    c.restore();
  }
}
