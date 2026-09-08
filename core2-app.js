
const ORIGINAL=window.CORE2_ORIGINAL;
const REFORM=window.CORE2_REFORM;
const PBQ=new Set([1,19,72,76,282]);
const app=document.getElementById('app');
const KEY='sabine_core2_reform_test_v1';
const EXAM_KEY=KEY+'_last_exam';
const MARK_KEY=KEY+'_marked';
function loadProgress(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
let state={mode:'original',order:[],i:0,selected:[],checked:false,current:null,override:null,progress:loadProgress()};

function getMarked(){try{return JSON.parse(localStorage.getItem(MARK_KEY)||'[]').map(String)}catch(e){return []}}
function toggleMarked(qid){
 let a=getMarked(),q=String(qid),i=a.indexOf(q);if(i>=0)a.splice(i,1);else a.push(q);
 localStorage.setItem(MARK_KEY,JSON.stringify(a));render()
}

function startPBQSet(mode){
 state.exam=false;state.examWrong=[];state.override=null;state.mode=mode;
 state.order=['1','19','72','76','282'];state.i=0;render()
}
function startExam(mode){
 let pool=Object.keys(ORIGINAL).filter(q=>!PBQ.has(Number(q)));
 if(pool.length<90)return alert('Nicht genügend bewertbare Fragen für die Prüfung.');
 for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 state.exam=true;state.examWrong=[];state.examCorrect=0;state.examAnswered=0;
 state.override=null;state.mode=mode;state.order=pool.slice(0,90);state.i=0;render()
}
function startUnanswered(mode){
 let p=loadProgress(),ids=Object.keys(ORIGINAL).filter(q=>!p[q]);
 if(!ids.length){alert('Alle 314 Fragen sind bereits als bearbeitet gespeichert.');return}
 state.exam=false;state.examWrong=[];state.override=null;state.mode=mode;state.order=ids;state.i=0;render()
}

function startMarked(mode){
 let ids=getMarked();if(!ids.length){alert('Noch keine Fragen markiert.');return}
 state.exam=false;state.examWrong=[];state.override=null;state.mode=mode;state.order=ids;state.i=0;render()
}

function save(){localStorage.setItem(KEY,JSON.stringify(state.progress));if(!state.exam&&state.order.length===314)localStorage.setItem(KEY+'_session',JSON.stringify({mode:state.mode,i:state.i}))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function itemFor(q){
 if(state.override&&state.override[q])return Object.assign({sourceLabel:'PRÜFUNGSFEHLER'},state.override[q]);
 if(state.mode==='original') return Object.assign({sourceLabel:'ORIGINAL'},ORIGINAL[q]);
 if(state.mode==='reform'){let a=REFORM[q];return Object.assign({n:+q,sourceLabel:'UMFORMULIERT'},a[(+q+state.i)%2]);}
 // gemischt: deterministisch abwechseln, damit nicht beide Formen derselben Frage direkt folgen
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
 let done=Object.keys(state.progress).length;
 app.innerHTML=`<section class="card"><h1>Core 2 · Testtrainer</h1><p>314 Originalfragen + 628 Umformulierungen. Live-Trainer bleibt unberührt.</p>
 <div class="modes"><button class="primary" onclick="start('original')">Originalfragen</button><button class="primary" onclick="start('reform')">Umformuliert</button><button class="primary" onclick="start('mixed')">Gemischt</button></div><h3>Nur offene Fragen</h3><div class="modes"><button class="secondary" onclick="startUnanswered('original')">Original</button><button class="secondary" onclick="startUnanswered('reform')">Umformuliert</button><button class="secondary" onclick="startUnanswered('mixed')">Gemischt</button></div><p class="small">Noch offen: ${314-Object.keys(loadProgress()).filter(q=>loadProgress()[q]).length}</p><h3>Markierte Fragen</h3><div class="modes"><button class="secondary" onclick="startMarked('original')">Original</button><button class="secondary" onclick="startMarked('reform')">Umformuliert</button><button class="secondary" onclick="startMarked('mixed')">Gemischt</button></div><p class="small">Aktuell markiert: ${getMarked().length}</p><h3>Simulationen / Hotspots</h3><div class="modes"><button class="secondary" onclick="startPBQSet('original')">Original</button><button class="secondary" onclick="startPBQSet('reform')">Umformuliert</button><button class="secondary" onclick="startPBQSet('mixed')">Gemischt</button></div><h3>90-Fragen-Prüfung</h3><div class="modes"><button class="secondary" onclick="startExam('original')">Original</button><button class="secondary" onclick="startExam('reform')">Umformuliert</button><button class="secondary" onclick="startExam('mixed')">Gemischt</button></div>
 <p class="small">Gespeicherter Fortschritt: ${done} bearbeitete Quellfragen.</p><div class="actions"><button class="danger" onclick="resetProgress()">Fortschritt zurücksetzen</button></div></section>`}
function start(mode){state.exam=false;state.examWrong=[];state.override=null;state.mode=mode;state.order=Array.from({length:314},(_,i)=>String(i+1));let old={};try{old=JSON.parse(localStorage.getItem(KEY+'_session')||'{}')}catch(e){};state.i=(old.mode===mode&&Number.isInteger(old.i)&&old.i>=0&&old.i<314)?old.i:0;render()}
function render(){
 let qid=state.order[state.i],q=itemFor(qid);state.current=q;state.selected=[];state.checked=false;
 if(q.type!=='mc')return renderPBQ(qid,q);
 let multi=q.answer.length>1;
 app.innerHTML=`<section class="card"><div class="badge">${q.sourceLabel||state.mode.toUpperCase()} · Q${qid} · ${state.i+1}/${state.order.length}</div>
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
 app.innerHTML=`<section class="card"><div class="badge">${q.sourceLabel||state.mode.toUpperCase()} · Q${qid} · ${state.i+1}/${state.order.length} · Simulation/Hotspot</div><p class="q">${esc(q.prompt)}</p>
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
 app.innerHTML=`<section class="card"><div class="badge">PRÜFUNG · ${q.sourceLabel||state.mode.toUpperCase()} · ${state.i+1}/90</div><p class="q">${esc(q.prompt)}</p>
 <p class="small">${multi?'Mehrfachauswahl · '+q.answer.length+' richtige Antworten':'Eine Antwort auswählen'}</p>
 <div id="opts">${q.options.map((o,i)=>`<div class="option" data-l="${String.fromCharCode(65+i)}" onclick="pick(this,${multi})"><b>${String.fromCharCode(65+i)}.</b><span>${esc(o)}</span></div>`).join('')}</div>
 <div class="actions"><button class="primary" onclick="checkExam()">Prüfen & weiter</button><button class="secondary" onclick="home()">Prüfung verlassen</button></div></section>`
}
function checkExam(){
 if(state.checked)return;
 let q=state.current;if(!state.selected.length)return alert('Bitte erst auswählen.');
 state.checked=true;
 let ok=[...state.selected].sort().join()===[...q.answer].sort().join();state.examAnswered++;if(ok)state.examCorrect++;else state.examWrong.push({qid:state.order[state.i],prompt:q.prompt,options:[...q.options],selected:[...state.selected],correct:[...q.answer]});state.progress[state.order[state.i]]=true;save();
 if(state.i>=89)return examResult();state.i++;renderExam()
}
function examResult(){
 if(state.order.length!==90)return alert('Interner Prüfungsfehler: Die Prüfung enthält nicht exakt 90 Fragen.');
 localStorage.setItem(EXAM_KEY,JSON.stringify({mode:state.mode,wrong:state.examWrong||[],correct:state.examCorrect||0,answered:state.examAnswered||0}));
 let pct=state.examAnswered?Math.round(state.examCorrect/state.examAnswered*100):0;
 app.innerHTML=`<section class="card"><div class="badge">PRÜFUNGSERGEBNIS</div><h1>${pct}%</h1><p>${state.examCorrect} von ${state.examAnswered} bewerteten Aufgaben richtig.</p><p class="small">Trainingswert – keine Umrechnung in den offiziellen CompTIA-Skalenwert.</p><div class="actions"><button class="primary" onclick="showExamWrong()">Fehler ansehen (${state.examWrong.length})</button><button class="primary" onclick="startExamErrors()">Nur Fehler trainieren</button><button class="secondary" onclick="home()">Hauptmenü</button></div></section>`
}



function startExamErrors(){
 if(!(state.examWrong||[]).length){try{let old=JSON.parse(localStorage.getItem(EXAM_KEY)||'{}');state.examWrong=old.wrong||[];if(old.mode)state.mode=old.mode}catch(e){}}
 let ids=[...new Set((state.examWrong||[]).map(x=>String(x.qid)))];
 if(!ids.length){alert('Keine Fehler aus der letzten Prüfung vorhanden.');return}
 state.exam=false;state.override={};for(const x of (state.examWrong||[])){state.override[String(x.qid)]={type:'mc',n:+x.qid,prompt:x.prompt,options:[...x.options],answer:[...x.correct]}}state.order=ids;state.i=0;render()
}

function showExamWrong(){
 let w=state.examWrong||[];
 if(!w.length){app.innerHTML=`<section class="card"><h2>✅ Keine Fehler in dieser Prüfung</h2><div class="actions"><button class="primary" onclick="home()">Hauptmenü</button></div></section>`;return}
 app.innerHTML=`<section class="card"><div class="badge">FEHLER AUS DER PRÜFUNG</div><h2>${w.length} Fehler</h2>${w.map(x=>`<div style="border-top:1px solid #ddd;padding:14px 0"><b>Q${x.qid}</b><p>${esc(x.prompt)}</p><div>${x.options.map((o,i)=>{let l=String.fromCharCode(65+i),sel=x.selected.includes(l),cor=x.correct.includes(l);return `<p style="margin:5px 0;padding:7px;border-radius:8px;${cor?'background:#e3f6e9;':''}${sel&&!cor?'background:#ffe8e6;':''}"><b>${l}.</b> ${esc(o)} ${cor?'✓':''}${sel&&!cor?'✕':''}</p>`}).join('')}</div><p>Deine Antwort: <b>${x.selected.join(', ')}</b> · Richtig: <b>${x.correct.join(', ')}</b></p></div>`).join('')}<div class="actions"><button class="primary" onclick="home()">Hauptmenü</button></div></section>`
}

function resetProgress(){if(!confirm('Gesamten Testtrainer-Fortschritt wirklich zurücksetzen?'))return;state.progress={};state.i=0;state.override=null;state.examWrong=[];state.exam=false;localStorage.removeItem(KEY);localStorage.removeItem(KEY+'_session');localStorage.removeItem(EXAM_KEY);localStorage.removeItem(MARK_KEY);home()}
home();
