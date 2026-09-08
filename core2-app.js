const ORIGINAL=window.CORE2_ORIGINAL;
const REFORM=window.CORE2_REFORM;
const PBQ=new Set([1,19,72,76,282]);
const TOPICS={
 'Windows & Betriebssystem':['windows','bitlocker','ntfs','exfat','systemsteuerung','task-manager','ereignisanzeige','domäne','gruppenricht','registry','boot','uefi','partition','diskmgmt','dienst'],
 'Sicherheit':['malware','phishing','ransomware','mfa','passwort','verschlüssel','zero-day','social engineering','quarantäne','firewall','least privilege','berecht','zertifikat','hash','edr'],
 'Netzwerk & Remote':['dns','dhcp','vpn','vnc','rdp','router','wlan','wi-fi','netzwerk','ip-adresse','proxy','port','tracert','netstat','nslookup','freigabe'],
 'Befehle & Linux':['linux','sudo',' su ',' cp ','chmod','chown','grep','dig','net use','powercfg','gpupdate','robocopy','xcopy','cmd','powershell','befehl'],
 'Software & Deployment':['software','anwendung','installation','update','patch','deployment','bereitstellung','lizenz','eula','image','backup','wiederherstellung','dll'],
 'Mobile & MDM':['smartphone','mobil','mdm','android','ios','remote wipe','fernlöschung','biometr','app'],
 'Support & Dokumentation':['helpdesk','ticket','dokument','störungsbericht','sop','änderung','change','kunde','eskal','kommunikation','aup','sicherheitsdatenblatt']
};
const app=document.getElementById('app');
const KEY='sabine_core2_reform_test_v1';
const EXAM_KEY=KEY+'_last_exam';
const MARK_KEY=KEY+'_marked';
function loadProgress(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
let state={mode:'original',order:[],i:0,selected:[],checked:false,current:null,override:null,progress:loadProgress(),topic:null,examEnd:0,examTimedOut:false};
let examTimer=null;

function getMarked(){try{return JSON.parse(localStorage.getItem(MARK_KEY)||'[]').map(String)}catch(e){return []}}
function toggleMarked(qid){
 let a=getMarked(),q=String(qid),i=a.indexOf(q);if(i>=0)a.splice(i,1);else a.push(q);
 localStorage.setItem(MARK_KEY,JSON.stringify(a));render()
}

function topicText(q){let o=ORIGINAL[String(q)]||{};return ((o.prompt||'')+' '+(o.options||[]).join(' ')).toLowerCase()}
function topicIds(name){let keys=TOPICS[name]||[];return Object.keys(ORIGINAL).filter(q=>{let t=' '+topicText(q)+' ';return keys.some(k=>t.includes(k))})}
function topicProgress(name){let ids=topicIds(name),p=loadProgress(),done=ids.filter(q=>p[q]).length;return {done,total:ids.length,pct:ids.length?Math.round(done/ids.length*100):0}}
function topicArg(name){return encodeURIComponent(name)}
function topicMenu(){
 stopExamTimer();state.exam=false;
 app.innerHTML=`<section class="card"><div class="badge">THEMEN-TRAINING</div><h1>Thema auswählen</h1><p class="small">Gleiche Themenlogik wie im bisherigen Trainer. Wähle pro Thema Original, Umformuliert oder Gemischt.</p>${Object.keys(TOPICS).map(n=>{let p=topicProgress(n),a=topicArg(n);return `<div style="border-top:1px solid #ddd;padding:14px 0"><h3>${esc(n)}</h3><p class="small">${p.done}/${p.total} bearbeitet · ${p.pct}%</p><div class="modes"><button class="secondary" onclick="startTopic('${a}','original')">Original</button><button class="secondary" onclick="startTopic('${a}','reform')">Umformuliert</button><button class="secondary" onclick="startTopic('${a}','mixed')">Gemischt</button><button class="danger" onclick="resetTopic('${a}')">↺ Thema zurücksetzen</button></div></div>`}).join('')}<div class="actions"><button class="primary" onclick="home()">← Hauptmenü</button></div></section>`
}
function startTopic(encoded,mode){let name=decodeURIComponent(encoded),ids=topicIds(name);if(!ids.length)return alert('Für dieses Thema wurden keine Fragen gefunden.');stopExamTimer();state.exam=false;state.examWrong=[];state.override=null;state.mode=mode;state.topic=name;state.order=ids;state.i=0;render()}
function resetTopic(encoded){let name=decodeURIComponent(encoded);if(!confirm('Fortschritt für „'+name+'“ wirklich zurücksetzen?'))return;let p=loadProgress();for(const q of topicIds(name))delete p[q];state.progress=p;localStorage.setItem(KEY,JSON.stringify(p));topicMenu()}

function stopExamTimer(){if(examTimer){clearInterval(examTimer);examTimer=null}}
function examClock(){let ms=Math.max(0,(state.examEnd||0)-Date.now()),sec=Math.ceil(ms/1000),m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function tickExam(){if(!state.exam)return stopExamTimer();let el=document.getElementById('examTimer');if(el)el.textContent='⏱️ '+examClock();if(state.examEnd&&Date.now()>=state.examEnd){state.examTimedOut=true;stopExamTimer();examResult()}}
function startPBQSet(mode){
 stopExamTimer();state.exam=false;state.examWrong=[];state.override=null;state.topic=null;state.mode=mode;
 state.order=['1','19','72','76','282'];state.i=0;render()
}
function startExam(mode){
 let pool=Object.keys(ORIGINAL).filter(q=>!PBQ.has(Number(q)));
 if(pool.length<90)return alert('Nicht genügend bewertbare Fragen für die Prüfung.');
 for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 stopExamTimer();state.exam=true;state.examWrong=[];state.examCorrect=0;state.examAnswered=0;state.examTimedOut=false;state.examEnd=Date.now()+90*60*1000;
 state.override=null;state.topic=null;state.mode=mode;state.order=pool.slice(0,90);state.i=0;renderExam();examTimer=setInterval(tickExam,1000);tickExam()
}
function startUnanswered(mode){
 stopExamTimer();let p=loadProgress(),ids=Object.keys(ORIGINAL).filter(q=>!p[q]);
 if(!ids.length){alert('Alle 314 Fragen sind bereits als bearbeitet gespeichert.');return}
 state.exam=false;state.examWrong=[];state.override=null;state.topic=null;state.mode=mode;state.order=ids;state.i=0;render()
}

function startMarked(mode){
 stopExamTimer();let ids=getMarked();if(!ids.length){alert('Noch keine Fragen markiert.');return}
 state.exam=false;state.examWrong=[];state.override=null;state.topic=null;state.mode=mode;state.order=ids;state.i=0;render()
}

function save(){localStorage.setItem(KEY,JSON.stringify(state.progress));if(!state.exam&&state.order.length===314)localStorage.setItem(KEY+'_session',JSON.stringify({mode:state.mode,i:state.i}))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function itemFor(q){
 if(state.override&&state.override[q])return Object.assign({sourceLabel:'PRÜFUNGSFEHLER'},state.override[q]);
 if(state.mode==='original') return Object.assign({sourceLabel:'ORIGINAL'},ORIGINAL[q]);
 if(state.mode==='reform'){let a=REFORM[q];return Object.assign({n:+q,sourceLabel:'UMFORMULIERT'},a[(+q+state.i)%2]);}
 if((state.i%3)===0)return Object.assign({sourceLabel:'GEMISCHT · ORIGINAL'},ORIGINAL[q]);
 let a=REFORM[q];return Object.assign({n:+q,sourceLabel:'GEMISCHT · UMFORMULIERT'},a[(state.i+ +q)%2]);
}
function answerCount(q){
 let v=q.answers??q.answer??q.a??q.correct??[];
 return Array.isArray(v)?v.length:1
}
function answerHint(q){
 let n=answerCount(q);
 return n>1?`Mehrfachauswahl · ${n} Antworten auswählen`:'Einzelauswahl'
}
function home(){
 stopExamTimer();state.exam=false;let done=Object.keys(state.progress).length;
 app.innerHTML=`<section class="card"><h1>Core 2 · Testtrainer</h1><p>314 Originalfragen + 628 Umformulierungen. Live-Trainer bleibt unberührt.</p>
 <div class="modes"><button class="primary" onclick="start('original')">Originalfragen</button><button class="primary" onclick="start('reform')">Umformuliert</button><button class="primary" onclick="start('mixed')">Gemischt</button></div><h3>Themen-Training</h3><div class="modes"><button class="secondary" onclick="topicMenu()">Themen wählen</button></div><h3>Nur offene Fragen</h3><div class="modes"><button class="secondary" onclick="startUnanswered('original')">Original</button><button class="secondary" onclick="startUnanswered('reform')">Umformuliert</button><button class="secondary" onclick="startUnanswered('mixed')">Gemischt</button></div><p class="small">Noch offen: ${314-Object.keys(loadProgress()).filter(q=>loadProgress()[q]).length}</p><h3>Markierte Fragen</h3><div class="modes"><button class="secondary" onclick="startMarked('original')">Original</button><button class="secondary" onclick="startMarked('reform')">Umformuliert</button><button class="secondary" onclick="startMarked('mixed')">Gemischt</button></div><p class="small">Aktuell markiert: ${getMarked().length}</p><h3>Simulationen / Hotspots</h3><div class="modes"><button class="secondary" onclick="startPBQSet('original')">Original</button><button class="secondary" onclick="startPBQSet('reform')">Umformuliert</button><button class="secondary" onclick="startPBQSet('mixed')">Gemischt</button></div><h3>90-Fragen-Prüfung</h3><div class="modes"><button class="secondary" onclick="startExam('original')">Original</button><button class="secondary" onclick="startExam('reform')">Umformuliert</button><button class="secondary" onclick="startExam('mixed')">Gemischt</button></div>
 <p class="small">Gespeicherter Fortschritt: ${done} bearbeitete Quellfragen.</p><div class="actions"><button class="danger" onclick="resetProgress()">Fortschritt zurücksetzen</button></div></section>`}
function start(mode){stopExamTimer();state.exam=false;state.examWrong=[];state.override=null;state.topic=null;state.mode=mode;state.order=Array.from({length:314},(_,i)=>String(i+1));let old={};try{old=JSON.parse(localStorage.getItem(KEY+'_session')||'{}')}catch(e){};state.i=(old.mode===mode&&Number.isInteger(old.i)&&old.i>=0&&old.i<314)?old.i:0;render()}
function render(){
 let qid=state.order[state.i],q=itemFor(qid);state.current=q;state.selected=[];state.checked=false;
 if(q.type!=='mc')return renderPBQ(qid,q);
 let multi=q.answer.length>1;
 app.innerHTML=`<section class="card"><div class="badge">${q.sourceLabel||state.mode.toUpperCase()}${state.topic?' · '+esc(state.topic):''} · Q${qid} · ${state.i+1}/${state.order.length}</div>
 <p class="q">${esc(q.prompt)}</p><p class="small">${multi?'Mehrfachauswahl · '+q.answer.length+' richtige Antworten':'Eine Antwort auswählen'}</p>
 <div id="opts">${q.options.map((o,i)=>`<div class="option" data-l="${String.fromCharCode(65+i)}" onclick="pick(this,${multi})"><b>${String.fromCharCode(65+i)}.</b><span>${esc(o)}</span></div>`).join('')}</div>
 <div class="actions"><button class="secondary" onclick="prev()" ${state.exam?'disabled':''}>← Zurück</button><button class="secondary" onclick="toggleMarked('${qid}')">${getMarked().includes(String(qid))?'★ Markiert':'☆ Markieren'}</button><button class="primary" onclick="check()">Prüfen</button><button class="secondary" onclick="next()">Weiter →</button><button class="secondary" onclick="home()">Menü</button></div><div id="fb"></div></section>`}
function pick(el,multi){if(state.checked)return;let l=el.dataset.l;if(!multi){document.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));state.selected=[l];el.classList.add('selected')}else{el.classList.toggle('selected');state.selected=Array.from(document.querySelectorAll('.option.selected')).map(x=>x.dataset.l)}}
function check(){if(state.checked)return;
 let qid=state.order[state.i],q=state.current;if(!state.selected.length)return alert('Bitte erst auswählen.');
 state.checked=true;let ok=[...state.selected].sort().join()===[...q.answer].sort().join();
 document.querySelectorAll('.option').forEach(el=>{let l=el.dataset.l;if(q.answer.includes(l))el.classList.add('correct');else if(state.selected.includes(l))el.classList.add('wrong')});
 state.progress[qid]=true;save();document.getElementById('fb').innerHTML=`<p><b>${ok?'✅ Richtig':'❌ Falsch'}</b> · Richtige Antwort: ${q.answer.join(', ')}</p>`}
function renderPBQ(qid,q){
 let ungraded=(qid==='76'||q.type==='pbq_ungraded');
 app.innerHTML=`<section class="card"><div class="badge">${q.sourceLabel||state.mode.toUpperCase()}${state.topic?' · '+esc(state.topic):''} · Q${qid} · ${state.i+1}/${state.order.length} · Simulation/Hotspot</div><p class="q">${esc(q.prompt)}</p>
 <p>${ungraded?'ℹ️ Diese Simulation bleibt bewusst unbewertet.':'Lösungskern: '+esc(q.answer_summary||'')}</p>
 <div class="actions"><button class="secondary" onclick="prev()" ${state.exam?'disabled':''}>← Zurück</button><button class="secondary" onclick="toggleMarked('${qid}')">${getMarked().includes(String(qid))?'★ Markiert':'☆ Markieren'}</button><button class="primary" onclick="markPBQ('${qid}')">Als bearbeitet markieren</button><button class="secondary" onclick="next()">Weiter →</button><button class="secondary" onclick="home()">Menü</button></div></section>`}
function markPBQ(q){state.progress[q]=true;save();next()}
function prev(){
 if(state.exam)return;
 if(state.i>0){state.i--;render()}
}
function next(){
 if(state.exam&&!state.checked)return alert('Bitte die Frage zuerst prüfen.');
 if(state.i<state.order.length-1){state.i++;save();render()}
 else if(state.exam){examResult()}
 else home()
}
function renderExam(){
 let qid=state.order[state.i],q=itemFor(qid);state.current=q;state.selected=[];state.checked=false;
 if(q.type!=='mc')throw new Error('PBQ darf im bewerteten 90-Fragen-Test nicht enthalten sein');
 let multi=q.answer.length>1;
 app.innerHTML=`<section class="card"><div class="badge">PRÜFUNG · ${q.sourceLabel||state.mode.toUpperCase()} · ${state.i+1}/90</div><p id="examTimer" class="small" style="font-weight:900">⏱️ ${examClock()}</p><p class="q">${esc(q.prompt)}</p>
 <p class="small">${multi?'Mehrfachauswahl · '+q.answer.length+' richtige Antworten':'Eine Antwort auswählen'}</p>
 <div id="opts">${q.options.map((o,i)=>`<div class="option" data-l="${String.fromCharCode(65+i)}" onclick="pick(this,${multi})"><b>${String.fromCharCode(65+i)}.</b><span>${esc(o)}</span></div>`).join('')}</div>
 <div class="actions"><button class="primary" onclick="checkExam()">Prüfen & weiter</button><button class="secondary" onclick="home()">Prüfung verlassen</button></div></section>`;tickExam()
}
function checkExam(){
 if(state.checked)return;
 let q=state.current;if(!state.selected.length)return alert('Bitte erst auswählen.');
 state.checked=true;
 let ok=[...state.selected].sort().join()===[...q.answer].sort().join();state.examAnswered++;if(ok)state.examCorrect++;else state.examWrong.push({qid:state.order[state.i],prompt:q.prompt,options:[...q.options],selected:[...state.selected],correct:[...q.answer]});state.progress[state.order[state.i]]=true;save();
 if(state.i>=89)return examResult();state.i++;renderExam()
}
function examResult(){
 stopExamTimer();if(state.order.length!==90)return alert('Interner Prüfungsfehler: Die Prüfung enthält nicht exakt 90 Fragen.');
 localStorage.setItem(EXAM_KEY,JSON.stringify({mode:state.mode,wrong:state.examWrong||[],correct:state.examCorrect||0,answered:state.examAnswered||0}));
 let pct=state.examAnswered?Math.round(state.examCorrect/state.examAnswered*100):0;
 app.innerHTML=`<section class="card"><div class="badge">PRÜFUNGSERGEBNIS</div><h1>${pct}%</h1><p>${state.examCorrect} von ${state.examAnswered} bewerteten Aufgaben richtig.</p><p class="small">${state.examTimedOut?'⏱️ Die 90 Minuten sind abgelaufen. · ':''}Trainingswert – keine Umrechnung in den offiziellen CompTIA-Skalenwert.</p><div class="actions"><button class="primary" onclick="showExamWrong()">Fehler ansehen (${state.examWrong.length})</button><button class="primary" onclick="startExamErrors()">Nur Fehler trainieren</button><button class="secondary" onclick="home()">Hauptmenü</button></div></section>`
}

function startExamErrors(){
 stopExamTimer();state.topic=null;if(!(state.examWrong||[]).length){try{let old=JSON.parse(localStorage.getItem(EXAM_KEY)||'{}');state.examWrong=old.wrong||[];if(old.mode)state.mode=old.mode}catch(e){}}
 let ids=[...new Set((state.examWrong||[]).map(x=>String(x.qid)))];
 if(!ids.length){alert('Keine Fehler aus der letzten Prüfung vorhanden.');return}
 state.exam=false;state.override={};for(const x of (state.examWrong||[])){state.override[String(x.qid)]={type:'mc',n:+x.qid,prompt:x.prompt,options:[...x.options],answer:[...x.correct]}}state.order=ids;state.i=0;render()
}

function showExamWrong(){
 let w=state.examWrong||[];
 if(!w.length){app.innerHTML=`<section class="card"><h2>✅ Keine Fehler in dieser Prüfung</h2><div class="actions"><button class="primary" onclick="home()">Hauptmenü</button></div></section>`;return}
 app.innerHTML=`<section class="card"><div class="badge">FEHLER AUS DER PRÜFUNG</div><h2>${w.length} Fehler</h2>${w.map(x=>`<div style="border-top:1px solid #ddd;padding:14px 0"><b>Q${x.qid}</b><p>${esc(x.prompt)}</p><div>${x.options.map((o,i)=>{let l=String.fromCharCode(65+i),sel=x.selected.includes(l),cor=x.correct.includes(l);return `<p style="margin:5px 0;padding:7px;border-radius:8px;${cor?'background:#e3f6e9;':''}${sel&&!cor?'background:#ffe8e6;':''}"><b>${l}.</b> ${esc(o)} ${cor?'✓':''}${sel&&!cor?'✕':''}</p>`}).join('')}</div><p>Deine Antwort: <b>${x.selected.join(', ')}</b> · Richtig: <b>${x.correct.join(', ')}</b></p></div>`).join('')}<div class="actions"><button class="primary" onclick="home()">Hauptmenü</button></div></section>`
}

function resetProgress(){if(!confirm('Gesamten Testtrainer-Fortschritt wirklich zurücksetzen?'))return;stopExamTimer();state.progress={};state.i=0;state.override=null;state.topic=null;state.examWrong=[];state.exam=false;localStorage.removeItem(KEY);localStorage.removeItem(KEY+'_session');localStorage.removeItem(EXAM_KEY);localStorage.removeItem(MARK_KEY);home()}
home();
