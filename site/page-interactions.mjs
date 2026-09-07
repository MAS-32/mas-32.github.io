// Clipboard success, application launch and account navigation are separate outcomes.
export async function copyWechat({clipboard,id}){
 if(!clipboard?.writeText)throw new Error('Clipboard unavailable');
 await clipboard.writeText(id);
 return true;
}
export function setupContact(){
 const copy=document.querySelector('[data-copy]'),open=document.querySelector('[data-open-wechat]');
 const input=document.querySelector('#wechat-id'),feedback=document.querySelector('.copy-feedback');
 const controller=new AbortController(),options={signal:controller.signal};
 const inWechat=/MicroMessenger/i.test(navigator.userAgent);
 const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 const onOpen=event=>{
  if(inWechat){event.preventDefault();feedback.textContent='请返回微信，搜索上方微信号添加；也可识别二维码。';return;}
  feedback.textContent='已尝试打开微信，网页无法确认是否成功。请在微信中搜索上方微信号；未打开时请手动打开应用。';
 };
 open.addEventListener('click',onOpen,options);
 copy.addEventListener('click',async()=>{
  copy.disabled=true;
  try{
   await copyWechat({clipboard:navigator.clipboard,id:input.value});
   if(controller.signal.aborted)return;
   feedback.textContent=inWechat?'微信号已复制。请返回微信，搜索粘贴添加。':'微信号已复制。可以点击“尝试打开微信”，再搜索粘贴添加。';
   if(mobile&&!inWechat){open.click();feedback.textContent='微信号已复制，已尝试打开微信。网页无法确认唤起结果；请在微信中搜索粘贴添加。';}
  }catch{
   if(controller.signal.aborted)return;
   input.focus();input.select();input.setSelectionRange(0,input.value.length);
   feedback.textContent='自动复制未成功，微信号已选中，请长按或按 Ctrl/Cmd+C 复制。';
  }finally{copy.disabled=false;}
 },options);
 const channelCopy=document.querySelector('[data-copy-channel]');
 channelCopy.addEventListener('click',async()=>{
  const name=document.querySelector('#channel-name'),status=document.querySelector('.channel-feedback');
  channelCopy.disabled=true;
  try{
   await copyWechat({clipboard:navigator.clipboard,id:name.value});
   if(!controller.signal.aborted)status.textContent='名称已复制。请在微信的视频号中搜索“MAS的成长日记”。';
  }catch{
   if(!controller.signal.aborted){name.focus();name.select();name.setSelectionRange(0,name.value.length);status.textContent='自动复制未成功，请长按选中的名称或按 Ctrl/Cmd+C 手动复制。';}
  }finally{channelCopy.disabled=false;}
 },options);
 return()=>controller.abort();
}

export function setupNavigation(){
 const header=document.querySelector('.site-header'),links=[...header.querySelectorAll('nav a')];
 const sections=links.map(a=>document.querySelector(a.getAttribute('href')));
 let frame=0;
 const update=()=>{
  frame=0;const line=header.getBoundingClientRect().height+36;
  let current=-1;
  sections.forEach((section,index)=>{if(section.getBoundingClientRect().top<=line)current=index;});
  links.forEach((link,index)=>{if(index===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const resize=()=>{document.documentElement.style.setProperty('--nav-offset',`${header.getBoundingClientRect().height+24}px`);schedule();};
 const observer=new ResizeObserver(resize);observer.observe(header);
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize,{passive:true});resize();
 return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);};
}
