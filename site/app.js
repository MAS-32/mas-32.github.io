import {setupContact,setupNavigation} from './page-interactions.mjs';
import {setupElasticCursor} from './elastic-cursor.mjs';
import {setupDialogs} from './records.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(hover:hover) and (pointer:fine)');
let enabled=!reduced.matches,field=null;
const teardownDialogs=setupDialogs(()=>enabled);
const teardownContact=setupContact();
const teardownNavigation=setupNavigation();

function updateMotion(){document.documentElement.classList.toggle('motion-off',!enabled);field?.setEnabled(enabled);document.dispatchEvent(new CustomEvent('mas-motion',{detail:enabled}));}
reduced.addEventListener('change',()=>{enabled=!reduced.matches;updateMotion();});

updateMotion();
const teardownCursor=setupElasticCursor(()=>enabled);
window.addEventListener('pagehide',()=>{teardownCursor();teardownDialogs();teardownContact();teardownNavigation();},{once:true});
if('IntersectionObserver'in window){const dock=document.querySelector('.mobile-dock'),visible=new Set();const observer=new IntersectionObserver(entries=>{for(const e of entries)e.isIntersecting?visible.add(e.target):visible.delete(e.target);dock.classList.toggle('is-hidden',visible.size>0);});observer.observe(document.querySelector('.hero-links'));observer.observe(document.querySelector('#connect'));}
async function setupStars(){
 const {createStars,stepStars,starLinks,LINK_RADIUS}=await import('./particles.mjs');
 const canvas=document.querySelector('#constellation'),ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 let stars=[],width=0,height=0,raf=0,previous=0,time=0,active=enabled,emphasis=scrollY<innerHeight*.6||document.querySelector('#connect').getBoundingClientRect().top<innerHeight*.75?1:.42;
 const pointer={x:0,y:0,active:false};
 function draw(){ctx.clearRect(0,0,width,height);for(const l of starLinks(stars,width<760?120:LINK_RADIUS)){const a=stars[l.i],b=stars[l.j],boost=Math.max(a.influence,b.influence);const alpha=(.11+.09*(1-l.d/LINK_RADIUS)+.27*boost)*emphasis;ctx.strokeStyle=`rgba(176,194,211,${alpha})`;ctx.lineWidth=boost>.2?1:.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(let i=0;i<stars.length;i++){const s=stars[i];ctx.fillStyle=`rgba(202,216,228,${(.52+s.influence*.4+(i%9===0?.18:0))*emphasis})`;ctx.beginPath();ctx.arc(s.x,s.y,s.size+(i%9===0?.35:0),0,Math.PI*2);ctx.fill();}}
 function stop(){cancelAnimationFrame(raf);raf=0;previous=0;}
 function loop(now){raf=0;if(!active||document.hidden)return;if(previous&&now-previous<(width<760?50:32)){raf=requestAnimationFrame(loop);return;}const dt=previous?Math.min((now-previous)/1000,.05):1/30;previous=now;time+=dt;stepStars(stars,pointer,dt,time);draw();raf=requestAnimationFrame(loop);}
 function start(){if(active&&!document.hidden&&!raf)raf=requestAnimationFrame(loop);}
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,width<760?1.25:1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);stars=createStars(width,height);draw();}
 field={setEnabled(on){active=on;stop();pointer.active=false;if(!on){stars=createStars(width,height);draw();}else start();}};
 window.addEventListener('pointermove',e=>{if(!fine.matches||e.pointerType==='touch'||!active||document.body.classList.contains('modal-open'))return;pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;},{passive:true});
 const leave=()=>{pointer.active=false;};document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);
 window.addEventListener('scroll',()=>{leave();const closing=document.querySelector('#connect').getBoundingClientRect();emphasis=scrollY<innerHeight*.6||closing.top<innerHeight*.75?1:.42;if(!active)draw();},{passive:true});
 let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,130);},{passive:true});
 document.addEventListener('visibilitychange',()=>{leave();document.hidden?stop():start();});
 resize();document.documentElement.classList.add('canvas-ready');start();
}
setupStars().catch(()=>{});
import('./intro.mjs').then(m=>m.setupIntro(()=>enabled)).catch(()=>{document.body.style.removeProperty('overflow');document.body.classList.remove('intro-playing');document.querySelector('#main').removeAttribute('aria-busy');});
