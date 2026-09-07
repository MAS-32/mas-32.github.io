// A small dialog stack keeps the page and record scroll positions independent.
export function setupDialogs(motionEnabled){
 const stack=[],timers=new Map();
 const controller=new AbortController(),options={signal:controller.signal};
 const dialogs=[...document.querySelectorAll('dialog')];
 let pagePosition=null,pageStyle=null;
 function unlockPage(){
  document.body.classList.remove('modal-open');
  if(pageStyle)Object.assign(document.body.style,pageStyle);
  if(pagePosition)window.scrollTo({left:pagePosition.x,top:pagePosition.y,behavior:'instant'});
  pagePosition=null;pageStyle=null;
 }
 function open(dialog,trigger,{nested=false}={}){
  if(stack.at(-1)?.dialog===dialog)return;
  if(stack.length&&!nested){
   const previous=stack.pop();clearTimeout(timers.get(previous.dialog));timers.delete(previous.dialog);
   previous.dialog.close();previous.dialog.classList.remove('is-closing');trigger=previous.trigger;
  }
  if(!pagePosition){
   pagePosition={x:scrollX,y:scrollY};
   pageStyle=Object.fromEntries(['position','top','left','width'].map(key=>[key,document.body.style[key]]));
   Object.assign(document.body.style,{position:'fixed',top:`${-pagePosition.y}px`,left:`${-pagePosition.x}px`,width:'100%'});
   document.body.classList.add('modal-open');
  }
  stack.push({dialog,trigger,parentScroll:stack.at(-1)?.dialog.scrollTop});
  dialog.showModal();dialog.scrollTop=0;dialog.querySelector('[data-close]').focus({preventScroll:true});
 }
 function close(dialog){
  if(stack.at(-1)?.dialog!==dialog||timers.has(dialog))return;
  dialog.classList.add('is-closing');
  timers.set(dialog,setTimeout(()=>{
   timers.delete(dialog);const entry=stack.pop();dialog.close();dialog.classList.remove('is-closing');
   if(stack.length)stack.at(-1).dialog.scrollTop=entry.parentScroll;
   else unlockPage();
   if(entry.trigger?.isConnected)entry.trigger.focus({preventScroll:true});
  },motionEnabled()?180:0));
 }
 for(const dialog of dialogs){
  dialog.addEventListener('cancel',event=>{event.preventDefault();close(dialog);},options);
  let backdropDown=false;
  const outside=event=>{const r=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom);};
  dialog.addEventListener('pointerdown',event=>{backdropDown=outside(event);},options);
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-close]')||backdropDown&&outside(event))close(dialog);backdropDown=false;},options);
  dialog.addEventListener('keydown',event=>{
   if(event.key!=='Tab')return;
   const items=[...dialog.querySelectorAll('button,a[href],input')].filter(x=>!x.disabled&&x.getClientRects().length);
   const first=items[0],last=items.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  },options);
 }
 const records=JSON.parse(document.querySelector('#experience-data').textContent);
 const gallery=document.querySelector('#evidence-gallery'),zoom=document.querySelector('#image-dialog'),zoomContent=document.querySelector('#zoom-content');
 function imageView(item){
  const frame=document.createElement('span'),image=document.createElement('img');frame.className='record-image';
  image.alt=item.alt;image.decoding='async';
  if(item.width&&item.height){image.width=item.width;image.height=item.height;}
  image.addEventListener('load',()=>{
   if(item.rotation===-90){
    frame.classList.add('is-rotated');frame.style.aspectRatio=`${image.naturalHeight}/${image.naturalWidth}`;
    image.style.width=`${image.naturalWidth/image.naturalHeight*100}%`;
   }
  },{once:true});
  image.src=item.src;frame.append(image);return frame;
 }
 function showImage(media,trigger){
  zoomContent.classList.remove('is-enlarged');zoomContent.replaceChildren(imageView(media));
  document.querySelector('#zoom-title').textContent=media.alt;
  document.querySelector('[data-image-original]').href=media.src;
  const toggle=document.querySelector('[data-zoom-toggle]');
  toggle.setAttribute('aria-pressed','false');toggle.textContent='放大细看';
  open(zoom,trigger,{nested:stack.length>0});
  zoom.querySelector('.zoom-scroll').scrollTo(0,0);
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('button,a');if(!trigger)return;
  if(trigger.matches('[data-contact],[data-video]'))open(document.querySelector(trigger.hasAttribute('data-video')?'#video-dialog':'#contact-dialog'),trigger);
  if(trigger.hasAttribute('data-image-src')){
   const image=trigger.querySelector('img');
   showImage({src:trigger.dataset.imageSrc,alt:trigger.dataset.imageAlt,width:image?.width,height:image?.height},trigger);
  }
  if(trigger.hasAttribute('data-evidence')){
   const item=records.find(record=>record.id===trigger.dataset.evidence);if(!item)return;
   document.querySelector('#evidence-title').textContent=item.title;
   document.querySelector('#evidence-caption').textContent=item.caption;
   gallery.replaceChildren(...item.images.map((media,index)=>{
    const figure=document.createElement('figure'),button=document.createElement('button'),caption=document.createElement('figcaption');
    button.className='record-zoom';button.type='button';button.setAttribute('aria-label',`放大：${media.alt}`);button.setAttribute('aria-haspopup','dialog');
    button.append(imageView(media));caption.textContent=`${index+1} / ${item.images.length} · ${media.alt}`;
    if(media.caption){const note=document.createElement("span");note.className="record-note";note.textContent=media.caption;caption.append(note);}
    button.addEventListener('click',()=>showImage(media,button));
    figure.append(button,caption);return figure;
   }));
   open(document.querySelector('#evidence-dialog'),trigger);
  }
  if(trigger.hasAttribute('data-zoom-toggle')){
   const enlarged=zoomContent.classList.toggle('is-enlarged');trigger.setAttribute('aria-pressed',String(enlarged));trigger.textContent=enlarged?'恢复全图':'放大细看';
  }
 },options);
 return()=>{controller.abort();for(const timer of timers.values())clearTimeout(timer);for(const {dialog} of stack)dialog.close();unlockPage();};
}
