(()=>{
 const PBQ_STATE_KEY=KEY+'_pbq_state_v2';
 function loadPBQState(){try{return JSON.parse(localStorage.getItem(PBQ_STATE_KEY)||'{}')}catch(e){return {}}}
 function field(label,select){return `<div style="border:1px solid #ddd;border-radius:10px;padding:11px;background:#fff"><b>${esc(label)}</b><div style="margin-top:7px">${select}</div></div>`}
 function select(qid,key,opts,val){return `<select style="width:100%;padding:10px;border:1px solid #bcc8d9;border-radius:9px;background:#fff" onchange="pbqSetValue('${qid}','${key}',this.value)"><option value="">— auswählen —</option>${opts.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('')}</select>`}
 function form(qid,v){
  if(qid==='1'){
   const ips=['169.254.17.1','224.0.0.1','50.90.234.1','127.1.0.1','192.168.10.1','10.100.0.1'];
   return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">${field('WLAN-AP · LAN-IP',select(qid,'apip',ips,v.apip))}${field('WLAN-Verschlüsselung',select(qid,'enc',['TLS 1.2','WPA2 PSK','L2TP/IPsec','WPA2 Enterprise'],v.enc))}${field('Router · Portweiterleitung',select(qid,'port',['Allow TCP Any 3347','Allow TCP Any 3306','Allow TCP Any 25','Allow TCP Any 23','Allow TCP Any 3389'],v.port))}${field('Firewall · LAN-IP zum geschützten Subnetz',select(qid,'fwip',ips,v.fwip))}${field('Windows-PC platzieren',select(qid,'pc',['Drahtloses AP-LAN','Hinter dem Router','Durch Firewall geschütztes Subnetz'],v.pc))}${field('Spielkonsole platzieren',select(qid,'console',['Drahtloses AP-LAN','Hinter dem Router','Durch Firewall geschütztes Subnetz'],v.console))}</div>`
  }
  if(qid==='19'){
   const replies=['Ich helfe Ihnen heute gerne weiter.','Ist dies der erste Router in Ihrem Büro?','Als Erstes müssen Sie das Standardpasswort ändern.','Legen Sie ein neues Passwort fest, das einen Großbuchstaben, einen Kleinbuchstaben und ein Sonderzeichen enthält.','Ja, bitte einen Neustart durchführen.'];
   return `<div class="hint">Ordne die fünf in der Quelle bestätigten Helpdesk-Antworten der richtigen Chat-Reihenfolge zu.</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">${[0,1,2,3,4].map(i=>field('Chat-Schritt '+(i+1),select(qid,'s'+i,replies,v['s'+i]))).join('')}</div>`
  }
  if(qid==='72'){
   const mails=['Konto gesperrt','Teilen Sie Ihr Feedback mit','Mitarbeitereinführung','Sicherheitsupdate','Vorstellungsgespräch'];
   const actions=['An Informationssicherheit melden','Keine weiteren Maßnahmen','Abbestellen','Anhang öffnen'];
   return `<div>${mails.map((m,i)=>`<div style="border:1px solid #ddd;border-radius:10px;padding:11px;margin:9px 0"><b>Posteingang ${i+1}: ${esc(m)}</b><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:8px">${field('Klassifizierung',select(qid,'c'+i,['Phishing','Spam','Legitim'],v['c'+i]))}${field('Maßnahme',select(qid,'a'+i,actions,v['a'+i]))}</div></div>`).join('')}</div>`
  }
  if(qid==='282'){
   const copy='copy "C:\\Program Files\\Testing\\msvcp100.dll" "\\\\User-PC02\\C$\\Windows\\System32" /h /v';
   const cmds=['shutdown -s -f -t 0','tasklist | sort','Get-WmiObject win32_computersystem',copy,'Get-EventLog -LogName System -Newest 8','reg /s "msvcp100.reg"','ls msvc*','setx path "C:\\Windows\\System32"','regsvr32 msvcp100.dll','Get-WmiObject win32_logicaldisk','robocopy "\\\\User-PC02\\C$\\Windows\\System32" "C:\\Program Files (x86)\\Testing" "msvcp100.dll"','gpupdate /force'];
   return `<div style="padding:11px;background:#111;color:#eee;border-radius:9px;font-family:monospace;margin-bottom:10px">System Error: MSVCP100.dll was not found. The application cannot start.</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">${field('1st CLI Resolution',select(qid,'c1',cmds,v.c1))}${field('2nd CLI Resolution',select(qid,'c2',cmds,v.c2))}</div>`
  }
  return ''
 }
 function grade(qid,v){
  if(qid==='1')return v.apip==='192.168.10.1'&&v.enc==='WPA2 PSK'&&v.port==='Allow TCP Any 3389'&&v.fwip==='10.100.0.1'&&v.pc==='Hinter dem Router'&&v.console==='Drahtloses AP-LAN';
  if(qid==='19'){const k=['Ich helfe Ihnen heute gerne weiter.','Ist dies der erste Router in Ihrem Büro?','Als Erstes müssen Sie das Standardpasswort ändern.','Legen Sie ein neues Passwort fest, das einen Großbuchstaben, einen Kleinbuchstaben und ein Sonderzeichen enthält.','Ja, bitte einen Neustart durchführen.'];return k.every((x,i)=>v['s'+i]===x)}
  if(qid==='72'){const c=['Phishing','Legitim','Legitim','Spam','Legitim'];const a=['An Informationssicherheit melden','Keine weiteren Maßnahmen','Keine weiteren Maßnahmen','An Informationssicherheit melden','Keine weiteren Maßnahmen'];return c.every((x,i)=>v['c'+i]===x&&v['a'+i]===a[i])}
  if(qid==='282'){const copy='copy "C:\\Program Files\\Testing\\msvcp100.dll" "\\\\User-PC02\\C$\\Windows\\System32" /h /v';return v.c1===copy&&v.c2==='regsvr32 msvcp100.dll'}
  return false
 }
 window.checkPBQInteractive=function(qid){qid=String(qid);const v=loadPBQState()[qid]||{},ok=grade(qid,v),q=state.current;state.progress[qid]=true;save();const fb=document.getElementById('pbqfb');if(fb)fb.innerHTML=`<div style="margin-top:14px;padding:13px;border-radius:10px;${ok?'background:#e3f6e9;border:1px solid #9ed3aa':'background:#ffe8e6;border:1px solid #efaaa3'}"><b>${ok?'✅ Richtig':'❌ Noch nicht richtig'}</b><br><b>Lösung:</b> ${esc(q.answer_summary||'')}</div>`};
 const priorRenderPBQ=renderPBQ;
 renderPBQ=function(qid,q){qid=String(qid);if(!['1','19','72','282'].includes(qid))return priorRenderPBQ(qid,q);const v=loadPBQState()[qid]||{};app.innerHTML=`<section class="card"><div class="badge">${q.sourceLabel||state.mode.toUpperCase()}${state.topic?' · '+esc(state.topic):''} · Q${qid} · ${state.i+1}/${state.order.length} · Simulation/Hotspot</div><p class="q">${esc(q.prompt)}</p>${form(qid,v)}<div id="pbqfb"></div><div class="actions"><button class="secondary" onclick="prev()">← Zurück</button><button class="secondary" onclick="toggleMarked('${qid}')">${getMarked().includes(qid)?'★ Markiert':'☆ Markieren'}</button><button class="primary" onclick="checkPBQInteractive('${qid}')">Simulation prüfen</button><button class="secondary" onclick="next()">Weiter →</button><button class="secondary" onclick="home()">Menü</button></div></section>`};
})();
