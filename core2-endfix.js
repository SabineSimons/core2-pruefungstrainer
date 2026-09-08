(()=>{
 const ACTIVE_EXAM_KEY=KEY+'_active_exam';
 const TOPIC_PROGRESS_KEY=KEY+'_topic_progress_v2';

 function loadTopicProgress(){
  try{
   let raw=localStorage.getItem(TOPIC_PROGRESS_KEY);
   if(raw)return JSON.parse(raw);
  }catch(e){}
  let migrated={},globalProgress=loadProgress();
  for(const name of Object.keys(TOPICS)){
   migrated[name]={};
   for(const q of topicIds(name))if(globalProgress[q])migrated[name][q]=true;
  }
  localStorage.setItem(TOPIC_PROGRESS_KEY,JSON.stringify(migrated));
  return migrated
 }
 function saveTopicProgress(o){localStorage.setItem(TOPIC_PROGRESS_KEY,JSON.stringify(o||{}))}
 function markTopicProgress(qid){
  if(!state.topic)return;
  let p=loadTopicProgress();
  if(!p[state.topic])p[state.topic]={};
  p[state.topic][String(qid)]=true;
  saveTopicProgress(p)
 }

 topicProgress=function(name){
  let ids=topicIds(name),p=loadTopicProgress(),t=p[name]||{},done=ids.filter(q=>t[q]).length;
  return {done,total:ids.length,pct:ids.length?Math.round(done/ids.length*100):0}
 };
 resetTopic=function(encoded){
  let name=decodeURIComponent(encoded);
  if(!confirm('Fortschritt für „'+name+'“ wirklich zurücksetzen?'))return;
  let p=loadTopicProgress();p[name]={};saveTopicProgress(p);topicMenu()
 };

 const originalCheck=check;
 check=function(){
  let before=state.checked,qid=state.order[state.i];
  originalCheck();
  if(!before&&state.checked&&state.topic)markTopicProgress(qid)
 };
 const originalMarkPBQ=markPBQ;
 markPBQ=function(q){
  if(state.topic)markTopicProgress(q);
  originalMarkPBQ(q)
 };

 toggleMarked=function(qid){
  let a=getMarked(),q=String(qid),i=a.indexOf(q);
  if(i>=0)a.splice(i,1);else a.push(q);
  localStorage.setItem(MARK_KEY,JSON.stringify(a));
  let marked=a.includes(q);
  document.querySelectorAll('button').forEach(btn=>{
   let oc=btn.getAttribute('onclick')||'';
   if(oc.includes("toggleMarked('"+q+"')"))btn.textContent=marked?'★ Markiert':'☆ Markieren'
  })
 };

 function loadActiveExam(){
  try{
   let x=JSON.parse(localStorage.getItem(ACTIVE_EXAM_KEY)||'null');
   if(!x||!Array.isArray(x.order)||x.order.length!==90)return null;
   return x
  }catch(e){return null}
 }
 function saveActiveExam(){
  if(!state.exam)return;
  localStorage.setItem(ACTIVE_EXAM_KEY,JSON.stringify({
   mode:state.mode,order:[...state.order],i:state.i,variantSeed:state.variantSeed,
   correct:state.examCorrect||0,answered:state.examAnswered||0,
   wrong:state.examWrong||[],end:state.examEnd||0,timedOut:!!state.examTimedOut,
   selected:[...(state.selected||[])]
  }))
 }
 function clearActiveExam(){localStorage.removeItem(ACTIVE_EXAM_KEY)}

 const originalStartExam=startExam;
 startExam=function(mode){
  let old=loadActiveExam();
  if(old&&!confirm('Es gibt noch eine gespeicherte laufende Prüfung. Diese wirklich verwerfen und neu starten?'))return;
  clearActiveExam();originalStartExam(mode);saveActiveExam()
 };

 const originalPick=pick;
 pick=function(el,multi){originalPick(el,multi);if(state.exam)saveActiveExam()};

 const originalCheckExam=checkExam;
 checkExam=function(){
  originalCheckExam();
  if(state.exam)saveActiveExam();else clearActiveExam()
 };

 const originalExamResult=examResult;
 examResult=function(){originalExamResult();clearActiveExam()};

 window.resumeExam=function(){
  let old=loadActiveExam();
  if(!old)return alert('Keine laufende Prüfung gespeichert.');
  stopExamTimer();
  state.exam=true;state.examWrong=old.wrong||[];state.examCorrect=old.correct||0;
  state.examAnswered=old.answered||0;state.examTimedOut=!!old.timedOut;
  state.examEnd=old.end||0;state.override=null;state.topic=null;state.fullSession=false;
  state.variantSeed=Number.isInteger(old.variantSeed)?old.variantSeed:0;
  state.mode=old.mode||'mixed';state.order=old.order.map(String);
  state.i=Math.max(0,Math.min(89,old.i||0));
  if(Date.now()>=state.examEnd){state.examTimedOut=true;examResult();return}
  renderExam();
  state.selected=[];
  for(const l of (old.selected||[])){
   let el=document.querySelector('.option[data-l="'+l+'"]');
   if(el){el.classList.add('selected');state.selected.push(l)}
  }
  examTimer=setInterval(tickExam,1000);tickExam();saveActiveExam()
 };

 const originalHome=home;
 home=function(){
  originalHome();
  let old=loadActiveExam();
  if(!old)return;
  let card=app.querySelector('.card');
  if(!card)return;
  let box=document.createElement('div');
  box.style.cssText='border-top:1px solid #ddd;margin-top:18px;padding-top:16px';
  let expired=old.end&&Date.now()>=old.end;
  box.innerHTML=`<h3>⏱️ Laufende Prüfung</h3><p class="small">${expired?'Die gespeicherte Prüfung ist inzwischen abgelaufen.':'Gespeichert bei Frage '+(Number(old.i)+1)+' von 90.'}</p><div class="modes"><button class="primary" onclick="resumeExam()">${expired?'Auswertung öffnen':'▶ Prüfung fortsetzen'}</button></div>`;
  card.appendChild(box)
 };

 resetProgress=function(){
  if(!confirm('Gesamten Testtrainer-Fortschritt wirklich zurücksetzen?'))return;
  stopExamTimer();state.progress={};state.i=0;state.override=null;state.topic=null;state.examWrong=[];
  state.exam=false;state.fullSession=false;state.variantSeed=0;
  localStorage.removeItem(KEY);localStorage.removeItem(KEY+'_session');localStorage.removeItem(EXAM_KEY);
  localStorage.removeItem(MARK_KEY);localStorage.removeItem(ACTIVE_EXAM_KEY);localStorage.removeItem(TOPIC_PROGRESS_KEY);
  home()
 };

 home();
})();
