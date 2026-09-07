// Anchor-based attraction: only nearby stars move, then return smoothly to their own region.
export const LINK_RADIUS=165;
export function createStars(width,height,random=Math.random){
  const count=width<760?Math.min(40,Math.max(32,Math.round(width*height/9500))):Math.min(124,Math.max(90,Math.round(width*height/12000)));
  const cols=Math.ceil(Math.sqrt(count*width/height));
  const rows=Math.ceil(count/cols);
  return Array.from({length:count},(_,i)=>{const ax=((i%cols)+.18+random()*.64)/cols*width;const ay=(Math.floor(i/cols)+.18+random()*.64)/rows*height;return {ax,ay,x:ax,y:ay,vx:0,vy:0,phase:random()*Math.PI*2,size:.7+random()*.9,influence:0};});
}
export function stepStars(stars,pointer,dt,time){
  const factor=Math.min(dt,.05)*60;
  for(let i=0;i<stars.length;i++){
    const s=stars[i],bx=s.ax+Math.sin(time*.12+s.phase)*12,by=s.ay+Math.cos(time*.1+s.phase)*10;
    const dx=pointer.x-bx,dy=pointer.y-by,d=Math.hypot(dx,dy);
    const t=Math.min(1,d/250),smooth=1-t*t*(3-2*t);
    const target=pointer.active&&d<250?smooth:0;
    s.influence+=(target-s.influence)*(1-Math.exp(-dt*4));
    const ring=28+(i%7)*6,approach=Math.max(0,d-ring)/Math.max(d,1)*.96*s.influence;
    const tx=bx+dx*approach,ty=by+dy*approach;
    s.vx+=(tx-s.x)*.026*factor;s.vy+=(ty-s.y)*.026*factor;
    s.vx*=Math.pow(.77,factor);s.vy*=Math.pow(.77,factor);
    s.x+=s.vx*factor;s.y+=s.vy*factor;
  }
  for(let i=0;i<stars.length;i++)for(let j=i+1;j<stars.length;j++){
    const a=stars[i],b=stars[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
    if(d<21&&d>0){const push=(21-d)*.018*factor;a.vx+=dx/d*push;a.vy+=dy/d*push;b.vx-=dx/d*push;b.vy-=dy/d*push;}
  }
}
export function starLinks(stars,radius=LINK_RADIUS){
  const candidates=[];
  for(let i=0;i<stars.length;i++)for(let j=i+1;j<stars.length;j++){const d=Math.hypot(stars[i].x-stars[j].x,stars[i].y-stars[j].y);if(d<radius)candidates.push({i,j,d});}
  candidates.sort((a,b)=>a.d-b.d);
  const degree=Array(stars.length).fill(0),links=[];
  for(const link of candidates){if(degree[link.i]>=3||degree[link.j]>=3)continue;degree[link.i]++;degree[link.j]++;links.push(link);if(links.length>=140)break;}
  return links;
}
