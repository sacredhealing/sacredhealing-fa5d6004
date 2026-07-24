import{r as a,j as e,g as Rr}from"./vendor-react--OR-uH7S.js";import{u as et,p as S,s as u,D as zr,c as Bt}from"./index-RRXEvQfm.js";import{u as Tr}from"./useAdminRole-CCeebBaS.js";import{u as Dr}from"./useStargateAccess-Dqqp_LGG.js";import{f as Mr}from"./dashboardAggregateStats-CsVrQlwV.js";import{r as Ar}from"./NotificationService-B-YjpcnE.js";import{u as Ir}from"./vendor-i18n-BS5B6gzd.js";import{aO as Pt,h as Wt,aX as Lr,n as $r,b3 as Fr}from"./vendor-icons-CZmAPI07.js";import{l as Br,a as Pr}from"./api-Bc0kPBir.js";import{C as qt}from"./ContentDropCard-ZztqVbID.js";import{f as Ae}from"./formatDistanceToNow-CP23zA8F.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";import"./vendor-motion-Dm4zQNot.js";import"./index-E_HfJ5im.js";import"./en-US-DaTnBiBt.js";import"./endOfMonth-BS24EeZA.js";function Ot(r,f){const C=r;if(!C?.error)return f;const A=[C.error,C.details,C.hint].filter(Boolean);return A.length?A.join(" — "):f}async function Vt(r,f){const C=r;if(C?.error||C?.session)return C;const A=f;if(A?.context&&typeof A.context.json=="function")try{const B=await A.context.json();return B?.error||B?.session?B:C??null}catch{return C??null}return C??null}function Wr(){const{t:r}=Ir(),{user:f}=et(),[C,A]=a.useState(!1),[B,U]=a.useState(null),G=a.useCallback(async(I,z,v,$=!1,R="channel",P)=>{if(!f)return S.error(r("community.goLive.signIn")),null;const{data:m}=await u.auth.getSession(),j=m.session?.access_token;if(!j)return S.error(r("community.goLive.signIn")),null;A(!0);try{const{data:D,error:k}=await u.functions.invoke("daily-room",{body:{action:"create",channel_id:R==="feed"?"feed":I,title:z,description:v,allow_non_admin:$,source:R,stargate_category:P?.stargate_category,partner_user_id:P?.partner_user_id},headers:{Authorization:`Bearer ${j}`}}),w=await Vt(D,k);return k||w?.error?(S.error(Ot(w,k?.message||r("community.goLive.createFailed"))),null):w?.session?(U(w.session),S.success(r("community.goLive.roomCreated")),{session:w.session,room_url:w.room_url}):(S.error(r("community.goLive.createFailed")),null)}catch(D){const k=D instanceof Error?D.message:r("community.goLive.createFailed");return S.error(k),null}finally{A(!1)}},[f,r]),Y=a.useCallback(async I=>{try{const{data:z}=await u.auth.getSession(),v=z.session?.access_token;if(!v){S.error(r("community.goLive.signIn"));return}const{data:$,error:R}=await u.functions.invoke("daily-room",{body:{action:"end",session_id:I},headers:{Authorization:`Bearer ${v}`}}),P=await Vt($,R);if(R||P?.error){S.error(Ot(P,R?.message||r("community.goLive.endFailed")));return}U(null),S.success(r("community.goLive.sessionEndedPrivate"))}catch{S.error(r("community.goLive.endFailed"))}},[r]),N=a.useCallback(async I=>{let z=u.from("community_live_sessions").select("*").eq("status","active").order("started_at",{ascending:!1});I&&(z=z.eq("channel_id",I));const{data:v}=await z,$=v||[],R=4*60*60*1e3,P=Date.now();return $.filter(m=>P-new Date(m.started_at).getTime()<R)},[]);return a.useMemo(()=>({createRoom:G,endSession:Y,fetchActiveSessions:N,activeSession:B,isCreating:C,setActiveSession:U}),[G,Y,N,B,C])}const qr=r=>{const{user:f}=et(),[C,A]=a.useState([]),[B,U]=a.useState(null),[G,Y]=a.useState(!0),N=async()=>{if(!f)return;const{data:v,error:$}=await u.from("private_messages").select("*").or(`and(sender_id.eq.${f.id},receiver_id.eq.${r}),and(sender_id.eq.${r},receiver_id.eq.${f.id})`).order("created_at",{ascending:!0});if($){console.error("Error fetching messages:",$);return}A(v||[]),await u.from("private_messages").update({is_read:!0}).eq("sender_id",r).eq("receiver_id",f.id).eq("is_read",!1)},I=async()=>{const{data:v}=await u.from("profiles").select("full_name, avatar_url").eq("user_id",r).single();U(v),Y(!1)};return a.useEffect(()=>{N(),I();const v=u.channel(`dm-${r}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},$=>{const R=$.new;(R.sender_id===f?.id&&R.receiver_id===r||R.sender_id===r&&R.receiver_id===f?.id)&&N()}).subscribe();return()=>{u.removeChannel(v)}},[r,f]),{messages:C,partnerProfile:B,isLoading:G,sendMessage:async(v,$="text",R)=>{if(!f)return!1;const P=`temp-dm-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,m=new Date().toISOString(),j={id:P,sender_id:f.id,receiver_id:r,content:v,created_at:m,is_read:!1,message_type:$,status:"pending",...R};A(E=>[...E,j]);const D=$!=="text"||!!R;let k=null,w=null;if(D){const E=await u.from("private_messages").insert({sender_id:f.id,receiver_id:r,content:v,message_type:$,...R||{}}).select().single();if(k=E.data,w=E.error,w){console.error("[usePrivateChat] media insert failed, falling back to text-only:",w);const W=await u.from("private_messages").insert({sender_id:f.id,receiver_id:r,content:v}).select().single();k=W.data,w=W.error}}else{const E=await u.from("private_messages").insert({sender_id:f.id,receiver_id:r,content:v}).select().single();k=E.data,w=E.error}return w?(A(E=>E.filter(W=>W.id!==P)),!1):(k&&A(E=>E.map(W=>W.id===P?k:W)),!0)}}};function Or(){const[r,f]=a.useState("idle"),[C,A]=a.useState(null),[B,U]=a.useState(0),G=a.useRef(null),Y=a.useRef([]),N=a.useRef(null),I=a.useRef(null),z=a.useRef(null),v=a.useRef(0),$=a.useRef(null),R=a.useCallback(()=>{[N.current,I.current].forEach(D=>{D?.getTracks().forEach(k=>{try{k.stop()}catch{}})}),N.current=null,I.current=null,z.current&&(clearInterval(z.current),z.current=null)},[]);a.useEffect(()=>()=>R(),[R]);const P=a.useCallback(async D=>{const k=$.current;if(k){f("uploading");try{const{data:w}=await u.auth.getUser();if(!w?.user)throw new Error("Not authenticated");const{data:E,error:W}=await u.from("call_recordings").select("id, host_user_id").eq("room_name",k.roomName).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(W)throw W;if(!E)throw new Error("Recording row not found for room");const ee=D.type.includes("mp4")?"mp4":"webm",Q=`${E.host_user_id}/${E.id}.${ee}`,{error:K}=await u.storage.from("call-recordings").upload(Q,D,{upsert:!0,contentType:D.type});if(K)throw K;const J=Math.round((Date.now()-v.current)/1e3),{error:q}=await u.from("call_recordings").update({status:"ready",storage_path:Q,video_url:Q,duration_seconds:J,ended_at:new Date().toISOString()}).eq("id",E.id);if(q)throw q;f("ready"),S.success("Recording saved to your profile")}catch(w){const E=w instanceof Error?w.message:String(w);console.error("[useCallScreenRecorder] finalize error:",w),A(E),f("failed"),S.error(`Recording upload failed: ${E}`)}}},[]),m=a.useCallback(async D=>{A(null),U(0),$.current=D,f("requesting");try{const k=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!0});N.current=k;let w=null;try{w=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0}}),I.current=w}catch(q){console.warn("[useCallScreenRecorder] no mic, continuing with tab audio only",q)}const E=new AudioContext,W=E.createMediaStreamDestination(),ee=k.getAudioTracks();if(ee.length)try{E.createMediaStreamSource(new MediaStream(ee)).connect(W)}catch(q){console.warn("[useCallScreenRecorder] tab audio mix failed",q)}if(w)try{E.createMediaStreamSource(w).connect(W)}catch(q){console.warn("[useCallScreenRecorder] mic mix failed",q)}const Q=new MediaStream([...k.getVideoTracks(),...W.stream.getAudioTracks()]),K=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")?"video/webm;codecs=vp8,opus":MediaRecorder.isTypeSupported("video/webm")?"video/webm":"video/mp4",J=new MediaRecorder(Q,{mimeType:K,videoBitsPerSecond:25e5});G.current=J,Y.current=[],J.ondataavailable=q=>{q.data&&q.data.size>0&&Y.current.push(q.data)},J.onstop=async()=>{const q=new Blob(Y.current,{type:K});Y.current=[],R(),await P(q)},k.getVideoTracks()[0]?.addEventListener("ended",()=>{J.state!=="inactive"&&J.stop()}),J.start(2e3),v.current=Date.now(),f("recording"),z.current=setInterval(()=>{U(Math.floor((Date.now()-v.current)/1e3))},1e3),S.success("Recording started — keep this tab open")}catch(k){const w=k instanceof Error?k.message:String(k);console.error("[useCallScreenRecorder] start error:",k),A(w),f("failed"),R();try{$.current&&await u.from("call_recordings").update({status:"failed",error_message:w}).eq("room_name",$.current.roomName).eq("status","pending")}catch{}S.error(`Could not start recording: ${w}`)}},[R,P]),j=a.useCallback(()=>{const D=G.current;D&&D.state!=="inactive"?D.stop():(R(),f("idle"))},[R]);return{status:r,error:C,elapsed:B,start:m,stop:j}}function Ut(r){const f=Math.floor(r/60).toString().padStart(2,"0"),C=(r%60).toString().padStart(2,"0");return`${f}:${C}`}const Vr=20,Gt=({roomName:r,sessionId:f,autoStart:C,className:A})=>{const{status:B,elapsed:U,start:G,stop:Y,error:N}=Or();a.useEffect(()=>{if(C&&B==="idle"&&r){const z=setTimeout(()=>{G({roomName:r,sessionId:f})},400);return()=>clearTimeout(z)}},[C,B,r,f,G]);const I=()=>{U<Vr&&!window.confirm(`Only ${Ut(U)} has been recorded. Stop and save anyway?`)||Y()};return e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl text-xs "+(A||""),children:[B==="idle"&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>G({roomName:r,sessionId:f}),className:"flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] text-black font-black text-[10px] tracking-[0.1em] uppercase transition-all hover:scale-[1.02] active:scale-95",children:[e.jsx(Pt,{className:"w-3 h-3 fill-current"})," Record call"]}),e.jsx("span",{className:"text-white/40",children:"Saves to your profile / Stargate when you stop."})]}),B==="requesting"&&e.jsxs("span",{className:"flex items-center gap-2 text-white/40",children:[e.jsx(Wt,{className:"w-3 h-3 animate-spin"})," Waiting for screen + mic permission…"]}),B==="recording"&&e.jsxs(e.Fragment,{children:[e.jsxs("span",{className:"flex items-center gap-1.5 text-red-400 font-black tracking-wide",children:[e.jsx(Pt,{className:"w-2.5 h-2.5 fill-current animate-pulse"})," REC ",Ut(U)]}),e.jsxs("button",{onClick:I,className:"flex items-center gap-1.5 ml-auto px-4 py-2 rounded-full border border-white/10 text-white/70 font-black text-[10px] tracking-[0.1em] uppercase hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all",children:[e.jsx(Lr,{className:"w-3 h-3"})," Stop & save"]})]}),B==="uploading"&&e.jsxs("span",{className:"flex items-center gap-2 text-white/40",children:[e.jsx(Wt,{className:"w-3 h-3 animate-spin"})," Uploading recording…"]}),B==="ready"&&e.jsxs("span",{className:"flex items-center gap-2 text-[#22D3EE]",children:[e.jsx($r,{className:"w-3 h-3"})," Saved to your profile."]}),B==="failed"&&e.jsxs("span",{className:"flex items-center gap-2 text-amber-400",children:[e.jsx(Fr,{className:"w-3 h-3"})," ",N||"Recording failed",e.jsx("button",{onClick:()=>G({roomName:r,sessionId:f}),className:"underline decoration-dotted underline-offset-2 hover:text-[#D4AF37]",children:"Retry"})]})]})},Me="#D4AF37";function Ur(r){return r&&r.replace(/<\/?t>/gi,"").replace(/<\/?[a-z_]+>/gi,"").replace(/\n{3,}/g,`

`).trim()}function Gr({onClose:r}){const[f,C]=a.useState("idle"),[A,B]=a.useState({done:0,total:0}),[U,G]=a.useState([]),[Y,N]=a.useState(""),I=async()=>{C("loading");try{const v=await Br("akasha");if(!v||v.length===0){C("ready"),G([]);return}const R=(await Promise.all(v.map(async j=>{const D=Ur([j.opening_hook,j.prose_woven,j.closing_reflection].filter(Boolean).join(`

`));let k=[];try{k=await Pr(j.id)}catch{k=[]}return{id:j.id,title:j.title,content:D,transmitters:k,order_index:j.order_index}}))).filter(j=>j.content&&j.content.trim().length>0);C("classifying"),B({done:0,total:R.length});const P=6,m=[];for(let j=0;j<R.length;j+=P){const D=R.slice(j,j+P),k=D.map(w=>({id:w.id,title:w.title,content:w.content.slice(0,1500)}));try{const{data:w,error:E}=await u.functions.invoke("gemini-bridge",{body:{messages:[{role:"user",content:`You are identifying which chapters below are teachings on specific Bhagavad Gita verses. For EACH chapter, determine: is it a commentary/teaching tied to a specific Bhagavad Gita chapter and verse? If yes, give your best-guess chapter (1-18) and verse number. If it's general spiritual knowledge not tied to a specific Gita verse (even if Gita-adjacent), mark is_gita false.

Respond ONLY with a JSON array, no markdown fences, no preamble, in this exact shape:
[{"id":"...", "is_gita": true, "chapter": 4, "verse": 26, "confidence": "high", "reason": "short reason"}, ...]

Chapters:
${JSON.stringify(k)}`}]}});if(E)throw E;let W=w?.response?.trim()||"[]";W=W.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();const ee=JSON.parse(W),Q={};ee.forEach(K=>{Q[K.id]=K}),D.forEach(K=>{const J=Q[K.id]||{};m.push({id:K.id,title:K.title,content:K.content,transmitters:K.transmitters,is_gita:!!J.is_gita,chapter:J.chapter||null,verse:J.verse||null,confidence:J.confidence||"low",reason:J.reason||""})})}catch(w){console.warn("Batch classification failed, keeping entries unclassified:",w),D.forEach(E=>{m.push({id:E.id,title:E.title,content:E.content,transmitters:E.transmitters,is_gita:!1,chapter:null,verse:null,confidence:"low",reason:"classification failed"})})}B({done:Math.min(j+P,R.length),total:R.length})}G(m),C("ready")}catch(v){console.error("Export failed:",v),N(v?.message||"Unknown error"),C("error"),S.error(`Export failed: ${v?.message||"unknown error"}`)}},z=U.filter(v=>v.is_gita&&v.chapter).sort((v,$)=>v.chapter-$.chapter||(v.verse||0)-($.verse||0));return f==="ready"&&U.length>0?e.jsxs("div",{style:{position:"fixed",inset:0,background:"#050505",zIndex:60,overflowY:"auto",padding:"24px 20px"},children:[e.jsxs("div",{className:"no-print",style:{display:"flex",gap:10,marginBottom:20},children:[e.jsx("button",{onClick:()=>window.print(),style:{flex:1,padding:"12px",borderRadius:14,background:Me,color:"#050505",fontWeight:900,fontSize:12,letterSpacing:"0.05em",textTransform:"uppercase",border:"none",cursor:"pointer"},children:"Save as PDF (Print)"}),e.jsx("button",{onClick:r,style:{padding:"12px 18px",borderRadius:14,background:"rgba(255,255,255,0.05)",color:"#fff",fontWeight:700,fontSize:12,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer"},children:"Close"})]}),e.jsx("h1",{style:{color:Me,fontSize:22,fontWeight:900,marginBottom:4},children:"Akashic Codex — Bhagavad Gita Extract"}),e.jsxs("p",{style:{color:"rgba(255,255,255,0.5)",fontSize:12,marginBottom:28},children:[z.length," chapters matched to a Gita chapter/verse, out of ",U.length," scanned. Chapter/verse are Gemini's best guess — please review before transmitting."]}),z.length===0?e.jsx("div",{style:{textAlign:"center",padding:40,color:"rgba(255,255,255,0.4)",fontSize:13},children:"None of your Codex chapters were confidently matched to a specific Gita verse."}):z.map(v=>e.jsxs("div",{style:{marginBottom:26,pageBreakInside:"avoid"},children:[e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"baseline",marginBottom:4},children:[e.jsxs("span",{style:{color:Me,fontWeight:900,fontSize:14},children:["BG ",v.chapter,".",v.verse||"?"]}),e.jsxs("span",{style:{color:"rgba(255,255,255,0.4)",fontSize:10,textTransform:"uppercase"},children:[v.confidence," confidence"]})]}),e.jsx("div",{style:{color:"#fff",fontWeight:700,fontSize:13,marginBottom:4},children:v.title}),v.transmitters?.length>0&&e.jsxs("div",{style:{color:Me,fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:6},children:["Channelled through: ",v.transmitters.join(", ")]}),e.jsx("div",{style:{color:"rgba(255,255,255,0.8)",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"},children:v.content}),v.reason&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.3)",fontSize:10,fontStyle:"italic",marginTop:6},children:["Why: ",v.reason]})]},v.id)),e.jsx("style",{children:`
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
          }
        `})]}):e.jsxs("div",{style:{position:"fixed",inset:0,background:"rgba(5,5,5,0.95)",zIndex:60,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"},children:[e.jsx("button",{onClick:r,style:{position:"absolute",top:20,right:20,background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:22,cursor:"pointer"},children:"✕"}),e.jsx("div",{style:{fontSize:40,marginBottom:16},children:"📖"}),e.jsx("h2",{style:{color:Me,fontSize:18,fontWeight:900,marginBottom:10},children:"Export Akashic Codex → Gita PDF"}),e.jsx("p",{style:{color:"rgba(255,255,255,0.5)",fontSize:13,marginBottom:24,maxWidth:320},children:"Pulls every chapter from your actual Akashic Codex, asks Gemini which Bhagavad Gita chapter and verse each one belongs to, and lays it out so you can review and copy into the Gita space."}),f==="idle"&&e.jsx("button",{onClick:I,style:{padding:"14px 28px",borderRadius:16,background:Me,color:"#050505",fontWeight:900,fontSize:13,letterSpacing:"0.05em",textTransform:"uppercase",border:"none",cursor:"pointer"},children:"Start"}),f==="loading"&&e.jsx("div",{style:{color:"rgba(255,255,255,0.6)",fontSize:13},children:"Loading your Codex chapters…"}),f==="classifying"&&e.jsxs("div",{style:{color:"rgba(255,255,255,0.6)",fontSize:13},children:["Identifying verses… ",A.done," / ",A.total]}),f==="ready"&&U.length===0&&e.jsx("div",{style:{color:"rgba(255,255,255,0.5)",fontSize:13},children:"No Akashic Codex chapters with content found."}),f==="error"&&e.jsxs("div",{style:{color:"#e07070",fontSize:13},children:["Something went wrong: ",Y,e.jsx("div",{style:{marginTop:12},children:e.jsx("button",{onClick:I,style:{padding:"8px 16px",borderRadius:10,background:"rgba(255,255,255,0.08)",color:"#fff",border:"none",cursor:"pointer",fontSize:12},children:"Retry"})})]})]})}const Z="#D4AF37",Ce="#22D3EE",Yt=[{value:"free",label:"Atma-Seed (Free) — everyone"},{value:"prana-flow",label:"Prana-Flow and up"},{value:"siddha-quantum",label:"Siddha-Quantum and up"},{value:"akasha-infinity",label:"Akasha-Infinity only"}],mt=[{value:"en",label:"English"},{value:"sv",label:"Svenska"},{value:"no",label:"Norsk"},{value:"es",label:"Español"}],Hr=["Shiva Siddhananda","Karaveera Nivasini Dasi"],Yr=(()=>{const r=["Chitta Vritti","Turiya state","Turiya","Kutastha Chaitanya","Manomaya Kosha","Pranamaya Kosha","Annamaya Kosha","Vijnanamaya Kosha","Anandamaya Kosha","72,000 Nadis?","Nadis?","Sadhaka","Sadhana","Arjuna","Krishna","Bhagavan","Atma","Brahman","Purusha","Prakriti","Sattva","Rajas","Tamas","Dharma","Karma","Moksha","Samadhi","Bhakti","Jnana","Kriya Yoga","Kriya","Pranayama","Prana","Kundalini","Sushumna","Ida","Pingala","Muladhara","Svadhishthana","Manipura","Anahata","Vishuddha","Ajna","Sahasrara","Aum","Om","Maya","Avidya","Vairagya","Ahimsa","Mahavatar Babaji","Babaji","Vishwananda","Paramahansa Yogananda","Yogananda","Lahiri Mahasaya","Ramana Maharshi","Adi Shankara","Patanjali","Agni"];return new RegExp(`\\b(${r.join("|")})\\b`,"g")})();function Kr(r){if(!r)return r;const f=r.split(Yr);return f.length===1?r:f.map((C,A)=>A%2===1?e.jsx("span",{style:{color:Z,fontWeight:600},children:C},A):C)}function Jr(r){return Yt.find(f=>f.value===r)?.label||r}function Ve(r){return r==="free"?"rgba(255,255,255,0.35)":r==="prana-flow"?"#8DD9C9":r==="siddha-quantum"?Ce:Z}function Ze(r){return mt.find(f=>f.value===r)?.label||r}const Ht={chapter:"",verse_number:"",sanskrit:"",transliteration:"",translation:"",transmitted_by:"",language:"en",tier_required:"free"};function Qr({isAdmin:r,onBack:f}){const[C,A]=a.useState([]),[B,U]=a.useState(!0),[G,Y]=a.useState(!1),[N,I]=a.useState(!1),[z,v]=a.useState(!1),[$,R]=a.useState(!1),[P,m]=a.useState([]),[j,D]=a.useState(!1),[k,w]=a.useState(""),[E,W]=a.useState(!1),[ee,Q]=a.useState(null),[K,J]=a.useState({}),[q,ge]=a.useState("en"),[ye,fe]=a.useState({}),[p,T]=a.useState(new Set),[H,re]=a.useState({}),[_,V]=a.useState({...Ht}),se=a.useCallback(async()=>{U(!0);const{data:s,error:x}=await u.from("bhagavad_gita_verses").select("*").order("chapter",{ascending:!0}).order("verse_number",{ascending:!0});x?(console.error("Failed to load Gita verses:",x),A([])):A(s||[]),U(!1)},[]);a.useEffect(()=>{se()},[se]);const ie=a.useCallback(async(s,x)=>{const y=`${s.id}:${x}`;T(O=>{if(O.has(y))return O;const X=new Set(O);return X.add(y),X});try{const{data:O,error:X}=await u.functions.invoke("gemini-bridge",{body:{messages:[{role:"user",content:`Translate the following spiritual teaching text into ${Ze(x)}. Preserve paragraph breaks exactly as they are. Return ONLY the translated text — no preamble, no quotes, no notes.

${s.translation}`}],feature:"gita_translation"}});if(X)throw X;const ce=O?.response?.trim();ce?fe(we=>({...we,[y]:ce})):(console.warn("Translation returned empty response:",O),re(we=>({...we,[y]:"empty response from translator"})),S.error("Translation came back empty — check the gemini-bridge function logs in Supabase."))}catch(O){console.warn("Auto-translation failed:",O),re(X=>({...X,[y]:O?.message||"unknown error"})),S.error(`Couldn't auto-translate: ${O?.message||"unknown error"}`)}finally{T(O=>{const X=new Set(O);return X.delete(y),X})}},[]),de=a.useCallback(async()=>{D(!0);try{const{data:s,error:x}=await u.from("book_entries").select("id,title,content,tags,book_type,created_at").eq("is_archived",!1).order("created_at",{ascending:!1}).limit(200);if(x)throw x;m(s||[])}catch(s){console.warn("Could not load book entries:",s),m([])}finally{D(!1)}},[]),Ue=()=>{v(!0),P.length===0&&de()},Ge=s=>{V(x=>({...x,translation:s.content||""})),v(!1),Y(!0),S.success(`Imported "${s.title}" — add chapter, verse, and tier, then Transmit`)},tt=a.useCallback(async(s,x)=>{const y=parseInt(s,10),O=parseInt(x,10);if(!(!y||!O||y<1||y>18||O<1)){W(!0),Q(null);try{const X=await fetch(`https://vedicscriptures.github.io/slok/${y}/${O}`);if(!X.ok)throw new Error("not found");const ce=await X.json();if(!ce||!ce.slok)throw new Error("not found");V(we=>({...we,sanskrit:ce.slok.replace(/\n/g," ").trim(),transliteration:(ce.transliteration||"").replace(/\n/g," ").trim()})),Q("ok")}catch{Q("notfound")}finally{W(!1)}}},[]),Ie=()=>{tt(_.chapter,_.verse_number)},He=async()=>{if(!_.chapter||!_.verse_number||!_.translation.trim()){S.error("Chapter, verse number, and the teaching text are required.");return}I(!0);try{const{data:s}=await u.auth.getUser(),{error:x}=await u.from("bhagavad_gita_verses").upsert({chapter:parseInt(_.chapter,10),verse_number:parseInt(_.verse_number,10),sanskrit:_.sanskrit.trim()||null,transliteration:_.transliteration.trim()||null,translation:_.translation.trim(),transmitted_by:_.transmitted_by.trim()||null,language:_.language,tier_required:_.tier_required,is_published:!0,created_by:s?.user?.id||null},{onConflict:"chapter,verse_number,language"});if(x)throw x;S.success(`Chapter ${_.chapter}, Verse ${_.verse_number} (${Ze(_.language)}) transmitted — ${Jr(_.tier_required)}`),V(y=>({...Ht,transmitted_by:y.transmitted_by,language:y.language,tier_required:y.tier_required})),Q(null),se()}catch(s){S.error(s.message||"Could not save this verse.")}finally{I(!1)}},ve=s=>{V({chapter:String(s.chapter),verse_number:String(s.verse_number),sanskrit:s.sanskrit||"",transliteration:s.transliteration||"",translation:s.translation||"",transmitted_by:s.transmitted_by||"",language:s.language||"en",tier_required:s.tier_required||"free"}),Q(s.sanskrit?"ok":null),Y(!0)},Ye=async s=>{if(!confirm("Remove this verse?"))return;const{error:x}=await u.from("bhagavad_gita_verses").delete().eq("id",s);if(x){S.error(x.message);return}A(y=>y.filter(O=>O.id!==s))},he={};C.forEach(s=>{const x=`${s.chapter}:${s.verse_number}`;he[x]||(he[x]=[]),he[x].push(s)});const Le=Object.values(he).map(s=>{const x=s.find(X=>(X.language||"en")===q);if(x)return{...x,isFallbackTranslation:!1};const y=s.find(X=>(X.language||"en")==="en")||s[0],O=`${y.id}:${q}`;return{...y,translation:ye[O]||y.translation,isFallbackTranslation:!0,isTranslating:p.has(O),translationError:H[O],sourceLanguage:y.language||"en",translationKey:O}});a.useEffect(()=>{q!=="en"&&Le.forEach(s=>{s.isFallbackTranslation&&!ye[s.translationKey]&&!p.has(s.translationKey)&&ie(s,q)})},[q,C]);const $e=Le,oe={};$e.forEach(s=>{oe[s.chapter]||(oe[s.chapter]=[]),oe[s.chapter].push(s)});const Ke=Object.keys(oe).map(Number).sort((s,x)=>s-x);return e.jsxs("div",{className:"c-chat-view",children:[e.jsxs("div",{className:"c-chat-header",children:[e.jsx("button",{className:"c-back-btn",onClick:f,children:"←"}),e.jsx("div",{className:"c-chat-icon",children:"📜"}),e.jsxs("div",{className:"c-chat-title",children:[e.jsx("div",{className:"c-chat-name",children:"Bhagavad Gita"}),e.jsx("div",{className:"c-chat-sub",children:"Verse-by-verse wisdom — open to every tier"})]}),r&&e.jsx("button",{onClick:()=>Y(s=>!s),style:{marginLeft:"auto",padding:"8px 14px",borderRadius:14,background:G?"rgba(212,175,55,0.18)":"rgba(212,175,55,0.1)",border:`1px solid ${Z}55`,color:Z,fontSize:11,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"},children:G?"Close":"+ Add Verse"})]}),r&&G&&e.jsxs("div",{style:{margin:"14px 16px 0",maxHeight:"calc(100vh - 220px)",overflowY:"auto",padding:18,borderRadius:24,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(30px)"},children:[e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:12},children:"Transmit a verse"}),e.jsx("button",{onClick:Ue,style:{width:"100%",marginBottom:10,padding:"9px 12px",borderRadius:12,background:"rgba(34,211,238,0.08)",border:`1px solid ${Ce}44`,color:Ce,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"center"},children:"📖 Import from My Book"}),e.jsx("button",{onClick:()=>R(!0),style:{width:"100%",marginBottom:14,padding:"9px 12px",borderRadius:12,background:"rgba(212,175,55,0.06)",border:`1px solid ${Z}33`,color:Z,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"center"},children:"📄 Export Akashic Codex → Gita PDF"}),e.jsxs("div",{style:{display:"flex",gap:10,marginBottom:6},children:[e.jsx("input",{type:"number",min:1,max:18,placeholder:"Chapter (1–18)",value:_.chapter,onChange:s=>V(x=>({...x,chapter:s.target.value})),onBlur:Ie,style:je}),e.jsx("input",{type:"number",min:1,placeholder:"Verse #",value:_.verse_number,onChange:s=>V(x=>({...x,verse_number:s.target.value})),onBlur:Ie,style:je})]}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10,minHeight:16},children:E?"Fetching Sanskrit…":ee==="ok"?"✓ Sanskrit auto-filled below — edit if needed":ee==="notfound"?"Couldn't auto-find this verse — paste Sanskrit manually below":"Enter chapter + verse, then tab out to auto-fill Sanskrit"}),e.jsx("textarea",{placeholder:"Sanskrit (auto-filled — editable)",value:_.sanskrit,onChange:s=>V(x=>({...x,sanskrit:s.target.value})),style:{...je,width:"100%",minHeight:50,marginBottom:10,resize:"vertical"}}),e.jsx("input",{type:"text",placeholder:"Transliteration (auto-filled — editable)",value:_.transliteration,onChange:s=>V(x=>({...x,transliteration:s.target.value})),style:{...je,width:"100%",marginBottom:14}}),e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8},children:"Language of this transmission"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14},children:mt.map(s=>e.jsx("button",{onClick:()=>V(x=>({...x,language:s.value})),style:{padding:"7px 14px",borderRadius:12,fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${_.language===s.value?Ce:"rgba(255,255,255,0.08)"}`,background:_.language===s.value?`${Ce}22`:"rgba(255,255,255,0.02)",color:_.language===s.value?Ce:"rgba(255,255,255,0.6)"},children:s.label},s.value))}),e.jsx("textarea",{placeholder:"Your transmission — the deepening, the teaching (required)",value:_.translation,onChange:s=>V(x=>({...x,translation:s.target.value})),style:{...je,width:"100%",minHeight:140,marginBottom:10,resize:"vertical"}}),e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8},children:"Transmitted by"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8},children:Hr.map(s=>e.jsx("button",{onClick:()=>V(x=>({...x,transmitted_by:s})),style:{padding:"6px 12px",borderRadius:12,fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${_.transmitted_by===s?Z:"rgba(255,255,255,0.08)"}`,background:_.transmitted_by===s?`${Z}22`:"rgba(255,255,255,0.02)",color:_.transmitted_by===s?Z:"rgba(255,255,255,0.6)"},children:s},s))}),e.jsx("input",{type:"text",placeholder:"Or type a name (e.g. a guest teacher)",value:_.transmitted_by,onChange:s=>V(x=>({...x,transmitted_by:s.target.value})),style:{...je,width:"100%",marginBottom:14}}),e.jsx("div",{style:{fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8},children:"Who receives this verse"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14},children:Yt.map(s=>e.jsx("button",{onClick:()=>V(x=>({...x,tier_required:s.value})),style:{padding:"7px 12px",borderRadius:12,fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${_.tier_required===s.value?Ve(s.value):"rgba(255,255,255,0.08)"}`,background:_.tier_required===s.value?`${Ve(s.value)}22`:"rgba(255,255,255,0.02)",color:_.tier_required===s.value?Ve(s.value):"rgba(255,255,255,0.6)"},children:s.label},s.value))}),e.jsx("button",{onClick:He,disabled:N,style:{width:"100%",padding:"12px",borderRadius:16,background:Z,color:"#050505",fontWeight:900,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",border:"none",cursor:N?"not-allowed":"pointer",opacity:N?.6:1},children:N?"Transmitting…":"Transmit Verse"})]}),e.jsx("div",{style:{display:"flex",gap:6,padding:"12px 16px 0",flexWrap:"wrap"},children:mt.map(s=>e.jsx("button",{onClick:()=>ge(s.value),style:{padding:"5px 12px",borderRadius:10,fontSize:10,fontWeight:800,letterSpacing:"0.05em",cursor:"pointer",border:`1px solid ${q===s.value?Z:"rgba(255,255,255,0.08)"}`,background:q===s.value?`${Z}18`:"transparent",color:q===s.value?Z:"rgba(255,255,255,0.4)"},children:s.label},s.value))}),e.jsx("div",{style:{flex:1,overflowY:"auto",padding:"16px 16px 48px"},children:B?e.jsx("div",{style:{textAlign:"center",padding:40,color:"rgba(255,255,255,0.4)",fontSize:13},children:"Loading the Gita…"}):$e.length===0?e.jsx("div",{style:{textAlign:"center",padding:40,color:"rgba(255,255,255,0.4)",fontSize:13},children:r?"No verses yet — tap + Add Verse to transmit the first one.":"No verses available for your tier yet."}):Ke.map(s=>{const x=K[s];return e.jsxs("div",{style:{marginBottom:18},children:[e.jsxs("button",{onClick:()=>J(y=>({...y,[s]:!y[s]})),style:{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 4px",background:"transparent",border:"none",borderBottom:`1px solid ${Z}33`,color:Z,cursor:"pointer"},children:[e.jsxs("span",{style:{fontWeight:900,fontSize:14,letterSpacing:"-0.02em"},children:["Chapter ",s]}),e.jsxs("span",{style:{fontSize:11,color:"rgba(255,255,255,0.4)"},children:[oe[s].length," verse",oe[s].length===1?"":"s"," ",x?"▸":"▾"]})]}),!x&&oe[s].map(y=>e.jsxs("div",{style:{marginTop:12,padding:16,borderRadius:24,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",backdropFilter:"blur(30px)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},children:[e.jsxs("div",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.15em",color:"rgba(255,255,255,0.4)"},children:[s,".",y.verse_number]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{fontSize:9,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",padding:"3px 8px",borderRadius:8,color:Ve(y.tier_required),border:`1px solid ${Ve(y.tier_required)}55`},children:y.tier_required.replace("-"," ")}),r&&!y.isFallbackTranslation&&e.jsx("button",{onClick:()=>ve(y),style:{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:13},title:"Edit verse",children:"✎"}),r&&!y.isFallbackTranslation&&e.jsx("button",{onClick:()=>Ye(y.id),style:{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:13},title:"Remove verse",children:"🗑"})]})]}),y.sanskrit&&e.jsx("div",{style:{fontSize:15,lineHeight:1.7,color:Z,marginBottom:6,fontWeight:600},children:y.sanskrit}),y.transliteration&&e.jsx("div",{style:{fontSize:12,fontStyle:"italic",color:"rgba(255,255,255,0.5)",marginBottom:8},children:y.transliteration}),y.isFallbackTranslation&&e.jsx("div",{style:{fontSize:10,color:y.translationError?"#e07070":"rgba(255,255,255,0.35)",fontStyle:"italic",marginBottom:6},children:y.isTranslating?"Translating…":y.translationError?`Translation failed (${y.translationError}) — showing ${Ze(y.sourceLanguage)} original`:`Auto-translated from ${Ze(y.sourceLanguage)}`}),e.jsx("div",{style:{fontSize:14,lineHeight:1.7,color:"rgba(255,255,255,0.9)",whiteSpace:"pre-wrap"},children:Kr(y.translation)}),y.transmitted_by&&e.jsxs("div",{style:{marginTop:12,paddingTop:10,borderTop:`1px solid ${Z}22`,fontSize:12,fontWeight:700,letterSpacing:"0.03em",fontStyle:"italic",color:Z},children:["— transmitted by ",y.transmitted_by]})]},y.id))]},s)})}),z&&e.jsxs("div",{style:{position:"fixed",inset:0,background:"rgba(5,5,5,0.92)",backdropFilter:"blur(20px)",zIndex:50,display:"flex",flexDirection:"column",padding:"20px 16px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14},children:[e.jsx("div",{style:{fontSize:15,fontWeight:900,color:Z},children:"Import from My Book"}),e.jsx("button",{onClick:()=>v(!1),style:{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:20,cursor:"pointer"},children:"✕"})]}),e.jsx("input",{type:"text",placeholder:"Search your Life Book & Akashic Codex entries…",value:k,onChange:s=>w(s.target.value),style:{...je,width:"100%",marginBottom:14}}),e.jsx("div",{style:{flex:1,overflowY:"auto"},children:j?e.jsx("div",{style:{textAlign:"center",padding:30,color:"rgba(255,255,255,0.4)",fontSize:13},children:"Loading your book…"}):(()=>{const s=P.filter(x=>{if(!k.trim())return!0;const y=k.toLowerCase();return x.title?.toLowerCase().includes(y)||x.content?.toLowerCase().includes(y)||x.tags?.some(O=>O.toLowerCase().includes(y))});return s.length===0?e.jsxs("div",{style:{textAlign:"center",padding:30,color:"rgba(255,255,255,0.4)",fontSize:13},children:["No entries found",k?" for that search":"","."]}):s.map(x=>e.jsxs("button",{onClick:()=>Ge(x),style:{display:"block",width:"100%",textAlign:"left",padding:14,marginBottom:10,borderRadius:18,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",cursor:"pointer"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4},children:[e.jsx("div",{style:{fontSize:13,fontWeight:700,color:"#fff"},children:x.title}),e.jsx("div",{style:{fontSize:9,fontWeight:800,color:x.book_type==="akashic_codex"?Z:Ce,textTransform:"uppercase"},children:x.book_type==="akashic_codex"?"Akashic Codex":"Life Book"})]}),e.jsxs("div",{style:{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.5},children:[(x.content||"").slice(0,140),x.content?.length>140?"…":""]})]},x.id))})()})]}),$&&e.jsx(Gr,{onClose:()=>R(!1)})]})}const je={padding:"10px 12px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:13,outline:"none",flex:1},pe=[{id:"divine-sangha",name:"Divine Sangha",icon:"🔱",description:"Open space for all members",access:"public"},{id:"bhagavad-gita",name:"Bhagavad Gita",icon:"📜",description:"Verse-by-verse wisdom — open to every tier",access:"tiered",minTierRank:0},{id:"sacred-mantras",name:"Sacred Mantras",icon:"ॐ",description:"Mantra questions & discussion — Prana-Flow and up",access:"tiered",minTierRank:1},{id:"healing-circle",name:"Healing Blessings",icon:"✦",description:"Open to everyone seeking healing blessings",access:"public"},{id:"siddha-masters",name:"Siddha Masters",icon:"☀",description:"Akasha-Infinity members",access:"tiered",minTierRank:3},{id:"bhakti-algorithm-lab",name:"Bhakti Algorithm Lab",icon:"⚡",description:"Siddha-Quantum and up",access:"tiered",minTierRank:2},{id:"stargate",name:"Stargate",icon:"⭐",description:"Stargate membership",access:"private"},{id:"sadhana",name:"Sadhana",icon:"🪔",description:"Special invite from admin only",access:"invite"}],Xr=`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');

.c-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  min-height: 280px;
  background: #050505;
  font-family: 'Plus Jakarta Sans', sans-serif;
  overflow: hidden;
  position: relative;
}

/* ── PRESENCE BANNER ── */
.c-banner {
  flex-shrink: 0;
  margin: 10px 14px 0;
  padding: 9px 18px;
  background: linear-gradient(90deg,rgba(212,175,55,.05),rgba(212,175,55,.12),rgba(212,175,55,.05));
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 40px;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .4em;
  text-transform: uppercase;
  color: rgba(212,175,55,.85);
  text-align: center;
  position: relative;
  overflow: hidden;
}
.c-banner::before {
  content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.07),transparent);
  animation:shimmer 3.5s infinite linear;
}
@keyframes shimmer{0%{left:-100%}100%{left:100%}}
.c-pulse{display:inline-block;width:6px;height:6px;background:#D4AF37;border-radius:50%;margin-right:8px;animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ── MOBILE TOP TABS ── */
.c-top-tabs {
  flex-shrink: 0;
  display: flex;
  margin: 10px 14px 0;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 40px;
  padding: 3px;
  gap: 2px;
}
.c-top-tab {
  flex: 1;
  background: transparent;
  border: none;
  border-radius: 40px;
  color: rgba(255,255,255,.35);
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  padding: 8px 4px;
  cursor: pointer;
  transition: all .25s;
}
.c-top-tab.active {
  background: rgba(212,175,55,.12);
  color: #D4AF37;
  box-shadow: 0 0 10px rgba(212,175,55,.1);
}

/* ── MAIN BODY ── */
.c-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  margin-top: 10px;
}

/* ─── CHANNEL LIST VIEW ─── */
.c-channels-view {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 14px calc(64px + max(14px, env(safe-area-inset-bottom)));
}
.c-channels-view::-webkit-scrollbar{width:2px}
.c-channels-view::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2)}

.c-section-label {
  font-weight: 800;
  font-size: 8px;
  letter-spacing: .5em;
  text-transform: uppercase;
  color: rgba(212,175,55,.4);
  padding: 14px 6px 8px;
}

.c-channel-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 13px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px;
  margin-bottom: 7px;
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .12s;
  background: rgba(255,255,255,.03);
  width: 100%;
  text-align: left;
  position: relative;
}
.c-channel-row:hover, .c-channel-row:active {
  background: rgba(212,175,55,.07);
  border-color: rgba(212,175,55,.22);
}
.c-channel-row:active { transform: scale(.99); }
.c-channel-row.locked { opacity: .4; }

.c-ch-icon {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  background: linear-gradient(145deg, #17140a, #0a0a0a);
  border: 1px solid rgba(212,175,55,.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.c-ch-icon.sacred { background:linear-gradient(145deg, rgba(34,211,238,.14), #0a0a0a); border-color:rgba(34,211,238,.3); }
.c-ch-icon.private { background:linear-gradient(145deg, rgba(212,175,55,.1), #0a0a0a); border-color:rgba(212,175,55,.16); }

.c-ch-info { flex: 1; min-width: 0; }
.c-ch-name {
  font-weight: 800;
  font-size: 14.5px;
  letter-spacing: -.02em;
  color: rgba(255,255,255,.95);
}
.c-ch-desc {
  font-size: 11.5px;
  color: rgba(255,255,255,.4);
  margin-top: 2px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-ch-arrow {
  color: rgba(212,175,55,.4);
  font-size: 17px;
  flex-shrink: 0;
}
.c-lock-badge {
  font-size: 13px;
  flex-shrink: 0;
}

/* ─── CHAT VIEW ─── */
.c-chat-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.c-chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(5,5,5,.9);
  border-bottom: 1px solid rgba(255,255,255,.05);
  backdrop-filter: blur(20px);
  position: relative;
}
.c-chat-header::after {
  content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.12),transparent);
}

.c-back-btn {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  color: rgba(255,255,255,.6);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .2s;
}
.c-back-btn:hover { background:rgba(212,175,55,.08); border-color:rgba(212,175,55,.2); color:#D4AF37; }

.c-chat-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  background: linear-gradient(145deg, #17140a, #0a0a0a);
  border: 1px solid rgba(212,175,55,.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 900;
  color: rgba(212,175,55,.75);
  flex-shrink: 0;
}

.c-chat-title { flex: 1; min-width: 0; }
.c-chat-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  letter-spacing: .03em;
}
.c-chat-sub {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(212,175,55,.4);
  margin-top: 1px;
}

/* GO LIVE BTN in header */
.c-golive-header-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg,rgba(212,175,55,.12),rgba(212,175,55,.22));
  border: 1px solid rgba(212,175,55,.35);
  border-radius: 20px;
  color: #D4AF37;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  padding: 7px 12px;
  cursor: pointer;
  transition: all .3s;
  white-space: nowrap;
}
.c-golive-header-btn:hover { background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.3)); }
.c-golive-active {
  background: rgba(255,59,48,.15);
  border-color: rgba(255,59,48,.4);
  color: #ff6b61;
  animation: pulse 1.5s ease-in-out infinite;
}

/* ── GO LIVE OPTIONS DROPDOWN ── */
.c-golive-options {
  position: absolute;
  top: calc(100% + 6px);
  right: 14px;
  width: 260px;
  background: rgba(10,10,12,.98);
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 20px;
  padding: 8px;
  z-index: 200;
  box-shadow: 0 8px 40px rgba(0,0,0,.7);
}
.c-golive-opt {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  transition: background .2s;
  text-align: left;
}
.c-golive-opt:hover { background:rgba(212,175,55,.07); }
.c-golive-opt-icon { font-size: 22px; flex-shrink: 0; }
.c-golive-opt strong { display:block; font-weight:800; font-size:13px; color:#fff; }
.c-golive-opt span { display:block; font-size:10px; color:rgba(255,255,255,.4); margin-top:2px; }

/* ── MESSAGES ── */
.c-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.c-messages::-webkit-scrollbar{width:2px}
.c-messages::-webkit-scrollbar-thumb{background:rgba(212,175,55,.15)}

.c-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.c-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: .5; }
.c-empty-title {
  font-family: 'Cinzel', serif;
  font-size: 17px;
  font-weight: 700;
  color: #D4AF37;
  margin-bottom: 6px;
}
.c-empty-sub {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(255,255,255,.25);
}
.c-skip-loading-btn {
  margin-top: 16px;
  padding: 10px 20px;
  font-size: 12px;
  font-weight: 600;
  color: #D4AF37;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.3);
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s, border-color .2s;
}
.c-skip-loading-btn:hover {
  background: rgba(212,175,55,.2);
  border-color: rgba(212,175,55,.5);
}

.c-date-divider {
  display: flex;
  justify-content: center;
  margin: 16px 0 14px;
}
.c-date-text {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(255,255,255,.4);
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  padding: 6px 14px;
  border-radius: 20px;
  white-space: nowrap;
}

.c-msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 78%;
  align-self: flex-start;
  animation: msgIn .2s ease-out;
}
.c-msg-row.mine { align-self: flex-end; flex-direction: row-reverse; }
.c-msg-row.consecutive { margin-top: -2px; }
@keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

.c-avatar {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: linear-gradient(145deg, #17140a, #0a0a0a);
  border: 1px solid rgba(255,255,255,.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: rgba(212,175,55,.65);
  flex-shrink: 0;
  align-self: flex-end;
}
.c-avatar.mine { background:linear-gradient(145deg, rgba(212,175,55,.3), rgba(212,175,55,.12)); color:#fff; }
.c-avatar.hidden { opacity: 0; pointer-events: none; }

.c-msg-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.c-msg-meta {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-bottom: 3px;
  padding-left: 2px;
}
.c-msg-author { font-weight:900; font-size:11.5px; letter-spacing:-.01em; color:#D4AF37; }
.c-msg-role { font-size:8px; font-weight:800; letter-spacing:.3em; text-transform:uppercase; color:rgba(212,175,55,.35); }

.c-bubble {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 19px 19px 19px 5px;
  padding: 10px 14px 8px;
  color: rgba(255,255,255,.88);
  font-size: 14px;
  line-height: 1.55;
  word-break: break-word;
  position: relative;
}
.c-bubble.mine {
  background: linear-gradient(135deg, rgba(212,175,55,.24), rgba(212,175,55,.11));
  border: 1px solid rgba(212,175,55,.32);
  border-radius: 19px 19px 5px 19px;
  color: #fff;
  box-shadow: 0 3px 16px rgba(212,175,55,.1);
}

.c-delete-btn {
  position: absolute;
  top: 5px; right: 8px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,.15);
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: opacity .2s;
  line-height: 1;
  padding: 0;
}
.c-bubble:hover .c-delete-btn { opacity: 1; }

.c-msg-time {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,.32);
  margin-top: 3px;
  padding-left: 2px;
}
.c-msg-time.mine { text-align: right; padding-right: 2px; padding-left: 0; display:flex; justify-content:flex-end; align-items:center; gap:4px; color: rgba(255,255,255,.4); }

.c-msg-sent {
  font-size: 11px;
  font-weight: 700;
  color: #D4AF37;
  display: inline;
}
.c-msg-sent.mine { text-align: right; }

.c-reactions { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px; }
.c-reaction {
  background: rgba(212,175,55,.06);
  border: 1px solid rgba(212,175,55,.1);
  border-radius: 20px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: rgba(255,255,255,.7);
  transition: all .2s;
}
.c-reaction:hover { background:rgba(212,175,55,.12); }
.c-reaction.active { border-color:rgba(212,175,55,.3); background:rgba(212,175,55,.12); }
.c-reaction-count { font-size:10px; font-weight:800; color:rgba(212,175,55,.6); }

/* ── INPUT BAR — NEVER CUT OFF ── */
/* ── CONTENT DROP CARD ── */
.c-drop-wrap { align-self: flex-start; max-width: 82%; width: 82%; margin: 4px 0; }
.c-drop-eyebrow { font-size: 8px; font-weight: 800; letter-spacing: .3em; text-transform: uppercase; color: rgba(212,175,55,.55); margin-bottom: 6px; padding-left: 4px; display: flex; align-items: center; gap: 6px; }
.c-drop-dot { width: 5px; height: 5px; border-radius: 50%; background: #D4AF37; }
.c-drop-card { border-radius: 22px; overflow: hidden; border: 1px solid rgba(212,175,55,.28); background: linear-gradient(180deg, rgba(212,175,55,.06), rgba(255,255,255,.02)); box-shadow: 0 10px 30px rgba(0,0,0,.4); }
.c-drop-media { height: 140px; position: relative; overflow: hidden; background: radial-gradient(ellipse at 30% 20%, rgba(212,175,55,.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(34,211,238,.1), transparent 55%), #0a0a0a; display: flex; align-items: center; justify-content: center; }
.c-drop-thumb-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .5; }
.c-drop-media::after { content: ''; position: absolute; inset: 0; backdrop-filter: blur(14px); background: rgba(5,5,5,.35); }
.c-drop-media.unlocked::after { content: none; }
.c-drop-play { position: relative; z-index: 2; width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 16px; backdrop-filter: blur(6px); cursor: pointer; color: #fff; }
.c-drop-lock { position: absolute; z-index: 3; top: 10px; right: 10px; width: 24px; height: 24px; border-radius: 8px; background: rgba(5,5,5,.7); border: 1px solid rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; font-size: 11px; }
.c-drop-duration { position: absolute; z-index: 3; bottom: 10px; left: 10px; font-size: 9px; font-weight: 800; letter-spacing: .1em; padding: 4px 9px; border-radius: 20px; background: rgba(5,5,5,.7); border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.75); }
.c-drop-player, .c-drop-audio-player { position: relative; z-index: 4; width: 100%; }
.c-drop-audio-player { position: absolute; bottom: 8px; left: 8px; right: 8px; width: calc(100% - 16px); height: 34px; }
.c-drop-body { padding: 13px 15px 15px; }
.c-drop-title { font-weight: 900; font-size: 14px; letter-spacing: -.02em; color: #fff; }
.c-drop-desc { font-size: 11.5px; color: rgba(255,255,255,.55); margin-top: 4px; line-height: 1.5; }
.c-drop-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.c-drop-price { font-size: 16px; font-weight: 900; color: #D4AF37; }
.c-drop-price span { font-size: 9px; font-weight: 700; color: rgba(255,255,255,.35); margin-left: 4px; }
.c-unlock-btn { background: radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%); color: #1a1300; border: none; padding: 8px 16px; border-radius: 13px; font-weight: 900; font-size: 11.5px; cursor: pointer; box-shadow: 0 6px 16px rgba(212,175,55,.25); }
.c-unlock-btn.owned { background: rgba(34,211,238,.12); color: #22D3EE; border: 1px solid rgba(34,211,238,.35); box-shadow: none; }
.c-unlock-btn:disabled { opacity: .5; cursor: default; }

.c-input-bar {
  flex-shrink: 0;
  padding: 10px 14px calc(64px + max(14px, env(safe-area-inset-bottom)));
  background: rgba(5,5,5,.85);
  border-top: 1px solid rgba(255,255,255,.05);
}
.c-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 26px;
  padding: 5px 6px 5px 18px;
  transition: border-color .2s, box-shadow .2s;
}
.c-input-row:focus-within {
  border-color: rgba(212,175,55,.32);
  box-shadow: 0 0 0 3px rgba(212,175,55,.06);
}
.c-input-row input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,.92);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14.5px;
}
.c-input-row input::placeholder { color: rgba(255,255,255,.25); }
.c-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%);
  border: none;
  color: #1a1300;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(212,175,55,.3);
  transition: transform .12s ease, opacity .2s;
}
.c-send-btn:active { transform: scale(.92); }
.c-send-btn:disabled { opacity: .25; cursor: default; box-shadow: none; }

/* ── FEED VIEW ── */
.c-feed-view {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}
.c-feed-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
}
.c-feed-author {
  font-weight: 800;
  font-size: 13px;
  color: #D4AF37;
}
.c-feed-time {
  font-size: 10px;
  color: rgba(255,255,255,.25);
  margin-left: 8px;
}
.c-feed-text {
  color: rgba(255,255,255,.8);
  font-size: 14px;
  line-height: 1.6;
  margin-top: 8px;
}

/* ── MEMBERS VIEW ── */
.c-members-view {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px calc(64px + max(14px, env(safe-area-inset-bottom)));
}
.c-member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: background .2s;
}
.c-member-row:hover { background: rgba(212,175,55,.05); }
.c-member-avatar {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 14px;
  color: #D4AF37;
  overflow: hidden;
  object-fit: cover;
}
.c-member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.c-member-name {
  font-weight: 800;
  font-size: 14px;
  color: rgba(255,255,255,.9);
}
.c-member-status {
  font-size: 10px;
  color: rgba(255,255,255,.3);
}

/* ── VIDEO CALL BUTTON (DMs) ── */
.c-video-call-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg,rgba(34,211,238,.12),rgba(34,211,238,.22));
  border: 1px solid rgba(34,211,238,.35);
  border-radius: 20px;
  color: #22d3ee;
  font-weight: 800;
  font-size: 9px;
  letter-spacing: .25em;
  text-transform: uppercase;
  padding: 7px 12px;
  cursor: pointer;
  transition: all .3s;
  white-space: nowrap;
}
.c-video-call-btn:hover { background:linear-gradient(135deg,rgba(34,211,238,.2),rgba(34,211,238,.3)); }
.c-video-call-btn:disabled { opacity:.4; cursor:default; }

/* ── LIVE PILL (small, in header, max 36px, dismissible) ── */
.c-live-pill-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  max-height: 36px;
  margin-left: auto;
}
.c-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-height: 36px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255,59,48,.15), rgba(212,175,55,.12));
  border: 1px solid rgba(255,59,48,.3);
  border-radius: 18px;
  color: #ff6b61;
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.c-live-pill:hover {
  background: linear-gradient(135deg, rgba(255,59,48,.25), rgba(212,175,55,.18));
}
.c-live-pill-dismiss {
  padding: 2px 6px;
  font-size: 12px;
  color: rgba(255,255,255,.5);
  cursor: pointer;
  border-radius: 50%;
}
.c-live-pill-dismiss:hover {
  color: rgba(255,255,255,.9);
}

/* ── LIVE IFRAME ── */
.c-live-frame {
  flex-shrink: 0;
  background: #000;
  border-bottom: 1px solid rgba(212,175,55,.15);
}
.c-live-frame iframe {
  width: 100%;
  height: 300px;
  border: none;
}

/* ── DESKTOP ── */
@media (min-width: 768px) {
  .c-top-tabs { display: none; }
  .c-body { gap: 0; }
  .c-live-frame iframe { height: 400px; }
}
`;function Kt(){const r=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/aac","audio/ogg;codecs=opus"];if(typeof MediaRecorder<"u"&&MediaRecorder.isTypeSupported){for(const f of r)if(MediaRecorder.isTypeSupported(f))return f}return""}function Zr({partnerId:r,onBack:f,isAdmin:C,onVideoCall:A,dmVideoUrl:B,onEndVideoCall:U,onDmSent:G}){const{user:Y}=et(),{messages:N,partnerProfile:I,isLoading:z,sendMessage:v}=qr(r),[$,R]=a.useState(""),[P,m]=a.useState(!1),[j,D]=a.useState(!1),[k,w]=a.useState(0),E=a.useRef(null),W=a.useRef([]),ee=a.useRef(null),Q=a.useRef(null),K=async()=>{const p=$.trim();p&&(R(""),await v(p,"text"),C&&G&&G(p,r))},J=async(p,T,H)=>{if(!Y)throw new Error("Not signed in");const re=H?.split(".").pop()||(T==="voice"?"webm":T==="video"?"mp4":"jpg"),_=`${Y.id}/${Date.now()}-${crypto.randomUUID()}.${re}`,{error:V}=await u.storage.from("chat-storage").upload(_,p,{upsert:!1,contentType:p.type||(T==="voice"?"audio/webm":void 0)});if(V)throw V;const{data:se}=u.storage.from("chat-storage").getPublicUrl(_);return{file_url:se.publicUrl,file_name:H||`${T}-${Date.now()}.${re}`,file_size:p.size||p.size||0,mime_type:p.type||(T==="voice"?"audio/webm":"")}},q=async(p,T,H,re)=>{m(!0);try{const _=await J(p,T,H);if(!await v(T==="voice"?"🎤 Voice message":T==="image"?"📷 Photo":"🎬 Video",T,{..._,duration:re}))throw new Error("Message not saved")}catch(_){console.error("[DMChatView] media send failed:",_),S.error(_?.message?.includes("column")||_?.code==="PGRST204"?"Media messages in DMs need one more update to be enabled — ask your developer to run the pending migration.":_.message||"Could not send media message.")}finally{m(!1)}},ge=p=>{const T=p.target.files?.[0];if(p.target.value="",!T)return;const H=T.type.startsWith("video/")?"video":"image";if(T.size>50*1024*1024){S.error("File is too large (50MB limit).");return}q(T,H,T.name)},ye=async()=>{try{const p=await navigator.mediaDevices.getUserMedia({audio:!0}),T=Kt(),H=T?new MediaRecorder(p,{mimeType:T}):new MediaRecorder(p),re=H.mimeType||T||"audio/webm",_=re.includes("mp4")?"m4a":re.includes("ogg")?"ogg":re.includes("aac")?"aac":"webm";W.current=[],H.ondataavailable=V=>{V.data.size>0&&W.current.push(V.data)},H.onstop=()=>{p.getTracks().forEach(ie=>ie.stop());const V=new Blob(W.current,{type:re}),se=k;V.size>0&&se>=1?q(V,"voice",`voice-note-${Date.now()}.${_}`,se):V.size===0&&S.error("Recording came out empty — try again.")},E.current=H,H.start(),D(!0),w(0),ee.current=setInterval(()=>w(V=>V+1),1e3)}catch(p){console.error("[DMChatView] mic access/recording failed:",p);const T=p instanceof DOMException&&p.name==="NotAllowedError"?"Microphone permission denied — check your browser/app settings.":"Couldn't start recording on this device.";S.error(T)}},fe=()=>{ee.current&&(clearInterval(ee.current),ee.current=null),D(!1),E.current?.stop(),E.current=null};return e.jsxs("div",{className:"c-chat-view",children:[e.jsxs("div",{className:"c-chat-header",children:[e.jsx("button",{className:"c-back-btn",onClick:f,children:"←"}),e.jsx("div",{className:"c-chat-icon",children:"👤"}),e.jsxs("div",{className:"c-chat-title",children:[e.jsx("div",{className:"c-chat-name",children:I?.full_name||"Direct Message"}),e.jsx("div",{className:"c-chat-sub",children:"Private 1-on-1 chat"})]}),B?e.jsx("button",{className:"c-video-call-btn",onClick:U,style:{marginLeft:"auto",borderColor:"rgba(255,59,48,.4)",color:"#ff6b61"},children:"⬛ END CALL"}):e.jsx("button",{className:"c-video-call-btn",onClick:A,style:{marginLeft:"auto"},children:"📹 VIDEO CALL"})]}),B&&e.jsx("div",{className:"c-live-frame",children:e.jsx("iframe",{src:B,allow:"camera;microphone;fullscreen;display-capture"})}),e.jsx("div",{className:"c-messages",children:z?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"⏳"}),e.jsx("div",{className:"c-empty-sub",children:"LOADING MESSAGES"})]}):N.length===0?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"👤"}),e.jsx("div",{className:"c-empty-title",children:I?.full_name||"Direct Message"}),e.jsx("div",{className:"c-empty-sub",children:"BE THE FIRST TO SPEAK"})]}):N.map(p=>{const T=p.sender_id===Y?.id,H=String(p.id||"").startsWith("temp-")||p.status==="pending";return["image","video","voice"].includes(p.message_type)&&p.file_url?e.jsx("div",{className:`c-msg-row ${T?"mine":""}`,children:e.jsxs("div",{className:"c-msg-body",children:[e.jsxs("div",{style:{maxWidth:260,borderRadius:18,overflow:"hidden",border:"1px solid rgba(255,255,255,.1)"},children:[p.message_type==="image"&&e.jsx("img",{src:p.file_url,alt:"",style:{display:"block",width:"100%",maxHeight:320,objectFit:"cover"}}),p.message_type==="video"&&e.jsx("video",{src:p.file_url,controls:!0,style:{display:"block",width:"100%",maxHeight:320}}),p.message_type==="voice"&&e.jsxs("div",{style:{padding:"10px 12px",background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{fontSize:15},children:"🎤"}),e.jsx("audio",{src:p.file_url,controls:!0,style:{height:32,flex:1}}),p.duration?e.jsxs("span",{style:{fontSize:10,color:"rgba(255,255,255,.4)"},children:[Math.floor(p.duration/60),":",(p.duration%60).toString().padStart(2,"0")]}):null]})]}),e.jsxs("div",{className:`c-msg-time ${T?"mine":""}`,children:[Ae(new Date(p.created_at),{addSuffix:!0}),T&&e.jsx("span",{className:"c-msg-sent mine",children:H?"○":"✓✓"})]})]})},p.id):e.jsx("div",{className:`c-msg-row ${T?"mine":""}`,children:e.jsxs("div",{className:"c-msg-body",children:[e.jsx("div",{className:`c-bubble ${T?"mine":""}`,children:typeof p.content=="string"&&p.content.startsWith("VIDEO_CALL:")?e.jsx("button",{type:"button",className:"c-video-call-btn",style:{color:"#22d3ee",borderColor:"rgba(34,211,238,.45)",background:"rgba(6,182,212,.12)"},onClick:()=>window.open(p.content.replace("VIDEO_CALL:",""),"_blank","noopener,noreferrer"),children:"🔗 JOIN VIDEO CALL"}):p.content}),e.jsxs("div",{className:`c-msg-time ${T?"mine":""}`,children:[Ae(new Date(p.created_at),{addSuffix:!0}),T&&e.jsx("span",{className:"c-msg-sent mine",children:H?"○":"✓✓"})]})]})},p.id)})}),e.jsxs("div",{className:"c-input-bar",children:[e.jsxs("div",{className:"c-input-row",children:[e.jsx("input",{type:"file",ref:Q,accept:"image/*,video/*",style:{display:"none"},onChange:ge}),j?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",gap:8,color:"#ff6b61",fontSize:13,fontWeight:700},children:[e.jsx("span",{style:{width:8,height:8,borderRadius:"50%",background:"#ff3b30",animation:"c-rec-pulse 1s infinite"}}),"Recording… ",Math.floor(k/60),":",(k%60).toString().padStart(2,"0")]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",onClick:()=>Q.current?.click(),disabled:P,style:{background:"none",border:"none",fontSize:19,cursor:"pointer",padding:"0 4px",opacity:P?.4:.75,flexShrink:0},title:"Send a photo or video",children:"📎"}),e.jsx("input",{placeholder:P?"Sending…":`Message ${I?.full_name||"them"}...`,value:$,onChange:p=>R(p.target.value),disabled:P,onKeyDown:p=>{p.key==="Enter"&&!p.shiftKey&&(p.preventDefault(),K())}})]}),!$.trim()&&!P?e.jsx("button",{type:"button",className:"c-send-btn",onClick:j?fe:ye,style:j?{background:"radial-gradient(circle at 30% 30%, #ff8a80, #ff3b30 75%)"}:void 0,title:j?"Stop and send":"Record a voice message",children:j?"⏹":"🎤"}):e.jsx("button",{className:"c-send-btn",onClick:K,disabled:!$.trim()||P,children:"➤"})]}),e.jsx("style",{children:"@keyframes c-rec-pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }"})]})]})}const va=()=>{const{user:r}=et(),{isAdmin:f}=Tr(),{isStargateMember:C}=Dr(),{groupUnreadByRoom:A,clearRoomUnread:B}=zr(),[U,G]=a.useState(!1),Y=Rr(),N=Wr();console.log("[Community] isAdmin:",f);const[I,z]=a.useState("chat"),[v,$]=a.useState([]),[R,P]=a.useState(!1),[m,j]=a.useState(null),[D,k]=a.useState(""),[w,E]=a.useState(!1),[W,ee]=a.useState(!1),[Q,K]=a.useState(0),J=a.useRef(null),q=a.useRef([]),ge=a.useRef(null),ye=a.useRef(null),[fe,p]=a.useState([]),[T,H]=a.useState(!1),[re,_]=a.useState(!1),[V,se]=a.useState(!1),[ie,de]=a.useState(null),[Ue,Ge]=a.useState(null),[tt,Ie]=a.useState(null),[He,ve]=a.useState([]),Ye=a.useRef(null),[he,Le]=a.useState(0),[$e,oe]=a.useState(""),[Ke,s]=a.useState("healing-chamber"),[x,y]=a.useState(!1),[O,X]=a.useState(null),[ce,we]=a.useState(""),[be,rt]=a.useState([]),[Fe,Jt]=a.useState(""),[at,it]=a.useState([]),[ea,pt]=a.useState(!1),[_e,Be]=a.useState([]),[Se,gt]=a.useState(""),[xe,ft]=a.useState(null),[Pe,We]=a.useState(!1),[ae,nt]=a.useState({}),[Qt,ht]=a.useState({}),[Xt,bt]=a.useState({}),[Je,Zt]=a.useState(null),er=a.useCallback(async()=>{if(!r)return;P(!0);const{data:t,error:i}=await u.rpc("get_my_library");i?(console.error("fetchLibrary error:",i),$([])):$((t||[]).map(n=>({id:n.content_id,title:n.title,description:n.description,content_type:n.content_type,thumbnail_url:n.thumbnail_url,duration_seconds:n.duration_seconds,price_cents:0,currency:n.currency||"eur",tier_required:"free"}))),P(!1)},[r]),xt=a.useCallback(async t=>{ht(i=>{const n=t.filter(o=>o&&!i[o]);return n.length>0&&u.from("content_vault").select("*").in("id",n).then(({data:o,error:l})=>{if(l){console.error("[Community] content_vault lookup failed:",l),bt(c=>{const b={...c};return n.forEach(d=>{b[d]=l.message||"Unknown error"}),b});return}o&&o.length>0?ht(c=>{const b={...c};return o.forEach(d=>{b[d.id]=d}),b}):bt(c=>{const b={...c};return n.forEach(d=>{b[d]="No row returned (RLS-hidden or deleted)"}),b})}),i})},[]),[tr,yt]=a.useState({}),[Ne,vt]=a.useState(""),[Qe,wt]=a.useState(null),[_t,St]=a.useState(null),[kt,rr]=a.useState(new Set),[ke,Ee]=a.useState(null),[jt,ar]=a.useState(null),[ir,nr]=a.useState(null),[sr,Ct]=a.useState(0),[or,Nt]=a.useState(0),[cr,lr]=a.useState(new Set),[dr,ur]=a.useState({}),[Re,st]=a.useState([]),[ot,Et]=a.useState(!1),Rt=a.useRef({});Rt.current=dr;const ze=a.useRef({}),qe=a.useMemo(()=>{const t={};return be.forEach(i=>{i.full_name&&(t[i.id]=i.full_name)}),ze.current=t,t},[be]),te=t=>!!t&&t.startsWith("dm-"),Te=(t,i)=>{if(!t.startsWith("dm-"))return null;const n=t.slice(3),o=36;if(n.length<o*2+1)return null;const l=n.slice(0,o),c=n.slice(o+1);return i===l?c:i===c?l:null},ue=a.useRef(null),ct=a.useRef({});ct.current=ae;const lt=a.useRef(N.fetchActiveSessions);lt.current=N.fetchActiveSessions,a.useEffect(()=>{if(!T){_(!1);return}const t=setTimeout(()=>_(!0),2e3);return()=>clearTimeout(t)},[T]),a.useEffect(()=>{const t=()=>{ke&&Ct(i=>i+1),ie&&Nt(i=>i+1)};return window.addEventListener("online",t),()=>window.removeEventListener("online",t)},[ke,ie]);const zt=a.useCallback(async t=>{if(!(!t||!r)){ue.current=t,H(!0);try{if(te(t)){const g=Te(t,r.id);if(!g){p([]);return}const F=4e3,h=new Promise((ne,ut)=>setTimeout(()=>ut(new Error("DM fetch timeout")),F)),M=Promise.all([u.from("private_messages").select("*").eq("sender_id",r.id).eq("receiver_id",g).order("created_at",{ascending:!0}),u.from("private_messages").select("*").eq("sender_id",g).eq("receiver_id",r.id).order("created_at",{ascending:!0})]);let L,le;try{[L,le]=await Promise.race([M,h])??[]}catch(ne){console.error("DM fetch error or timeout:",ne),ue.current===t&&p([]);return}if(ue.current!==t)return;const kr=L?.data??[],jr=le?.data??[];L.error&&console.error("Error loading DM sent:",L.error),le.error&&console.error("Error loading DM received:",le.error);const Cr=[...kr,...jr].sort((ne,ut)=>new Date(ne.created_at).getTime()-new Date(ut.created_at).getTime()),Nr=ze.current,Er=Cr.map(ne=>({id:ne.id,channel_id:t,user_id:ne.sender_id,content:ne.content,created_at:ne.created_at,user_name:ne.sender_id===r.id?"You":Nr[ne.sender_id]||"Member"}));p(Er);return}const i=ae[t];if(!i){p([]);return}const{data:n,error:o}=await u.from("chat_messages").select("*").eq("room_id",i).order("created_at",{ascending:!0}).limit(100);if(o){console.error("Error loading channel messages:",o),p([]);return}const l=ze.current,b=(n||[]).map(g=>({...g,user_name:g.user_name||(g.user_id===r?.id?"You":l[g.user_id]||"Member")}));p(b);const d=b.filter(g=>g.message_type==="content_drop"&&g.content_id).map(g=>g.content_id);d.length>0&&xt(d)}finally{ue.current===t&&(ue.current=null),H(!1)}}},[ae,r,xt]),De=a.useCallback(async()=>{We(!0);const{data:t,error:i}=await u.from("community_posts").select("id, user_id, content, created_at, image_url, audio_url, video_url, pdf_url, post_type, likes_count, comments_count").not("post_type","eq","live").order("created_at",{ascending:!1}).limit(30);if(i){console.error("Error loading community feed:",i),Be([]),We(!1);return}const o=(t||[]).filter(l=>l.post_type!=="live").map(l=>({...l,likes_count:l.likes_count??0,comments_count:l.comments_count??0,user_liked:!1}));if(r?.id){const l=o.map(d=>d.id),{data:c}=await u.from("post_likes").select("post_id").eq("user_id",r.id).in("post_id",l),b=new Set((c||[]).map(d=>d.post_id));o.forEach(d=>{d.user_liked=b.has(d.id)})}Be(o),We(!1)},[r?.id]),Tt=a.useRef(De);Tt.current=De;const Xe=a.useCallback(async t=>{const{data:i,error:n}=await u.from("post_comments").select("id, post_id, user_id, content, created_at").eq("post_id",t).order("created_at",{ascending:!0});if(n){console.error("Error loading comments:",n),yt(l=>({...l,[t]:[]}));return}const o=i||[];yt(l=>({...l,[t]:o.map(c=>({id:c.id,post_id:c.post_id,user_id:c.user_id,content:c.content,created_at:c.created_at,user_name:r?.id===c.user_id?"You":Rt.current[c.user_id]?.full_name??"Member"}))}))},[r?.id]),Dt=a.useCallback(async(t,i)=>{if(!r||!i.trim())return;wt(t);const{error:n}=await u.from("post_comments").insert({post_id:t,user_id:r.id,content:i.trim()});if(wt(null),vt(""),n){console.error("Failed to add comment:",n),S.error("Could not add comment.");return}const o=_e.find(l=>l.id===t);o&&(await u.from("community_posts").update({comments_count:(o.comments_count||0)+1}).eq("id",t),Be(l=>l.map(c=>c.id===t?{...c,comments_count:(c.comments_count||0)+1}:c))),await Xe(t),S.success("Comment added.")},[r,_e,Xe]),mr=a.useCallback(async t=>{if(!r){S.info("Sign in to like posts.");return}const i=_e.find(n=>n.id===t);i&&(St(t),i.user_liked?(await u.from("post_likes").delete().eq("post_id",t).eq("user_id",r.id),await u.from("community_posts").update({likes_count:Math.max(0,(i.likes_count||0)-1)}).eq("id",t),Be(n=>n.map(o=>o.id===t?{...o,user_liked:!1,likes_count:Math.max(0,(o.likes_count||0)-1)}:o))):(await u.from("post_likes").insert({post_id:t,user_id:r.id}),await u.from("community_posts").update({likes_count:(i.likes_count||0)+1}).eq("id",t),Be(n=>n.map(o=>o.id===t?{...o,user_liked:!0,likes_count:(o.likes_count||0)+1}:o))),St(null))},[r,_e]);a.useEffect(()=>{if(!r)return;const t=async()=>{try{let o=new Set;try{const{data:h}=await u.from("user_roles").select("user_id").eq("role","admin");o=new Set((h||[]).map(M=>M.user_id))}catch{}let l=u.from("profiles").select("*").limit(500);r?.id&&(l=l.neq("user_id",r.id));const{data:c,error:b}=await l;if(b){console.error("Error loading members:",b),rt([]);return}const d=c??[],g={};d.forEach(h=>{const M=h.user_id!=null?h.user_id:h.id;M&&(g[M]={full_name:h.full_name??null,avatar_url:h.avatar_url??null})}),ur(h=>({...h,...g}));const F=d.filter(h=>(h.user_id!=null?h.user_id:h.id)===r?.id?!1:(h.subscription_tier||h.role||"").toLowerCase()!=="admin").map(h=>{const M=h.user_id!=null?h.user_id:h.id;return{id:M,full_name:h.full_name??null,subscription_tier:h.subscription_tier??h.role??null,avatar_url:h.avatar_url??null,isAdmin:o.has(M)}}).sort((h,M)=>{if(h.isAdmin&&!M.isAdmin)return-1;if(!h.isAdmin&&M.isAdmin)return 1;const L=(h.full_name||"").toLowerCase(),le=(M.full_name||"").toLowerCase();return L.localeCompare(le)});rt(F)}catch(o){console.error("Failed to load members:",o),rt([])}},i=async()=>{const{data:o,error:l}=await u.from("chat_rooms").select("id, name").order("created_at",{ascending:!0});if(l){console.error("Error loading chat rooms:",l);return}const c={};(o||[]).forEach(g=>{const F=pe.find(h=>h.name===g.name);F&&(c[F.id]=g.id),(g.type==="sadhana"||g.name==="Sadhana")&&(c.sadhana=g.id),g.type==="stargate"&&(c.stargate=g.id),g.name==="Community Lounge"&&!c["divine-sangha"]&&(c["divine-sangha"]=g.id),g.name?.includes("Divine Sangha")&&!c["divine-sangha"]&&(c["divine-sangha"]=g.id),g.name?.includes("Sacred Mantra")&&!c["sacred-mantras"]&&(c["sacred-mantras"]=g.id),g.name?.includes("Healing")&&!c["healing-circle"]&&(c["healing-circle"]=g.id)});const d=pe.filter(g=>!c[g.id]);if(d.length>0){const g=d.map(async h=>{const{data:M,error:L}=await u.from("chat_rooms").insert({name:h.name}).select("id").single();if(!L&&M?.id)return{channelId:h.id,roomId:M.id};const{data:le}=await u.from("chat_rooms").select("id").eq("name",h.name).order("created_at",{ascending:!0}).limit(1);return le&&le.length>0?{channelId:h.id,roomId:le[0].id}:{channelId:h.id,roomId:null}});(await Promise.all(g)).forEach(h=>{h.roomId&&(c[h.channelId]=h.roomId)})}nt(c)};Promise.all([t(),i()]),(async()=>{const o=await Mr();if(o!=null){Le(o.total_profiles);return}const{count:l,error:c}=await u.from("profiles").select("id",{count:"exact",head:!0});!c&&l!=null&&Le(l)})()},[r?.id]),a.useEffect(()=>{if(!r?.id)return;const t=u.channel("community-presence");return t.on("presence",{event:"sync"},()=>{const i=t.presenceState(),n=new Set;Object.values(i).forEach(o=>{(o||[]).forEach(l=>{l?.user_id&&n.add(l.user_id)})}),n.add(r.id),rr(n)}).subscribe(async i=>{i==="SUBSCRIBED"&&await t.track({user_id:r.id})}),()=>{u.removeChannel(t)}},[r?.id]);const Mt=a.useCallback(async t=>{if(!r||!t||te(t)||ct.current[t])return;const n=pe.find(o=>o.id===t)?.name||t;try{let{data:o}=await u.from("chat_rooms").select("id").eq("name",n).maybeSingle();if(!o){const{data:l,error:c}=await u.from("chat_rooms").insert({name:n}).select("id").single();if(!c&&l)o=l;else{const{data:b}=await u.from("chat_rooms").select("id").eq("name",n).maybeSingle();b?o=b:console.error("Failed to create chat room:",c)}}if(o?.id){nt(c=>({...c,[t]:o.id}));const{error:l}=await u.from("chat_members").upsert({room_id:o.id,user_id:r.id},{onConflict:"room_id,user_id"});l&&console.warn("Could not join chat room as member:",t,l)}}catch(o){console.warn("Could not ensure room for channel:",t,o)}},[r]);a.useEffect(()=>{De()},[De]),a.useEffect(()=>{!r?.id||f||(async()=>{const{data:t}=await u.from("chat_rooms").select("id").eq("name","Sadhana").maybeSingle();if(!t?.id)return;const{data:i}=await u.from("chat_members").select("id").eq("room_id",t.id).eq("user_id",r.id).maybeSingle();G(!!i)})()},[r?.id,f]),a.useEffect(()=>{if(!r?.id)return;(async()=>{const{data:n}=await u.from("community_notifications").select("id, type, title, body, channel_id, link, is_read, created_at").eq("user_id",r.id).order("created_at",{ascending:!1}).limit(50);st(n||[])})();const i=u.channel(`notifs-${r.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"community_notifications",filter:`user_id=eq.${r.id}`},n=>{const o=n.new;st(l=>[{...o},...l.filter(c=>c.id!==o.id)])}).subscribe();return()=>{u.removeChannel(i)}},[r?.id]),a.useEffect(()=>{if(!(typeof localStorage<"u"?localStorage.getItem("push-permission-asked"):null)&&r?.id){typeof localStorage<"u"&&localStorage.setItem("push-permission-asked","1");const i=setTimeout(async()=>{try{await Ar()&&await u.from("profiles").update({push_enabled:!0}).eq("user_id",r.id)}catch{}},3e3);return()=>clearTimeout(i)}},[r?.id]),a.useEffect(()=>{Je&&Xe(Je)},[Je,Xe]),a.useEffect(()=>{const t=u.channel("community-feed").on("postgres_changes",{event:"*",schema:"public",table:"community_posts"},()=>{Tt.current()}).subscribe();return()=>{u.removeChannel(t)}},[]),a.useEffect(()=>{if(!m){ve([]),de(null);return}if(te(m)&&r){const l=Te(m,r.id);if(zt(m),l){const c=u.channel(`dm-${r.id}-${l}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},b=>{const d=b.new;if(!(d.sender_id===r.id&&d.receiver_id===l||d.sender_id===l&&d.receiver_id===r.id))return;const F=ze.current,h={id:d.id,channel_id:m,user_id:d.sender_id,content:d.content,created_at:d.created_at,user_name:d.sender_id===r.id?"You":F[d.sender_id]||"Member"};p(M=>M.some(L=>L.id===h.id)?M:[...M,h])}).subscribe();return()=>{u.removeChannel(c)}}return}let t=!1,i=null,n=null,o=null;return(async()=>{let l=ae[m];if(!l&&(await Mt(m),l=ct.current[m],!l||t)){t||(p([]),ve([]),de(null));return}if(t)return;r&&u.from("chat_members").upsert({room_id:l,user_id:r.id,role:"member"},{onConflict:"room_id,user_id"}).then(({error:b})=>{b&&console.error("[Community] chat_members auto-join failed:",b)}),H(!0);const c=lt.current;await Promise.all([(async()=>{ue.current=m;try{const{data:b,error:d}=await u.from("chat_messages").select("*").eq("room_id",l).order("created_at",{ascending:!0}).limit(100);if(t||ue.current!==m)return;if(d){p([]);return}const g=ze.current;p((b||[]).map(h=>({...h,user_name:h.user_id===r?.id?"You":g[h.user_id]||"Member"})))}finally{ue.current===m&&(ue.current=null),H(!1)}})(),c(m).then(b=>{t||ve(b)})]).catch(()=>{t||H(!1)}),!t&&(i=setInterval(()=>c(m).then(b=>{t||ve(b)}),3e4),n=u.channel(`room-${l}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages",filter:`room_id=eq.${l}`},b=>{const d=b.new,g=ze.current,F={...d,user_name:d.user_id===r?.id?"You":g[d.user_id]||"Member"};p(h=>{if(h.some(L=>L.id===F.id))return h;const M=h.findIndex(L=>L.id.startsWith("temp-")&&L.user_id===d.user_id&&L.content===d.content);if(M!==-1){const L=[...h];return L[M]=F,L}return[...h,F]})}).subscribe(),o=u.channel(`live-${m}`).on("postgres_changes",{event:"*",schema:"public",table:"community_live_sessions"},()=>{lt.current(m).then(b=>{t||ve(b)})}).subscribe())})(),()=>{t=!0,i&&clearInterval(i),n&&u.removeChannel(n),o&&u.removeChannel(o)}},[m,zt,ae,r,Mt]),a.useEffect(()=>{Ye.current?.scrollIntoView({behavior:"auto"})},[fe,m]);const pr=async(t,i,n)=>{if(!r)return;se(!1),y(!1);try{const{data:d}=await u.from("community_live_sessions").select("id").eq("channel_id",t).eq("host_user_id",r.id).eq("status","active");for(const g of d||[])await N.endSession(g.id)}catch(d){console.warn("Could not clean up stale sessions before going live:",d)}const o=n?.trim()||`Live in ${i}`,l=t==="stargate"&&C&&!f,c=t==="stargate"?{stargate_category:Ke}:void 0,b=await N.createRoom(t,o,void 0,l,"channel",c);b&&(de(b.room_url),Ge(b.session?.room_name||null),Ie(b.session?.id||null))},gr=async()=>{!m||!me||(X(m),we(me.name),oe(""),y(!0))},At=async()=>{if(!(!O||!r)){if(O==="feed"){y(!1);return}await pr(O,ce,$e),y(!1)}},It=async()=>{if(!m||!r||!te(m))return;const t=Te(m,r.id),i=t?qe[t]:"Member",n=await N.createRoom(m,`Video call with ${i}`,"1-on-1 video call",!0,"channel",t?{partner_user_id:t}:void 0);n&&(Ee(n.room_url),ar(n.session?.room_name||null),nr(n.session?.id||null),t&&await u.from("private_messages").insert({sender_id:r.id,receiver_id:t,content:"VIDEO_CALL:"+n.room_url}))},fr=async()=>{N.activeSession&&(await N.endSession(N.activeSession.id),de(null),Ge(null),Ie(null),await De())},hr=async()=>{if(!r||!Se.trim())return;We(!0);let t=null,i=null,n=null,o=null,l="text";try{if(xe){const g=xe.name.split(".").pop()||"bin",F=`feed/${r.id}/${Date.now()}.${g}`,{error:h}=await u.storage.from("community-media").upload(F,xe,{upsert:!0,contentType:xe.type||void 0});if(h)throw h;const{data:M}=u.storage.from("community-media").getPublicUrl(F),L=M.publicUrl;xe.type.startsWith("image/")?(t=L,l="image"):xe.type.startsWith("video/")?(n=L,l="video"):xe.type.startsWith("audio/")?(i=L,l="audio"):xe.type==="application/pdf"||g.toLowerCase()==="pdf"?(o=L,l="pdf"):(o=L,l="attachment")}const{error:c}=await u.from("community_posts").insert({user_id:r.id,content:Se.trim(),image_url:t,audio_url:i,video_url:n,pdf_url:o,post_type:l});if(c)throw c;const b=qe[r.id]||"Admin",d=Se.trim();gt(""),ft(null),await De(),S.success("Post shared to the Sangha feed.");try{u.functions.invoke("notify-community",{body:{type:"post",triggeredBy:b,title:`✨ New post from ${b}`,body:d.substring(0,100)+(d.length>100?"...":""),link:"/community"}})}catch(g){console.warn("Notify community failed:",g)}}catch(c){console.error("Failed to create feed post:",c),S.error("Could not post to feed. Please try again.")}finally{We(!1)}},br=async(t,i,n)=>{if(!r)throw new Error("Not signed in");const o=n?.split(".").pop()||(i==="voice"?"webm":i==="video"?"mp4":"jpg"),l=`${r.id}/${Date.now()}-${crypto.randomUUID()}.${o}`,{error:c}=await u.storage.from("chat-storage").upload(l,t,{upsert:!1,contentType:t.type||(i==="voice"?"audio/webm":void 0)});if(c)throw c;const{data:b}=u.storage.from("chat-storage").getPublicUrl(l);return{file_url:b.publicUrl,file_name:n||`${i}-${Date.now()}.${o}`,file_size:t.size||t.size||0,mime_type:t.type||(i==="voice"?"audio/webm":"")}},Lt=a.useCallback(async()=>{if(r){pt(!0);try{const{data:t,error:i}=await u.from("private_messages").select("id, sender_id, receiver_id, content, created_at, is_read").or(`sender_id.eq.${r.id},receiver_id.eq.${r.id}`).order("created_at",{ascending:!1}).limit(300);if(i)throw i;const n=new Map;(t||[]).forEach(d=>{const g=d.sender_id===r.id?d.receiver_id:d.sender_id,F=n.get(g)||{last:d,unread:0};d.receiver_id===r.id&&!d.is_read&&(F.unread+=1),n.set(g,F)});const o=Array.from(n.keys());if(o.length===0){it([]);return}const{data:l}=await u.from("profiles").select("user_id, full_name, avatar_url").in("user_id",o),c={};(l||[]).forEach(d=>{c[d.user_id]=d});const b=o.map(d=>{const{last:g,unread:F}=n.get(d);return{partnerId:d,partnerName:c[d]?.full_name||"Member",partnerAvatar:c[d]?.avatar_url||null,lastMessage:g.content||"",lastMessageAt:g.created_at,isMine:g.sender_id===r.id,unread:F}}).sort((d,g)=>new Date(g.lastMessageAt).getTime()-new Date(d.lastMessageAt).getTime());it(b)}catch(t){console.error("[Community] fetchRecentDms failed:",t),it([])}finally{pt(!1)}}},[r]);a.useEffect(()=>{I==="members"&&Lt()},[I,Lt]);const $t=async(t,i,n,o)=>{if(!r||!m)return;if(te(m)){S.error("Photo/video/voice messages aren't available in private chats yet — group channels only for now.");return}const l=ae[m];if(!l){S.error("Channel is not ready yet — try again in a moment.");return}E(!0);try{const c=await br(t,i,n),b=i==="voice"?"🎤 Voice message":i==="image"?"📷 Photo":"🎬 Video",{error:d}=await u.from("chat_messages").insert({room_id:l,user_id:r.id,content:b,message_type:i,file_url:c.file_url,file_name:c.file_name,file_size:c.file_size,mime_type:c.mime_type,duration:o||null});if(d)throw d}catch(c){console.error("[Community] media send failed:",c),S.error(c.message||"Could not send media message.")}finally{E(!1)}},xr=t=>{const i=t.target.files?.[0];if(t.target.value="",!i)return;const n=i.type.startsWith("video/")?"video":"image";if(i.size>50*1024*1024){S.error("File is too large (50MB limit).");return}$t(i,n,i.name)},yr=async()=>{try{const t=await navigator.mediaDevices.getUserMedia({audio:!0}),i=Kt(),n=i?new MediaRecorder(t,{mimeType:i}):new MediaRecorder(t),o=n.mimeType||i||"audio/webm",l=o.includes("mp4")?"m4a":o.includes("ogg")?"ogg":o.includes("aac")?"aac":"webm";q.current=[],n.ondataavailable=c=>{c.data.size>0&&q.current.push(c.data)},n.onstop=()=>{t.getTracks().forEach(d=>d.stop());const c=new Blob(q.current,{type:o}),b=Q;c.size>0&&b>=1?$t(c,"voice",`voice-note-${Date.now()}.${l}`,b):c.size===0&&S.error("Recording came out empty — try again.")},J.current=n,n.start(),ee(!0),K(0),ge.current=setInterval(()=>K(c=>c+1),1e3)}catch(t){console.error("[Community] mic access/recording failed:",t);const i=t instanceof DOMException&&t.name==="NotAllowedError"?"Microphone permission denied — check your browser/app settings.":"Couldn't start recording on this device.";S.error(i)}},vr=()=>{ge.current&&(clearInterval(ge.current),ge.current=null),ee(!1),J.current?.stop(),J.current=null},Ft=async()=>{if(!D.trim()||!r||!m)return;const t=D.trim();if(k(""),te(m)){const d=Te(m,r.id);if(!d)return;const g={id:`temp-${Date.now()}`,channel_id:m,user_id:r.id,content:t,created_at:new Date().toISOString(),user_name:"You"};p(M=>[...M,g]);const{data:F,error:h}=await u.from("private_messages").insert({sender_id:r.id,receiver_id:d,content:t}).select().single();h?(console.error("Failed to send DM:",h),S.error("Could not send message."),p(M=>M.filter(L=>L.id!==g.id))):F&&p(M=>M.map(L=>L.id===g.id?{...g,id:F.id}:L));return}let i=ae[m];if(!i)try{const g=pe.find(h=>h.id===m)?.name||m;let{data:F}=await u.from("chat_rooms").select("id").eq("name",g).maybeSingle();if(!F){const{data:h,error:M}=await u.from("chat_rooms").insert({name:g}).select("id").single();if(!M&&h)F=h;else{const{data:L}=await u.from("chat_rooms").select("id").eq("name",g).maybeSingle();L&&(F=L)}}if(F?.id)i=F.id,nt(h=>({...h,[m]:i}));else{S.error("Could not set up this channel. Please try again.");return}}catch(d){console.error("Error while ensuring chat room exists:",d),S.error("Channel is not configured yet.");return}const o=be.find(d=>d.id===r.id)?.full_name||"You",l={id:`temp-${Date.now()}`,channel_id:m,user_id:r.id,content:t,created_at:new Date().toISOString(),user_name:"You",pending:!0};p(d=>[...d,l]);const{data:c,error:b}=await u.from("chat_messages").insert({room_id:i,user_id:r.id,content:t}).select().single();if(b)console.error("Failed to send message:",b),S.error("Could not send message."),p(d=>d.filter(g=>g.id!==l.id));else{c&&p(d=>d.map(g=>g.id===l.id?{...c,user_name:"You",pending:!1}:g));try{const d=`last-notif-${m}`,g=typeof localStorage<"u"?localStorage.getItem(d):null,F=60*60*1e3;if(!g||Date.now()-parseInt(g,10)>F){typeof localStorage<"u"&&localStorage.setItem(d,Date.now().toString());const h=pe.find(M=>M.id===m);u.functions.invoke("notify-community",{body:{type:"message",triggeredBy:o,channelId:m,channelName:h?.name||m,title:`💬 New message in ${h?.name||m}`,body:`${o}: ${t.substring(0,80)}${t.length>80?"…":""}`,link:"/community"}})}}catch(d){console.warn("Notify community failed:",d)}}},wr=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),Ft())},_r=async t=>{await u.from("chat_messages").delete().eq("id",t),p(i=>i.filter(n=>n.id!==t))},me=a.useMemo(()=>{if(!m)return;const t=pe.find(i=>i.id===m);if(t)return t;if(m.startsWith("dm-")&&r){const i=Te(m,r.id),n=i?qe[i]:null;return{id:m,name:n||"Direct Message",icon:"👤",description:"Private 1-on-1 chat"}}},[m,r,qe]),Oe=t=>t?t.split(" ").map(i=>i[0]).join("").toUpperCase().slice(0,2):"??",dt=t=>{try{return Ae(new Date(t),{addSuffix:!0})}catch{return""}},Sr=typeof window<"u"&&window.innerWidth>=768;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Xr}),e.jsxs("div",{className:"c-root",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"10px 14px 0",gap:10},children:[e.jsxs("div",{className:"c-banner",style:{flex:1,margin:0},children:[e.jsx("span",{className:"c-pulse"}),he," SOUL",he===1?"":"S"," IN SACRED COMMUNITY"]}),e.jsxs("div",{style:{position:"relative",flexShrink:0},children:[e.jsxs("button",{onClick:()=>{Et(!ot),!ot&&Re.some(t=>!t.is_read)&&u.from("community_notifications").update({is_read:!0}).eq("user_id",r?.id).eq("is_read",!1).then(()=>{st(t=>t.map(i=>({...i,is_read:!0})))})},style:{background:"rgba(255,255,255,.04)",border:"1px solid rgba(212,175,55,.2)",borderRadius:12,padding:"8px 12px",cursor:"pointer",fontSize:18},children:["🔔",Re.filter(t=>!t.is_read).length>0&&e.jsx("span",{style:{position:"absolute",top:-4,right:-4,background:"#D4AF37",color:"#000",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"},children:Re.filter(t=>!t.is_read).length>9?"9+":Re.filter(t=>!t.is_read).length})]}),ot&&e.jsxs("div",{style:{position:"absolute",top:"100%",right:0,marginTop:4,background:"#0a0a0a",border:"1px solid rgba(212,175,55,.25)",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,.5)",minWidth:280,maxWidth:360,maxHeight:320,overflowY:"auto",zIndex:100},children:[e.jsx("div",{style:{padding:12,borderBottom:"1px solid rgba(255,255,255,.06)",fontWeight:800,fontSize:10,letterSpacing:"0.2em",color:"#D4AF37"},children:"NOTIFICATIONS"}),Re.length===0?e.jsx("div",{style:{padding:24,color:"rgba(255,255,255,.4)",fontSize:13},children:"No notifications yet"}):Re.slice(0,20).map(t=>e.jsxs("div",{onClick:()=>{t.link&&Y(t.link),Et(!1)},style:{padding:12,borderBottom:"1px solid rgba(255,255,255,.04)",cursor:"pointer",background:t.is_read?"transparent":"rgba(212,175,55,.06)"},children:[e.jsx("div",{style:{fontWeight:700,fontSize:12,color:"rgba(255,255,255,.95)"},children:t.title}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2},children:t.body}),e.jsx("div",{style:{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:4},children:Ae(new Date(t.created_at),{addSuffix:!0})})]},t.id))]})]})]}),e.jsxs("div",{className:"c-top-tabs",children:[e.jsx("button",{className:`c-top-tab ${I==="chat"?"active":""}`,onClick:()=>z("chat"),children:"Chat"}),e.jsx("button",{className:`c-top-tab ${I==="feed"?"active":""}`,onClick:()=>z("feed"),children:"Feed"}),e.jsx("button",{className:`c-top-tab ${I==="members"?"active":""}`,onClick:()=>z("members"),children:"Members"}),e.jsx("button",{className:`c-top-tab ${I==="library"?"active":""}`,onClick:()=>{z("library"),er()},children:"Library"})]}),e.jsx("div",{className:"c-body",children:I==="chat"||Sr?m&&me?te(m)?(()=>{const t=Te(m,r?.id||"");return t?e.jsx(Zr,{partnerId:t,onBack:()=>{j(null),Ee(null),de(null),z("members")},isAdmin:f,onVideoCall:It,dmVideoUrl:ke,onEndVideoCall:()=>Ee(null),onDmSent:async(i,n)=>{const o=qe[r?.id||""]||"Admin";try{u.functions.invoke("notify-community",{body:{type:"dm",triggeredBy:o,title:`💌 Message from ${o}`,body:i.substring(0,100)+(i.length>100?"…":""),link:"/community",targetUserIds:[n]}})}catch(l){console.warn("Notify DM failed:",l)}}}):e.jsx("div",{className:"c-chat-view",children:e.jsxs("div",{className:"c-chat-header",children:[e.jsx("button",{className:"c-back-btn",onClick:()=>{j(null),Ee(null),de(null)},children:"←"}),e.jsx("div",{className:"c-chat-title",children:e.jsx("div",{className:"c-chat-name",children:"Invalid DM"})})]})})})():m==="bhagavad-gita"?e.jsx(Qr,{isAdmin:f,onBack:()=>{j(null),z("members")}}):e.jsxs("div",{className:"c-chat-view",children:[e.jsxs("div",{className:"c-chat-header",children:[e.jsx("button",{className:"c-back-btn",onClick:()=>{j(null),Ee(null),de(null)},children:"←"}),e.jsx("div",{className:"c-chat-icon",children:me.icon}),e.jsxs("div",{className:"c-chat-title",children:[e.jsx("div",{className:"c-chat-name",children:me.name}),e.jsx("div",{className:"c-chat-sub",children:me.description})]}),te(m)&&!ke&&e.jsxs("button",{className:"c-video-call-btn",onClick:It,disabled:N.isCreating,children:[N.isCreating?"⏳":"📹"," VIDEO CALL"]}),te(m)&&ke&&e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",className:"c-video-call-btn",onClick:()=>Ct(t=>t+1),title:"Reload Daily iframe if a participant freezes or drops",children:"⟳ RECONNECT"}),e.jsx("button",{className:"c-video-call-btn",onClick:()=>Ee(null),style:{borderColor:"rgba(255,59,48,.4)",color:"#ff6b61"},children:"⬛ END CALL"})]}),!te(m)&&(f||m==="stargate"&&C)&&!ie&&e.jsx("button",{className:`c-golive-header-btn ${N.isCreating?"c-golive-active":""}`,onClick:gr,disabled:N.isCreating,children:N.isCreating?"⏳ CREATING...":"🔴 GO LIVE"}),!te(m)&&ie&&e.jsx("button",{type:"button",className:"c-golive-header-btn",onClick:()=>Nt(t=>t+1),title:"Reload Daily iframe if remote video/audio is stuck",children:"⟳ RECONNECT"}),!te(m)&&ie&&(f||N.activeSession?.host_user_id===r?.id)&&e.jsx("button",{className:"c-golive-header-btn c-golive-active",onClick:fr,children:"⬛ END LIVE"}),!te(m)&&!ie&&He.length>0&&!cr.has(m)&&e.jsx("div",{className:"c-live-pill-wrap",children:He.slice(0,1).map(t=>e.jsxs("div",{className:"c-live-pill",children:[e.jsx("span",{style:{animation:"pulse 1.5s ease-in-out infinite"},onClick:()=>t.room_url&&window.open(t.room_url,"_blank"),children:"🔴"}),e.jsxs("span",{onClick:()=>t.room_url&&window.open(t.room_url,"_blank"),children:["JOIN LIVE: ",t.title.length>18?t.title.slice(0,18)+"…":t.title]}),e.jsx("span",{className:"c-live-pill-dismiss",onClick:()=>lr(i=>new Set(i).add(m)),"aria-label":"Dismiss",children:"✕"})]},t.id))})]}),te(m)&&ke&&e.jsxs("div",{className:"c-live-frame",children:[jt&&e.jsx("div",{style:{padding:"8px 8px 0"},children:e.jsx(Gt,{roomName:jt,sessionId:ir,autoStart:!0})}),e.jsx("iframe",{src:ke,allow:"camera;microphone;fullscreen;display-capture"},`dm-daily-${sr}`)]}),!te(m)&&ie&&e.jsxs("div",{className:"c-live-frame",children:[Ue&&e.jsx("div",{style:{padding:"8px 8px 0"},children:e.jsx(Gt,{roomName:Ue,sessionId:tt,autoStart:!0})}),e.jsx("iframe",{src:ie,allow:"camera;microphone;fullscreen;display-capture"},`live-daily-${or}`)]}),e.jsxs("div",{className:"c-messages",children:[T?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"⏳"}),e.jsx("div",{className:"c-empty-sub",children:"LOADING MESSAGES"}),re&&e.jsx("button",{className:"c-skip-loading-btn",onClick:()=>{H(!1),_(!1),p([])},children:"Start chatting anyway"})]}):fe.length===0?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:me.icon}),e.jsx("div",{className:"c-empty-title",children:me.name}),e.jsx("div",{className:"c-empty-sub",children:"BE THE FIRST TO SPEAK"})]}):fe.map((t,i)=>{const n=t.user_id===r?.id,o=fe[i-1],l=o&&o.user_id===t.user_id;if(t.message_type==="content_drop"&&t.content_id){const c=Qt[t.content_id];return c?e.jsx(qt,{content:c},t.id):e.jsxs("div",{style:{alignSelf:"flex-start",maxWidth:"82%",padding:"10px 14px",borderRadius:16,background:"rgba(220,38,38,.08)",border:"1px solid rgba(220,38,38,.3)",color:"rgba(255,180,180,.9)",fontSize:11.5},children:["⚠️ Drop card failed to load (content_id: ",t.content_id?.slice(0,8),"…). ",Xt[t.content_id]||"Still loading, or couldn't be found."]},t.id)}if(["image","video","voice"].includes(t.message_type)&&t.file_url){const c=t.message_type,b=t.file_url,d=t.duration;return e.jsxs("div",{className:`c-msg-row ${n?"mine":""} ${l?"consecutive":""}`,children:[e.jsx("div",{className:`c-avatar ${n?"mine":""} ${l||n?"hidden":""}`,children:Oe(t.user_name||(n?"ME":void 0))}),e.jsxs("div",{className:"c-msg-body",children:[!l&&!n&&e.jsx("div",{className:"c-msg-meta",children:e.jsx("span",{className:"c-msg-author",children:t.user_name||"Member"})}),e.jsxs("div",{style:{maxWidth:260,borderRadius:18,overflow:"hidden",border:"1px solid rgba(255,255,255,.1)"},children:[c==="image"&&e.jsx("img",{src:b,alt:"",style:{display:"block",width:"100%",maxHeight:320,objectFit:"cover"}}),c==="video"&&e.jsx("video",{src:b,controls:!0,style:{display:"block",width:"100%",maxHeight:320}}),c==="voice"&&e.jsxs("div",{style:{padding:"10px 12px",background:"rgba(255,255,255,.05)",display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{fontSize:15},children:"🎤"}),e.jsx("audio",{src:b,controls:!0,style:{height:32,flex:1}}),d?e.jsxs("span",{style:{fontSize:10,color:"rgba(255,255,255,.4)"},children:[Math.floor(d/60),":",(d%60).toString().padStart(2,"0")]}):null]})]}),e.jsx("div",{className:`c-msg-time ${n?"mine":""}`,children:Ae(new Date(t.created_at),{addSuffix:!0})})]})]},t.id)}return e.jsxs("div",{className:`c-msg-row ${n?"mine":""} ${l?"consecutive":""}`,children:[e.jsx("div",{className:`c-avatar ${n?"mine":""} ${l||n?"hidden":""}`,children:Oe(t.user_name||(n?"ME":void 0))}),e.jsxs("div",{className:"c-msg-body",children:[!l&&!n&&e.jsx("div",{className:"c-msg-meta",children:e.jsx("span",{className:"c-msg-author",children:t.user_name||"Member"})}),e.jsxs("div",{className:`c-bubble ${n?"mine":""}`,children:[t.content,!te(m)&&(n||f)&&e.jsx("button",{className:"c-delete-btn",onClick:()=>_r(t.id),children:"✕"})]}),e.jsx("div",{className:`c-msg-time ${n?"mine":""}`,children:dt(t.created_at)}),n&&!t.pending&&e.jsx("div",{className:`c-msg-sent ${n?"mine":""}`,children:"✓ Sent"})]})]},t.id)}),e.jsx("div",{ref:Ye})]}),e.jsxs("div",{className:"c-input-bar",children:[e.jsxs("div",{className:"c-input-row",children:[e.jsx("input",{type:"file",ref:ye,accept:"image/*,video/*",style:{display:"none"},onChange:xr}),W?e.jsxs("div",{style:{flex:1,display:"flex",alignItems:"center",gap:8,color:"#ff6b61",fontSize:13,fontWeight:700},children:[e.jsx("span",{style:{width:8,height:8,borderRadius:"50%",background:"#ff3b30",animation:"c-rec-pulse 1s infinite"}}),"Recording… ",Math.floor(Q/60),":",(Q%60).toString().padStart(2,"0")]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{type:"button",onClick:()=>ye.current?.click(),disabled:w,style:{background:"none",border:"none",fontSize:19,cursor:"pointer",padding:"0 4px",opacity:w?.4:.75,flexShrink:0},title:"Send a photo or video",children:"📎"}),e.jsx("input",{placeholder:w?"Sending…":`Message ${me.name}...`,value:D,onChange:t=>k(t.target.value),onKeyDown:wr,disabled:w})]}),!D.trim()&&!w?e.jsx("button",{type:"button",className:"c-send-btn",onClick:W?vr:yr,style:W?{background:"radial-gradient(circle at 30% 30%, #ff8a80, #ff3b30 75%)"}:void 0,title:W?"Stop and send":"Record a voice message",children:W?"⏹":"🎤"}):e.jsx("button",{className:"c-send-btn",onClick:Ft,disabled:!D.trim()||w,children:"➤"})]}),e.jsx("style",{children:"@keyframes c-rec-pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }"})]})]}):e.jsxs("div",{className:"c-channels-view",children:[e.jsx("div",{className:"c-section-label",children:"OPEN CHANNELS"}),pe.filter(t=>t.access==="public").map(t=>{const i=A[ae[t.id]]||0;return e.jsxs("button",{className:"c-channel-row",onClick:()=>{console.log("[Community] Channel clicked:",t.id),j(t.id),z("chat"),ae[t.id]&&B(ae[t.id])},children:[e.jsxs("div",{className:"c-ch-icon",style:{position:"relative"},children:[t.icon,i>0&&e.jsx("div",{style:{position:"absolute",top:-4,right:-4,minWidth:16,height:16,padding:"0 4px",borderRadius:8,background:"radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%)",color:"#1a1300",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 8px rgba(212,175,55,.7)"},children:i>9?"9+":i})]}),e.jsxs("div",{className:"c-ch-info",children:[e.jsx("div",{className:"c-ch-name",children:t.name}),e.jsx("div",{className:"c-ch-desc",children:t.description}),e.jsxs("div",{style:{fontSize:10,color:"rgba(212,175,55,.5)",marginTop:2},children:[he," members"]})]}),e.jsx("div",{className:"c-ch-arrow",children:"›"})]},t.id)}),e.jsx("div",{className:"c-section-label",children:"SACRED SPACES"}),pe.filter(t=>t.access==="tiered").map(t=>{const i=be.find(d=>d.id===r?.id)?.subscription_tier,n=Bt(i),o=t.minTierRank??2,l=f||n>=o,c=o>=3?"Akasha-Infinity":o>=2?"Siddha-Quantum":"Prana-Flow",b=A[ae[t.id]]||0;return e.jsxs("button",{className:`c-channel-row ${l?"":"locked"}`,onClick:()=>{l?(console.log("[Community] Channel clicked:",t.id),j(t.id),z("chat"),ae[t.id]&&B(ae[t.id])):S.error(`This space requires ${c} or higher.`)},children:[e.jsxs("div",{className:"c-ch-icon sacred",style:{position:"relative"},children:[t.icon,l&&b>0&&e.jsx("div",{style:{position:"absolute",top:-4,right:-4,minWidth:16,height:16,padding:"0 4px",borderRadius:8,background:"radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%)",color:"#1a1300",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 8px rgba(212,175,55,.7)"},children:b>9?"9+":b})]}),e.jsxs("div",{className:"c-ch-info",children:[e.jsx("div",{className:"c-ch-name",children:t.name}),e.jsx("div",{className:"c-ch-desc",children:t.description}),e.jsxs("div",{style:{fontSize:10,color:"rgba(212,175,55,.5)",marginTop:2},children:[be.filter(d=>Bt(d.subscription_tier)>=o).length+(f?1:0)," members"]})]}),l?e.jsx("div",{className:"c-ch-arrow",children:"›"}):e.jsx("span",{className:"c-lock-badge",children:"🔒"})]},t.id)}),e.jsx("div",{className:"c-section-label",children:"PRIVATE"}),pe.filter(t=>t.access==="private"||t.access==="invite").map(t=>{const i=t.id==="stargate"?!f&&!C:t.access==="invite"?!f&&!U:!f;return e.jsxs("button",{className:`c-channel-row ${i?"locked":""}`,onClick:()=>{i||(console.log("[Community] Channel clicked:",t.id),j(t.id),z("chat"))},children:[e.jsx("div",{className:"c-ch-icon private",children:t.icon}),e.jsxs("div",{className:"c-ch-info",children:[e.jsx("div",{className:"c-ch-name",children:t.name}),e.jsx("div",{className:"c-ch-desc",children:t.description}),e.jsx("div",{style:{fontSize:10,color:"rgba(212,175,55,.5)",marginTop:2},children:t.id==="stargate"?"Stargate members":"Invite only"})]}),i?e.jsx("span",{className:"c-lock-badge",children:"🔒"}):e.jsx("div",{className:"c-ch-arrow",children:"›"})]},t.id)})]}):I==="feed"?e.jsxs("div",{className:"c-feed-view",children:[e.jsx("div",{className:"c-section-label",children:f?"ADMIN FEED":"SANGHA FEED"}),f&&e.jsxs("div",{className:"c-feed-card",style:{marginBottom:16},children:[e.jsx("textarea",{placeholder:"Share an update with the Sangha...",value:Se,onChange:t=>gt(t.target.value),style:{width:"100%",minHeight:70,background:"transparent",border:"none",outline:"none",resize:"vertical",color:"rgba(255,255,255,.9)",fontSize:14,fontFamily:"'Plus Jakarta Sans', sans-serif"}}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginTop:10},children:[e.jsx("input",{type:"file",accept:"image/*,video/*,audio/*,application/pdf",onChange:t=>ft(t.target.files?.[0]||null),style:{fontSize:11,color:"rgba(255,255,255,.6)"}}),e.jsx("button",{onClick:hr,disabled:Pe||!Se.trim(),style:{marginLeft:"auto",padding:"8px 16px",borderRadius:999,border:"none",background:"linear-gradient(135deg, rgba(212,175,55,.3), rgba(212,175,55,.6))",color:"#050505",fontSize:11,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",cursor:Pe||!Se.trim()?"default":"pointer",opacity:Pe||!Se.trim()?.4:1},children:Pe?"Posting...":"Post"})]})]}),Pe&&_e.length===0?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"⏳"}),e.jsx("div",{className:"c-empty-sub",children:"LOADING FEED"})]}):_e.length===0?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"✦"}),e.jsx("div",{className:"c-empty-title",children:"No posts yet"}),e.jsx("div",{className:"c-empty-sub",children:"Share the first transmission"})]}):_e.map(t=>e.jsxs("div",{className:"c-feed-card",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",marginBottom:4},children:[e.jsx("span",{className:"c-feed-author",children:"Admin Transmission"}),e.jsx("span",{className:"c-feed-time",children:dt(t.created_at)})]}),e.jsx("div",{className:"c-feed-text",children:t.content}),t.image_url&&e.jsx("img",{src:t.image_url,alt:"",style:{marginTop:10,borderRadius:16,width:"100%",maxHeight:260,objectFit:"cover",border:"1px solid rgba(255,255,255,.06)"}}),t.video_url&&t.post_type==="live"&&e.jsx("button",{type:"button",onClick:()=>window.open(t.video_url,"_blank","noopener,noreferrer"),style:{display:"block",marginTop:10,width:"100%",padding:"12px 16px",borderRadius:16,border:"1px solid rgba(220,38,38,.55)",background:"linear-gradient(135deg, rgba(127,29,29,.85), rgba(185,28,28,.95))",color:"#fecaca",fontSize:13,fontWeight:800,letterSpacing:"0.06em",cursor:"pointer"},children:Date.now()-new Date(t.created_at).getTime()>4*60*60*1e3?"📹 Watch Recording":"🔴 JOIN LIVE SESSION"}),t.video_url&&t.post_type!=="live"&&e.jsxs(e.Fragment,{children:[e.jsx("video",{src:t.video_url,controls:!0,style:{marginTop:10,borderRadius:16,width:"100%",maxHeight:260,objectFit:"cover",border:"1px solid rgba(255,255,255,.06)",background:"#000"}}),e.jsx("button",{type:"button",onClick:async()=>{try{S.info("Starting audio conversion…");const{data:i,error:n}=await u.functions.invoke("convert-meditation-audio",{body:{video_url:t.video_url}});if(n)throw n;if(!i?.success)throw new Error(i?.error||"Conversion failed");S.success("Audio conversion started. It will appear when ready.")}catch(i){S.error(i?.message||"Could not start conversion.")}},style:{marginTop:10,width:"100%",padding:"10px 14px",borderRadius:16,border:"1px solid rgba(212,175,55,.28)",background:"rgba(10,10,10,.9)",color:"rgba(212,175,55,.92)",fontSize:11,fontWeight:900,letterSpacing:"0.22em",textTransform:"uppercase",cursor:"pointer"},children:"🎧 Video → Audio"})]}),t.audio_url&&e.jsx("audio",{src:t.audio_url,controls:!0,style:{marginTop:10,width:"100%"}}),t.pdf_url&&e.jsx("a",{href:t.pdf_url,target:"_blank",rel:"noreferrer",style:{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,fontSize:12,color:"rgba(212,175,55,.9)",textDecoration:"underline"},children:"📄 Open attached PDF"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"},children:[e.jsxs("button",{type:"button",onClick:()=>mr(t.id),disabled:!!_t,style:{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"none",color:t.user_liked?"#D4AF37":"rgba(255,255,255,.5)",fontSize:12,cursor:_t?"default":"pointer"},children:[e.jsx("span",{children:t.user_liked?"❤️":"🤍"}),e.jsx("span",{children:t.likes_count??0})]}),e.jsxs("button",{type:"button",onClick:()=>Zt(i=>i===t.id?null:t.id),style:{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"none",color:"rgba(255,255,255,.5)",fontSize:12,cursor:"pointer"},children:[e.jsx("span",{children:"💬"}),e.jsx("span",{children:t.comments_count??0})]})]}),Je===t.id&&e.jsxs("div",{style:{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"},children:[(tr[t.id]||[]).map(i=>e.jsxs("div",{style:{marginBottom:8,fontSize:12,color:"rgba(255,255,255,.8)"},children:[e.jsxs("span",{style:{fontWeight:600,color:"rgba(212,175,55,.9)",marginRight:6},children:[i.user_name??"Member",":"]}),e.jsx("span",{children:i.content}),e.jsx("span",{style:{marginLeft:6,color:"rgba(255,255,255,.4)",fontSize:11},children:dt(i.created_at)})]},i.id)),r?e.jsxs("div",{style:{display:"flex",gap:8,marginTop:8},children:[e.jsx("input",{type:"text",placeholder:"Write a comment...",value:Ne,onChange:i=>vt(i.target.value),onKeyDown:i=>{i.key==="Enter"&&(i.preventDefault(),Dt(t.id,Ne))},style:{flex:1,padding:"8px 12px",borderRadius:999,border:"1px solid rgba(255,255,255,.1)",background:"rgba(5,5,5,.8)",color:"rgba(255,255,255,.9)",fontSize:12,outline:"none"}}),e.jsx("button",{type:"button",onClick:()=>Dt(t.id,Ne),disabled:!Ne.trim()||Qe===t.id,style:{padding:"8px 14px",borderRadius:999,border:"none",background:"rgba(212,175,55,.4)",color:"#050505",fontSize:11,fontWeight:700,cursor:Ne.trim()&&Qe!==t.id?"pointer":"default",opacity:Ne.trim()&&Qe!==t.id?1:.5},children:Qe===t.id?"…":"Comment"})]}):e.jsx("p",{style:{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:8},children:"Sign in to comment."})]})]},t.id))]}):I==="members"?e.jsxs("div",{className:"c-members-view",children:[e.jsx("div",{style:{position:"sticky",top:0,zIndex:5,background:"#050505",paddingBottom:10,marginBottom:4},children:e.jsx("input",{placeholder:"Search members…",value:Fe,onChange:t=>Jt(t.target.value),style:{width:"100%",padding:"10px 14px",borderRadius:999,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.9)",fontSize:13,outline:"none"}})}),!Fe.trim()&&at.length>0&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"c-section-label",children:"Recent Chats"}),at.map(t=>e.jsxs("div",{className:"c-member-row",onClick:()=>{if(!r)return;const i=[r.id,t.partnerId].sort();j(`dm-${i[0]}-${i[1]}`),z("chat")},children:[e.jsx("div",{className:"c-member-avatar",children:t.partnerAvatar?e.jsx("img",{src:t.partnerAvatar,alt:""}):Oe(t.partnerName)}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{className:"c-member-name",children:t.partnerName}),e.jsxs("div",{className:"c-member-status",style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:[t.isMine?"You: ":"",t.lastMessage]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0},children:[e.jsx("span",{style:{fontSize:10,color:"rgba(255,255,255,.35)"},children:Ae(new Date(t.lastMessageAt),{addSuffix:!1})}),t.unread>0&&e.jsx("div",{style:{minWidth:18,height:18,padding:"0 5px",borderRadius:9,background:"radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%)",color:"#1a1300",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"},children:t.unread>9?"9+":t.unread})]})]},t.partnerId))]}),!Fe.trim()&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"c-section-label",style:{marginTop:at.length>0?16:0},children:"Guides & Admins"}),be.filter(t=>t.isAdmin&&t.id!==r?.id).length>0?be.filter(t=>t.isAdmin&&t.id!==r?.id).map(t=>{const i=kt.has(t.id);return e.jsxs("div",{className:"c-member-row",onClick:()=>{if(!r)return;const n=[r.id,t.id].sort();j(`dm-${n[0]}-${n[1]}`),z("chat")},style:{borderLeft:"2px solid rgba(212,175,55,.4)"},children:[e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{className:"c-member-avatar",children:t.avatar_url?e.jsx("img",{src:t.avatar_url,alt:""}):Oe(t.full_name||void 0)}),i&&e.jsx("span",{style:{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #050505"},title:"Online"})]}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsxs("div",{className:"c-member-name",children:[t.full_name||"Admin"," ",e.jsx("span",{style:{marginLeft:6,fontSize:9,fontWeight:800,letterSpacing:"0.15em",color:"#D4AF37",textTransform:"uppercase"},children:"Admin"})]}),e.jsx("div",{className:"c-member-status",children:"Message your guide"})]})]},t.id)}):e.jsx("div",{style:{padding:"8px 12px",fontSize:11,color:"rgba(255,255,255,.4)"},children:"No guides online"})]}),e.jsx("div",{className:"c-section-label",style:{marginTop:16},children:"All Members"}),Fe.trim()&&e.jsx(e.Fragment,{children:(()=>{const t=Fe.trim().toLowerCase(),i=be.filter(n=>{if(r&&n.id===r.id||!t&&n.isAdmin)return!1;const o=(n.subscription_tier||"").toLowerCase();if(o==="admin")return!1;if(!t)return!0;const c=`${(n.full_name||"").toLowerCase()} ${o} ${n.isAdmin?"admin guide":""}`;return t.split(/\s+/).filter(Boolean).every(d=>c.includes(d))});return i.length===0?e.jsxs("div",{className:"c-empty",style:{marginTop:24},children:[e.jsx("div",{className:"c-empty-icon",children:"👤"}),e.jsx("div",{className:"c-empty-title",children:t?"No members match your search":"No members yet"}),e.jsx("div",{className:"c-empty-sub",children:t?"Try a different name or tier":"Members will appear here"})]}):i.map(n=>{const o=kt.has(n.id);return e.jsxs("div",{className:"c-member-row",onClick:()=>{if(!r)return;const l=[r.id,n.id].sort(),c=`dm-${l[0]}-${l[1]}`;j(c),z("chat")},children:[e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{className:"c-member-avatar",children:n.avatar_url?e.jsx("img",{src:n.avatar_url,alt:""}):Oe(n.full_name||void 0)}),o&&e.jsx("span",{style:{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #050505",boxShadow:"0 0 8px #22c55e, 0 0 12px rgba(34, 197, 94, 0.6)"},title:"Online","aria-label":"Online"})]}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsxs("div",{className:"c-member-name",children:[n.full_name||"Member",n.isAdmin&&e.jsx("span",{style:{marginLeft:6,fontSize:9,fontWeight:800,letterSpacing:"0.15em",color:"#D4AF37",textTransform:"uppercase"},children:"Admin"})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[o&&e.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:"#22c55e",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}),"Online"]}),n.subscription_tier&&e.jsx("span",{className:"c-member-status",children:n.subscription_tier})]})]})]},n.id)})})()})]}):I==="library"?e.jsxs("div",{className:"c-channels-view",children:[e.jsx("div",{className:"c-section-label",children:"My Library"}),R?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"⏳"}),e.jsx("div",{className:"c-empty-sub",children:"LOADING LIBRARY"})]}):v.length===0?e.jsxs("div",{className:"c-empty",children:[e.jsx("div",{className:"c-empty-icon",children:"📚"}),e.jsx("div",{className:"c-empty-title",children:"Nothing here yet"}),e.jsx("div",{className:"c-empty-sub",children:"PURCHASES SHOW UP HERE PERMANENTLY"})]}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:v.map(t=>e.jsx(qt,{content:t},t.id))})]}):null})]}),x&&e.jsx("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsxs("div",{style:{background:"#0a0a0a",border:"1px solid rgba(212,175,55,.3)",borderRadius:20,padding:28,width:"90%",maxWidth:400},children:[e.jsx("h3",{style:{color:"#D4AF37",fontWeight:900,fontSize:16,marginBottom:4},children:"🔴 Name Your Live Session"}),e.jsxs("p",{style:{color:"rgba(255,255,255,.5)",fontSize:12,marginBottom:16},children:["Going live in ",ce,". Give it a title so members know what it's about."]}),e.jsx("input",{autoFocus:!0,placeholder:"e.g. Evening Meditation Circle",value:$e,onChange:t=>oe(t.target.value),onKeyDown:t=>{t.key==="Enter"&&At()},style:{width:"100%",padding:"12px 16px",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(212,175,55,.2)",color:"#fff",fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"}}),O==="stargate"&&e.jsxs("div",{style:{marginTop:12},children:[e.jsx("label",{style:{display:"block",color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6},children:"Stargate Category"}),e.jsxs("select",{value:Ke,onChange:t=>s(t.target.value),style:{width:"100%",padding:"12px 16px",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(212,175,55,.2)",color:"#fff",fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"},children:[e.jsx("option",{value:"healing-chamber",style:{background:"#0a0a0a"},children:"🌿 Healing Chamber"}),e.jsx("option",{value:"bhagavad-gita",style:{background:"#0a0a0a"},children:"📖 Bhagavad Gita Class"}),e.jsx("option",{value:"other",style:{background:"#0a0a0a"},children:"✨ Other"})]}),e.jsx("p",{style:{color:"rgba(255,255,255,.4)",fontSize:10,marginTop:6},children:"Recording will be saved into this folder of the Stargate course."})]}),e.jsxs("div",{style:{display:"flex",gap:10,marginTop:18},children:[e.jsx("button",{onClick:()=>y(!1),style:{flex:1,padding:"10px 0",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.6)",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:".1em"},children:"Cancel"}),e.jsx("button",{onClick:At,disabled:N.isCreating,style:{flex:1,padding:"10px 0",borderRadius:12,background:"linear-gradient(135deg, rgba(212,175,55,.3), rgba(212,175,55,.6))",border:"none",color:"#050505",fontSize:12,fontWeight:900,cursor:N.isCreating?"wait":"pointer",textTransform:"uppercase",letterSpacing:".1em",opacity:N.isCreating?.5:1},children:N.isCreating?"Starting...":"🔴 Go Live"})]})]})})]})};export{va as default};
