// Pure time-based state. No DOM, Canvas, hardware or external service dependencies.
export const MODES = Object.freeze({
  normal: { pupil: .48, openness: .92, interval: 4.5, gaze: .55 },
  curious: { pupil: .61, openness: 1, interval: 5.5, gaze: .78 },
  sleepy: { pupil: .43, openness: .46, interval: 3.2, gaze: .25 }
});
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
export function lidGeometry(openness, blink) {
  const o=clamp(openness,0,1), b=clamp(blink,0,1);
  const lower=635-(1-o)*20;
  const aperture=o<=.46?o/.46*.7:.7+(o-.46)/.54*.3;
  const upper=lower-845*aperture;
  return {edge:240,upper:upper+(lower-upper)*b,lower};
}
export function seededRandom(seed = 42) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
export function binocularGazeOffset(gaze,convergence=0,side=1){
 const g=clamp(gaze,-1,1),c=clamp(convergence,0,100);
 // Mild settings still fade completely at the edge. Strong settings lose at
 // most 24px, keeping gaze monotonic instead of reversing past convergence 36.
 return 36*g+(side===-1?-1:1)*(c-Math.min(c,24)*Math.abs(g));
}
// Rounded aperture, independent of the circular display boundary.
// Upper and lower curves share endpoints and coincide at full closure.
export function roundedLidGeometry(openness,blink){
 const o=clamp(openness,0,1),b=clamp(blink,0,1);
 const aperture=(o<=.46?o/.46*.55:.55+(o-.46)/.54*.45)*(1-b);
 return {left:[28,245],right:[437,235],lower:[[20,485],[435,495]],upper:[[20,485-515*aperture],[435,495-525*aperture]]};
}
export function inwardLidGeometry(openness,blink,side=1){
 const g=roundedLidGeometry(openness,blink),a=8*Math.PI/180;
 // Rotate only the opening; mirror its geometry for the screen-right eye.
 const point=([x,y])=>{const dx=x-233,dy=y-233;return [233+side*(dx*Math.cos(a)-dy*Math.sin(a)),233+dx*Math.sin(a)+dy*Math.cos(a)];};
 return {left:point(g.left),right:point(g.right),upper:g.upper.map(point),lower:g.lower.map(point)};
}
export function droopingLidGeometry(openness,blink,side=1){
 const o=clamp(openness,0,1),b=clamp(blink,0,1);
 const a=(o<=.46?o/.46*.55:.55+(o-.46)/.54*.45)*(1-b);
 // Screen-left eye: outer corner is left, 28px below the inner corner.
 // Shape the upper lid independently; rotating the whole opening reverses this.
 const g={left:[28,263],right:[437,235],lower:[[20,499],[435,483]],upper:[[20+25*a,499-509*a],[435+12*a,483-518*a]]};
 const p=([x,y])=>[side===-1?466-x:x,y];
 return {left:p(g.left),right:p(g.right),lower:g.lower.map(p),upper:g.upper.map(p)};
}
export class EyeModel {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.mode = 'normal'; this.auto = true; this.time = 0; this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0; this.headX=0; this.headY=0; this.pupil = .48; this.basePupil = .48;
    this.openness = .92; this.baseOpen = .92; this.blinkAge = -1;
    this.nextBlink = 2.5; this.nextGaze = .9; this.blink = 0;
  }
  setMode(mode) { if (!MODES[mode]) return; this.mode = mode; this.basePupil = MODES[mode].pupil; this.baseOpen = MODES[mode].openness; }
  setGaze(x,y) { this.targetX = clamp(x,-1,1); this.targetY = clamp(y,-1,1); }
  setPupil(v) { this.basePupil = clamp(v,.25,.7); }
  setOpen(v) { this.baseOpen = clamp(v,.05,1); }
  triggerBlink() { if (this.blinkAge < 0) this.blinkAge = 0; }
  step(dt) {
    dt = clamp(dt,0,.1); this.time += dt;
    const mode = MODES[this.mode];
    if (this.auto && this.time >= this.nextGaze) {
      this.setGaze((this.random()*2-1)*mode.gaze,(this.random()*2-1)*mode.gaze*.65);
      this.nextGaze = this.time + 1.2 + this.random()*2.5;
    }
    if (this.time >= this.nextBlink) {
      this.triggerBlink(); this.nextBlink = this.time + mode.interval*(.7+this.random()*.6);
    }
    if (this.blinkAge >= 0) {
      this.blinkAge += dt;
      const duration = this.mode === 'sleepy' ? .55 : .29;
      const phase = this.blinkAge / duration;
      // Quick closure, gentler opening. Exactly closed at phase .32.
      this.blink = phase < .32 ? Math.sin(Math.min(1,phase/.32)*Math.PI/2) : .5+.5*Math.cos(Math.min(1,(phase-.32)/.68)*Math.PI);
      if (phase >= 1) { this.blinkAge = -1; this.blink = 0; }
    }
    const ease = 1-Math.exp(-dt*9);
    this.x += (this.targetX-this.x)*ease; this.y += (this.targetY-this.y)*ease;
    const headEase=1-Math.exp(-dt*2.4);
    this.headX+=(this.x-this.headX)*headEase;this.headY+=(this.y-this.headY)*headEase;
    this.pupil += (clamp(this.basePupil + Math.sin(this.time*1.6)*.015,.25,.7)-this.pupil)*(1-Math.exp(-dt*3));
    this.openness += (this.baseOpen-this.openness)*(1-Math.exp(-dt*5));
    return this.snapshot();
  }
  snapshot() { return {x:this.x,y:this.y,headX:this.headX,headY:this.headY,pupil:this.pupil,openness:this.openness,open:this.openness*(1-this.blink),blink:this.blink,time:this.time}; }
}
