(()=>{
 const RESUME_KEY='sabine_core2_topic_resume_v1';
 let tries=0;
 function install(){
  if(window.__core2TopicResumeInstalled)return;
  if(typeof startTopic!=='function'||typeof topicIds!=='function'||typeof next!=='function'||typeof prev!=='function'||typeof home!=='function'||typeof pick!=='function'||typeof check!=='function'||typeof resetTopic!=='function'||typeof resetProgress!=='function'||typeof state==='undefined'||typeof TOPICS==='undefined'){
   if(++tries<200)return setTimeout(install,50);
   console.error('Core-2-Themenfortsetzung konnte nicht initialisiert werden.');
   return;
  }
  window.__core2TopicResumeInstalled=true;

  function loadSessions(){try{return JSON.parse(localStorage.getItem(RESUME_KEY)||'{}')}catch(e){return {}}}
  function saveSessions(o){localStorage.setItem(RESUME_KEY,JSON.stringify(o||{}))}
  function key(topic,mode){return encodeURIComponent(topic)+'|'+String(mode||'original')}
  function getSession(topic,mode){return loadSessions()[key(topic,mode)]||null}
  function clearSession(topic,mode){let all=loadSessions();delete all[key(topic,mode)];saveSessions(all)}
  function clearTopicSessions(topic){let all=loadSessions(),prefix=encodeURIComponent(topic)+'|';for(const k of Object.keys(all))if(k.startsWith(prefix))delete all[k];saveSessions(all)}
  function isTopicRun(){return !!(state&&!state.exam&&state.topic&&Object.prototype.hasOwnProperty.call(TOPICS,state.topic)&&Array.isArray(state.order)&&state.order.length)}
  function saveCurrent(){
   if(!isTopicRun())return;
   let all=loadSessions();
   all[key(state.topic,state.mode)]={i:state.i,variantSeed:Number(state.variantSeed)||0,selected:[...(state.selected||[])],checked:!!state.checked};
   saveSessions(all)
  }
  function restoreInteraction(old){
   if(!old||!Array.isArray(old.selected)||!old.selected.length||!state.current||state.current.type!=='mc')return;
   state.selected=[];
   document.querySelectorAll('.option.selected').forEach(el=>el.classList.remove('selected'));
   for(const l of old.selected){let el=document.querySelector('.option[data-l="'+l+'"]');if(el){el.classList.add('selected');state.selected.push(l)}}
   if(old.checked&&state.selected.length){state.checked=false;check()}
  }

  const baseStartTopic=startTopic;
  startTopic=function(encoded,mode){
   let name=decodeURIComponent(encoded),ids=topicIds(name),old=getSession(name,mode);
   baseStartTopic(encoded,mode);
   if(old&&Number.isInteger(old.i)&&old.i>=0&&old.i<ids.length){
    state.i=old.i;
    if(Number.isInteger(old.variantSeed))state.variantSeed=old.variantSeed;
    render();
    restoreInteraction(old)
   }else if(old){
    clearSession(name,mode)
   }
   saveCurrent()
  };

  const basePick=pick;
  pick=function(el,multi){basePick(el,multi);saveCurrent()};

  const baseCheck=check;
  check=function(){baseCheck();saveCurrent()};

  const basePrev=prev;
  prev=function(){basePrev();saveCurrent()};

  const baseNext=next;
  next=function(){
   let ending=isTopicRun()&&state.i>=state.order.length-1;
   if(ending){let topic=state.topic,mode=state.mode;clearSession(topic,mode);state.topic=null;baseNext();return}
   baseNext();saveCurrent()
  };

  const baseHome=home;
  home=function(){saveCurrent();baseHome()};

  const baseResetTopic=resetTopic;
  resetTopic=function(encoded){
   let accepted=false,oldConfirm=window.confirm;
   window.confirm=function(msg){let r=oldConfirm(msg);accepted=!!r;return r};
   try{baseResetTopic(encoded)}finally{window.confirm=oldConfirm}
   if(accepted)clearTopicSessions(decodeURIComponent(encoded))
  };

  const baseResetProgress=resetProgress;
  resetProgress=function(){
   let accepted=false,oldConfirm=window.confirm;
   window.confirm=function(msg){let r=oldConfirm(msg);accepted=!!r;return r};
   try{baseResetProgress()}finally{window.confirm=oldConfirm}
   if(accepted)localStorage.removeItem(RESUME_KEY)
  };
 }
 install();
})();
