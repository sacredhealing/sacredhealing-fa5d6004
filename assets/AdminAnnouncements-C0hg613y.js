import{g as ee,r as a,j as e}from"./vendor-react--OR-uH7S.js";import{S as w,a as N,b as k,c as A,d as r}from"./select-suWj-RC1.js";import{d as te,s as l}from"./index-RRXEvQfm.js";import{u as se,a as ie,b as T}from"./vendor-query-D1GokQmc.js";import{A as ae,a as re,E as W,ad as ne,Z as oe,R as le,M as ce,j as de,k as ge,an as pe}from"./vendor-icons-CZmAPI07.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-i18n-BS5B6gzd.js";import"./vendor-supabase-DRj4EguU.js";import"./vendor-motion-Dm4zQNot.js";const c="#D4AF37",x="#22D3EE",ue="#050505",$="community-uploads",V=8*1024*1024,me=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');

  .sqi-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${ue};
    min-height: 100vh;
  }
  .sqi-label {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.6);
  }
  .glass-card {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 40px;
  }
  .gold-glow {
    color: ${c};
    text-shadow: 0 0 20px rgba(212,175,55,0.35);
  }
  .gold-btn {
    background: linear-gradient(135deg, #D4AF37 0%, #B8960C 50%, #D4AF37 100%);
    background-size: 200% 200%;
    color: #050505;
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border-radius: 100px;
    border: none;
    padding: 14px 28px;
    cursor: pointer;
    transition: all 0.4s ease;
    box-shadow: 0 0 30px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .gold-btn:hover:not(:disabled) {
    box-shadow: 0 0 50px rgba(212,175,55,0.45), inset 0 1px 0 rgba(255,255,255,0.4);
    background-position: right center;
    transform: translateY(-1px);
  }
  .gold-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .sqi-input {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 16px !important;
    color: rgba(255,255,255,0.85) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 14px !important;
    padding: 12px 16px !important;
    transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
  }
  .sqi-input:focus {
    border-color: rgba(212,175,55,0.35) !important;
    box-shadow: 0 0 0 3px rgba(212,175,55,0.08) !important;
    outline: none !important;
  }
  .sqi-input::placeholder { color: rgba(255,255,255,0.2) !important; }
  .sqi-select-trigger {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 16px !important;
    color: rgba(255,255,255,0.85) !important;
  }
  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .ann-card {
    background: rgba(255,255,255,0.018);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 28px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .ann-card:hover { border-color: rgba(212,175,55,0.2); box-shadow: 0 0 20px rgba(212,175,55,0.06); }
  .ann-card.inactive { opacity: 0.45; }
  .icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.25s ease;
    color: rgba(255,255,255,0.5);
  }
  .icon-btn:hover { background: rgba(255,255,255,0.08); color: ${c}; border-color: rgba(212,175,55,0.25); }
  .icon-btn.danger:hover { color: #ef4444; border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); }
  .direct-link-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 100px;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.3);
    color: ${c};
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
  }
  .direct-link-btn:hover { background: rgba(212,175,55,0.2); box-shadow: 0 0 14px rgba(212,175,55,0.2); }
  .upload-zone {
    border: 1.5px dashed rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255,255,255,0.01);
    color: rgba(255,255,255,0.3);
    font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
  }
  .upload-zone:hover { border-color: rgba(212,175,55,0.35); background: rgba(212,175,55,0.04); color: ${c}; }
  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%;
    box-shadow: 0 0 8px ${x};
    animation: pulse-sqi 2s infinite;
    display: inline-block;
    margin-right: 6px;
  }
  @keyframes pulse-sqi {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.75); }
  }
  .section-title {
    font-size: 10px; font-weight: 800; letter-spacing: 0.3em;
    text-transform: uppercase; color: rgba(212,175,55,0.5);
    margin-bottom: 20px;
  }
  .smart-logic-banner {
    background: linear-gradient(135deg, rgba(34,211,238,0.06), rgba(212,175,55,0.06));
    border: 1px solid rgba(34,211,238,0.15);
    border-radius: 20px;
    padding: 14px 18px;
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 12px; color: rgba(255,255,255,0.55);
    line-height: 1.6;
  }
`,H={info:{bg:"rgba(59,130,246,0.15)",color:"#60a5fa",label:"INFO"},success:{bg:"rgba(34,197,94,0.15)",color:"#4ade80",label:"SUCCESS"},warning:{bg:"rgba(234,179,8,0.15)",color:"#facc15",label:"WARNING"},promotion:{bg:"rgba(212,175,55,0.15)",color:"#D4AF37",label:"PROMOTION"}};function xe(b){return H[b]??H.info}function Ae(){const b=ee(),{toast:d}=te(),h=se(),f=a.useRef(null),[p,z]=a.useState(""),[u,I]=a.useState(""),[q,E]=a.useState("info"),[y,C]=a.useState(""),[m,v]=a.useState(""),[_,B]=a.useState(""),[G,D]=a.useState(""),[M,U]=a.useState(""),[R,L]=a.useState(""),[j,F]=a.useState(""),[K,O]=a.useState(!1),{data:P,isLoading:Q}=ie({queryKey:["admin-announcements"],queryFn:async()=>{const{data:t,error:i}=await l.from("announcements").select("*").order("created_at",{ascending:!1});if(i)throw i;return t}}),S=T({mutationFn:async()=>{let t=null;if(y){const o=parseInt(y,10);t=new Date(Date.now()+o*60*60*1e3).toISOString()}const i=j?new Date(j).toISOString():new Date().toISOString(),{data:s,error:n}=await l.from("announcements").insert({title:p,message:u,type:q,expires_at:t,starts_at:i,image_url:m||null,link_url:_||null,audio_url:M||null,recurring:R||null}).select("id").single();if(n)throw n;s?.id&&l.functions.invoke("translate-announcement",{body:{announcement_id:s.id,title:p,content:u}}).then(({error:o})=>{o&&console.error("translate-announcement:",o)});let g=!1;if(s?.id){const{error:o}=await l.functions.invoke("send-announcement-email",{body:{announcement_id:s.id}});o&&(console.error("send-announcement-email:",o),g=!0)}return{emailBlastFailed:g}},onSuccess:t=>{h.invalidateQueries({queryKey:["admin-announcements"]}),z(""),I(""),E("info"),C(""),v(""),B(""),D(""),U(""),L(""),F(""),d({title:"✦ Prema-Pulse Transmitted",description:t.emailBlastFailed?"In-app notice is live. The email blast could not be started (check Edge Functions / Resend).":"In-app notice is live; announcement emails are being sent to all accounts."})},onError:t=>{d({title:"Transmission Error",description:t.message,variant:"destructive"})}}),Y=T({mutationFn:async({id:t,is_active:i})=>{const{error:s}=await l.from("announcements").update({is_active:!i}).eq("id",t);if(s)throw s},onSuccess:()=>h.invalidateQueries({queryKey:["admin-announcements"]})}),J=T({mutationFn:async t=>{const{error:i}=await l.from("announcements").delete().eq("id",t);if(i)throw i},onSuccess:()=>{h.invalidateQueries({queryKey:["admin-announcements"]}),d({title:"Transmission Dissolved"})}}),Z=async t=>{const i=t.target.files?.[0];if(i){if(!i.type.startsWith("image/")){d({title:"Invalid file",description:"Please choose an image file.",variant:"destructive"}),t.target.value="";return}if(i.size>V){d({title:"File too large",description:`Images must be under ${V/1024/1024} MB.`,variant:"destructive"}),t.target.value="";return}O(!0);try{const s=i.name.split(".").pop()?.toLowerCase(),n=s&&/^[a-z0-9]{1,8}$/.test(s)?s:i.type==="image/png"?"png":i.type==="image/webp"?"webp":i.type==="image/gif"?"gif":"jpg",g=`announcements/${Date.now()}-${Math.random().toString(36).slice(2,9)}.${n}`,{error:o}=await l.storage.from($).upload(g,i,{upsert:!0,contentType:i.type||`image/${n==="jpg"?"jpeg":n}`});if(o)throw o;const{data:X}=l.storage.from($).getPublicUrl(g);v(X.publicUrl),d({title:"✦ Image Uploaded"})}catch(s){const n=s&&typeof s=="object"&&"message"in s&&typeof s.message=="string"||s instanceof Error?s.message:"Upload failed";d({title:"Upload failed",description:n,variant:"destructive"})}finally{O(!1),f.current&&(f.current.value="")}}};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:me}),e.jsx("div",{className:"sqi-root",style:{padding:"16px 16px 112px",color:"rgba(255,255,255,0.85)"},children:e.jsxs("div",{style:{maxWidth:640,margin:"0 auto"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:36},children:[e.jsx("button",{type:"button",className:"icon-btn",onClick:()=>b("/admin"),style:{flexShrink:0},children:e.jsx(ae,{size:18})}),e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:22,fontWeight:900,letterSpacing:"-0.04em",color:"#fff",lineHeight:1.1},children:[e.jsx("span",{className:"gold-glow",children:"PREMA-PULSE"})," TRANSMISSIONS"]}),e.jsx("div",{className:"sqi-label",style:{marginTop:4},children:"Broadcast Vedic Light-Codes to your community"})]})]}),e.jsxs("div",{className:"smart-logic-banner",style:{marginBottom:28},children:[e.jsx("div",{style:{marginTop:2},children:e.jsx("span",{className:"pulse-dot",style:{background:x}})}),e.jsxs("div",{children:[e.jsx("span",{style:{color:x,fontWeight:700,fontSize:11,letterSpacing:"0.1em"},children:"BHAKTI-ALGORITHM ACTIVE"}),e.jsx("br",{}),"Each user sees only the"," ",e.jsx("strong",{style:{color:"rgba(255,255,255,0.85)"},children:"single newest active announcement"})," — once. After clicking it's marked read and never shown again. A user logging in after a month still sees only one transmission — the latest. No spam. Pure signal."]})]}),e.jsxs("div",{className:"glass-card",style:{padding:"32px 28px",marginBottom:36},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:28},children:[e.jsx("div",{style:{width:36,height:36,borderRadius:12,background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.25)",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(re,{size:16,color:c})}),e.jsx("span",{style:{fontWeight:800,letterSpacing:"-0.02em",fontSize:15},children:"New Transmission"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:20},children:[e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Title"}),e.jsx("input",{className:"sqi-input",style:{width:"100%",boxSizing:"border-box"},placeholder:"29 New Meditations on SOMA just dropped...",value:p,onChange:t=>z(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Message"}),e.jsx("textarea",{className:"sqi-input",style:{width:"100%",boxSizing:"border-box",resize:"vertical",minHeight:100},placeholder:"Describe what's new, what energy is being transmitted...",value:u,onChange:t=>I(t.target.value),rows:4})]}),e.jsxs("div",{style:{background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.15)",borderRadius:20,padding:"18px 20px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14},children:[e.jsx(W,{size:14,color:c}),e.jsx("span",{style:{color:c,fontSize:10,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase"},children:"Direct Link — User Clicks → Goes There"})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:6},children:"Destination URL"}),e.jsx("input",{className:"sqi-input",style:{width:"100%",boxSizing:"border-box"},placeholder:"https://sacredhealing.lovable.app/meditations",value:_,onChange:t=>B(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:6},children:"Button Label (optional)"}),e.jsx("input",{className:"sqi-input",style:{width:"100%",boxSizing:"border-box"},placeholder:"Explore 29 SOMA Meditations →",value:G,onChange:t=>D(t.target.value)})]})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Image (optional)"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[e.jsxs("label",{className:"upload-zone",style:{display:"block",cursor:"pointer",margin:0},children:[e.jsx("input",{ref:f,type:"file",accept:"image/*",style:{display:"none"},onChange:Z}),e.jsx(ne,{size:18,style:{margin:"0 auto 6px",display:"block",opacity:.5}}),K?"Uploading...":"Tap to upload from phone / computer"]}),e.jsx("div",{className:"sqi-label",style:{textAlign:"center"},children:"— or paste URL —"}),e.jsx("input",{className:"sqi-input",style:{width:"100%",boxSizing:"border-box"},placeholder:"https://...",value:m,onChange:t=>v(t.target.value)}),m&&e.jsx("img",{src:m,alt:"",style:{borderRadius:16,maxHeight:120,objectFit:"cover",width:"100%"}})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Audio URL (optional)"}),e.jsx("input",{className:"sqi-input",style:{width:"100%",boxSizing:"border-box"},placeholder:"https://example.com/audio.mp3",value:M,onChange:t=>U(t.target.value)})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},children:[e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Type"}),e.jsxs(w,{value:q,onValueChange:E,children:[e.jsx(N,{className:"sqi-select-trigger",children:e.jsx(k,{})}),e.jsxs(A,{children:[e.jsx(r,{value:"info",children:"Info"}),e.jsx(r,{value:"success",children:"Success"}),e.jsx(r,{value:"warning",children:"Warning"}),e.jsx(r,{value:"promotion",children:"Promotion"})]})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Recurring"}),e.jsxs(w,{value:R||"none",onValueChange:t=>L(t==="none"?"":t),children:[e.jsx(N,{className:"sqi-select-trigger",children:e.jsx(k,{placeholder:"None"})}),e.jsxs(A,{children:[e.jsx(r,{value:"none",children:"None"}),e.jsx(r,{value:"weekly",children:"Weekly"})]})]})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},children:[e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Publish Date / Time"}),e.jsx("input",{className:"sqi-input",type:"datetime-local",style:{width:"100%",boxSizing:"border-box"},value:j,onChange:t=>F(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("div",{className:"sqi-label",style:{marginBottom:8},children:"Expires After"}),e.jsxs(w,{value:y||"never",onValueChange:t=>C(t==="never"?"":t),children:[e.jsx(N,{className:"sqi-select-trigger",children:e.jsx(k,{placeholder:"Never"})}),e.jsxs(A,{children:[e.jsx(r,{value:"never",children:"Never"}),e.jsx(r,{value:"1",children:"1 hour"}),e.jsx(r,{value:"24",children:"24 hours"}),e.jsx(r,{value:"72",children:"3 days"}),e.jsx(r,{value:"168",children:"1 week"})]})]})]})]}),e.jsxs("button",{type:"button",className:"gold-btn",onClick:()=>S.mutate(),disabled:!p||!u||S.isPending,style:{marginTop:8},children:[e.jsx(oe,{size:15}),S.isPending?"TRANSMITTING...":"ACTIVATE TRANSMISSION"]})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"section-title",children:"✦ Active Transmissions Archive"}),Q?e.jsxs("div",{style:{textAlign:"center",color:"rgba(255,255,255,0.3)",padding:40},children:[e.jsx("span",{className:"pulse-dot",style:{background:x}}),"Scanning Akasha-Archive..."]}):P?.length===0?e.jsx("div",{style:{textAlign:"center",color:"rgba(255,255,255,0.2)",padding:40,fontSize:13},children:"No transmissions found in the Archive."}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:16},children:P?.map((t,i)=>{const s=xe(t.type),n=i===0;return e.jsxs("div",{className:`ann-card${t.is_active?"":" inactive"}`,style:{padding:"20px 22px",position:"relative"},children:[n&&t.is_active&&e.jsx("div",{style:{position:"absolute",top:-10,left:22,background:c,color:"#050505",fontSize:7,fontWeight:900,letterSpacing:"0.25em",padding:"3px 10px",borderRadius:100},children:"ACTIVE · USERS SEE THIS"}),e.jsxs("div",{style:{display:"flex",gap:14,alignItems:"flex-start"},children:[e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10},children:[e.jsx("span",{className:"type-badge",style:{background:s.bg,color:s.color},children:s.label}),t.recurring&&e.jsxs("span",{className:"type-badge",style:{background:"rgba(168,85,247,0.15)",color:"#c084fc"},children:[e.jsx(le,{size:8})," ",t.recurring]}),!t.is_active&&e.jsx("span",{className:"type-badge",style:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)"},children:"INACTIVE"})]}),e.jsx("div",{style:{fontWeight:700,fontSize:14,letterSpacing:"-0.02em",marginBottom:6},children:t.title}),e.jsx("div",{style:{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6},children:t.message}),t.image_url&&e.jsx("img",{src:t.image_url,alt:"",style:{marginTop:12,borderRadius:14,maxHeight:110,objectFit:"cover",width:"100%"}}),t.link_url&&e.jsxs("a",{href:t.link_url,target:"_blank",rel:"noopener noreferrer",className:"direct-link-btn",style:{marginTop:14,display:"inline-flex"},children:[e.jsx(W,{size:11}),"Open Link →"]}),t.audio_url&&e.jsxs("div",{style:{marginTop:10,fontSize:11,color:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",gap:5},children:[e.jsx(ce,{size:10})," Audio transmission attached"]}),e.jsxs("div",{style:{marginTop:12,fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:"0.05em"},children:["Published: ",new Date(t.starts_at).toLocaleString(),t.expires_at&&e.jsxs("span",{style:{marginLeft:10},children:["· Dissolves: ",new Date(t.expires_at).toLocaleDateString()]})]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:8,flexShrink:0},children:[e.jsx("button",{type:"button",className:"icon-btn",onClick:()=>Y.mutate({id:t.id,is_active:t.is_active}),title:t.is_active?"Deactivate":"Activate",children:t.is_active?e.jsx(de,{size:15}):e.jsx(ge,{size:15})}),e.jsx("button",{type:"button",className:"icon-btn danger",onClick:()=>J.mutate(t.id),title:"Delete",children:e.jsx(pe,{size:15})})]})]})]},t.id)})})]})]})})]})}export{Ae as default};
