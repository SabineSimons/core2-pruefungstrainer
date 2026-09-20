(()=>{
 const ERROR_KEY='sabine_core2_topic_errors_v1';
 let tries=0;

 function install(){
  if(window.__core2TopicErrorsInstalled)return;
  if(!window.__core2TopicResumeInstalled || typeof check!=='function' || typeof render!=='function' || typeof home!=='function' || typeof topicMenu!=='function' || typeof resetTopic!=='function' || typeof resetProgress!=='function' || typeof topicIds!=='function' || typeof state==='undefined' || typeof ORIGINAL==='undefined'){
   if(++tries<240)return setTimeout(install,50);
   console.error('Core-2-Fehlerfragen konnten nicht initialisiert werden.');
   return;
  }
  window.__core2TopicErrorsInstalled=true;

  function getErrors(){
   try{return [...new Set(JSON.parse(localStorage.getItem(ERROR_KEY)||'[]').map(String))].filter(q=>ORIGINAL[q])}
   catch(e){return []}
  }
  function saveErrors(ids){localStorage.setItem(ERROR_KEY,JSON.stringify([...new Set((ids||[]).map(String))].filter(q=>ORIGINAL[q])))}
  function setError(qid,isWrong){
   qid=String(qid);let ids=getErrors(),i=ids.indexOf(qid);
   if(isWrong&&i<0)ids.push(qid);
   if(!isWrong&&i>=0)ids.splice(i,1);
   saveErrors(ids)
  }
  function clearErrorsForTopic(name){
   let topicSet=new Set(topicIds(name).map(String));
   saveErrors(getErrors().filter(q=>!topicSet.has(q)))
  }
  window.getTopicErrors=getErrors;

  window.startTopicErrors=function(mode){
   let ids=getErrors();
   if(!ids.length)return alert('Aktuell sind keine falsch beantworteten Fragen gespeichert.');
   stopExamTimer();state.exam=false;state.examWrong=[];state.override=null;state.topic=null;state.fullSession=false;
   state.variantSeed=newVariantSeed();state.mode=mode;state.order=ids;state.i=0;render()
  };

  function addErrorBox(){
   let card=app&&app.querySelector?app.querySelector('.card'):null;
   if(!card||card.querySelector('[data-topic-errors]'))return;
   let ids=getErrors(),box=document.createElement('div');
   box.setAttribute('data-topic-errors','1');
   box.style.cssText='border-top:1px solid #ddd;padding-top:16px;margin-top:16px';
   box.innerHTML=`<h3>❌ Fehlerfragen</h3><p class="small">Aktuell gespeichert: ${ids.length}</p><div class="modes"><button class="secondary" onclick="startTopicErrors('original')">Original</button><button class="secondary" onclick="startTopicErrors('reform')">Umformuliert</button><button class="secondary" onclick="startTopicErrors('mixed')">Gemischt</button></div>`;
   let target=[...card.querySelectorAll('.actions')].find(x=>x.textContent.includes('Zum Gesamttrainer'));
   if(target)card.insertBefore(box,target);else card.appendChild(box)
  }

  const baseCheck=check;
  check=function(){
   let before=!!state.checked,qid=state.order&&state.order[state.i],q=state.current,selected=[...(state.selected||[])],wasExam=!!state.exam;
   baseCheck();
   if(!wasExam&&!before&&state.checked&&qid&&q&&q.type==='mc'){
    let ok=[...selected].sort().join()===[...(q.answer||[])].sort().join();
    setError(qid,!ok)
   }
  };

  const baseHome=home;
  home=function(){baseHome();addErrorBox()};
  const baseTopicMenu=topicMenu;
  topicMenu=function(){baseTopicMenu();addErrorBox()};

  const baseResetTopic=resetTopic;
  resetTopic=function(encoded){
   let accepted=false,oldConfirm=window.confirm;
   window.confirm=function(msg){let r=oldConfirm(msg);accepted=!!r;return r};
   try{baseResetTopic(encoded)}finally{window.confirm=oldConfirm}
   if(accepted)clearErrorsForTopic(decodeURIComponent(encoded))
  };

  const baseResetProgress=resetProgress;
  resetProgress=function(){
   let accepted=false,oldConfirm=window.confirm;
   window.confirm=function(msg){let r=oldConfirm(msg);accepted=!!r;return r};
   try{baseResetProgress()}finally{window.confirm=oldConfirm}
   if(accepted)localStorage.removeItem(ERROR_KEY)
  };

  home()
 }
 install()
})();
