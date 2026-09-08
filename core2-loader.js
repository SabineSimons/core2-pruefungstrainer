(async()=>{
  try{
    const raw=atob(window.CORE2_Z||"");
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const code=await new Response(stream).text();
    (0,eval)(code);
    if(Object.keys(window.CORE2_ORIGINAL||{}).length!==314) throw new Error("Originalbank unvollständig");
    if(Object.values(window.CORE2_REFORM||{}).reduce((a,x)=>a+x.length,0)!==628) throw new Error("Umformulierungsbank unvollständig");
    const appScript=document.createElement("script");
    appScript.src="core2-app.js";
    appScript.onerror=()=>{document.getElementById("app").textContent="Trainer konnte nicht geladen werden.";};
    appScript.onload=async()=>{
      try{
        const expRaw=atob(window.CORE2_EZ||"");
        const expBytes=new Uint8Array(expRaw.length);
        for(let i=0;i<expRaw.length;i++) expBytes[i]=expRaw.charCodeAt(i);
        const expStream=new Blob([expBytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        const expCode=await new Response(expStream).text();
        (0,eval)(expCode);
        if(Object.keys(window.CORE2_EXPLANATIONS||{}).length!==309) throw new Error("Erklärungsbank unvollständig");
        const fixScript=document.createElement("script");
        fixScript.src="core2-endfix.js";
        fixScript.onerror=()=>{document.getElementById("app").textContent="Trainer-Erweiterung konnte nicht geladen werden.";};
        fixScript.onload=()=>{
          const sourceFixScript=document.createElement("script");
          sourceFixScript.src="core2-sourcefix.js";
          sourceFixScript.onerror=()=>{document.getElementById("app").textContent="Quellenkorrekturen konnten nicht geladen werden.";};
          document.body.appendChild(sourceFixScript);
        };
        document.body.appendChild(fixScript);
      }catch(e){
        console.error(e);
        document.getElementById("app").textContent="Trainer-Erklärungen konnten nicht geladen werden.";
      }
    };
    document.body.appendChild(appScript);
  }catch(e){
    console.error(e);
    document.getElementById("app").textContent="Trainerdaten konnten nicht geladen werden.";
  }
})();
