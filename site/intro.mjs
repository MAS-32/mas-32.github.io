import {GREETINGS,INTRO_TIMING,getGreetingDuration,curtainPath} from './greetings.mjs';

const ease='cubic-bezier(.76,0,.24,1)';
const sleep=(ms,signal)=>new Promise(resolve=>{
 const id=setTimeout(resolve,ms);
 signal.addEventListener('abort',()=>{clearTimeout(id);resolve();},{once:true});
});

export function setupIntro(motionEnabled){
 const home=document.querySelector('#home');
 const requestedHash=location.hash;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let controller=null,stage=null,running=false;

 function makeStage(){
  const el=document.createElement('div');
  el.id='intro-stage';
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.setAttribute('aria-atomic','true');
  el.setAttribute('aria-label','MAS 多语言问候开场');
  el.innerHTML=`<div class="greeting-center"><span class="greeting-mark" aria-hidden="true"></span><div class="greeting-slot"><span id="greeting-word"></span></div></div><svg class="curtain-curve" aria-hidden="true" preserveAspectRatio="none"><path/></svg>`;
  document.body.append(el);
  return el;
 }

 function heroReveal(){
  document.documentElement.classList.add('hero-entering');
  requestAnimationFrame(()=>document.documentElement.classList.add('hero-entered'));
 }

 function cleanup(){
  if(!running&&!stage)return;
  controller?.abort();
  controller=null;
  running=false;
  stage?.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
  stage?.remove();
  stage=null;
  document.body.classList.remove('intro-playing');
  document.body.style.removeProperty('overflow');
  document.querySelector('#main').removeAttribute('aria-busy');
  let destination=null;
  if(requestedHash&&requestedHash!=='#home'){
   try{destination=document.getElementById(decodeURIComponent(requestedHash.slice(1)));}catch{}
  }
  if(destination)destination.scrollIntoView({block:'start'});
  else window.scrollTo({top:0,left:0,behavior:'instant'});
 }

 async function exitCurtain(signal,quick=false){
  if(!stage||signal.aborted)return;
  const path=stage.querySelector('path');
  const start=performance.now();
  const duration=quick?INTRO_TIMING.reduced:INTRO_TIMING.curtain;
  const width=innerWidth,height=innerHeight;
  const bulge=Math.min(280,Math.max(130,height*.25));
  const flatten=now=>{
   if(signal.aborted||!path.isConnected)return;
   const progress=Math.min(1,(now-start)/duration);
   const smooth=progress*progress*(3-2*progress);
   path.setAttribute('d',curtainPath(width,height,bulge*(1-smooth)));
   if(progress<1)requestAnimationFrame(flatten);
  };
  requestAnimationFrame(flatten);
  const curtain=stage.animate(
   [{transform:'translateY(0)'},{transform:`translateY(calc(-100% - ${bulge}px))`}],
   {duration,easing:ease,fill:'forwards'}
  );
  sleep(quick?70:INTRO_TIMING.heroOverlap,signal).then(()=>{if(!signal.aborted)heroReveal();});
  await Promise.race([curtain.finished.catch(()=>{}),sleep(duration+120,signal)]);
 }

 async function play(){
  if(running)return;
  running=true;
  controller=new AbortController();
  const {signal}=controller;
  document.documentElement.classList.remove('hero-entered','hero-entering');
  window.scrollTo({top:0,left:0,behavior:'instant'});
  stage=makeStage();
  document.body.classList.add('intro-playing');
  document.body.style.overflow='hidden';
  document.querySelector('#main').setAttribute('aria-busy','true');
  const word=stage.querySelector('#greeting-word');
  const path=stage.querySelector('path');
  path.setAttribute('d',curtainPath(innerWidth,innerHeight,Math.min(280,Math.max(130,innerHeight*.25))));

  if(reduced.matches||!motionEnabled()){
   const last=GREETINGS.at(-1);
   word.textContent=last.text;
   word.lang=last.lang;
   word.dir=last.dir;
   word.dataset.language=last.language;
   await sleep(INTRO_TIMING.reduced,signal);
   if(!signal.aborted)await exitCurtain(signal,true);
  }else{
   for(let index=0;index<GREETINGS.length&&!signal.aborted;index++){
    const item=GREETINGS[index];
    word.textContent=item.text;
    word.lang=item.lang;
    word.dir=item.dir;
    word.dataset.language=item.language;
    await sleep(getGreetingDuration(index),signal);
   }
  }

  if(!signal.aborted&&!reduced.matches&&motionEnabled())await exitCurtain(signal);
  if(!signal.aborted)cleanup();
 }

 window.addEventListener('pagehide',cleanup,{once:true});
 window.addEventListener('resize',()=>{
  const path=stage?.querySelector('path');
  if(path)path.setAttribute('d',curtainPath(innerWidth,innerHeight,Math.min(280,Math.max(130,innerHeight*.25))));
 },{passive:true});
 document.addEventListener('mas-motion',event=>{
  if(!event.detail&&running){controller?.abort();heroReveal();cleanup();}
 });
 requestAnimationFrame(()=>play());
}
