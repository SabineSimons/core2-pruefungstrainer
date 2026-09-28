(()=>{
 let tries=0;
 function install(){
  if(window.__core2ClassicStatsInstalled)return;
  if(typeof TOPICS==='undefined'||typeof BANK==='undefined'||typeof getTrainProgress!=='function'||typeof getTrainErrors!=='function'||typeof topicFor!=='function'||typeof topicArg!=='function'||typeof startTraining!=='function'||typeof renderTraining!=='function'||typeof home!=='function'||typeof topicMenu!=='function'||typeof $!=='function'){
   if(++tries<200)return setTimeout(install,50);
   console.error('Classic-Core-2-Ergebnisanzeige konnte nicht initialisiert werden.');
   return;
  }
  window.__core2ClassicStatsInstalled=true;

  function topicScore(name){
   let ids=BANK.filter(q=>topicFor(q,name)).map(q=>String(q.n));
   let p=getTrainProgress(),t=(p.topics&&p.topics[name])||{};
   let doneIds=ids.filter(q=>!!t[q]),doneSet=new Set(doneIds);
   let err=new Set(getTrainErrors().map(String));
   let errors=doneIds.filter(q=>err.has(q)).length;
   let right=Math.max(0,doneIds.length-errors);
   return {done:doneIds.length,total:ids.length,right,errors,accuracy:doneIds.length?Math.round(right/doneIds.length*100):null,openIds:ids.filter(q=>!doneSet.has(q))}
  }
  function overallScore(){
   let ids=[...new Set(BANK.map(q=>String(q.n)))],p=getTrainProgress(),a=p.all||{};
   let doneIds=ids.filter(q=>!!a[q]||!!a[Number(q)]),doneSet=new Set(doneIds);
   let err=new Set(getTrainErrors().map(String));
   let errors=doneIds.filter(q=>err.has(q)).length,right=Math.max(0,doneIds.length-errors);
   return {done:doneIds.length,total:ids.length,right,errors,accuracy:doneIds.length?Math.round(right/doneIds.length*100):null,openIds:ids.filter(q=>!doneSet.has(q))}
  }
  window.startClassicOpenTopic=function(encoded){
   let name=decodeURIComponent(encoded),s=topicScore(name),open=new Set(s.openIds);
   let pool=BANK.filter(q=>topicFor(q,name)&&open.has(String(q.n)));
   if(!pool.length)return alert('In „'+name+'“ sind keine offenen Fragen mehr.');
   train={topic:name,items:shuffle(pool),index:0,selected:[],checked:false,correct:0,ok:false};
   renderTraining()
  };

  function topicCard(name,compact){
   let s=topicScore(name),a=topicArg(name),pct=s.accuracy===null?'—':s.accuracy+'% richtig';
   if(compact){
    return '<div style="border:1px solid var(--line);border-radius:12px;padding:9px">'+
     '<button class="btn secondary" style="width:100%;padding:8px 10px;font-size:13px" onclick="startTopic(\''+a+'\')">'+name+' · '+s.done+'/'+s.total+' bearbeitet · '+s.right+'/'+s.done+' richtig · '+pct+' · '+s.errors+' falsch · '+s.openIds.length+' offen</button>'+
     '<button class="btn secondary" style="width:100%;margin-top:6px;padding:7px 9px;font-size:12px" onclick="startClassicOpenTopic(\''+a+'\')" '+(s.openIds.length?'':'disabled')+'>▶ '+s.openIds.length+' offene Fragen</button>'+
     '<button class="btn danger" style="width:100%;margin-top:6px;padding:7px 9px;font-size:12px" onclick="resetTopicProgress(\''+a+'\')">↺ Dieses Thema zurücksetzen</button></div>'
   }
   return '<div class="modecard" style="text-align:left"><h3>'+name+'</h3>'+
    '<p><b>'+s.done+' von '+s.total+'</b> bearbeitet · Richtig: <b>'+s.right+'/'+s.done+'</b> · <b>'+pct+'</b> · Falsch: <b>'+s.errors+'</b> · Offen: <b>'+s.openIds.length+'</b></p>'+
    '<button class="btn primary" style="width:100%" onclick="startTopic(\''+a+'\')">Thema starten</button>'+
    '<button class="btn secondary" style="width:100%;margin-top:8px" onclick="startClassicOpenTopic(\''+a+'\')" '+(s.openIds.length?'':'disabled')+'>▶ '+s.openIds.length+' offene Fragen</button>'+
    '<button class="btn danger" style="width:100%;margin-top:8px" onclick="resetTopicProgress(\''+a+'\')">↺ Fortschritt dieses Themas zurücksetzen</button></div>'
  }

  topicMenu=function(){
   stopTimer();$('#top').classList.add('hidden');
   app.innerHTML='<section class="card"><div class="qnum">THEMEN-TRAINING</div><div class="qtext">Thema auswählen</div><div class="topicgrid">'+
    Object.keys(TOPICS).map(n=>topicCard(n,false)).join('')+
    '</div><div class="actions"><button class="btn secondary" onclick="home()">← Hauptmenü</button><button class="btn danger" onclick="resetAllProgress()">🗑️ Kompletten Fortschritt zurücksetzen</button></div></section>'
  };

  const baseHome=home;
  home=function(){
   baseHome();
   let quick=document.querySelector('.quicktopics');
   if(quick){
    quick.style.display='grid';quick.style.gridTemplateColumns='1fr';quick.style.gap='8px';
    quick.innerHTML=Object.keys(TOPICS).map(n=>topicCard(n,true)).join('')
   }
   let overall=overallScore();
   let cards=[...document.querySelectorAll('.modecard')],box=cards.find(x=>x.textContent.includes('Gesamtfortschritt'));
   if(box){
    let p=box.querySelector('p');
    if(p)p.innerHTML='<b>'+overall.done+' von '+overall.total+'</b> Fragen bearbeitet<br>Richtig: <b>'+overall.right+'/'+overall.done+'</b> · <b>'+(overall.accuracy===null?'—':overall.accuracy+'% richtig')+'</b> · Falsch: <b>'+overall.errors+'</b> · Offen: <b>'+overall.openIds.length+'</b>'
   }
  };
  home()
 }
 install()
})();