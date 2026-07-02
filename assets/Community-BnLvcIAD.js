import{r as n,j as t,i as $t}from"./vendor-react-DdWqvjvq.js";import{u as be,m as N,s as d,B as Ee,g as it}from"./index-DPalQnOV.js";import{u as Ft}from"./useAdminRole-Bx4gCuv8.js";import{u as Ot}from"./useStargateAccess-Bxlc0eYb.js";import{f as qt}from"./dashboardAggregateStats-MUmxQE5h.js";import{r as Bt}from"./NotificationService-AnAjJhJu.js";import{u as Wt}from"./vendor-i18n-CLO2ZSBh.js";import{aY as nt,h as at,aP as Vt,b4 as Ut,b5 as Gt}from"./vendor-icons-DQ9y02-X.js";import{f as De}from"./formatDistanceToNow-CP23zA8F.js";import"./vendor-crypto-Cz0s2Wb9.js";import"./vendor-radix-E_JnJsxb.js";import"./vendor-query-DDdS-q50.js";import"./vendor-supabase-C8XXFrAR.js";import"./vendor-motion-BWTr00U0.js";import"./index-E_HfJ5im.js";import"./en-US-DaTnBiBt.js";import"./endOfMonth-BS24EeZA.js";function st(r,g){const S=r;if(!S?.error)return g;const D=[S.error,S.details,S.hint].filter(Boolean);return D.length?D.join(" — "):g}async function ot(r,g){const S=r;if(S?.error||S?.session)return S;const D=g;if(D?.context&&typeof D.context.json=="function")try{const f=await D.context.json();return f?.error||f?.session?f:S??null}catch{return S??null}return S??null}function Yt(){const{t:r}=Wt(),{user:g}=be(),[S,D]=n.useState(!1),[f,z]=n.useState(null),E=n.useCallback(async(M,P,C,h=!1,k="channel",I)=>{if(!g)return N.error(r("community.goLive.signIn")),null;const{data:q}=await d.auth.getSession(),v=q.session?.access_token;if(!v)return N.error(r("community.goLive.signIn")),null;D(!0);try{const{data:w,error:R}=await d.functions.invoke("daily-room",{body:{action:"create",channel_id:k==="feed"?"feed":M,title:P,description:C,allow_non_admin:h,source:k,stargate_category:I?.stargate_category,partner_user_id:I?.partner_user_id},headers:{Authorization:`Bearer ${v}`}}),x=await ot(w,R);return R||x?.error?(N.error(st(x,R?.message||r("community.goLive.createFailed"))),null):x?.session?(z(x.session),N.success(r("community.goLive.roomCreated")),{session:x.session,room_url:x.room_url}):(N.error(r("community.goLive.createFailed")),null)}catch(w){const R=w instanceof Error?w.message:r("community.goLive.createFailed");return N.error(R),null}finally{D(!1)}},[g,r]),c=n.useCallback(async M=>{try{const{data:P}=await d.auth.getSession(),C=P.session?.access_token;if(!C){N.error(r("community.goLive.signIn"));return}const{data:h,error:k}=await d.functions.invoke("daily-room",{body:{action:"end",session_id:M},headers:{Authorization:`Bearer ${C}`}}),I=await ot(h,k);if(k||I?.error){N.error(st(I,k?.message||r("community.goLive.endFailed")));return}z(null),N.success(r("community.goLive.sessionEndedPrivate"))}catch{N.error(r("community.goLive.endFailed"))}},[r]),L=n.useCallback(async M=>{let P=d.from("community_live_sessions").select("*").eq("status","active").order("started_at",{ascending:!1});M&&(P=P.eq("channel_id",M));const{data:C}=await P;return C||[]},[]);return n.useMemo(()=>({createRoom:E,endSession:c,fetchActiveSessions:L,activeSession:f,isCreating:S,setActiveSession:z}),[E,c,L,f,S])}const Ht=r=>{const{user:g}=be(),[S,D]=n.useState([]),[f,z]=n.useState(null),[E,c]=n.useState(!0),L=async()=>{if(!g)return;const{data:C,error:h}=await d.from("private_messages").select("*").or(`and(sender_id.eq.${g.id},receiver_id.eq.${r}),and(sender_id.eq.${r},receiver_id.eq.${g.id})`).order("created_at",{ascending:!0});if(h){console.error("Error fetching messages:",h);return}D(C||[]),await d.from("private_messages").update({is_read:!0}).eq("sender_id",r).eq("receiver_id",g.id).eq("is_read",!1)},M=async()=>{const{data:C}=await d.from("profiles").select("full_name, avatar_url").eq("user_id",r).single();z(C),c(!1)};return n.useEffect(()=>{L(),M();const C=d.channel(`dm-${r}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},h=>{const k=h.new;(k.sender_id===g?.id&&k.receiver_id===r||k.sender_id===r&&k.receiver_id===g?.id)&&L()}).subscribe();return()=>{d.removeChannel(C)}},[r,g]),{messages:S,partnerProfile:f,isLoading:E,sendMessage:async(C,h="text",k)=>{if(!g)return!1;const I=`temp-dm-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,q=new Date().toISOString(),v={id:I,sender_id:g.id,receiver_id:r,content:C,created_at:q,is_read:!1,message_type:h,status:"pending",...k};D(x=>[...x,v]);const{data:w,error:R}=await d.from("private_messages").insert({sender_id:g.id,receiver_id:r,content:C}).select().single();return R?(D(x=>x.filter(T=>T.id!==I)),!1):(w&&D(x=>x.map(T=>T.id===I?w:T)),!0)}}};function Kt(){const[r,g]=n.useState("idle"),[S,D]=n.useState(null),[f,z]=n.useState(0),E=n.useRef(null),c=n.useRef([]),L=n.useRef(null),M=n.useRef(null),P=n.useRef(null),C=n.useRef(0),h=n.useRef(null),k=n.useCallback(()=>{[L.current,M.current].forEach(w=>{w?.getTracks().forEach(R=>{try{R.stop()}catch{}})}),L.current=null,M.current=null,P.current&&(clearInterval(P.current),P.current=null)},[]);n.useEffect(()=>()=>k(),[k]);const I=n.useCallback(async w=>{const R=h.current;if(R){g("uploading");try{const{data:x}=await d.auth.getUser();if(!x?.user)throw new Error("Not authenticated");const{data:T,error:B}=await d.from("call_recordings").select("id, host_user_id").eq("room_name",R.roomName).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(B)throw B;if(!T)throw new Error("Recording row not found for room");const K=w.type.includes("mp4")?"mp4":"webm",J=`${T.host_user_id}/${T.id}.${K}`,{error:G}=await d.storage.from("call-recordings").upload(J,w,{upsert:!0,contentType:w.type});if(G)throw G;const O=Math.round((Date.now()-C.current)/1e3),{error:A}=await d.from("call_recordings").update({status:"ready",storage_path:J,video_url:J,duration_seconds:O,ended_at:new Date().toISOString()}).eq("id",T.id);if(A)throw A;g("ready"),N.success("Recording saved to your profile")}catch(x){const T=x instanceof Error?x.message:String(x);console.error("[useCallScreenRecorder] finalize error:",x),D(T),g("failed"),N.error(`Recording upload failed: ${T}`)}}},[]),q=n.useCallback(async w=>{D(null),z(0),h.current=w,g("requesting");try{const R=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:!0});L.current=R;let x=null;try{x=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0}}),M.current=x}catch(A){console.warn("[useCallScreenRecorder] no mic, continuing with tab audio only",A)}const T=new AudioContext,B=T.createMediaStreamDestination(),K=R.getAudioTracks();if(K.length)try{T.createMediaStreamSource(new MediaStream(K)).connect(B)}catch(A){console.warn("[useCallScreenRecorder] tab audio mix failed",A)}if(x)try{T.createMediaStreamSource(x).connect(B)}catch(A){console.warn("[useCallScreenRecorder] mic mix failed",A)}const J=new MediaStream([...R.getVideoTracks(),...B.stream.getAudioTracks()]),G=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")?"video/webm;codecs=vp8,opus":MediaRecorder.isTypeSupported("video/webm")?"video/webm":"video/mp4",O=new MediaRecorder(J,{mimeType:G,videoBitsPerSecond:25e5});E.current=O,c.current=[],O.ondataavailable=A=>{A.data&&A.data.size>0&&c.current.push(A.data)},O.onstop=async()=>{const A=new Blob(c.current,{type:G});c.current=[],k(),await I(A)},R.getVideoTracks()[0]?.addEventListener("ended",()=>{O.state!=="inactive"&&O.stop()}),O.start(2e3),C.current=Date.now(),g("recording"),P.current=setInterval(()=>{z(Math.floor((Date.now()-C.current)/1e3))},1e3),N.success("Recording started — keep this tab open")}catch(R){const x=R instanceof Error?R.message:String(R);console.error("[useCallScreenRecorder] start error:",R),D(x),g("failed"),k();try{h.current&&await d.from("call_recordings").update({status:"failed",error_message:x}).eq("room_name",h.current.roomName).eq("status","pending")}catch{}N.error(`Could not start recording: ${x}`)}},[k,I]),v=n.useCallback(()=>{const w=E.current;w&&w.state!=="inactive"?w.stop():(k(),g("idle"))},[k]);return{status:r,error:S,elapsed:f,start:q,stop:v}}function Jt(r){const g=Math.floor(r/60).toString().padStart(2,"0"),S=(r%60).toString().padStart(2,"0");return`${g}:${S}`}const ct=({roomName:r,sessionId:g,autoStart:S,className:D})=>{const{status:f,elapsed:z,start:E,stop:c,error:L}=Kt();return n.useEffect(()=>{if(S&&f==="idle"&&r){const M=setTimeout(()=>{E({roomName:r,sessionId:g})},400);return()=>clearTimeout(M)}},[S,f,r,g,E]),t.jsxs("div",{className:"flex items-center gap-3 px-3 py-2 rounded-md border border-border/40 bg-background/60 text-xs "+(D||""),children:[f==="idle"&&t.jsxs(t.Fragment,{children:[t.jsxs(Ee,{size:"sm",variant:"destructive",onClick:()=>E({roomName:r,sessionId:g}),className:"gap-1.5",children:[t.jsx(nt,{className:"w-3 h-3 fill-current"})," Record call"]}),t.jsx("span",{className:"text-muted-foreground",children:"Saves to your profile / Stargate when you stop."})]}),f==="requesting"&&t.jsxs("span",{className:"flex items-center gap-2 text-muted-foreground",children:[t.jsx(at,{className:"w-3 h-3 animate-spin"})," Waiting for screen + mic permission…"]}),f==="recording"&&t.jsxs(t.Fragment,{children:[t.jsxs("span",{className:"flex items-center gap-1.5 text-red-500 font-semibold",children:[t.jsx(nt,{className:"w-2.5 h-2.5 fill-current animate-pulse"})," REC ",Jt(z)]}),t.jsxs(Ee,{size:"sm",variant:"outline",onClick:c,className:"gap-1.5 ml-auto",children:[t.jsx(Vt,{className:"w-3 h-3"})," Stop & save"]})]}),f==="uploading"&&t.jsxs("span",{className:"flex items-center gap-2 text-muted-foreground",children:[t.jsx(at,{className:"w-3 h-3 animate-spin"})," Uploading recording…"]}),f==="ready"&&t.jsxs("span",{className:"flex items-center gap-2 text-emerald-500",children:[t.jsx(Ut,{className:"w-3 h-3"})," Saved to your profile."]}),f==="failed"&&t.jsxs("span",{className:"flex items-center gap-2 text-amber-500",children:[t.jsx(Gt,{className:"w-3 h-3"})," ",L||"Recording failed",t.jsx(Ee,{size:"sm",variant:"ghost",onClick:()=>E({roomName:r,sessionId:g}),children:"Retry"})]})]})},U=[{id:"divine-sangha",name:"Divine Sangha",icon:"🔱",description:"Open space for all members",access:"public"},{id:"sacred-mantras",name:"Sacred Mantras",icon:"ॐ",description:"Mantra questions & discussion",access:"public"},{id:"healing-circle",name:"Healing Circle",icon:"✦",description:"Healing questions & updates",access:"public"},{id:"siddha-masters",name:"Siddha Masters",icon:"☀",description:"Siddha Quantum members",access:"sacred",tiers:["siddha_quantum","akasha_infinity"]},{id:"bhakti-algorithm-lab",name:"Bhakti Algorithm Lab",icon:"⚡",description:"Akasha Infinity members",access:"sacred",tiers:["akasha_infinity"]},{id:"stargate",name:"Stargate",icon:"⭐",description:"Stargate membership",access:"private"},{id:"andlig-transformation",name:"Andlig Transformation",icon:"🌸",description:"Monthly live — invite only",access:"private"}],Qt=`
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
  padding: 8px 14px 20px;
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
  gap: 12px;
  padding: 12px 12px;
  border: 1px solid rgba(255,255,255,.04);
  border-radius: 18px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all .2s;
  background: rgba(255,255,255,.02);
  width: 100%;
  text-align: left;
  position: relative;
}
.c-channel-row:hover, .c-channel-row:active {
  background: rgba(212,175,55,.06);
  border-color: rgba(212,175,55,.15);
}
.c-channel-row.locked { opacity: .45; }

.c-ch-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  background: rgba(212,175,55,.07);
  border: 1px solid rgba(212,175,55,.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.c-ch-icon.sacred { background:rgba(34,211,238,.06); border-color:rgba(34,211,238,.18); }
.c-ch-icon.private { background:rgba(212,175,55,.04); border-color:rgba(212,175,55,.1); }

.c-ch-info { flex: 1; min-width: 0; }
.c-ch-name {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -.02em;
  color: rgba(255,255,255,.92);
}
.c-ch-desc {
  font-size: 11px;
  color: rgba(255,255,255,.35);
  margin-top: 2px;
  font-weight: 400;
}
.c-ch-arrow {
  color: rgba(212,175,55,.35);
  font-size: 16px;
  flex-shrink: 0;
}
.c-lock-badge {
  font-size: 12px;
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
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
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
  align-items: center;
  gap: 10px;
  margin: 12px 0 6px;
}
.c-date-divider::before,.c-date-divider::after {
  content:'';flex:1;height:1px;background:rgba(255,255,255,.05);
}
.c-date-text {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: .4em;
  text-transform: uppercase;
  color: rgba(255,255,255,.18);
  white-space: nowrap;
}

.c-msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 80%;
  align-self: flex-start;
  animation: msgIn .2s ease-out;
}
.c-msg-row.mine { align-self: flex-end; flex-direction: row-reverse; }
.c-msg-row.consecutive { margin-top: -2px; }
@keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

.c-avatar {
  width: 32px;
  height: 32px;
  border-radius: 11px;
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: #D4AF37;
  flex-shrink: 0;
  align-self: flex-end;
}
.c-avatar.mine { background:rgba(212,175,55,.15); }
.c-avatar.hidden { opacity: 0; pointer-events: none; }

.c-msg-body { display: flex; flex-direction: column; gap: 2px; }

.c-msg-meta {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-bottom: 3px;
  padding-left: 2px;
}
.c-msg-author { font-weight:900; font-size:12px; letter-spacing:-.02em; color:#D4AF37; }
.c-msg-role { font-size:8px; font-weight:800; letter-spacing:.3em; text-transform:uppercase; color:rgba(212,175,55,.35); }

.c-bubble {
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  color: rgba(212,175,55,.9);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}
.c-bubble.mine {
  background: rgba(212,175,55,.12);
  border-color: rgba(212,175,55,.22);
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 14px rgba(212,175,55,.08);
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
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(212,175,55,.28);
  margin-top: 3px;
  padding-left: 2px;
}
.c-msg-time.mine { text-align: right; padding-right: 2px; padding-left: 0; }

.c-msg-sent {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(212,175,55,.75);
  margin-top: 2px;
  padding-left: 2px;
}
.c-msg-sent.mine { text-align: right; padding-right: 2px; padding-left: 0; }

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
.c-input-bar {
  flex-shrink: 0;
  padding: 10px 14px max(14px, env(safe-area-inset-bottom));
  background: rgba(5,5,5,.85);
  border-top: 1px solid rgba(255,255,255,.05);
}
.c-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 22px;
  padding: 4px 6px 4px 16px;
  transition: border-color .2s;
}
.c-input-row:focus-within {
  border-color: rgba(212,175,55,.25);
  box-shadow: 0 0 20px rgba(212,175,55,.06);
}
.c-input-row input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,.9);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
}
.c-input-row input::placeholder { color: rgba(255,255,255,.2); }
.c-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(212,175,55,.25), rgba(212,175,55,.45));
  border: none;
  color: #D4AF37;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .2s;
}
.c-send-btn:hover { background: linear-gradient(135deg, rgba(212,175,55,.35), rgba(212,175,55,.55)); }
.c-send-btn:disabled { opacity: .3; cursor: default; }

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
  padding: 14px;
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
`;function Xt({partnerId:r,onBack:g,isAdmin:S,onVideoCall:D,dmVideoUrl:f,onEndVideoCall:z,onDmSent:E}){const{user:c}=be(),{messages:L,partnerProfile:M,isLoading:P,sendMessage:C}=Ht(r),[h,k]=n.useState(""),I=async()=>{const v=h.trim();v&&(k(""),await C(v,"text"),S&&E&&E(v,r))},q=v=>v?v.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2):"??";return t.jsxs("div",{className:"c-chat-view",children:[t.jsxs("div",{className:"c-chat-header",children:[t.jsx("button",{className:"c-back-btn",onClick:g,children:"←"}),t.jsx("div",{className:"c-chat-icon",children:"👤"}),t.jsxs("div",{className:"c-chat-title",children:[t.jsx("div",{className:"c-chat-name",children:M?.full_name||"Direct Message"}),t.jsx("div",{className:"c-chat-sub",children:"Private 1-on-1 chat"})]}),f?t.jsx("button",{className:"c-video-call-btn",onClick:z,style:{marginLeft:"auto",borderColor:"rgba(255,59,48,.4)",color:"#ff6b61"},children:"⬛ END CALL"}):t.jsx("button",{className:"c-video-call-btn",onClick:D,style:{marginLeft:"auto"},children:"📹 VIDEO CALL"})]}),f&&t.jsx("div",{className:"c-live-frame",children:t.jsx("iframe",{src:f,allow:"camera;microphone;fullscreen;display-capture"})}),t.jsx("div",{className:"c-messages",children:P?t.jsxs("div",{className:"c-empty",children:[t.jsx("div",{className:"c-empty-icon",children:"⏳"}),t.jsx("div",{className:"c-empty-sub",children:"LOADING MESSAGES"})]}):L.length===0?t.jsxs("div",{className:"c-empty",children:[t.jsx("div",{className:"c-empty-icon",children:"👤"}),t.jsx("div",{className:"c-empty-title",children:M?.full_name||"Direct Message"}),t.jsx("div",{className:"c-empty-sub",children:"BE THE FIRST TO SPEAK"})]}):L.map(v=>{const w=v.sender_id===c?.id;return t.jsxs("div",{className:`c-msg-row ${w?"mine":""}`,children:[t.jsx("div",{className:`c-avatar ${w?"mine":""}`,children:q(w?"You":v.sender_profile?.full_name)}),t.jsxs("div",{className:"c-msg-body",children:[t.jsx("div",{className:"c-msg-meta",children:t.jsx("span",{className:"c-msg-author",children:w?"You":v.sender_profile?.full_name||"Member"})}),t.jsx("div",{className:`c-bubble ${w?"mine":""}`,children:typeof v.content=="string"&&v.content.startsWith("VIDEO_CALL:")?t.jsx("button",{type:"button",className:"c-video-call-btn",style:{color:"#22d3ee",borderColor:"rgba(34,211,238,.45)",background:"rgba(6,182,212,.12)"},onClick:()=>window.open(v.content.replace("VIDEO_CALL:",""),"_blank","noopener,noreferrer"),children:"🔗 JOIN VIDEO CALL"}):v.content}),t.jsx("div",{className:`c-msg-time ${w?"mine":""}`,children:De(new Date(v.created_at),{addSuffix:!0})}),w&&!(String(v.id||"").startsWith("temp-")||v.status==="pending")&&t.jsx("div",{className:`c-msg-sent ${w?"mine":""}`,children:"✓ Sent"})]})]},v.id)})}),t.jsx("div",{className:"c-input-bar",children:t.jsxs("div",{className:"c-input-row",children:[t.jsx("input",{placeholder:`Message ${M?.full_name||"them"}...`,value:h,onChange:v=>k(v.target.value),onKeyDown:v=>{v.key==="Enter"&&!v.shiftKey&&(v.preventDefault(),I())}}),t.jsx("button",{className:"c-send-btn",onClick:I,disabled:!h.trim(),children:"➤"})]})})]})}const hr=()=>{const{user:r}=be(),{isAdmin:g}=Ft(),{isStargateMember:S}=Ot(),D=$t(),f=Yt();console.log("[Community] isAdmin:",g);const[z,E]=n.useState("chat"),[c,L]=n.useState(null),[M,P]=n.useState(""),[C,h]=n.useState([]),[k,I]=n.useState(!1),[q,v]=n.useState(!1),[w,R]=n.useState(!1),[x,T]=n.useState(null),[B,K]=n.useState(null),[J,G]=n.useState(null),[O,A]=n.useState([]),Re=n.useRef(null),[xe,Te]=n.useState(0),[Le,Me]=n.useState(""),[Ie,lt]=n.useState("healing-chamber"),[dt,ce]=n.useState(!1),[pe,mt]=n.useState(null),[Ae,ut]=n.useState(""),[Y,ve]=n.useState([]),[ze,pt]=n.useState(""),[Q,le]=n.useState([]),[X,Pe]=n.useState(""),[H,$e]=n.useState(null),[de,me]=n.useState(!1),[te,ye]=n.useState({}),[ge,gt]=n.useState(null),[ft,Fe]=n.useState({}),[re,Oe]=n.useState(""),[fe,qe]=n.useState(null),[Be,We]=n.useState(null),[Ve,ht]=n.useState(new Set),[Z,ie]=n.useState(null),[Ue,bt]=n.useState(null),[xt,vt]=n.useState(null),[yt,Ge]=n.useState(0),[_t,Ye]=n.useState(0),[wt,St]=n.useState(new Set),[kt,jt]=n.useState({}),[ne,_e]=n.useState([]),[we,He]=n.useState(!1),Ke=n.useRef({});Ke.current=kt;const ae=n.useRef({}),ue=n.useMemo(()=>{const e={};return Y.forEach(i=>{i.full_name&&(e[i.id]=i.full_name)}),ae.current=e,e},[Y]),$=e=>!!e&&e.startsWith("dm-"),se=(e,i)=>{if(!e.startsWith("dm-"))return null;const a=e.slice(3),s=36;if(a.length<s*2+1)return null;const o=a.slice(0,s),u=a.slice(s+1);return i===o?u:i===u?o:null},W=n.useRef(null),Se=n.useRef({});Se.current=te;const ke=n.useRef(f.fetchActiveSessions);ke.current=f.fetchActiveSessions,n.useEffect(()=>{if(!k){v(!1);return}const e=setTimeout(()=>v(!0),2e3);return()=>clearTimeout(e)},[k]),n.useEffect(()=>{const e=()=>{Z&&Ge(i=>i+1),x&&Ye(i=>i+1)};return window.addEventListener("online",e),()=>window.removeEventListener("online",e)},[Z,x]);const Je=n.useCallback(async e=>{if(!(!e||!r)){W.current=e,I(!0);try{if($(e)){const m=se(e,r.id);if(!m){h([]);return}const p=4e3,j=new Promise((F,Ce)=>setTimeout(()=>Ce(new Error("DM fetch timeout")),p)),l=Promise.all([d.from("private_messages").select("*").eq("sender_id",r.id).eq("receiver_id",m).order("created_at",{ascending:!0}),d.from("private_messages").select("*").eq("sender_id",m).eq("receiver_id",r.id).order("created_at",{ascending:!0})]);let b,_;try{[b,_]=await Promise.race([l,j])??[]}catch(F){console.error("DM fetch error or timeout:",F),W.current===e&&h([]);return}if(W.current!==e)return;const ee=b?.data??[],It=_?.data??[];b.error&&console.error("Error loading DM sent:",b.error),_.error&&console.error("Error loading DM received:",_.error);const At=[...ee,...It].sort((F,Ce)=>new Date(F.created_at).getTime()-new Date(Ce.created_at).getTime()),zt=ae.current,Pt=At.map(F=>({id:F.id,channel_id:e,user_id:F.sender_id,content:F.content,created_at:F.created_at,user_name:F.sender_id===r.id?"You":zt[F.sender_id]||"Member"}));h(Pt);return}const i=te[e];if(!i){h([]);return}const{data:a,error:s}=await d.from("chat_messages").select("*").eq("room_id",i).order("created_at",{ascending:!0}).limit(100);if(s){console.error("Error loading channel messages:",s),h([]);return}const o=ae.current,y=(a||[]).map(m=>({...m,user_name:m.user_name||(m.user_id===r?.id?"You":o[m.user_id]||"Member")}));h(y)}finally{W.current===e&&(W.current=null),I(!1)}}},[te,r]),oe=n.useCallback(async()=>{me(!0);const{data:e,error:i}=await d.from("community_posts").select("id, user_id, content, created_at, image_url, audio_url, video_url, pdf_url, post_type, likes_count, comments_count").not("post_type","eq","live").order("created_at",{ascending:!1}).limit(30);if(i){console.error("Error loading community feed:",i),le([]),me(!1);return}const s=(e||[]).filter(o=>o.post_type!=="live").map(o=>({...o,likes_count:o.likes_count??0,comments_count:o.comments_count??0,user_liked:!1}));if(r?.id){const o=s.map(m=>m.id),{data:u}=await d.from("post_likes").select("post_id").eq("user_id",r.id).in("post_id",o),y=new Set((u||[]).map(m=>m.post_id));s.forEach(m=>{m.user_liked=y.has(m.id)})}le(s),me(!1)},[r?.id]),Qe=n.useRef(oe);Qe.current=oe;const he=n.useCallback(async e=>{const{data:i,error:a}=await d.from("post_comments").select("id, post_id, user_id, content, created_at").eq("post_id",e).order("created_at",{ascending:!0});if(a){console.error("Error loading comments:",a),Fe(o=>({...o,[e]:[]}));return}const s=i||[];Fe(o=>({...o,[e]:s.map(u=>({id:u.id,post_id:u.post_id,user_id:u.user_id,content:u.content,created_at:u.created_at,user_name:r?.id===u.user_id?"You":Ke.current[u.user_id]?.full_name??"Member"}))}))},[r?.id]),Xe=n.useCallback(async(e,i)=>{if(!r||!i.trim())return;qe(e);const{error:a}=await d.from("post_comments").insert({post_id:e,user_id:r.id,content:i.trim()});if(qe(null),Oe(""),a){console.error("Failed to add comment:",a),N.error("Could not add comment.");return}const s=Q.find(o=>o.id===e);s&&(await d.from("community_posts").update({comments_count:(s.comments_count||0)+1}).eq("id",e),le(o=>o.map(u=>u.id===e?{...u,comments_count:(u.comments_count||0)+1}:u))),await he(e),N.success("Comment added.")},[r,Q,he]),Nt=n.useCallback(async e=>{if(!r){N.info("Sign in to like posts.");return}const i=Q.find(a=>a.id===e);i&&(We(e),i.user_liked?(await d.from("post_likes").delete().eq("post_id",e).eq("user_id",r.id),await d.from("community_posts").update({likes_count:Math.max(0,(i.likes_count||0)-1)}).eq("id",e),le(a=>a.map(s=>s.id===e?{...s,user_liked:!1,likes_count:Math.max(0,(s.likes_count||0)-1)}:s))):(await d.from("post_likes").insert({post_id:e,user_id:r.id}),await d.from("community_posts").update({likes_count:(i.likes_count||0)+1}).eq("id",e),le(a=>a.map(s=>s.id===e?{...s,user_liked:!0,likes_count:(s.likes_count||0)+1}:s))),We(null))},[r,Q]);n.useEffect(()=>{if(!r)return;const e=async()=>{try{let s=new Set;try{const{data:l}=await d.from("user_roles").select("user_id").eq("role","admin");s=new Set((l||[]).map(b=>b.user_id))}catch{}let o=d.from("profiles").select("*").limit(500);r?.id&&(o=o.neq("user_id",r.id));const{data:u,error:y}=await o;if(y){console.error("Error loading members:",y),ve([]);return}const m=u??[],p={};m.forEach(l=>{const b=l.user_id!=null?l.user_id:l.id;b&&(p[b]={full_name:l.full_name??null,avatar_url:l.avatar_url??null})}),jt(l=>({...l,...p}));const j=m.filter(l=>(l.user_id!=null?l.user_id:l.id)===r?.id?!1:(l.subscription_tier||l.role||"").toLowerCase()!=="admin").map(l=>{const b=l.user_id!=null?l.user_id:l.id;return{id:b,full_name:l.full_name??null,subscription_tier:l.subscription_tier??l.role??null,avatar_url:l.avatar_url??null,isAdmin:s.has(b)}}).sort((l,b)=>{if(l.isAdmin&&!b.isAdmin)return-1;if(!l.isAdmin&&b.isAdmin)return 1;const _=(l.full_name||"").toLowerCase(),ee=(b.full_name||"").toLowerCase();return _.localeCompare(ee)});ve(j)}catch(s){console.error("Failed to load members:",s),ve([])}},i=async()=>{const{data:s,error:o}=await d.from("chat_rooms").select("id, name");if(o){console.error("Error loading chat rooms:",o);return}const u={};(s||[]).forEach(p=>{const j=U.find(l=>l.name===p.name);j&&(u[j.id]=p.id),p.type==="andlig"&&(u["andlig-transformation"]=p.id),p.type==="stargate"&&(u.stargate=p.id),p.name==="Community Lounge"&&!u["divine-sangha"]&&(u["divine-sangha"]=p.id),p.name?.includes("Divine Sangha")&&!u["divine-sangha"]&&(u["divine-sangha"]=p.id),p.name?.includes("Sacred Mantra")&&!u["sacred-mantras"]&&(u["sacred-mantras"]=p.id),p.name?.includes("Healing")&&!u["healing-circle"]&&(u["healing-circle"]=p.id)});const m=U.filter(p=>!u[p.id]);if(m.length>0){const p=m.map(async l=>{const{data:b,error:_}=await d.from("chat_rooms").insert({name:l.name}).select("id").single();if(!_&&b?.id)return{channelId:l.id,roomId:b.id};const{data:ee}=await d.from("chat_rooms").select("id").eq("name",l.name).limit(1);return ee&&ee.length>0?{channelId:l.id,roomId:ee[0].id}:{channelId:l.id,roomId:null}});(await Promise.all(p)).forEach(l=>{l.roomId&&(u[l.channelId]=l.roomId)})}ye(u)};Promise.all([e(),i()]),(async()=>{const s=await qt();if(s!=null){Te(s.total_profiles);return}const{count:o,error:u}=await d.from("profiles").select("id",{count:"exact",head:!0});!u&&o!=null&&Te(o)})()},[r?.id]),n.useEffect(()=>{if(!r?.id)return;const e=d.channel("community-presence");return e.on("presence",{event:"sync"},()=>{const i=e.presenceState(),a=new Set;Object.values(i).forEach(s=>{(s||[]).forEach(o=>{o?.user_id&&a.add(o.user_id)})}),a.add(r.id),ht(a)}).subscribe(async i=>{i==="SUBSCRIBED"&&await e.track({user_id:r.id})}),()=>{d.removeChannel(e)}},[r?.id]);const Ze=n.useCallback(async e=>{if(!r||!e||$(e)||Se.current[e])return;const a=U.find(s=>s.id===e)?.name||e;try{let{data:s}=await d.from("chat_rooms").select("id").eq("name",a).maybeSingle();if(!s){const{data:o,error:u}=await d.from("chat_rooms").insert({name:a}).select("id").single();if(!u&&o)s=o;else{const{data:y}=await d.from("chat_rooms").select("id").eq("name",a).maybeSingle();y?s=y:console.error("Failed to create chat room:",u)}}s?.id&&ye(o=>({...o,[e]:s.id}))}catch(s){console.warn("Could not ensure room for channel:",e,s)}},[r]);n.useEffect(()=>{oe()},[oe]),n.useEffect(()=>{if(!r?.id)return;(async()=>{const{data:a}=await d.from("community_notifications").select("id, type, title, body, channel_id, link, is_read, created_at").eq("user_id",r.id).order("created_at",{ascending:!1}).limit(50);_e(a||[])})();const i=d.channel(`notifs-${r.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"community_notifications",filter:`user_id=eq.${r.id}`},a=>{const s=a.new;_e(o=>[{...s},...o.filter(u=>u.id!==s.id)])}).subscribe();return()=>{d.removeChannel(i)}},[r?.id]),n.useEffect(()=>{if(!(typeof localStorage<"u"?localStorage.getItem("push-permission-asked"):null)&&r?.id){typeof localStorage<"u"&&localStorage.setItem("push-permission-asked","1");const i=setTimeout(async()=>{try{await Bt()&&await d.from("profiles").update({push_enabled:!0}).eq("user_id",r.id)}catch{}},3e3);return()=>clearTimeout(i)}},[r?.id]),n.useEffect(()=>{ge&&he(ge)},[ge,he]),n.useEffect(()=>{const e=d.channel("community-feed").on("postgres_changes",{event:"*",schema:"public",table:"community_posts"},()=>{Qe.current()}).subscribe();return()=>{d.removeChannel(e)}},[]),n.useEffect(()=>{if(!c){A([]),T(null);return}if($(c)&&r){const o=se(c,r.id);if(Je(c),o){const u=d.channel(`dm-${r.id}-${o}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},y=>{const m=y.new;if(!(m.sender_id===r.id&&m.receiver_id===o||m.sender_id===o&&m.receiver_id===r.id))return;const j=ae.current,l={id:m.id,channel_id:c,user_id:m.sender_id,content:m.content,created_at:m.created_at,user_name:m.sender_id===r.id?"You":j[m.sender_id]||"Member"};h(b=>b.some(_=>_.id===l.id)?b:[...b,l])}).subscribe();return()=>{d.removeChannel(u)}}return}let e=!1,i=null,a=null,s=null;return(async()=>{let o=te[c];if(!o&&(await Ze(c),o=Se.current[c],!o||e)){e||(h([]),A([]),T(null));return}if(e)return;I(!0);const u=ke.current;await Promise.all([(async()=>{W.current=c;try{const{data:y,error:m}=await d.from("chat_messages").select("*").eq("room_id",o).order("created_at",{ascending:!0}).limit(100);if(e||W.current!==c)return;if(m){h([]);return}const p=ae.current;h((y||[]).map(l=>({...l,user_name:l.user_id===r?.id?"You":p[l.user_id]||"Member"})))}finally{W.current===c&&(W.current=null),I(!1)}})(),u(c).then(y=>{e||A(y)})]).catch(()=>{e||I(!1)}),!e&&(i=setInterval(()=>u(c).then(y=>{e||A(y)}),3e4),a=d.channel(`room-${o}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages",filter:`room_id=eq.${o}`},y=>{const m=y.new,p=ae.current,j={...m,user_name:m.user_id===r?.id?"You":p[m.user_id]||"Member"};h(l=>{if(l.some(_=>_.id===j.id))return l;const b=l.findIndex(_=>_.id.startsWith("temp-")&&_.user_id===m.user_id&&_.content===m.content);if(b!==-1){const _=[...l];return _[b]=j,_}return[...l,j]})}).subscribe(),s=d.channel(`live-${c}`).on("postgres_changes",{event:"*",schema:"public",table:"community_live_sessions"},()=>{ke.current(c).then(y=>{e||A(y)})}).subscribe())})(),()=>{e=!0,i&&clearInterval(i),a&&d.removeChannel(a),s&&d.removeChannel(s)}},[c,Je,te,r,Ze]),n.useEffect(()=>{Re.current?.scrollIntoView({behavior:"auto"})},[C,c]);const Ct=async(e,i,a)=>{if(!r)return;R(!1),ce(!1);const s=a?.trim()||`Live in ${i}`,o=e==="stargate"&&S&&!g,u=e==="stargate"?{stargate_category:Ie}:void 0,y=await f.createRoom(e,s,void 0,o,"channel",u);y&&(T(y.room_url),K(y.session?.room_name||null),G(y.session?.id||null))},Et=async()=>{!c||!V||(mt(c),ut(V.name),Me(""),ce(!0))},et=async()=>{if(!(!pe||!r)){if(pe==="feed"){ce(!1);return}await Ct(pe,Ae,Le),ce(!1)}},tt=async()=>{if(!c||!r||!$(c))return;const e=se(c,r.id),i=e?ue[e]:"Member",a=await f.createRoom(c,`Video call with ${i}`,"1-on-1 video call",!0,"channel",e?{partner_user_id:e}:void 0);a&&(ie(a.room_url),bt(a.session?.room_name||null),vt(a.session?.id||null),e&&await d.from("private_messages").insert({sender_id:r.id,receiver_id:e,content:"VIDEO_CALL:"+a.room_url}))},Dt=async()=>{f.activeSession&&(await f.endSession(f.activeSession.id),T(null),K(null),G(null),await oe())},Rt=async()=>{if(!r||!X.trim())return;me(!0);let e=null,i=null,a=null,s=null,o="text";try{if(H){const p=H.name.split(".").pop()||"bin",j=`feed/${r.id}/${Date.now()}.${p}`,{error:l}=await d.storage.from("community-media").upload(j,H,{upsert:!0,contentType:H.type||void 0});if(l)throw l;const{data:b}=d.storage.from("community-media").getPublicUrl(j),_=b.publicUrl;H.type.startsWith("image/")?(e=_,o="image"):H.type.startsWith("video/")?(a=_,o="video"):H.type.startsWith("audio/")?(i=_,o="audio"):H.type==="application/pdf"||p.toLowerCase()==="pdf"?(s=_,o="pdf"):(s=_,o="attachment")}const{error:u}=await d.from("community_posts").insert({user_id:r.id,content:X.trim(),image_url:e,audio_url:i,video_url:a,pdf_url:s,post_type:o});if(u)throw u;const y=ue[r.id]||"Admin",m=X.trim();Pe(""),$e(null),await oe(),N.success("Post shared to the Sangha feed.");try{d.functions.invoke("notify-community",{body:{type:"post",triggeredBy:y,title:`✨ New post from ${y}`,body:m.substring(0,100)+(m.length>100?"...":""),link:"/community"}})}catch(p){console.warn("Notify community failed:",p)}}catch(u){console.error("Failed to create feed post:",u),N.error("Could not post to feed. Please try again.")}finally{me(!1)}},rt=async()=>{if(!M.trim()||!r||!c)return;const e=M.trim();if(P(""),$(c)){const m=se(c,r.id);if(!m)return;const p={id:`temp-${Date.now()}`,channel_id:c,user_id:r.id,content:e,created_at:new Date().toISOString(),user_name:"You"};h(b=>[...b,p]);const{data:j,error:l}=await d.from("private_messages").insert({sender_id:r.id,receiver_id:m,content:e}).select().single();l?(console.error("Failed to send DM:",l),N.error("Could not send message."),h(b=>b.filter(_=>_.id!==p.id))):j&&h(b=>b.map(_=>_.id===p.id?{...p,id:j.id}:_));return}let i=te[c];if(!i)try{const p=U.find(l=>l.id===c)?.name||c;let{data:j}=await d.from("chat_rooms").select("id").eq("name",p).maybeSingle();if(!j){const{data:l,error:b}=await d.from("chat_rooms").insert({name:p}).select("id").single();if(!b&&l)j=l;else{const{data:_}=await d.from("chat_rooms").select("id").eq("name",p).maybeSingle();_&&(j=_)}}if(j?.id)i=j.id,ye(l=>({...l,[c]:i}));else{N.error("Could not set up this channel. Please try again.");return}}catch(m){console.error("Error while ensuring chat room exists:",m),N.error("Channel is not configured yet.");return}const s=Y.find(m=>m.id===r.id)?.full_name||"You",o={id:`temp-${Date.now()}`,channel_id:c,user_id:r.id,content:e,created_at:new Date().toISOString(),user_name:"You",pending:!0};h(m=>[...m,o]);const{data:u,error:y}=await d.from("chat_messages").insert({room_id:i,user_id:r.id,content:e}).select().single();if(y)console.error("Failed to send message:",y),N.error("Could not send message."),h(m=>m.filter(p=>p.id!==o.id));else{u&&h(m=>m.map(p=>p.id===o.id?{...u,user_name:"You",pending:!1}:p));try{const m=`last-notif-${c}`,p=typeof localStorage<"u"?localStorage.getItem(m):null,j=60*60*1e3;if(!p||Date.now()-parseInt(p,10)>j){typeof localStorage<"u"&&localStorage.setItem(m,Date.now().toString());const l=U.find(b=>b.id===c);d.functions.invoke("notify-community",{body:{type:"message",triggeredBy:s,channelId:c,channelName:l?.name||c,title:`💬 New message in ${l?.name||c}`,body:`${s}: ${e.substring(0,80)}${e.length>80?"…":""}`,link:"/community"}})}}catch(m){console.warn("Notify community failed:",m)}}},Tt=e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),rt())},Lt=async e=>{await d.from("chat_messages").delete().eq("id",e),h(i=>i.filter(a=>a.id!==e))},V=n.useMemo(()=>{if(!c)return;const e=U.find(i=>i.id===c);if(e)return e;if(c.startsWith("dm-")&&r){const i=se(c,r.id),a=i?ue[i]:null;return{id:c,name:a||"Direct Message",icon:"👤",description:"Private 1-on-1 chat"}}},[c,r,ue]),je=e=>e?e.split(" ").map(i=>i[0]).join("").toUpperCase().slice(0,2):"??",Ne=e=>{try{return De(new Date(e),{addSuffix:!0})}catch{return""}},Mt=typeof window<"u"&&window.innerWidth>=768;return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:Qt}),t.jsxs("div",{className:"c-root",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"10px 14px 0",gap:10},children:[t.jsxs("div",{className:"c-banner",style:{flex:1,margin:0},children:[t.jsx("span",{className:"c-pulse"}),xe," SOUL",xe===1?"":"S"," IN SACRED COMMUNITY"]}),t.jsxs("div",{style:{position:"relative",flexShrink:0},children:[t.jsxs("button",{onClick:()=>{He(!we),!we&&ne.some(e=>!e.is_read)&&d.from("community_notifications").update({is_read:!0}).eq("user_id",r?.id).eq("is_read",!1).then(()=>{_e(e=>e.map(i=>({...i,is_read:!0})))})},style:{background:"rgba(255,255,255,.04)",border:"1px solid rgba(212,175,55,.2)",borderRadius:12,padding:"8px 12px",cursor:"pointer",fontSize:18},children:["🔔",ne.filter(e=>!e.is_read).length>0&&t.jsx("span",{style:{position:"absolute",top:-4,right:-4,background:"#D4AF37",color:"#000",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"},children:ne.filter(e=>!e.is_read).length>9?"9+":ne.filter(e=>!e.is_read).length})]}),we&&t.jsxs("div",{style:{position:"absolute",top:"100%",right:0,marginTop:4,background:"#0a0a0a",border:"1px solid rgba(212,175,55,.25)",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,.5)",minWidth:280,maxWidth:360,maxHeight:320,overflowY:"auto",zIndex:100},children:[t.jsx("div",{style:{padding:12,borderBottom:"1px solid rgba(255,255,255,.06)",fontWeight:800,fontSize:10,letterSpacing:"0.2em",color:"#D4AF37"},children:"NOTIFICATIONS"}),ne.length===0?t.jsx("div",{style:{padding:24,color:"rgba(255,255,255,.4)",fontSize:13},children:"No notifications yet"}):ne.slice(0,20).map(e=>t.jsxs("div",{onClick:()=>{e.link&&D(e.link),He(!1)},style:{padding:12,borderBottom:"1px solid rgba(255,255,255,.04)",cursor:"pointer",background:e.is_read?"transparent":"rgba(212,175,55,.06)"},children:[t.jsx("div",{style:{fontWeight:700,fontSize:12,color:"rgba(255,255,255,.95)"},children:e.title}),t.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2},children:e.body}),t.jsx("div",{style:{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:4},children:De(new Date(e.created_at),{addSuffix:!0})})]},e.id))]})]})]}),t.jsxs("div",{className:"c-top-tabs",children:[t.jsx("button",{className:`c-top-tab ${z==="chat"?"active":""}`,onClick:()=>E("chat"),children:"Chat"}),t.jsx("button",{className:`c-top-tab ${z==="feed"?"active":""}`,onClick:()=>E("feed"),children:"Feed"}),t.jsx("button",{className:`c-top-tab ${z==="members"?"active":""}`,onClick:()=>E("members"),children:"Members"})]}),t.jsx("div",{className:"c-body",children:z==="chat"||Mt?c&&V?$(c)?(()=>{const e=se(c,r?.id||"");return e?t.jsx(Xt,{partnerId:e,onBack:()=>{L(null),ie(null),T(null),E("members")},isAdmin:g,onVideoCall:tt,dmVideoUrl:Z,onEndVideoCall:()=>ie(null),onDmSent:async(i,a)=>{const s=ue[r?.id||""]||"Admin";try{d.functions.invoke("notify-community",{body:{type:"dm",triggeredBy:s,title:`💌 Message from ${s}`,body:i.substring(0,100)+(i.length>100?"…":""),link:"/community",targetUserIds:[a]}})}catch(o){console.warn("Notify DM failed:",o)}}}):t.jsx("div",{className:"c-chat-view",children:t.jsxs("div",{className:"c-chat-header",children:[t.jsx("button",{className:"c-back-btn",onClick:()=>{L(null),ie(null),T(null)},children:"←"}),t.jsx("div",{className:"c-chat-title",children:t.jsx("div",{className:"c-chat-name",children:"Invalid DM"})})]})})})():t.jsxs("div",{className:"c-chat-view",children:[t.jsxs("div",{className:"c-chat-header",children:[t.jsx("button",{className:"c-back-btn",onClick:()=>{L(null),ie(null),T(null)},children:"←"}),t.jsx("div",{className:"c-chat-icon",children:V.icon}),t.jsxs("div",{className:"c-chat-title",children:[t.jsx("div",{className:"c-chat-name",children:V.name}),t.jsx("div",{className:"c-chat-sub",children:V.description})]}),$(c)&&!Z&&t.jsxs("button",{className:"c-video-call-btn",onClick:tt,disabled:f.isCreating,children:[f.isCreating?"⏳":"📹"," VIDEO CALL"]}),$(c)&&Z&&t.jsxs(t.Fragment,{children:[t.jsx("button",{type:"button",className:"c-video-call-btn",onClick:()=>Ge(e=>e+1),title:"Reload Daily iframe if a participant freezes or drops",children:"⟳ RECONNECT"}),t.jsx("button",{className:"c-video-call-btn",onClick:()=>ie(null),style:{borderColor:"rgba(255,59,48,.4)",color:"#ff6b61"},children:"⬛ END CALL"})]}),!$(c)&&(g||c==="stargate"&&S)&&!x&&t.jsx("button",{className:`c-golive-header-btn ${f.isCreating?"c-golive-active":""}`,onClick:Et,disabled:f.isCreating,children:f.isCreating?"⏳ CREATING...":"🔴 GO LIVE"}),!$(c)&&x&&t.jsx("button",{type:"button",className:"c-golive-header-btn",onClick:()=>Ye(e=>e+1),title:"Reload Daily iframe if remote video/audio is stuck",children:"⟳ RECONNECT"}),!$(c)&&x&&(g||f.activeSession?.host_user_id===r?.id)&&t.jsx("button",{className:"c-golive-header-btn c-golive-active",onClick:Dt,children:"⬛ END LIVE"}),!$(c)&&!x&&O.length>0&&!wt.has(c)&&t.jsx("div",{className:"c-live-pill-wrap",children:O.slice(0,1).map(e=>t.jsxs("div",{className:"c-live-pill",children:[t.jsx("span",{style:{animation:"pulse 1.5s ease-in-out infinite"},onClick:()=>e.room_url&&window.open(e.room_url,"_blank"),children:"🔴"}),t.jsxs("span",{onClick:()=>e.room_url&&window.open(e.room_url,"_blank"),children:["JOIN LIVE: ",e.title.length>18?e.title.slice(0,18)+"…":e.title]}),t.jsx("span",{className:"c-live-pill-dismiss",onClick:()=>St(i=>new Set(i).add(c)),"aria-label":"Dismiss",children:"✕"})]},e.id))})]}),$(c)&&Z&&t.jsxs("div",{className:"c-live-frame",children:[Ue&&t.jsx("div",{style:{padding:"8px 8px 0"},children:t.jsx(ct,{roomName:Ue,sessionId:xt,autoStart:!0})}),t.jsx("iframe",{src:Z,allow:"camera;microphone;fullscreen;display-capture"},`dm-daily-${yt}`)]}),!$(c)&&x&&t.jsxs("div",{className:"c-live-frame",children:[B&&t.jsx("div",{style:{padding:"8px 8px 0"},children:t.jsx(ct,{roomName:B,sessionId:J,autoStart:!0})}),t.jsx("iframe",{src:x,allow:"camera;microphone;fullscreen;display-capture"},`live-daily-${_t}`)]}),t.jsxs("div",{className:"c-messages",children:[k?t.jsxs("div",{className:"c-empty",children:[t.jsx("div",{className:"c-empty-icon",children:"⏳"}),t.jsx("div",{className:"c-empty-sub",children:"LOADING MESSAGES"}),q&&t.jsx("button",{className:"c-skip-loading-btn",onClick:()=>{I(!1),v(!1),h([])},children:"Start chatting anyway"})]}):C.length===0?t.jsxs("div",{className:"c-empty",children:[t.jsx("div",{className:"c-empty-icon",children:V.icon}),t.jsx("div",{className:"c-empty-title",children:V.name}),t.jsx("div",{className:"c-empty-sub",children:"BE THE FIRST TO SPEAK"})]}):C.map((e,i)=>{const a=e.user_id===r?.id,s=C[i-1],o=s&&s.user_id===e.user_id;return t.jsxs("div",{className:`c-msg-row ${a?"mine":""} ${o?"consecutive":""}`,children:[t.jsx("div",{className:`c-avatar ${a?"mine":""} ${o||a?"hidden":""}`,children:je(e.user_name||(a?"ME":void 0))}),t.jsxs("div",{className:"c-msg-body",children:[!o&&!a&&t.jsx("div",{className:"c-msg-meta",children:t.jsx("span",{className:"c-msg-author",children:e.user_name||"Member"})}),t.jsxs("div",{className:`c-bubble ${a?"mine":""}`,children:[e.content,!$(c)&&(a||g)&&t.jsx("button",{className:"c-delete-btn",onClick:()=>Lt(e.id),children:"✕"})]}),t.jsx("div",{className:`c-msg-time ${a?"mine":""}`,children:Ne(e.created_at)}),a&&!e.pending&&t.jsx("div",{className:`c-msg-sent ${a?"mine":""}`,children:"✓ Sent"})]})]},e.id)}),t.jsx("div",{ref:Re})]}),t.jsx("div",{className:"c-input-bar",children:t.jsxs("div",{className:"c-input-row",children:[t.jsx("input",{placeholder:`Message ${V.name}...`,value:M,onChange:e=>P(e.target.value),onKeyDown:Tt}),t.jsx("button",{className:"c-send-btn",onClick:rt,disabled:!M.trim(),children:"➤"})]})})]}):t.jsxs("div",{className:"c-channels-view",children:[t.jsx("div",{className:"c-section-label",children:"OPEN CHANNELS"}),U.filter(e=>e.access==="public").map(e=>t.jsxs("button",{className:"c-channel-row",onClick:()=>{console.log("[Community] Channel clicked:",e.id),L(e.id),E("chat")},children:[t.jsx("div",{className:"c-ch-icon",children:e.icon}),t.jsxs("div",{className:"c-ch-info",children:[t.jsx("div",{className:"c-ch-name",children:e.name}),t.jsx("div",{className:"c-ch-desc",children:e.description}),t.jsxs("div",{style:{fontSize:10,color:"rgba(212,175,55,.5)",marginTop:2},children:[xe," members"]})]}),t.jsx("div",{className:"c-ch-arrow",children:"›"})]},e.id)),t.jsx("div",{className:"c-section-label",children:"SACRED SPACES"}),U.filter(e=>e.access==="sacred").map(e=>{const i=Y.find(o=>o.id===r?.id)?.subscription_tier,a=it(i),s=g||a>=2;return t.jsxs("button",{className:`c-channel-row ${s?"":"locked"}`,onClick:()=>{s?(console.log("[Community] Channel clicked:",e.id),L(e.id),E("chat")):N.error("This space requires Siddha Quantum or Akasha Infinity membership.")},children:[t.jsx("div",{className:"c-ch-icon sacred",children:e.icon}),t.jsxs("div",{className:"c-ch-info",children:[t.jsx("div",{className:"c-ch-name",children:e.name}),t.jsx("div",{className:"c-ch-desc",children:e.description}),t.jsxs("div",{style:{fontSize:10,color:"rgba(212,175,55,.5)",marginTop:2},children:[Y.filter(o=>it(o.subscription_tier)>=2).length+(g?1:0)," members"]})]}),s?t.jsx("div",{className:"c-ch-arrow",children:"›"}):t.jsx("span",{className:"c-lock-badge",children:"🔒"})]},e.id)}),t.jsx("div",{className:"c-section-label",children:"PRIVATE"}),U.filter(e=>e.access==="private").map(e=>{const i=e.id==="stargate"?!g&&!S:!g;return t.jsxs("button",{className:`c-channel-row ${i?"locked":""}`,onClick:()=>{i||(console.log("[Community] Channel clicked:",e.id),L(e.id),E("chat"))},children:[t.jsx("div",{className:"c-ch-icon private",children:e.icon}),t.jsxs("div",{className:"c-ch-info",children:[t.jsx("div",{className:"c-ch-name",children:e.name}),t.jsx("div",{className:"c-ch-desc",children:e.description}),t.jsx("div",{style:{fontSize:10,color:"rgba(212,175,55,.5)",marginTop:2},children:e.id==="stargate"?"Stargate members":"Invite only"})]}),i?t.jsx("span",{className:"c-lock-badge",children:"🔒"}):t.jsx("div",{className:"c-ch-arrow",children:"›"})]},e.id)})]}):z==="feed"?t.jsxs("div",{className:"c-feed-view",children:[t.jsx("div",{className:"c-section-label",children:g?"ADMIN FEED":"SANGHA FEED"}),g&&t.jsxs("div",{className:"c-feed-card",style:{marginBottom:16},children:[t.jsx("textarea",{placeholder:"Share an update with the Sangha...",value:X,onChange:e=>Pe(e.target.value),style:{width:"100%",minHeight:70,background:"transparent",border:"none",outline:"none",resize:"vertical",color:"rgba(255,255,255,.9)",fontSize:14,fontFamily:"'Plus Jakarta Sans', sans-serif"}}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginTop:10},children:[t.jsx("input",{type:"file",accept:"image/*,video/*,audio/*,application/pdf",onChange:e=>$e(e.target.files?.[0]||null),style:{fontSize:11,color:"rgba(255,255,255,.6)"}}),t.jsx("button",{onClick:Rt,disabled:de||!X.trim(),style:{marginLeft:"auto",padding:"8px 16px",borderRadius:999,border:"none",background:"linear-gradient(135deg, rgba(212,175,55,.3), rgba(212,175,55,.6))",color:"#050505",fontSize:11,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",cursor:de||!X.trim()?"default":"pointer",opacity:de||!X.trim()?.4:1},children:de?"Posting...":"Post"})]})]}),de&&Q.length===0?t.jsxs("div",{className:"c-empty",children:[t.jsx("div",{className:"c-empty-icon",children:"⏳"}),t.jsx("div",{className:"c-empty-sub",children:"LOADING FEED"})]}):Q.length===0?t.jsxs("div",{className:"c-empty",children:[t.jsx("div",{className:"c-empty-icon",children:"✦"}),t.jsx("div",{className:"c-empty-title",children:"No posts yet"}),t.jsx("div",{className:"c-empty-sub",children:"Share the first transmission"})]}):Q.map(e=>t.jsxs("div",{className:"c-feed-card",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",marginBottom:4},children:[t.jsx("span",{className:"c-feed-author",children:"Admin Transmission"}),t.jsx("span",{className:"c-feed-time",children:Ne(e.created_at)})]}),t.jsx("div",{className:"c-feed-text",children:e.content}),e.image_url&&t.jsx("img",{src:e.image_url,alt:"",style:{marginTop:10,borderRadius:16,width:"100%",maxHeight:260,objectFit:"cover",border:"1px solid rgba(255,255,255,.06)"}}),e.video_url&&e.post_type==="live"&&t.jsx("button",{type:"button",onClick:()=>window.open(e.video_url,"_blank","noopener,noreferrer"),style:{display:"block",marginTop:10,width:"100%",padding:"12px 16px",borderRadius:16,border:"1px solid rgba(220,38,38,.55)",background:"linear-gradient(135deg, rgba(127,29,29,.85), rgba(185,28,28,.95))",color:"#fecaca",fontSize:13,fontWeight:800,letterSpacing:"0.06em",cursor:"pointer"},children:Date.now()-new Date(e.created_at).getTime()>4*60*60*1e3?"📹 Watch Recording":"🔴 JOIN LIVE SESSION"}),e.video_url&&e.post_type!=="live"&&t.jsxs(t.Fragment,{children:[t.jsx("video",{src:e.video_url,controls:!0,style:{marginTop:10,borderRadius:16,width:"100%",maxHeight:260,objectFit:"cover",border:"1px solid rgba(255,255,255,.06)",background:"#000"}}),t.jsx("button",{type:"button",onClick:async()=>{try{N.info("Starting audio conversion…");const{data:i,error:a}=await d.functions.invoke("convert-meditation-audio",{body:{video_url:e.video_url}});if(a)throw a;if(!i?.success)throw new Error(i?.error||"Conversion failed");N.success("Audio conversion started. It will appear when ready.")}catch(i){N.error(i?.message||"Could not start conversion.")}},style:{marginTop:10,width:"100%",padding:"10px 14px",borderRadius:16,border:"1px solid rgba(212,175,55,.28)",background:"rgba(10,10,10,.9)",color:"rgba(212,175,55,.92)",fontSize:11,fontWeight:900,letterSpacing:"0.22em",textTransform:"uppercase",cursor:"pointer"},children:"🎧 Video → Audio"})]}),e.audio_url&&t.jsx("audio",{src:e.audio_url,controls:!0,style:{marginTop:10,width:"100%"}}),e.pdf_url&&t.jsx("a",{href:e.pdf_url,target:"_blank",rel:"noreferrer",style:{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,fontSize:12,color:"rgba(212,175,55,.9)",textDecoration:"underline"},children:"📄 Open attached PDF"}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"},children:[t.jsxs("button",{type:"button",onClick:()=>Nt(e.id),disabled:!!Be,style:{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"none",color:e.user_liked?"#D4AF37":"rgba(255,255,255,.5)",fontSize:12,cursor:Be?"default":"pointer"},children:[t.jsx("span",{children:e.user_liked?"❤️":"🤍"}),t.jsx("span",{children:e.likes_count??0})]}),t.jsxs("button",{type:"button",onClick:()=>gt(i=>i===e.id?null:e.id),style:{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"none",color:"rgba(255,255,255,.5)",fontSize:12,cursor:"pointer"},children:[t.jsx("span",{children:"💬"}),t.jsx("span",{children:e.comments_count??0})]})]}),ge===e.id&&t.jsxs("div",{style:{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)"},children:[(ft[e.id]||[]).map(i=>t.jsxs("div",{style:{marginBottom:8,fontSize:12,color:"rgba(255,255,255,.8)"},children:[t.jsxs("span",{style:{fontWeight:600,color:"rgba(212,175,55,.9)",marginRight:6},children:[i.user_name??"Member",":"]}),t.jsx("span",{children:i.content}),t.jsx("span",{style:{marginLeft:6,color:"rgba(255,255,255,.4)",fontSize:11},children:Ne(i.created_at)})]},i.id)),r?t.jsxs("div",{style:{display:"flex",gap:8,marginTop:8},children:[t.jsx("input",{type:"text",placeholder:"Write a comment...",value:re,onChange:i=>Oe(i.target.value),onKeyDown:i=>{i.key==="Enter"&&(i.preventDefault(),Xe(e.id,re))},style:{flex:1,padding:"8px 12px",borderRadius:999,border:"1px solid rgba(255,255,255,.1)",background:"rgba(5,5,5,.8)",color:"rgba(255,255,255,.9)",fontSize:12,outline:"none"}}),t.jsx("button",{type:"button",onClick:()=>Xe(e.id,re),disabled:!re.trim()||fe===e.id,style:{padding:"8px 14px",borderRadius:999,border:"none",background:"rgba(212,175,55,.4)",color:"#050505",fontSize:11,fontWeight:700,cursor:re.trim()&&fe!==e.id?"pointer":"default",opacity:re.trim()&&fe!==e.id?1:.5},children:fe===e.id?"…":"Comment"})]}):t.jsx("p",{style:{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:8},children:"Sign in to comment."})]})]},e.id))]}):z==="members"?t.jsxs("div",{className:"c-members-view",children:[t.jsx("div",{className:"c-section-label",children:"Guides & Admins"}),Y.filter(e=>e.isAdmin&&e.id!==r?.id).length>0?Y.filter(e=>e.isAdmin&&e.id!==r?.id).map(e=>{const i=Ve.has(e.id);return t.jsxs("div",{className:"c-member-row",onClick:()=>{if(!r)return;const a=[r.id,e.id].sort();L(`dm-${a[0]}-${a[1]}`),E("chat")},style:{borderLeft:"2px solid rgba(212,175,55,.4)"},children:[t.jsxs("div",{style:{position:"relative"},children:[t.jsx("div",{className:"c-member-avatar",children:e.avatar_url?t.jsx("img",{src:e.avatar_url,alt:""}):je(e.full_name||void 0)}),i&&t.jsx("span",{style:{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #050505"},title:"Online"})]}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsxs("div",{className:"c-member-name",children:[e.full_name||"Admin"," ",t.jsx("span",{style:{marginLeft:6,fontSize:9,fontWeight:800,letterSpacing:"0.15em",color:"#D4AF37",textTransform:"uppercase"},children:"Admin"})]}),t.jsx("div",{className:"c-member-status",children:"Message your guide"})]})]},e.id)}):t.jsx("div",{style:{padding:"8px 12px",fontSize:11,color:"rgba(255,255,255,.4)"},children:"No guides online"}),t.jsx("div",{className:"c-section-label",style:{marginTop:16},children:"All Members"}),t.jsx("div",{style:{marginBottom:10},children:t.jsx("input",{placeholder:"Search members…",value:ze,onChange:e=>pt(e.target.value),style:{width:"100%",padding:"8px 12px",borderRadius:999,border:"1px solid rgba(255,255,255,.08)",background:"rgba(5,5,5,.8)",color:"rgba(255,255,255,.9)",fontSize:12,outline:"none"}})}),(()=>{const e=ze.trim().toLowerCase(),i=Y.filter(a=>{if(r&&a.id===r.id||!e&&a.isAdmin)return!1;const s=(a.subscription_tier||"").toLowerCase();if(s==="admin")return!1;if(!e)return!0;const u=`${(a.full_name||"").toLowerCase()} ${s} ${a.isAdmin?"admin guide":""}`;return e.split(/\s+/).filter(Boolean).every(m=>u.includes(m))});return i.length===0?t.jsxs("div",{className:"c-empty",style:{marginTop:24},children:[t.jsx("div",{className:"c-empty-icon",children:"👤"}),t.jsx("div",{className:"c-empty-title",children:e?"No members match your search":"No members yet"}),t.jsx("div",{className:"c-empty-sub",children:e?"Try a different name or tier":"Members will appear here"})]}):i.map(a=>{const s=Ve.has(a.id);return t.jsxs("div",{className:"c-member-row",onClick:()=>{if(!r)return;const o=[r.id,a.id].sort(),u=`dm-${o[0]}-${o[1]}`;L(u),E("chat")},children:[t.jsxs("div",{style:{position:"relative"},children:[t.jsx("div",{className:"c-member-avatar",children:a.avatar_url?t.jsx("img",{src:a.avatar_url,alt:""}):je(a.full_name||void 0)}),s&&t.jsx("span",{style:{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #050505",boxShadow:"0 0 8px #22c55e, 0 0 12px rgba(34, 197, 94, 0.6)"},title:"Online","aria-label":"Online"})]}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsxs("div",{className:"c-member-name",children:[a.full_name||"Member",a.isAdmin&&t.jsx("span",{style:{marginLeft:6,fontSize:9,fontWeight:800,letterSpacing:"0.15em",color:"#D4AF37",textTransform:"uppercase"},children:"Admin"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[s&&t.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:"#22c55e",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase"},children:[t.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}),"Online"]}),a.subscription_tier&&t.jsx("span",{className:"c-member-status",children:a.subscription_tier})]})]})]},a.id)})})()]}):null})]}),dt&&t.jsx("div",{style:{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsxs("div",{style:{background:"#0a0a0a",border:"1px solid rgba(212,175,55,.3)",borderRadius:20,padding:28,width:"90%",maxWidth:400},children:[t.jsx("h3",{style:{color:"#D4AF37",fontWeight:900,fontSize:16,marginBottom:4},children:"🔴 Name Your Live Session"}),t.jsxs("p",{style:{color:"rgba(255,255,255,.5)",fontSize:12,marginBottom:16},children:["Going live in ",Ae,". Give it a title so members know what it's about."]}),t.jsx("input",{autoFocus:!0,placeholder:"e.g. Evening Meditation Circle",value:Le,onChange:e=>Me(e.target.value),onKeyDown:e=>{e.key==="Enter"&&et()},style:{width:"100%",padding:"12px 16px",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(212,175,55,.2)",color:"#fff",fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"}}),pe==="stargate"&&t.jsxs("div",{style:{marginTop:12},children:[t.jsx("label",{style:{display:"block",color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6},children:"Stargate Category"}),t.jsxs("select",{value:Ie,onChange:e=>lt(e.target.value),style:{width:"100%",padding:"12px 16px",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(212,175,55,.2)",color:"#fff",fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans', sans-serif"},children:[t.jsx("option",{value:"healing-chamber",style:{background:"#0a0a0a"},children:"🌿 Healing Chamber"}),t.jsx("option",{value:"bhagavad-gita",style:{background:"#0a0a0a"},children:"📖 Bhagavad Gita Class"}),t.jsx("option",{value:"other",style:{background:"#0a0a0a"},children:"✨ Other"})]}),t.jsx("p",{style:{color:"rgba(255,255,255,.4)",fontSize:10,marginTop:6},children:"Recording will be saved into this folder of the Stargate course."})]}),t.jsxs("div",{style:{display:"flex",gap:10,marginTop:18},children:[t.jsx("button",{onClick:()=>ce(!1),style:{flex:1,padding:"10px 0",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.6)",fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:".1em"},children:"Cancel"}),t.jsx("button",{onClick:et,disabled:f.isCreating,style:{flex:1,padding:"10px 0",borderRadius:12,background:"linear-gradient(135deg, rgba(212,175,55,.3), rgba(212,175,55,.6))",border:"none",color:"#050505",fontSize:12,fontWeight:900,cursor:f.isCreating?"wait":"pointer",textTransform:"uppercase",letterSpacing:".1em",opacity:f.isCreating?.5:1},children:f.isCreating?"Starting...":"🔴 Go Live"})]})]})})]})};export{hr as default};
