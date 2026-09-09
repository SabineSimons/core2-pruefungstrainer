(()=>{
 const SESSION_KEY='sabine_core2_2201202_topic_sessions_v1';
 function sessions(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'{}')}catch(e){return {}}}
 function put(o){localStorage.setItem(SESSION_KEY,JSON.stringify(o||{}))}
 function isTopic(t){return !!(t&&typeof TOPICS!=='undefined'&&Object.prototype.hasOwnProperty.call(TOPICS,t))}
 function saveCurrent(){
  if(!train||!isTopic(train.topic)||!Array.isArray(train.items)||train.index<0||train.index>=train.items.length)return;
  let all=sessions();
  all[train.topic]={items:train.items.map(q=>q.n),index:train.index,selected:[...(train.selected||[])],checked:!!train.checked,correct:Number(train.correct)||0,ok:!!train.ok};
  put(all)
 }
 function clearTopic(topic){let all=sessions();delete all[topic];put(all)}

 const baseStartTraining=startTraining;
 startTraining=function(topic){
  if(isTopic(topic)){
   let old=sessions()[topic];
   if(old&&Array.isArray(old.items)&&old.items.length){
    let map=new Map(BANK.map(q=>[q.n,q])),items=old.items.map(n=>map.get(n)).filter(Boolean);
    if(items.length===old.items.length&&Number.isInteger(old.index)&&old.index>=0&&old.index<items.length){
     train={topic,items,index:old.index,selected:Array.isArray(old.selected)?old.selected:[],checked:!!old.checked,correct:Number(old.correct)||0,ok:!!old.ok};
     renderTraining();
     return
    }
    clearTopic(topic)
   }
  }
  if(isTopic(topic)){
   let pool=BANK.filter(q=>topicFor(q,topic)),progress=getTrainProgress(),doneMap=(progress.topics&&progress.topics[topic])||{};
   let done=pool.filter(q=>doneMap[q.n]),open=pool.filter(q=>!doneMap[q.n]);
   if(done.length&&open.length){train={topic,items:[...done,...shuffle(open)],index:done.length,selected:[],checked:false,correct:0,ok:false};saveCurrent();renderTraining();return}
  }
  baseStartTraining(topic);
  saveCurrent()
 };

 const baseTrainPick=trainPick;
 trainPick=function(l,multi){baseTrainPick(l,multi);saveCurrent()};

 const baseTrainCheck=trainCheck;
 trainCheck=function(){baseTrainCheck();saveCurrent()};

 const baseTrainNext=trainNext;
 trainNext=function(){
  let topic=train&&train.topic,ending=!!(train&&isTopic(topic)&&train.index>=train.items.length-1);
  baseTrainNext();
  if(ending)clearTopic(topic);else saveCurrent()
 };

 const baseTrainingDone=trainingDone;
 trainingDone=function(){if(train&&isTopic(train.topic))clearTopic(train.topic);baseTrainingDone()};

 const baseHome=home;
 home=function(){saveCurrent();baseHome()};

 const baseResetTopic=resetTopicProgress;
 resetTopicProgress=function(encoded){
  let accepted=false,oldConfirm=window.confirm;
  window.confirm=function(msg){let r=oldConfirm(msg);accepted=!!r;return r};
  try{baseResetTopic(encoded)}finally{window.confirm=oldConfirm}
  if(accepted)clearTopic(decodeURIComponent(encoded))
 };

 const baseResetAll=resetAllProgress;
 resetAllProgress=function(){
  let accepted=false,oldConfirm=window.confirm;
  window.confirm=function(msg){let r=oldConfirm(msg);accepted=!!r;return r};
  try{baseResetAll()}finally{window.confirm=oldConfirm}
  if(accepted)localStorage.removeItem(SESSION_KEY)
 };
})();
