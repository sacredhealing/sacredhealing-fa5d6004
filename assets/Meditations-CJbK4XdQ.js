import{j as e,r as g,g as oe,t as le,R as Z}from"./vendor-react--OR-uH7S.js";import{f as F,u as X,s as y,n as _,L as de,a as ce,o as ge,l as pe,p as ue,B as me}from"./index--rD5Zqv9.js";import{m as W}from"./vendor-motion-Dm4zQNot.js";import{a as D,c as M,O as xe,V as he,v as be,L as fe,h as V,A as ye,Y as ve,P as K,_ as we,p as je}from"./vendor-icons-DpdMlvID.js";import{D as ke,a as Se}from"./dialog-Cp4Ynjud.js";import{u as _e}from"./useUserDailyState-Bm07g580.js";import{g as ee,u as Ne}from"./getItemLanguage-p2_86nve.js";import{u as ze}from"./useJyotishProfile-BD53I0zd.js";import{s as Ae}from"./startPranaMonthlyCheckout-B3mByync.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-i18n-BS5B6gzd.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";import"./vedicCalculations-DbxpS8o1.js";import"./stripeCheckoutNavigation-AOhyaKuh.js";const Ce=()=>e.jsxs("div",{className:"relative flex flex-col items-center justify-center p-12 overflow-hidden",children:[e.jsx(W.div,{animate:{scale:[1,1.15,1],opacity:[.2,.4,.2]},transition:{duration:5,repeat:1/0,ease:"easeInOut"},className:"absolute w-48 h-48 bg-[#D4AF37] rounded-full blur-[60px]"}),e.jsxs(W.svg,{width:"200",height:"200",viewBox:"0 0 200 200",fill:"none",xmlns:"http://www.w3.org/2000/svg",initial:{opacity:0},animate:{opacity:1},className:"relative z-10",children:[e.jsx("path",{d:"M100 40 L160 180 L40 180 Z",stroke:"rgba(212,175,55,0.25)",strokeWidth:"0.8",fill:"none"}),e.jsx("path",{d:"M100 70 L130 180 L70 180 Z",stroke:"rgba(212,175,55,0.3)",strokeWidth:"0.6",fill:"none"}),e.jsx("path",{d:"M100 95 L115 180 L85 180 Z",stroke:"rgba(212,175,55,0.2)",strokeWidth:"0.5",fill:"none"}),e.jsx("circle",{cx:"100",cy:"100",r:"55",stroke:"rgba(212,175,55,0.15)",strokeWidth:"0.5",fill:"none"})]}),e.jsxs(W.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"mt-6 text-center",children:[e.jsx("p",{className:"text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-serif",style:{fontFamily:"Cinzel, DM Serif Display, Georgia, serif"},children:"The Void is Full"}),e.jsx("p",{className:"text-white/25 text-[10px] mt-2 italic font-serif",style:{fontFamily:"Cinzel, DM Serif Display, Georgia, serif"},children:"Mahavatar Babaji waits in the silence..."})]})]});function Fe(t,i){const s=Math.floor(t/3600),a=Math.floor(t%3600/60);return s>0?i("meditations.curatedDurationHoursMins",{hours:s,minutes:a}):i("meditations.curatedDurationMins",{minutes:a})}const Pe=({playlist:t,onClick:i})=>{const{t:s}=F();return e.jsxs("button",{onClick:i,className:"group relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 hover:scale-[1.02] transition-all duration-300 text-left w-full",children:[e.jsxs("div",{className:"aspect-[4/3] relative",children:[t.cover_image_url?e.jsx("img",{src:t.cover_image_url,alt:t.title,className:"w-full h-full object-cover",loading:"lazy"}):e.jsx("div",{className:"w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center",children:e.jsx(D,{size:32,className:"text-primary/50"})}),e.jsx("div",{className:"absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",children:e.jsx("div",{className:"w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-purple",children:e.jsx(M,{size:24,className:"text-primary-foreground ml-1"})})}),(t.mood||t.theme)&&e.jsx("div",{className:"absolute top-3 left-3 px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm",children:e.jsx("span",{className:"text-xs font-medium text-white capitalize",children:t.mood||t.theme})})]}),e.jsxs("div",{className:"p-4",children:[e.jsx("h3",{className:"font-heading font-semibold text-foreground",children:t.title}),t.description&&e.jsx("p",{className:"text-sm text-muted-foreground mt-1 line-clamp-2",children:t.description}),e.jsxs("div",{className:"flex items-center gap-3 mt-3 text-xs text-muted-foreground",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(xe,{size:12}),Fe(t.total_duration,s)]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:t.track_count===1?s("meditations.playlistSessionOne"):s("meditations.playlistSessions",{count:t.track_count})})]})]})]})},De=({meditationId:t,open:i,onOpenChange:s})=>{const{user:a}=X(),[c,o]=g.useState([]),[h,l]=g.useState(new Set),[d,x]=g.useState(!1),[p,u]=g.useState(""),[v,b]=g.useState(!1);g.useEffect(()=>{!i||!a||!t||(async()=>{x(!0);const{data:r}=await y.from("meditation_playlists").select("id,name").eq("user_id",a.id).order("created_at",{ascending:!1}),{data:f}=await y.from("meditation_playlist_items").select("playlist_id").eq("meditation_id",t);o(r||[]),l(new Set((f||[]).map(j=>j.playlist_id))),x(!1)})()},[i,a,t]);const w=async r=>{const{data:f}=await y.from("meditation_playlist_items").select("order_index").eq("playlist_id",r).order("order_index",{ascending:!1}).limit(1);return f&&f.length>0?f[0].order_index+1:0},k=async r=>{if(!t)return;if(h.has(r))await y.from("meditation_playlist_items").delete().eq("playlist_id",r).eq("meditation_id",t),l(j=>{const A=new Set(j);return A.delete(r),A}),_.success("Removed from playlist");else{const j=await w(r);await y.from("meditation_playlist_items").insert({playlist_id:r,meditation_id:t,order_index:j}),l(A=>new Set(A).add(r)),_.success("Added to playlist")}},S=async()=>{if(!a||!t||!p.trim())return;b(!0);const{data:r,error:f}=await y.from("meditation_playlists").insert({user_id:a.id,name:p.trim()}).select("id,name").single();if(f||!r){_.error("Could not create playlist"),b(!1);return}await y.from("meditation_playlist_items").insert({playlist_id:r.id,meditation_id:t,order_index:0}),o(j=>[r,...j]),l(j=>new Set(j).add(r.id)),u(""),b(!1),_.success(`Added to "${r.name}"`)};return e.jsx(ke,{open:i,onOpenChange:s,children:e.jsxs(Se,{className:"max-w-md bg-[#0a0a0a] border-[#D4AF37]/25 p-5 max-h-[80vh] overflow-y-auto",children:[e.jsx("div",{style:{fontWeight:800,fontSize:16,color:"rgba(255,255,255,.92)",marginBottom:14},children:"Add to Meditation Playlist"}),e.jsxs("div",{style:{display:"flex",gap:8,marginBottom:18},children:[e.jsx("input",{value:p,onChange:r=>u(r.target.value),placeholder:"New playlist name",style:{flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(212,175,55,.25)",borderRadius:14,padding:"11px 14px",fontSize:13,color:"#fff",outline:"none"}}),e.jsx("button",{onClick:S,disabled:!p.trim()||v,style:{width:42,height:42,borderRadius:14,border:"none",flexShrink:0,background:p.trim()?"#D4AF37":"rgba(212,175,55,.15)",color:"#000",display:"flex",alignItems:"center",justifyContent:"center",cursor:p.trim()?"pointer":"default"},children:e.jsx(he,{size:18})})]}),d&&e.jsx("div",{style:{fontSize:13,color:"rgba(255,255,255,.4)",textAlign:"center",padding:"20px 0"},children:"Loading your playlists…"}),!d&&c.length===0&&e.jsx("div",{style:{fontSize:13,color:"rgba(255,255,255,.4)",textAlign:"center",padding:"20px 0"},children:"You don't have any meditation playlists yet — create one above."}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:c.map(r=>{const f=h.has(r.id);return e.jsxs("button",{onClick:()=>k(r.id),style:{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:16,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",cursor:"pointer",textAlign:"left"},children:[e.jsx("div",{style:{width:36,height:36,borderRadius:10,flexShrink:0,background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.25)",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(D,{size:15,style:{color:"#D4AF37"}})}),e.jsx("div",{style:{flex:1,fontSize:14,fontWeight:600,color:"rgba(255,255,255,.88)"},children:r.name}),e.jsx("div",{style:{width:24,height:24,borderRadius:"50%",flexShrink:0,border:f?"none":"1.5px solid rgba(255,255,255,.2)",background:f?"#D4AF37":"transparent",display:"flex",alignItems:"center",justifyContent:"center"},children:f&&e.jsx(be,{size:14,style:{color:"#000"}})})]},r.id)})})]})})},Me=t=>{const[i,s]=g.useState([]),[a,c]=g.useState(!0);g.useEffect(()=>{o()},[t]);const o=async()=>{c(!0);const{data:l,error:d}=await y.from("curated_playlists").select("*").eq("content_type",t).eq("is_active",!0).order("order_index");if(d||!l){c(!1);return}const x=await Promise.all(l.map(async p=>{{const{data:u}=await y.from("curated_playlist_items").select(`
              id,
              meditation_id,
              meditations!curated_playlist_items_meditation_id_fkey (
                duration_minutes,
                play_count
              )
            `).eq("playlist_id",p.id),v=u?.length||0,b=u?.reduce((k,S)=>{const r=S.meditations;return k+(r?.duration_minutes||0)*60},0)||0,w=u?.reduce((k,S)=>{const r=S.meditations;return k+(r?.play_count||0)},0)||0;return{...p,track_count:v,total_duration:b,total_plays:w}}}));s(x),c(!1)};return{playlists:i,loading:a,refetch:o,getPlaylistItems:async l=>{{const{data:d}=await y.from("curated_playlist_items").select(`
          id,
          meditation_id,
          order_index,
          meditations!curated_playlist_items_meditation_id_fkey (*)
        `).eq("playlist_id",l).order("order_index");return d?.map(x=>x.meditations).filter(Boolean)||[]}}}};function Le({language:t,setLanguage:i,compact:s}){const{t:a}=F();return s?e.jsxs("div",{className:"flex items-center gap-1 shrink-0",children:[e.jsx("button",{"aria-label":a("meditations.langSvAria"),className:`p-2 rounded-lg transition ${t==="sv"?"text-[#D4AF37] bg-[#D4AF37]/15":"text-muted-foreground hover:text-foreground/80"}`,onClick:()=>i("sv"),children:e.jsx(de,{size:20})}),e.jsx("button",{"aria-label":a("meditations.langEnAria"),className:`p-2 rounded-lg transition ${t==="en"?"text-[#D4AF37] bg-[#D4AF37]/15":"text-muted-foreground hover:text-foreground/80"}`,onClick:()=>i("en"),children:e.jsx(fe,{className:"w-5 h-5",strokeWidth:1.5})})]}):e.jsx("div",{className:"flex items-center justify-between gap-3 mt-3",children:e.jsxs("div",{className:"flex rounded-full bg-black p-1 border border-[#D4AF37]/60",children:[e.jsx("button",{className:`px-4 py-2 rounded-full text-sm transition ${t==="sv"?"text-[#D4AF37] bg-[#D4AF37]/10":"text-muted-foreground hover:text-foreground"}`,onClick:()=>i("sv"),children:a("meditations.langSv")}),e.jsx("button",{className:`px-4 py-2 rounded-full text-sm transition ${t==="en"?"text-[#D4AF37] bg-[#D4AF37]/10":"text-muted-foreground hover:text-foreground"}`,onClick:()=>i("en"),children:a("meditations.langEn")})]})})}function qe(t){const i=t?.durationSec??t?.duration_seconds??(t?.duration_minutes!=null?t.duration_minutes*60:void 0)??t?.duration??t?.lengthSec??t?.length_seconds;if(typeof i=="number"&&isFinite(i))return i;if(typeof i=="string"){const s=Number(i);if(isFinite(s))return s}return 8*60}function Be(t,i){const a=Math.abs(i-(t==="busy"?120:t==="heavy"?300:t==="calm"?480:720));return Math.max(0,1e3-a)}function Ee(t,i){const s=(i?.title??i?.name??"").toString().toLowerCase(),a=(i?.tags??[]).join(" ").toLowerCase(),c=(i?.category??"").toString().toLowerCase(),o=`${s} ${a} ${c}`;if(t==="morning"){if(o.includes("morning")||o.includes("morgon"))return 80;if(o.includes("energ")||o.includes("focus")||o.includes("fokus"))return 40}if(t==="evening"){if(o.includes("sleep")||o.includes("sömn")||o.includes("evening"))return 80;if(o.includes("wind")||o.includes("unwind")||o.includes("kväll"))return 40}return 10}function Re(t,i){if(!t?.length)return null;const{dayPhase:s,userState:a,language:c}=i;let o=null,h=-1/0;for(const l of t){if(ee(l)!==c)continue;const x=qe(l),p=Be(a,x)+Ee(s,l)+25;p>h&&(h=p,o=l)}return o}function Te(t){const i=t?.durationSec??t?.duration_seconds??(t?.duration_minutes!=null?t.duration_minutes*60:void 0)??t?.duration??t?.lengthSec??t?.length_seconds;if(typeof i=="number"&&isFinite(i))return i;if(typeof i=="string"){const s=Number(i);if(isFinite(s))return s}return 8*60}function We(t){const i=(t?.title??t?.name??"").toString().toLowerCase(),s=Array.isArray(t?.tags)?t.tags.join(" ").toLowerCase():"",a=(t?.category??"").toString().toLowerCase();return`${i} ${s} ${a}`}function $e(t,i){return t.filter(s=>ee(s)===i)}function Ie(t){const i=We(t);return Te(t)<=5*60?"short":i.includes("morgon")||i.includes("morning")||i.includes("sunrise")?"morning":i.includes("sömn")||i.includes("sleep")||i.includes("night")||i.includes("dream")||i.includes("starlight")?"sleep":i.includes("heal")||i.includes("läkning")||i.includes("chakra")?"healing":i.includes("focus")||i.includes("fokus")||i.includes("intention")?"focus":i.includes("nature")||i.includes("skog")||i.includes("ocean")?"nature":"all"}function Ge(t){const i={short:[],morning:[],sleep:[],healing:[],focus:[],nature:[],all:[]};for(const a of t){const c=Ie(a);i[c].push(a)}const s=new Set(["short","morning","sleep","healing","focus","nature"].flatMap(a=>i[a].map(c=>c?.id??c?.slug??c?.title)));return i.all=t.filter(a=>{const c=a?.id??a?.slug??a?.title;return!s.has(c)}),i}function Q(){const{t}=F(),[i,s]=g.useState(!1);return g.useEffect(()=>{const a=()=>s(window.scrollY>800);return a(),window.addEventListener("scroll",a,{passive:!0}),()=>window.removeEventListener("scroll",a)},[]),i?e.jsx("button",{onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),className:"fixed bottom-24 right-4 z-50 rounded-full border border-border bg-muted/80 backdrop-blur-sm px-4 py-3 text-sm text-foreground hover:bg-muted transition shadow-lg",children:t("meditations.backToTop")}):null}const $=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');

  :root {
    --siddha-gold:   #D4AF37;
    --gold-glow:     rgba(212,175,55,0.25);
    --gold-faint:    rgba(212,175,55,0.08);
    --akasha-black:  #050505;
    --glass-bg:      rgba(255,255,255,0.02);
    --glass-border:  rgba(255,255,255,0.05);
    --text-primary:  rgba(255,255,255,0.92);
    --text-muted:    rgba(255,255,255,0.45);
    --vayu-cyan:     #22D3EE;
    --radius-xl:     40px;
    --radius-lg:     20px;
  }

  /* ── Page shell ── */
  .sqi-page {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--akasha-black);
    min-height: 100vh;
    color: var(--text-primary);
    overflow-x: hidden;
    position: relative;
  }

  /* ── Starfield canvas ── */
  .sqi-stars {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  /* ── Floating gold orbs ── */
  @keyframes orbFloat {
    0%,100% { transform: translateY(0) rotate(0deg);    opacity: .18; }
    50%      { transform: translateY(-20px) rotate(180deg); opacity: .45; }
  }
  .sqi-orb {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,.2), transparent 70%);
    pointer-events: none;
    animation: orbFloat var(--dur, 10s) ease-in-out infinite;
    animation-delay: var(--dl, 0s);
  }

  /* ── Content layer ── */
  .sqi-content { position: relative; z-index: 1; }

  /* ── Shimmer animation for Cinzel titles ── */
  @keyframes goldShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .sqi-shimmer-title {
    font-family: 'Cinzel', serif !important;
    font-size: clamp(26px, 7vw, 38px) !important;
    font-weight: 600 !important;
    letter-spacing: -0.02em !important;
    line-height: 1.1 !important;
    background: linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: goldShimmer 5s linear infinite;
    display: inline-block;
  }

  /* ── Micro label ── */
  .sqi-micro {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,.45);
    margin-bottom: 6px;
  }

  /* ── Glass card ── */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .glass-card:hover { border-color: rgba(212,175,55,0.15); }

  /* ── Category card (compact, golden-glowing — perf-friendly: only opacity animates) ── */
  @keyframes categoryGlowPulse {
    0%,100% { opacity: .45; }
    50%      { opacity: 1; }
  }
  .category-card {
    position: relative;
    background: linear-gradient(135deg, rgba(212,175,55,.08), rgba(15,8,0,.4));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(212,175,55,.45);
    border-radius: 16px;
    isolation: isolate;
  }
  .category-card::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    box-shadow: 0 0 28px rgba(212,175,55,.3), 0 0 50px rgba(212,175,55,.1), inset 0 0 26px rgba(212,175,55,.06);
    pointer-events: none;
    animation: categoryGlowPulse 3.4s ease-in-out infinite;
    will-change: opacity;
    z-index: -1;
  }
  .category-card:hover::after { opacity: 1; }

  /* ── Gold glow text ── */
  .gold-glow { color: var(--siddha-gold); text-shadow: 0 0 15px rgba(212,175,55,0.3); }

  /* ── Nadi pulse (cyan, for icons) ── */
  @keyframes nadiPulse {
    0%,100% { opacity: .6; }
    50%      { opacity: 1; filter: drop-shadow(0 0 8px rgba(212,175,55,.7)); }
  }
  .nadi-pulse { animation: nadiPulse 3s ease-in-out infinite; color: var(--siddha-gold); }

  /* ── Language toggle ── */
  .lang-pill {
    display: inline-flex;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 100px;
    padding: 3px;
    gap: 2px;
  }
  .lang-btn {
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    background: transparent;
    color: var(--text-muted);
    transition: all .2s;
    font-family: inherit;
  }
  .lang-btn.active {
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    color: #050505;
    box-shadow: 0 0 14px rgba(212,175,55,.45);
  }

  /* ── Jyotish line (blended, no card shell) ── */
  .jyotish-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0 20px 16px;
  }
  .jyotish-line .dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(16,185,129,.55);
    margin-top: 6px;
    flex-shrink: 0;
  }
  .jyotish-line .label {
    font-weight: 700;
    color: rgba(16,185,129,.8);
  }

  /* ── Gold horizontal divider ── */
  .akasha-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent);
    margin: 4px 0 12px;
  }

  /* ── Section header (inside collapsible) ── */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    border-radius: 16px;
    transition: background .2s;
  }
  .section-header:hover { background: rgba(255,255,255,.02); }

  /* ── Meditation row ── */
  .meditation-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-radius: var(--radius-lg);
    transition: background .2s ease, border-color .2s ease;
    cursor: pointer;
    position: relative;
  }
  .meditation-row:hover { background: rgba(212,175,55,.04); }
  /* Golden Aura — active row (inset glow so parent overflow:hidden does not clip) */
  @keyframes sqiMeditationRowAura {
    0%, 100% {
      border-color: rgba(212,175,55,.35);
      box-shadow: inset 0 0 32px rgba(212,175,55,.08), 0 0 0 1px rgba(212,175,55,.2);
      background: rgba(212,175,55,.035);
    }
    50% {
      border-color: rgba(212,175,55,.7);
      box-shadow: inset 0 0 48px rgba(212,175,55,.16), 0 0 0 2px rgba(212,175,55,.4);
      background: rgba(212,175,55,.08);
    }
  }
  .meditation-row.sqi-active-card {
    border-width: 1px;
    border-style: solid;
    animation: sqiMeditationRowAura 3s ease-in-out infinite;
  }

  /* ── Play button (match Healing /h-track h-play-btn) ── */
  .play-btn {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04));
    border: 1px solid rgba(212,175,55,.25);
    display: flex; align-items: center; justify-content: center;
    color: var(--siddha-gold);
    flex-shrink: 0;
    transition: all .22s;
    box-shadow: 0 0 10px rgba(212,175,55,.15);
  }
  .play-btn:hover, .play-btn.playing {
    background: linear-gradient(135deg, #F5E17A, #D4AF37, #A07C10);
    color: #050505;
    box-shadow: 0 0 22px rgba(212,175,55,.65), 0 0 40px rgba(212,175,55,.25);
    transform: scale(1.08);
  }
  .play-btn.playing {
    animation: sqiPlayBtnPulse 2s ease-in-out infinite;
  }
  @keyframes sqiPlayBtnPulse {
    0%, 100% { box-shadow: 0 0 18px rgba(212,175,55,.55), 0 0 32px rgba(245,225,122,.2); }
    50% { box-shadow: 0 0 32px rgba(212,175,55,.95), 0 0 56px rgba(212,175,55,.3); }
  }

  /* ── Scalar ring (Vayu-Cyan) on now-playing row ── */
  @keyframes scalarRing {
    0%   { transform: scale(.8);  opacity: 0; }
    50%  { opacity: .4; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  .scalar-ring {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px solid rgba(34,211,238,.65);
    animation: scalarRing 2.2s ease-out infinite;
    pointer-events: none;
    box-shadow: 0 0 12px rgba(34,211,238,.35);
  }

  /* ── Progress bar (under playing row) ── */
  .progress-track {
    height: 3px;
    background: rgba(255,255,255,.08);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 8px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #D4AF37, #F5E17A);
    border-radius: 3px;
    transition: width 0.5s ease;
    box-shadow: 0 0 10px rgba(212,175,55,.7), 0 0 20px rgba(212,175,55,.25);
  }

  /* ── Lock overlay ── */
  .lock-overlay {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: rgba(5,5,5,.55);
    backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: opacity .2s;
  }
  .meditation-row:hover .lock-overlay { opacity: 1; }

  /* ── Tier badges ── */
  .badge-premium {
    font-size: 9px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; padding: 4px 10px;
    border-radius: 100px;
    background: linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.05));
    border: 1px solid rgba(212,175,55,.3);
    color: var(--siddha-gold);
  }
  .badge-free {
    font-size: 9px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; padding: 4px 10px;
    border-radius: 100px;
    background: rgba(34,211,238,.08);
    border: 1px solid rgba(34,211,238,.2);
    color: var(--vayu-cyan);
  }

  /* ── SV+EN bilingual tag ── */
  .badge-bilingual {
    font-size: 9px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid rgba(34,211,238,.2);
    color: rgba(34,211,238,.6);
  }

  /* ── Sacred Commission cards ── */
  .commission-card {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 24px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: all .25s ease;
  }
  .commission-card:hover {
    border-color: rgba(212,175,55,.2);
    box-shadow: 0 8px 32px rgba(212,175,55,.06);
  }

  /* ── Now-Playing floating bar ── */
  @keyframes nowPlayingSlide {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes sqiNpBarBreath {
    0%, 100% {
      border-color: rgba(212,175,55,.32);
      box-shadow: 0 0 22px rgba(212,175,55,.22), 0 0 48px rgba(212,175,55,.1), 0 10px 36px rgba(0,0,0,.55);
    }
    50% {
      border-color: rgba(212,175,55,.65);
      box-shadow: 0 0 40px rgba(212,175,55,.45), 0 0 72px rgba(212,175,55,.15), 0 14px 44px rgba(0,0,0,.5);
    }
  }
  .now-playing-bar {
    position: fixed;
    bottom: 72px;
    left: 50%; transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 398px;
    background: rgba(10,9,8,.92);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(212,175,55,.25);
    border-radius: 24px;
    padding: 12px 16px;
    z-index: 50;
    display: flex; align-items: center; gap: 12px;
    animation: nowPlayingSlide .35s ease-out;
    box-shadow: 0 0 28px rgba(212,175,55,.18), 0 8px 32px rgba(0,0,0,.6);
  }
  .now-playing-bar.np-siddha-live {
    animation: nowPlayingSlide .35s ease-out, sqiNpBarBreath 2.6s ease-in-out infinite;
  }
  .np-play-icon {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #F5E17A, #D4AF37, #A07C10);
    display: flex; align-items: center; justify-content: center;
    color: #050505;
    box-shadow: 0 0 14px rgba(212,175,55,.5);
    position: relative;
  }
  .np-play-icon.np-pulse {
    animation: npIconGold 2s ease-in-out infinite;
  }
  @keyframes npIconGold {
    0%, 100% { box-shadow: 0 0 12px rgba(212,175,55,.55); transform: scale(1); }
    50% { box-shadow: 0 0 24px rgba(212,175,55,.95), 0 0 40px rgba(245,225,122,.25); transform: scale(1.06); }
  }
  .np-track { flex: 1; min-width: 0; }
  .np-title {
    font-size: 12px; font-weight: 800; letter-spacing: -.01em;
    font-family: 'Cinzel', serif;
    color: rgba(255,255,255,.9);
    line-height: 1.35;
    word-break: break-word;
    overflow-wrap: anywhere;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .np-title.np-cinzel-gold {
    color: #D4AF37;
    text-shadow: 0 0 16px rgba(212,175,55,0.4), 0 0 32px rgba(212,175,55,0.12);
  }
  .np-bar-track { height: 2px; background: rgba(255,255,255,.08); border-radius: 2px; margin-top: 5px; }
  .np-bar-fill  {
    height: 100%;
    background: linear-gradient(90deg, #D4AF37, #F5E17A);
    border-radius: 2px;
    transition: width .5s;
    box-shadow: 0 0 8px rgba(212,175,55,.75), 0 0 16px rgba(212,175,55,.3);
  }

  /* ── Chevron ── */
  .chevron {
    width: 24px; height: 24px;
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted);
    font-size: 12px;
    transition: transform .3s ease, border-color .3s;
  }
  .chevron.open { transform: rotate(180deg); border-color: rgba(212,175,55,.3); color: var(--siddha-gold); }

  /* ── Hero area ── */
  .sqi-hero {
    position: relative;
    padding: 52px 20px 24px;
    overflow: hidden;
  }
  .sqi-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,.07), transparent 65%);
    pointer-events: none;
  }
`,Oe=()=>{const t=g.useRef(null);return g.useEffect(()=>{const i=t.current;if(!i)return;const s=i.getContext("2d"),a=()=>{i.width=window.innerWidth,i.height=window.innerHeight};a(),window.addEventListener("resize",a);const c=Array.from({length:150},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*1.3,alpha:Math.random()*.5,speed:.003+Math.random()*.009,phase:Math.random()*Math.PI*2,gold:Math.random()>.8}));let o;const h=()=>{s.clearRect(0,0,i.width,i.height),c.forEach(l=>{l.phase+=l.speed;const d=l.alpha*(.5+.5*Math.sin(l.phase));s.beginPath(),s.arc(l.x,l.y,l.r,0,Math.PI*2),s.fillStyle=l.gold?`rgba(212,175,55,${d})`:`rgba(255,255,255,${d*.5})`,s.fill()}),o=requestAnimationFrame(h)};return h(),()=>{cancelAnimationFrame(o),window.removeEventListener("resize",a)}},[]),e.jsx("canvas",{ref:t,className:"sqi-stars"})},He=()=>{const{t}=F(),i=ze();return i.isLoading||!i.mahadasha?null:e.jsxs("div",{className:"jyotish-line",children:[e.jsx("span",{className:"dot"}),e.jsx("p",{style:{fontSize:11.5,color:"rgba(255,255,255,.4)",lineHeight:1.5,margin:0},children:t("meditations.jyotishGuidanceBody",{mahadasha:i.mahadasha,meditationType:i.meditationType,karmaFocus:i.karmaFocus})})]})},te=({med:t,lang:i,currentAudio:s,isPlaying:a,playerProgress:c,hasMeditationAccess:o,onPlay:h,onLock:l})=>{const{t:d}=F(),x=s?.id===t.id,p=x&&a,u=(t.is_premium||t.tier==="prana_flow")&&!o,v=!t.is_premium&&t.tier!=="prana_flow",b=!!(t.audio_url&&t.audio_url_sv),w=i==="sv"&&t.title_sv?t.title_sv:t.title,[k,S]=g.useState(!1);return e.jsxs("div",{className:`meditation-row${p?" sqi-active-card":""}`,style:p?void 0:{border:x?"1px solid rgba(212,175,55,.3)":"1px solid transparent",background:x?"rgba(212,175,55,.04)":void 0},onClick:()=>u?l():h(t,i),children:[e.jsx(De,{meditationId:t.id,open:k,onOpenChange:S}),e.jsxs("div",{style:{position:"relative",flexShrink:0},children:[e.jsx("div",{className:`play-btn${p?" playing":""}`,children:p?e.jsx(K,{size:14}):e.jsx(M,{size:14,style:{marginLeft:2}})}),p&&e.jsx("div",{className:"scalar-ring"})]}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontFamily:"'Cinzel', serif",fontSize:13,fontWeight:500,letterSpacing:".02em",color:p?"#D4AF37":"rgba(255,255,255,0.88)",lineHeight:1.35,marginBottom:3,wordBreak:"break-word",overflowWrap:"anywhere",textShadow:p?"0 0 18px rgba(212,175,55,0.45), 0 0 36px rgba(212,175,55,0.12)":void 0},children:w}),e.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:10.5,color:"rgba(255,255,255,.4)"},children:[t.duration_minutes!=null&&t.duration_minutes>0&&e.jsxs("span",{children:["⏱ ",t.duration_minutes," ",d("meditations.duration")]}),b&&e.jsx("span",{className:"badge-bilingual",children:d("meditations.bilingualBadge")})]}),p&&c!==void 0&&e.jsx("div",{className:"progress-track",style:{marginTop:8},children:e.jsx("div",{className:"progress-fill",style:{width:`${c*100}%`}})})]}),e.jsxs("div",{style:{flexShrink:0,display:"flex",alignItems:"center",gap:6},children:[e.jsx("button",{onClick:r=>{r.stopPropagation(),S(!0)},style:{width:26,height:26,borderRadius:"50%",border:"none",background:"transparent",color:"rgba(255,255,255,.32)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},children:e.jsx(we,{size:15})}),v?e.jsx("span",{className:"badge-free",children:d("meditations.badgeFree")}):e.jsxs("span",{className:"badge-premium",children:[u?"🔒":"+"," ",d("meditations.badgePranaPlus")]})]}),u&&e.jsxs("div",{className:"lock-overlay",children:[e.jsx(je,{size:18,color:"#D4AF37",style:{margin:"0 auto 4px"}}),e.jsx("span",{style:{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#D4AF37"},children:d("meditations.upgradeLabel")})]})]})},Ye=({title:t,subtitle:i,meditations:s,lang:a,currentAudio:c,isPlaying:o,playerProgress:h,hasMeditationAccess:l,onPlay:d,onLock:x,defaultOpen:p=!1})=>{const[u,v]=g.useState(p);return e.jsxs("div",{className:"category-card",style:{marginBottom:10,overflow:"visible"},children:[e.jsxs("div",{className:"section-header",onClick:()=>v(b=>!b),children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:800,fontSize:15,letterSpacing:"-0.01em",color:"rgba(255,255,255,0.9)"},children:t}),i&&e.jsx("div",{style:{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2},children:i})]}),e.jsx("div",{className:`chevron${u?" open":""}`,children:u?"▲":"▼"})]}),u&&e.jsxs("div",{style:{paddingBottom:12},children:[e.jsx("div",{className:"akasha-divider"}),s.map((b,w)=>e.jsxs(Z.Fragment,{children:[e.jsx(te,{med:b,lang:a,currentAudio:c,isPlaying:o,playerProgress:h,hasMeditationAccess:l,onPlay:d,onLock:x}),w<s.length-1&&e.jsx("div",{style:{height:1,background:"rgba(255,255,255,.03)",margin:"0 20px"}})]},b.id))]})]})},Ue=({audio:t,isPlaying:i,progress:s,onToggle:a})=>e.jsxs("div",{className:`now-playing-bar${i?" np-siddha-live":""}`,children:[e.jsx("div",{className:`np-play-icon${i?" np-pulse":""}`,onClick:a,style:{cursor:"pointer"},children:i?e.jsx(K,{size:14}):e.jsx(M,{size:14,style:{marginLeft:2}})}),e.jsxs("div",{className:"np-track",children:[e.jsx("div",{className:`np-title${i?" np-cinzel-gold":""}`,children:t.title}),e.jsx("div",{className:"np-bar-track",children:e.jsx("div",{className:"np-bar-fill",style:{width:`${(s??0)*100}%`}})})]}),e.jsx(D,{size:14,className:"nadi-pulse"})]}),ct=()=>{const{t}=F(),i=oe(),[s]=le(),{user:a}=X(),{isAdmin:c,adminGranted:o,isPremium:h,tier:l}=ce(),{language:d,setLanguage:x}=Ne(),{playUniversalAudio:p,currentAudio:u,isPlaying:v,togglePlay:b,progress:w}=ge(),{playlists:k,getPlaylistItems:S}=Me("meditation"),[r,f]=g.useState([]),[j,A]=g.useState(!0),[N,I]=g.useState(null),[L,G]=g.useState([]),q=g.useRef(!1),{reading:ie,generateReading:O}=pe(),H=_e(),B=ue(),ae=t(`meditations.dayPhase.${B}`),C=g.useMemo(()=>Re(r,{dayPhase:B,userState:H?.userState??"calm",language:d}),[r,H,d,B]);g.useEffect(()=>{const n=s.get("success"),m=s.get("wealth_success"),z=s.get("cancelled"),T=s.get("membership_success"),P=s.get("membership_cancelled");n==="true"?_.success(t("meditations.paymentSuccess")):m==="true"?_.success(t("meditations.wealthSuccess")):T==="true"?_.success(t("meditations.membershipSuccess")):(z==="true"||P==="true")&&_.info(t("meditations.paymentCancelled"))},[s,t]),g.useEffect(()=>{se()},[]);const se=async()=>{const{data:n}=await y.from("meditations").select("*").order("created_at",{ascending:!1});n&&f(n),A(!1)};g.useEffect(()=>{if(!a)return;(async()=>{const{data:m}=await y.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",a.id).maybeSingle();if(m?.birth_name&&m?.birth_date&&m?.birth_time&&m?.birth_place){const z={name:m.birth_name,birthDate:m.birth_date,birthTime:m.birth_time,birthPlace:m.birth_place,plan:"compass"};await O(z,0,"Europe/Stockholm",a.id)}})()},[a,ie,O]);const Y=(a?.subscription_tier??l??"free").toString().toLowerCase(),re=["prana_flow","soma","brahman","admin","lifetime"].includes(Y)||Y.includes("premium"),E=!!a&&(c||o||h||re),U=g.useMemo(()=>$e(r,d),[r,d]),ne=g.useMemo(()=>{const n=Ge(U),m=["short","morning","sleep","healing","focus","nature","all"],z={short:t("meditations.sections.short","Short resets"),morning:t("meditations.sections.morning","Morning"),sleep:t("meditations.sections.sleep","Sleep"),healing:t("meditations.sections.healing","Healing"),focus:t("meditations.sections.focus","Focus"),nature:t("meditations.sections.nature","Nature"),all:t("meditations.sections.more","More")},T={short:t("meditations.sections.shortDesc","2–5 minutes. Easy to begin."),morning:t("meditations.sections.morningDesc","Start your day gently."),sleep:t("meditations.sections.sleepDesc","Unwind the body and mind."),healing:t("meditations.sections.healingDesc","Support what's tender."),focus:t("meditations.sections.focusDesc","Clear and steady attention."),nature:t("meditations.sections.natureDesc","Ground in the presence of earth."),all:t("meditations.sections.moreDesc","Explore when you feel ready.")};return m.map(P=>({title:z[P],subtitle:T[P],items:n[P]||[]}))},[U,t]),R=(n,m)=>{const z=m==="sv"&&n.audio_url_sv?n.audio_url_sv:n.audio_url;if(!z){_.error("Audio not yet uploaded for this meditation. Please check the admin panel.");return}p({id:n.id,title:n.title,audio_url:z,artist:"",cover_image_url:null,duration_seconds:0,shc_reward:0,contentType:"meditation"})},J=g.useCallback(async()=>{if(!a){i("/auth");return}if(!q.current){q.current=!0;try{await Ae({successPath:"/meditations?membership_success=true",sourcePage:"meditations-prana-upgrade"})}catch(n){q.current=!1,_.error(n instanceof Error?n.message:t("meditations.checkoutFailed"))}}},[a,i,t]);return j?e.jsxs("div",{className:"sqi-page",style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh"},children:[e.jsx("style",{children:$}),e.jsx(Ce,{}),e.jsx(V,{size:28,className:"nadi-pulse",style:{margin:"0 auto 12px",display:"block",color:"#22D3EE"}}),e.jsx("div",{className:"sqi-micro",children:t("meditations.loadingArchive")})]}):N?e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:$}),e.jsxs("div",{className:"sqi-content",style:{padding:"48px 20px 20px 32px"},children:[e.jsxs(me,{variant:"ghost",size:"sm",onClick:()=>{I(null),G([])},className:"mb-4",children:[e.jsx(ye,{size:16,className:"mr-1"}),t("common.back")]}),e.jsxs("div",{className:"glass-card",style:{padding:24,marginBottom:24},children:[N.cover_image_url&&e.jsx("img",{src:N.cover_image_url,alt:N.title,style:{width:96,height:96,borderRadius:16,objectFit:"cover",marginBottom:12}}),e.jsx("h2",{style:{fontWeight:800,fontSize:20,color:"rgba(255,255,255,.9)",marginBottom:4},children:N.title}),N.description&&e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:8},children:N.description}),e.jsx("p",{style:{fontSize:12,color:"rgba(255,255,255,.35)"},children:N.track_count===1?t("meditations.playlistSessionOne"):t("meditations.playlistSessions",{count:N.track_count})})]}),e.jsx("div",{className:"glass-card",style:{overflow:"visible"},children:L.length===0?e.jsx("div",{style:{textAlign:"center",padding:24},children:e.jsx(V,{className:"animate-spin",size:24,style:{color:"rgba(212,175,55,.6)"}})}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"akasha-divider"}),L.map((n,m)=>e.jsxs(Z.Fragment,{children:[e.jsx(te,{med:n,lang:d,currentAudio:u,isPlaying:v,playerProgress:w??0,hasMeditationAccess:E,onPlay:R,onLock:J}),m<L.length-1&&e.jsx("div",{style:{height:1,background:"rgba(255,255,255,.03)",margin:"0 20px"}})]},n.id))]})})]})]}):e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:$}),e.jsx(Oe,{}),e.jsxs("div",{className:"sqi-content",children:[e.jsxs("div",{className:"sqi-hero",children:[e.jsx("div",{className:"sqi-orb",style:{width:200,height:200,top:-60,right:-60,"--dur":"12s","--dl":"0s"}}),e.jsx("div",{className:"sqi-orb",style:{width:100,height:100,top:"60%",left:-30,"--dur":"8s","--dl":"-3s"}}),e.jsx("h1",{className:"sqi-shimmer-title",children:t("meditations.hallOfStillness")}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginTop:14,marginBottom:0},children:[e.jsx(ve,{size:14,style:{color:"rgba(255,255,255,.35)"}}),e.jsx("span",{className:"sqi-micro",style:{marginBottom:0},children:t("meditations.audioLanguageLabel").toUpperCase()}),e.jsx(Le,{language:d,setLanguage:x})]})]}),C&&e.jsx("div",{style:{padding:"0 20px 20px"},children:e.jsxs("div",{className:"glass-card",style:{padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1px solid rgba(212,175,55,.18)",background:"linear-gradient(135deg, rgba(212,175,55,.06), rgba(212,175,55,.02))"},onClick:()=>R(C,d),children:[e.jsx("div",{style:{position:"relative",flexShrink:0},children:e.jsx("div",{className:"play-btn playing",children:e.jsx(M,{size:14,style:{marginLeft:2}})})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontFamily:"'Cinzel', serif",fontSize:13,fontWeight:500,letterSpacing:".02em",color:"#D4AF37",marginBottom:4,lineHeight:1.35,wordBreak:"break-word",overflowWrap:"anywhere"},children:d==="sv"&&C.title_sv?C.title_sv:C.title}),e.jsxs("div",{style:{fontSize:11,color:"rgba(255,255,255,.35)"},children:[ae," · ",t("meditations.startComfort")]})]}),C.audio_url_sv&&e.jsx("span",{className:"badge-bilingual",children:t("meditations.bilingualBadge")})]})}),e.jsxs("div",{onClick:()=>i("/meditation-playlists"),style:{margin:"0 20px 16px",padding:"14px 16px",borderRadius:20,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(212,175,55,.16)",display:"flex",alignItems:"center",gap:12,cursor:"pointer"},children:[e.jsx("div",{style:{width:40,height:40,borderRadius:13,flexShrink:0,background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(D,{size:18,style:{color:"#D4AF37"}})}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{fontWeight:700,fontSize:14,color:"rgba(255,255,255,.88)"},children:"Your Meditation Playlists"}),e.jsx("div",{style:{fontSize:11.5,color:"rgba(255,255,255,.4)",marginTop:1},children:"Create and play your own meditation mixes"})]}),e.jsx("div",{style:{color:"rgba(212,175,55,.5)",fontSize:16,flexShrink:0},children:"›"})]}),e.jsx(He,{}),a&&!E&&e.jsx("div",{style:{padding:"0 20px 20px"},children:e.jsxs("div",{onClick:()=>i("/prana-flow"),style:{background:"linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(5,5,5,0.98) 60%)",border:"1px solid rgba(212,175,55,0.25)",borderRadius:24,padding:"24px 22px",cursor:"pointer",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"60%",height:1,background:"linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)"}}),e.jsx("div",{style:{fontWeight:800,fontSize:7,letterSpacing:"0.5em",textTransform:"uppercase",color:"rgba(212,175,55,0.45)",marginBottom:8},children:"◈ Prana–Flow · 19€/mo"}),e.jsx("div",{style:{fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",fontSize:"1.4rem",color:"white",marginBottom:6},children:"Unlock the Full Meditation Library"}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,0.3)",lineHeight:1.6,marginBottom:14},children:"Complete guided meditations · Yoga Nidra · Mantra library · Sacred frequencies"}),e.jsx("div",{style:{display:"inline-flex",alignItems:"center",gap:8,background:"#D4AF37",color:"#050505",borderRadius:100,padding:"10px 22px",fontWeight:800,fontSize:8,letterSpacing:"0.35em",textTransform:"uppercase"},children:"◈ Start Free — 7 Days"})]})}),k.length>0&&e.jsxs("div",{style:{padding:"0 20px 24px"},children:[e.jsx("div",{className:"sqi-micro",style:{marginBottom:8,color:"rgba(212,175,55,.5)"},children:t("meditations.featuredCollections")}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:k.map(n=>e.jsx(Pe,{playlist:n,onClick:async()=>{I(n);const m=await S(n.id);G(m||[])}},n.id))})]}),e.jsxs("div",{style:{padding:"0 20px 12px"},children:[e.jsx("div",{className:"sqi-micro",style:{marginBottom:4},children:t("meditations.sectionMicroLabel")}),e.jsx("div",{style:{fontWeight:800,fontSize:17,letterSpacing:"-0.02em",color:"rgba(255,255,255,.9)"},children:t("meditations.allMeditations")})]}),e.jsx("div",{style:{padding:"0 20px"},children:ne.map((n,m)=>n.items.length>0&&e.jsx(Ye,{title:n.title,subtitle:n.subtitle,meditations:n.items,lang:d,currentAudio:u,isPlaying:v,playerProgress:w??0,hasMeditationAccess:E,onPlay:R,onLock:J,defaultOpen:!1},n.title))}),Q&&e.jsx(Q,{}),e.jsx("div",{style:{height:100}})]}),u&&u.contentType==="meditation"&&e.jsx(Ue,{audio:u,isPlaying:v,progress:w??0,onToggle:b})]})};export{ct as default};
