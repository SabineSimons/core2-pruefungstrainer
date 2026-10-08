(()=>{
  if(!('speechSynthesis' in window))return;
  const synth=window.speechSynthesis;
  let current=null;
  function stop(){synth.cancel();current=null;}
  function say(message){
    stop();
    if(!message)return;
    const u=new SpeechSynthesisUtterance(message);
    u.lang='de-DE';u.rate=0.9;u.pitch=1;
    const voices=synth.getVoices();
    const german=voices.find(v=>v.lang.toLowerCase()==='de-de')||voices.find(v=>v.lang.toLowerCase().startsWith('de'));
    if(german)u.voice=german;
    current=u;u.onend=()=>{if(current===u)current=null};
    synth.speak(u);
  }
  function question(){
    if(!train||!train.items)return;
    const q=train.items[train.index];if(!q)return;
    say('Frage '+q.n+'. '+q.prompt+'. '+q.options.map(([letter,answer])=>'Antwort '+letter+': '+answer+'.').join(' '));
  }
  function answer(){
    if(!train||!train.checked)return;
    const q=train.items[train.index];if(!q)return;
    const correct=q.answers.map(letter=>{const option=q.options.find(o=>o[0]===letter);return 'Antwort '+letter+': '+(option?option[1]:'')}).join('. ');
    say('Richtige Antwort: '+correct+'. Erklärung: '+(q.explanation||'Für diese Frage ist keine zusätzliche Erklärung hinterlegt.'));
  }
  window.core2ReadQuestion=question;
  window.core2ReadAnswer=answer;
  window.core2StopSpeech=stop;
  const oldRender=renderTraining;
  renderTraining=function(){
    stop();oldRender();
    if(!train||!train.items||!train.items[train.index])return;
    const card=app.querySelector('section.card');if(!card)return;
    const bar=document.createElement('div');bar.className='actions';
    bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:14px 0';
    const btn=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='btn secondary';b.textContent=label;b.onclick=fn;bar.appendChild(b)};
    btn('🔊 Frage und Antworten vorlesen',question);
    if(train.checked)btn('🔊 Richtige Antwort + Erklärung',answer);
    btn('⏹ Stopp',stop);
    const nav=card.querySelector('.nav');if(nav)card.insertBefore(bar,nav);else card.appendChild(bar);
  };
  const oldHome=home;home=function(){stop();return oldHome.apply(this,arguments)};
  const oldNext=trainNext;trainNext=function(){stop();return oldNext.apply(this,arguments)};
  if(train&&train.items&&train.items[train.index])renderTraining();
})();