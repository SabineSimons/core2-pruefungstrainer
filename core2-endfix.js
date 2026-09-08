(()=>{
 const ACTIVE_EXAM_KEY=KEY+'_active_exam';
 const TOPIC_PROGRESS_KEY=KEY+'_topic_progress_v2';
 const PBQ_STATE_KEY=KEY+'_pbq_state_v2';
 const EXPLANATIONS=window.CORE2_EXPLANATIONS||{};

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

 function correctAnswerText(q){
  return (q.answer||[]).map(l=>{
   let i=l.charCodeAt(0)-65,txt=(q.options||[])[i]??'';
   return l+'. '+txt
  }).join(' | ')
 }
 const originalCheck=check;
 check=function(){
  let before=state.checked,qid=String(state.order[state.i]),q=state.current;
  originalCheck();
  if(!before&&state.checked){
   if(state.topic)markTopicProgress(qid);
   let fb=document.getElementById('fb');
   if(fb){
    let ok=[...(state.selected||[])].sort().join()===[...(q.answer||[])].sort().join();
    let explanation=EXPLANATIONS[qid]||'';
    fb.innerHTML=`<div style="margin-top:14px;padding:13px;border-radius:10px;${ok?'background:#e3f6e9;border:1px solid #9ed3aa':'background:#ffe8e6;border:1px solid #efaaa3'}"><b>${ok?'✅ Richtig':'❌ Falsch'}</b><br><b>Richtige Antwort:</b> ${esc(correctAnswerText(q))}${explanation?`<br><span>${esc(explanation)}</span>`:''}</div>`
   }
  }
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

 function loadPBQState(){
  try{return JSON.parse(localStorage.getItem(PBQ_STATE_KEY)||'{}')}catch(e){return {}}
 }
 function savePBQValue(qid,key,val){
  let all=loadPBQState(),q=String(qid);all[q]=all[q]||{};all[q][key]=val;
  localStorage.setItem(PBQ_STATE_KEY,JSON.stringify(all))
 }
 window.pbqSetValue=savePBQValue;
 function pbqSelect(qid,key,opts,val){
  return `<select style="width:100%;padding:10px;border:1px solid #bcc8d9;border-radius:9px;background:#fff" onchange="pbqSetValue('${qid}','${key}',this.value)"><option value="">— auswählen —</option>${opts.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('')}</select>`
 }
 function pbqField(label,select){return `<div style="border:1px solid #ddd;border-radius:10px;padding:11px;background:#fff"><b>${esc(label)}</b><div style="margin-top:7px">${select}</div></div>`}
 function pbqForm(qid,v){
  if(qid==='1'){
   let ips=['169.254.17.1','224.0.0.1','50.90.234.1','127.1.0.1','192.168.10.1','10.100.0.1'];
   return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
    ${pbqField('WLAN-AP · LAN-IP',pbqSelect(qid,'apip',ips,v.apip))}
    ${pbqField('WLAN-Verschlüsselung',pbqSelect(qid,'enc',['TLS 1.2','WPA2 PSK','L2TP/IPsec','WPA2 Enterprise'],v.enc))}
    ${pbqField('Router · Portweiterleitung',pbqSelect(qid,'port',['Allow TCP Any 3347','Allow TCP Any 3306','Allow TCP Any 25','Allow TCP Any 23','Allow TCP Any 3389'],v.port))}
    ${pbqField('Firewall · LAN-IP zum geschützten Subnetz',pbqSelect(qid,'fwip',ips,v.fwip))}
    ${pbqField('Windows-PC platzieren',pbqSelect(qid,'pc',['Drahtloses AP-LAN','Hinter dem Router','Durch Firewall geschütztes Subnetz'],v.pc))}
    ${pbqField('Spielkonsole platzieren',pbqSelect(qid,'console',['Drahtloses AP-LAN','Hinter dem Router','Durch Firewall geschütztes Subnetz'],v.console))}
   </div>`
  }
  if(qid==='19'){
   let replies=[
    'Ich helfe Ihnen heute gerne weiter.',
    'Ist dies der erste Router in Ihrem Büro?',
    'Als Erstes müssen Sie das Standardpasswort ändern.',
    'Legen Sie ein neues Passwort fest, das einen Großbuchstaben, einen Kleinbuchstaben und ein Sonderzeichen enthält.',
    'Ja, bitte einen Neustart durchführen.'
   ];
   return `<div class="hint">Ordne die fünf in der Quelle bestätigten Helpdesk-Antworten der richtigen Chat-Reihenfolge zu.</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">${[0,1,2,3,4].map(i=>pbqField('Chat-Schritt '+(i+1),pbqSelect(qid,'s'+i,replies,v['s'+i]))).join('')}</div>`
  }
  if(qid==='72'){
   let mails=['Konto gesperrt','Teilen Sie Ihr Feedback mit','Mitarbeitereinführung','Sicherheitsupdate','Vorstellungsgespräch'];
   return `<div>${mails.map((m,i)=>`<div style="border:1px solid #ddd;border-radius:10px;padding:11px;margin:9px 0"><b>Posteingang ${i+1}: ${esc(m)}</b><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:8px">${pbqField('Klassifizierung',pbqSelect(qid,'c'+i,['Phishing','Spam','Legitim'],v['c'+i]))}${pbqField('Maßnahme',pbqSelect(qid,'a'+i,['An Informationssicherheit melden','Keine weiteren Maßnahmen','Abbestellen','Anhang öffnen'],v['a'+i]))}</div></div>`).join('')}</div>`
  }
  if(qid==='282'){
   let copy='copy "C:\\Program Files\\Testing\\msvcp100.dll" "\\\\User-PC02\\C$\\Windows\\System32" /h /v';
   let cmds=[
    'shutdown -s -f -t 0',
    'tasklist | sort',
    'Get-WmiObject win32_computersystem',
    copy,
    'Get-EventLog -LogName System -Newest 8',
    'reg /s "msvcp100.reg"',
    'ls msvc*',
    'setx path "C:\\Windows\\System32"',
    'regsvr32 msvcp100.dll',
    'Get-WmiObject win32_logicaldisk',
    'robocopy "\\\\User-PC02\\C$\\Windows\\System32" "C:\\Program Files (x86)\\Testing" "msvcp100.dll"',
    'gpupdate /force'
   ];
   return `<div style="padding:11px;background:#111;color:#eee;border-radius:9px;font-family:monospace;margin-bottom:10px">System Error: MSVCP100.dll was not found. The application cannot start.</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">${pbqField('1st CLI Resolution',pbqSelect(qid,'c1',cmds,v.c1))}${pbqField('2nd CLI Resolution',pbqSelect(qid,'c2',cmds,v.c2))}</div>`
  }
  return ''
 }
 function gradePBQInteractive(qid,v){
  if(qid==='1')return v.apip==='192.168.10.1'&&v.enc==='WPA2 PSK'&&v.port==='Allow TCP Any 3389'&&v.fwip==='10.100.0.1'&&v.pc==='Hinter dem Router'&&v.console==='Drahtloses AP-LAN';
  if(qid==='19'){
   let k=['Ich helfe Ihnen heute gerne weiter.','Ist dies der erste Router in Ihrem Büro?','Als Erstes müssen Sie das Standardpasswort ändern.','Legen Sie ein neues Passwort fest, das einen Großbuchstaben, einen Kleinbuchstaben und ein Sonderzeichen enthält.','Ja, bitte einen Neustart durchführen.'];
   return k.every((x,i)=>v['s'+i]===x)
  }
  if(qid==='72'){
   let c=['Phishing','Legitim','Legitim','Spam','Legitim'],a=['An Informationssicherheit melden','Keine weiteren Maßnahmen','Keine weiteren Maßnahmen','An Informationssicherheit melden','Keine weiteren Maßnahmen'];
   return c.every((x,i)=>v['c'+i]===x&&v['a'+i]===a[i])
  }
  if(qid==='282'){
   let copy='copy "C:\\Program Files\\Testing\\msvcp100.dll" "\\\\User-PC02\\C$\\Windows\\System32" /h /v';
   return v.c1===copy&&v.c2==='regsvr32 msvcp100.dll'
  }
  return false
 }
 window.checkPBQInteractive=function(qid){
  qid=String(qid);let v=(loadPBQState()[qid]||{}),ok=gradePBQInteractive(qid,v),q=state.current;
  state.progress[qid]=true;save();if(state.topic)markTopicProgress(qid);
  let fb=document.getElementById('pbqfb');
  if(fb)fb.innerHTML=`<div style="margin-top:14px;padding:13px;border-radius:10px;${ok?'background:#e3f6e9;border:1px solid #9ed3aa':'background:#ffe8e6;border:1px solid #efaaa3'}"><b>${ok?'✅ Richtig':'❌ Noch nicht richtig'}</b><br><b>Lösung:</b> ${esc(q.answer_summary||'')}</div>`
 };
 const originalRenderPBQ=renderPBQ;
 renderPBQ=function(qid,q){
  qid=String(qid);
  if(!['1','19','72','282'].includes(qid))return originalRenderPBQ(qid,q);
  let v=loadPBQState()[qid]||{};
  app.innerHTML=`<section class="card"><div class="badge">${q.sourceLabel||state.mode.toUpperCase()}${state.topic?' · '+esc(state.topic):''} · Q${qid} · ${state.i+1}/${state.order.length} · Simulation/Hotspot</div><p class="q">${esc(q.prompt)}</p>${pbqForm(qid,v)}<div id="pbqfb"></div><div class="actions"><button class="secondary" onclick="prev()">← Zurück</button><button class="secondary" onclick="toggleMarked('${qid}')">${getMarked().includes(qid)?'★ Markiert':'☆ Markieren'}</button><button class="primary" onclick="checkPBQInteractive('${qid}')">Simulation prüfen</button><button class="secondary" onclick="next()">Weiter →</button><button class="secondary" onclick="home()">Menü</button></div></section>`
 };

 showExamWrong=function(){
  let w=state.examWrong||[];
  if(!w.length){try{let old=JSON.parse(localStorage.getItem(EXAM_KEY)||'{}');w=old.wrong||[];state.examWrong=w}catch(e){}}
  if(!w.length){app.innerHTML=`<section class="card"><h2>✅ Keine Fehler in dieser Prüfung</h2><div class="actions"><button class="primary" onclick="home()">Hauptmenü</button></div></section>`;return}
  app.innerHTML=`<section class="card"><div class="badge">FEHLER AUS DER PRÜFUNG</div><h2>${w.length} Fehler</h2>${w.map(x=>{
   let correct=(x.correct||[]).map(l=>{let i=l.charCodeAt(0)-65;return l+'. '+(x.options||[])[i]}).join(' | '),ex=EXPLANATIONS[String(x.qid)]||'';
   return `<div style="border-top:1px solid #ddd;padding:14px 0"><b>Q${x.qid}</b><p>${esc(x.prompt)}</p><div>${(x.options||[]).map((o,i)=>{let l=String.fromCharCode(65+i),sel=(x.selected||[]).includes(l),cor=(x.correct||[]).includes(l);return `<p style="margin:5px 0;padding:7px;border-radius:8px;${cor?'background:#e3f6e9;':''}${sel&&!cor?'background:#ffe8e6;':''}"><b>${l}.</b> ${esc(o)} ${cor?'✓':''}${sel&&!cor?'✕':''}</p>`}).join('')}</div><p>Deine Antwort: <b>${(x.selected||[]).join(', ')||'—'}</b><br>Richtig: <b>${esc(correct)}</b></p>${ex?`<p class="small">${esc(ex)}</p>`:''}</div>`
  }).join('')}<div class="actions"><button class="primary" onclick="home()">Hauptmenü</button></div></section>`
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
  localStorage.removeItem(PBQ_STATE_KEY);
  home()
 };

 home();
})();
