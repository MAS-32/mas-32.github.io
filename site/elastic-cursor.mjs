export const CURSOR_CONFIG={
 diameter:50,
 dotDiameter:10,
 maxStretch:.35,
 velocityDivisor:700,
 followStiffness:200,
 followDamping:21,
 pullStiffness:240,
 pullDamping:18,
 shapeEase:.24,
 targetPadding:10,
 targetRadius:12,
 targetPull:.12,
 targetMaxPull:5,
 cursorLead:.12,
 cursorMaxLead:8,
 imageDiameter:76,
 minViewport:800
};

export const lerp=(from,to,ease)=>from+(to-from)*ease;
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function springStep(value,velocity,target,delta,stiffness=CURSOR_CONFIG.followStiffness,damping=CURSOR_CONFIG.followDamping){
 const nextVelocity=(velocity+(target-value)*stiffness*delta)*Math.exp(-damping*delta);
 return {value:value+nextVelocity*delta,velocity:nextVelocity};
}
export function cursorStretch(diffX,diffY,divisor=CURSOR_CONFIG.velocityDivisor,max=CURSOR_CONFIG.maxStretch){
 return Math.min(Math.hypot(diffX,diffY)/divisor,max);
}
export function cursorAngle(diffX,diffY){
 return Math.atan2(diffY,diffX)*180/Math.PI;
}
// An ellipse repeats every 180 degrees: follow the shortest equivalent turn.
export function turnEllipse(current,target,ease){
 const difference=((target-current+90)%180+180)%180-90;
 return current+difference*ease;
}
export function magneticPull(pointer,rect,amount=CURSOR_CONFIG.targetPull,max=CURSOR_CONFIG.targetMaxPull){
 return {
  x:clamp((pointer.x-(rect.left+rect.width/2))*amount,-Math.min(max,rect.width*.04),Math.min(max,rect.width*.04)),
  y:clamp((pointer.y-(rect.top+rect.height/2))*amount,-Math.min(max,rect.height*.1),Math.min(max,rect.height*.1))
 };
}
export function targetShape(kind,rect,config=CURSOR_CONFIG){
 // Target feedback belongs to its real hit area. Never enlarge the inversion surface.
 return {mode:['button','link','image'].includes(kind)?'target':'follow',width:config.diameter,height:config.diameter,radius:config.diameter/2};
}

const interactiveSelector='a[href],button,[role="button"],[data-cursor="link"],[data-cursor="button"],[data-cursor="image"]';
const nativeSelector='input,textarea,select,option,video,iframe,[contenteditable="true"],[data-no-custom-cursor="true"]';

function markCursorContent(root=document){
 for(const element of root.querySelectorAll('h1,h2,h3,h4,p,.wordmark,.eyebrow,.section-label,.cover-masthead,.article-meta,.caption,.interest-list,.topic-list')){
  if(!element.closest(interactiveSelector))element.dataset.cursor='text';
 }
 for(const element of root.querySelectorAll('a[href],button:not(.photo)')){
  if(element.closest('dialog'))continue;
  element.classList.add('cursor-interactive');
  element.dataset.cursor=element.matches('[data-contact],[data-video],.contact-link,.motion-toggle,.subtle-button')?'button':'link';
 }
 for(const element of root.querySelectorAll('.photo')){
  element.classList.add('cursor-interactive');
  element.dataset.cursor='image';
 }
 for(const element of root.querySelectorAll('dialog,input,textarea,select,video,iframe,[contenteditable="true"]'))element.dataset.noCustomCursor='true';
}

function makeCursor(){
 const cursor=document.createElement('div');
 cursor.className='elastic-cursor';
 cursor.setAttribute('aria-hidden','true');
 cursor.innerHTML='<span class="elastic-cursor-ring"></span><span class="elastic-cursor-dot"></span>';
 document.body.append(cursor);
 return {cursor,ring:cursor.firstElementChild,dot:cursor.lastElementChild};
}

export function setupElasticCursor(motionEnabled){
 markCursorContent();
 const fine=matchMedia(`(hover:hover) and (pointer:fine) and (min-width:${CURSOR_CONFIG.minViewport}px)`);
 const {cursor,ring,dot}=makeCursor();
 const pointer={x:0,y:0};
 const ringState={x:0,y:0,vx:0,vy:0,width:CURSOR_CONFIG.diameter,height:CURSOR_CONFIG.diameter,radius:CURSOR_CONFIG.diameter/2,rotation:0,scaleX:1,scaleY:1};
 const pulls=new Map();
 let frame=0,lastFrame=0,moved=false,inside=false,allowed=Boolean(motionEnabled()),target=null,targetKind='text',targetRect=null,pullNode=null;

 const available=()=>allowed&&fine.matches&&!document.body.classList.contains('modal-open')&&!document.body.classList.contains('intro-playing');
 const setVisible=visible=>{
  inside=visible;
  cursor.classList.toggle('is-visible',visible&&available());
  document.documentElement.classList.toggle('custom-cursor-enabled',available());
 };
 const resetPull=()=>{
  if(pullNode){const state=pulls.get(pullNode);if(state){state.tx=0;state.ty=0;}pullNode=null;}
  if(target)target.removeAttribute('data-cursor-active');
 };
 const stopPulls=()=>{for(const node of pulls.keys())node.style.removeProperty('transform');pulls.clear();};
 const stepPulls=delta=>{
  let unsettled=false;
  for(const [node,s] of pulls){
   if(!node.isConnected){pulls.delete(node);continue;}
   const x=springStep(s.x,s.vx,s.tx,delta,CURSOR_CONFIG.pullStiffness,CURSOR_CONFIG.pullDamping);
   const y=springStep(s.y,s.vy,s.ty,delta,CURSOR_CONFIG.pullStiffness,CURSOR_CONFIG.pullDamping);
   Object.assign(s,{x:clamp(x.value,-s.maxX,s.maxX),y:clamp(y.value,-s.maxY,s.maxY),vx:x.velocity,vy:y.velocity});
   node.style.transform=`translate3d(${s.x.toFixed(3)}px,${s.y.toFixed(3)}px,0)`;
   const moving=Math.hypot(s.tx-s.x,s.ty-s.y)>.01||Math.hypot(s.vx,s.vy)>.025;
   unsettled||=moving;
   if(!moving&&node!==pullNode){node.style.removeProperty('transform');pulls.delete(node);}
  }
  return unsettled;
 };
 const clearTarget=()=>{resetPull();target=null;targetRect=null;targetKind='text';cursor.dataset.state='text';cursor.dataset.mode='follow';};
 const resolveTarget=node=>{
  const element=node instanceof Element?node:null;
  const native=element?.closest(nativeSelector);
  if(native||document.body.classList.contains('modal-open')){clearTarget();cursor.classList.add('is-native');document.documentElement.classList.add('custom-cursor-native');return;}
  cursor.classList.remove('is-native');document.documentElement.classList.remove('custom-cursor-native');
  const next=element?.closest(interactiveSelector)||null;
  if(next===target)return;
  clearTarget();
  if(!next)return;
  target=next;
  targetKind=next.dataset.cursor||(next.matches('.photo')?'image':next.tagName==='BUTTON'?'button':'link');
  targetRect=next.getBoundingClientRect();
  next.setAttribute('data-cursor-active','');
  pullNode=next.querySelector('.magnetic-inner');
  if(pullNode&&!pulls.has(pullNode))pulls.set(pullNode,{x:0,y:0,vx:0,vy:0,tx:0,ty:0,maxX:Math.min(5,targetRect.width*.04),maxY:Math.min(5,targetRect.height*.1)});
  cursor.dataset.state=targetKind;
 };
 const updateRect=()=>{
  if(!target)return null;
  const rect=target.getBoundingClientRect();
  targetRect={left:rect.left,top:rect.top,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom};
  return targetRect;
 };
 const transformRing=()=>{
  ring.style.width=`${ringState.width.toFixed(2)}px`;
  ring.style.height=`${ringState.height.toFixed(2)}px`;
  ring.style.borderRadius=`${ringState.radius.toFixed(2)}px`;
  ring.style.transform=`translate3d(${ringState.x.toFixed(2)}px,${ringState.y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${ringState.rotation.toFixed(2)}deg) scale(${ringState.scaleX.toFixed(3)},${ringState.scaleY.toFixed(3)})`;
 };
 const draw=now=>{
  frame=0;
  const enabled=available()&&inside&&moved&&!cursor.classList.contains('is-native');
  cursor.classList.toggle('is-visible',enabled);
  const delta=lastFrame?Math.min((now-lastFrame)/1000,.034):1/60;
  lastFrame=now;
  if(!enabled){
   if(available()&&stepPulls(delta))frame=requestAnimationFrame(draw);
   else{stopPulls();lastFrame=0;}
   return;
  }
  let desiredX=pointer.x,desiredY=pointer.y,desiredWidth=CURSOR_CONFIG.diameter,desiredHeight=CURSOR_CONFIG.diameter,desiredRadius=CURSOR_CONFIG.diameter/2;
  let desiredRotation=0,desiredScaleX=1,desiredScaleY=1;
  const rect=target?updateRect():null;
  const shape=rect?targetShape(targetKind,rect):targetShape('text',{width:0,height:0});
  cursor.dataset.mode=shape.mode;
  if(rect&&shape.mode==='target'){
   if(pullNode){const pull=magneticPull(pointer,rect),state=pulls.get(pullNode);if(state){state.tx=pull.x;state.ty=pull.y;}}
  }else{
   const diffX=pointer.x-ringState.x,diffY=pointer.y-ringState.y;
   const stretch=cursorStretch(diffX,diffY);
   desiredScaleX=1+stretch;desiredScaleY=1-stretch*.42;
   desiredRotation=stretch>.012?cursorAngle(diffX,diffY):0;
  }
  const springX=springStep(ringState.x,ringState.vx,desiredX,delta,rect?185:CURSOR_CONFIG.followStiffness,rect?22:CURSOR_CONFIG.followDamping);
  const springY=springStep(ringState.y,ringState.vy,desiredY,delta,rect?185:CURSOR_CONFIG.followStiffness,rect?22:CURSOR_CONFIG.followDamping);
  ringState.x=springX.value;ringState.vx=springX.velocity;
  ringState.y=springY.value;ringState.vy=springY.velocity;
  ringState.width=lerp(ringState.width,desiredWidth,CURSOR_CONFIG.shapeEase);
  ringState.height=lerp(ringState.height,desiredHeight,CURSOR_CONFIG.shapeEase);
  ringState.radius=lerp(ringState.radius,desiredRadius,CURSOR_CONFIG.shapeEase);
  const shapeEase=1-Math.pow(1-CURSOR_CONFIG.shapeEase,delta*60);
  ringState.scaleX=lerp(ringState.scaleX,desiredScaleX,shapeEase);
  ringState.scaleY=lerp(ringState.scaleY,desiredScaleY,shapeEase);
  ringState.rotation=turnEllipse(ringState.rotation,desiredRotation,shapeEase);
  if(Math.abs(ringState.scaleX-1)<.002&&Math.abs(turnEllipse(0,ringState.rotation,1))<.02)ringState.rotation=0;
  transformRing();
  const pullMoving=stepPulls(delta);
  const unsettled=Math.hypot(desiredX-ringState.x,desiredY-ringState.y)>.08||Math.hypot(ringState.vx,ringState.vy)>.08||Math.abs(ringState.scaleX-desiredScaleX)>.002||Math.abs(turnEllipse(0,ringState.rotation,1))>.02||pullMoving;
  if(unsettled)frame=requestAnimationFrame(draw);
 };
 const render=()=>{if(!frame)frame=requestAnimationFrame(draw);};
 const move=event=>{
  if(event.pointerType&&event.pointerType!=='mouse')return;
  pointer.x=event.clientX;pointer.y=event.clientY;
  dot.style.transform=`translate3d(${pointer.x}px,${pointer.y}px,0) translate(-50%,-50%)`;
  if(!moved){moved=true;ringState.x=pointer.x;ringState.y=pointer.y;ringState.vx=0;ringState.vy=0;transformRing();}
  resolveTarget(event.target);setVisible(true);render();
 };
 const leave=()=>{inside=false;cursor.classList.remove('is-visible');clearTarget();render();};
 const refresh=()=>{if(!moved)return;const beneath=document.elementFromPoint(pointer.x,pointer.y);resolveTarget(beneath);render();};
 const configure=on=>{allowed=Boolean(on);if(!available()){leave();stopPulls();document.documentElement.classList.remove('custom-cursor-enabled','custom-cursor-native');}else{setVisible(inside);render();}};
 const onMotion=event=>configure(event.detail);
 const enter=()=>{if(moved)setVisible(true);};
 const visibility=()=>{if(document.hidden)leave();};
 const mediaChange=()=>configure(motionEnabled());
 const bodyObserver=new MutationObserver(()=>{
  if(available()){setVisible(inside);refresh();}
  else{clearTarget();stopPulls();cursor.classList.remove('is-visible');document.documentElement.classList.remove('custom-cursor-enabled');}
 });
 window.addEventListener('pointermove',move,{passive:true});
 document.documentElement.addEventListener('pointerleave',leave);
 document.documentElement.addEventListener('pointerenter',enter);
 window.addEventListener('blur',leave);
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('scroll',refresh,{passive:true});
 window.addEventListener('resize',refresh,{passive:true});
 fine.addEventListener('change',mediaChange);
 document.addEventListener('mas-motion',onMotion);
 bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
 configure(allowed);
 return()=>{
  cancelAnimationFrame(frame);resetPull();stopPulls();cursor.remove();
  window.removeEventListener('pointermove',move);
  document.documentElement.removeEventListener('pointerleave',leave);
  document.documentElement.removeEventListener('pointerenter',enter);
  window.removeEventListener('blur',leave);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('scroll',refresh);window.removeEventListener('resize',refresh);
  fine.removeEventListener('change',mediaChange);bodyObserver.disconnect();
  document.removeEventListener('mas-motion',onMotion);
  document.documentElement.classList.remove('custom-cursor-enabled','custom-cursor-native');
 };
}
