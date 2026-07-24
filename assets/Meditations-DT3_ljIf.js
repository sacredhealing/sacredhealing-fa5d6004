import{j as e,r as g,g as oe,t as le,R as q}from"./vendor-react--OR-uH7S.js";import{f as k,s as A,L as de,u as ce,a as ge,n as pe,l as me,o as ue,p as _,B as he}from"./index-RRXEvQfm.js";import{m as T}from"./vendor-motion-Dm4zQNot.js";import{a as J,c as C,O as xe,L as be,h as U,A as fe,V as ye,P as Q,p as ve}from"./vendor-icons-CZmAPI07.js";import{u as je}from"./useUserDailyState-B0aveObL.js";import{g as K,u as we}from"./getItemLanguage-CSCly_VY.js";import{u as ke}from"./useJyotishProfile-DquYAUtL.js";import{s as Se}from"./startPranaMonthlyCheckout-C9NYGHrG.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-i18n-BS5B6gzd.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";import"./vedicCalculations-DbxpS8o1.js";import"./stripeCheckoutNavigation-AOhyaKuh.js";const _e=()=>e.jsxs("div",{className:"relative flex flex-col items-center justify-center p-12 overflow-hidden",children:[e.jsx(T.div,{animate:{scale:[1,1.15,1],opacity:[.2,.4,.2]},transition:{duration:5,repeat:1/0,ease:"easeInOut"},className:"absolute w-48 h-48 bg-[#D4AF37] rounded-full blur-[60px]"}),e.jsxs(T.svg,{width:"200",height:"200",viewBox:"0 0 200 200",fill:"none",xmlns:"http://www.w3.org/2000/svg",initial:{opacity:0},animate:{opacity:1},className:"relative z-10",children:[e.jsx("path",{d:"M100 40 L160 180 L40 180 Z",stroke:"rgba(212,175,55,0.25)",strokeWidth:"0.8",fill:"none"}),e.jsx("path",{d:"M100 70 L130 180 L70 180 Z",stroke:"rgba(212,175,55,0.3)",strokeWidth:"0.6",fill:"none"}),e.jsx("path",{d:"M100 95 L115 180 L85 180 Z",stroke:"rgba(212,175,55,0.2)",strokeWidth:"0.5",fill:"none"}),e.jsx("circle",{cx:"100",cy:"100",r:"55",stroke:"rgba(212,175,55,0.15)",strokeWidth:"0.5",fill:"none"})]}),e.jsxs(T.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"mt-6 text-center",children:[e.jsx("p",{className:"text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-serif",style:{fontFamily:"Cinzel, DM Serif Display, Georgia, serif"},children:"The Void is Full"}),e.jsx("p",{className:"text-white/25 text-[10px] mt-2 italic font-serif",style:{fontFamily:"Cinzel, DM Serif Display, Georgia, serif"},children:"Mahavatar Babaji waits in the silence..."})]})]});function Ne(t,i){const r=Math.floor(t/3600),a=Math.floor(t%3600/60);return r>0?i("meditations.curatedDurationHoursMins",{hours:r,minutes:a}):i("meditations.curatedDurationMins",{minutes:a})}const ze=({playlist:t,onClick:i})=>{const{t:r}=k();return e.jsxs("button",{onClick:i,className:"group relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 hover:scale-[1.02] transition-all duration-300 text-left w-full",children:[e.jsxs("div",{className:"aspect-[4/3] relative",children:[t.cover_image_url?e.jsx("img",{src:t.cover_image_url,alt:t.title,className:"w-full h-full object-cover",loading:"lazy"}):e.jsx("div",{className:"w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center",children:e.jsx(J,{size:32,className:"text-primary/50"})}),e.jsx("div",{className:"absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",children:e.jsx("div",{className:"w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-purple",children:e.jsx(C,{size:24,className:"text-primary-foreground ml-1"})})}),(t.mood||t.theme)&&e.jsx("div",{className:"absolute top-3 left-3 px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm",children:e.jsx("span",{className:"text-xs font-medium text-white capitalize",children:t.mood||t.theme})})]}),e.jsxs("div",{className:"p-4",children:[e.jsx("h3",{className:"font-heading font-semibold text-foreground",children:t.title}),t.description&&e.jsx("p",{className:"text-sm text-muted-foreground mt-1 line-clamp-2",children:t.description}),e.jsxs("div",{className:"flex items-center gap-3 mt-3 text-xs text-muted-foreground",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(xe,{size:12}),Ne(t.total_duration,r)]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:t.track_count===1?r("meditations.playlistSessionOne"):r("meditations.playlistSessions",{count:t.track_count})})]})]})]})},Ae=t=>{const[i,r]=g.useState([]),[a,s]=g.useState(!0);g.useEffect(()=>{n()},[t]);const n=async()=>{s(!0);const{data:d,error:l}=await A.from("curated_playlists").select("*").eq("content_type",t).eq("is_active",!0).order("order_index");if(l||!d){s(!1);return}const u=await Promise.all(d.map(async p=>{{const{data:m}=await A.from("curated_playlist_items").select(`
              id,
              meditation_id,
              meditations!curated_playlist_items_meditation_id_fkey (
                duration_minutes,
                play_count
              )
            `).eq("playlist_id",p.id),b=m?.length||0,w=m?.reduce((y,N)=>{const v=N.meditations;return y+(v?.duration_minutes||0)*60},0)||0,x=m?.reduce((y,N)=>{const v=N.meditations;return y+(v?.play_count||0)},0)||0;return{...p,track_count:b,total_duration:w,total_plays:x}}}));r(u),s(!1)};return{playlists:i,loading:a,refetch:n,getPlaylistItems:async d=>{{const{data:l}=await A.from("curated_playlist_items").select(`
          id,
          meditation_id,
          order_index,
          meditations!curated_playlist_items_meditation_id_fkey (*)
        `).eq("playlist_id",d).order("order_index");return l?.map(u=>u.meditations).filter(Boolean)||[]}}}};function Y({language:t,setLanguage:i,compact:r}){const{t:a}=k();return r?e.jsxs("div",{className:"flex items-center gap-1 shrink-0",children:[e.jsx("button",{"aria-label":a("meditations.langSvAria"),className:`p-2 rounded-lg transition ${t==="sv"?"text-[#D4AF37] bg-[#D4AF37]/15":"text-muted-foreground hover:text-foreground/80"}`,onClick:()=>i("sv"),children:e.jsx(de,{size:20})}),e.jsx("button",{"aria-label":a("meditations.langEnAria"),className:`p-2 rounded-lg transition ${t==="en"?"text-[#D4AF37] bg-[#D4AF37]/15":"text-muted-foreground hover:text-foreground/80"}`,onClick:()=>i("en"),children:e.jsx(be,{className:"w-5 h-5",strokeWidth:1.5})})]}):e.jsx("div",{className:"flex items-center justify-between gap-3 mt-3",children:e.jsxs("div",{className:"flex rounded-full bg-black p-1 border border-[#D4AF37]/60",children:[e.jsx("button",{className:`px-4 py-2 rounded-full text-sm transition ${t==="sv"?"text-[#D4AF37] bg-[#D4AF37]/10":"text-muted-foreground hover:text-foreground"}`,onClick:()=>i("sv"),children:a("meditations.langSv")}),e.jsx("button",{className:`px-4 py-2 rounded-full text-sm transition ${t==="en"?"text-[#D4AF37] bg-[#D4AF37]/10":"text-muted-foreground hover:text-foreground"}`,onClick:()=>i("en"),children:a("meditations.langEn")})]})})}function Ce(t){const i=t?.durationSec??t?.duration_seconds??(t?.duration_minutes!=null?t.duration_minutes*60:void 0)??t?.duration??t?.lengthSec??t?.length_seconds;if(typeof i=="number"&&isFinite(i))return i;if(typeof i=="string"){const r=Number(i);if(isFinite(r))return r}return 8*60}function Fe(t,i){const a=Math.abs(i-(t==="busy"?120:t==="heavy"?300:t==="calm"?480:720));return Math.max(0,1e3-a)}function De(t,i){const r=(i?.title??i?.name??"").toString().toLowerCase(),a=(i?.tags??[]).join(" ").toLowerCase(),s=(i?.category??"").toString().toLowerCase(),n=`${r} ${a} ${s}`;if(t==="morning"){if(n.includes("morning")||n.includes("morgon"))return 80;if(n.includes("energ")||n.includes("focus")||n.includes("fokus"))return 40}if(t==="evening"){if(n.includes("sleep")||n.includes("sömn")||n.includes("evening"))return 80;if(n.includes("wind")||n.includes("unwind")||n.includes("kväll"))return 40}return 10}function Me(t,i){if(!t?.length)return null;const{dayPhase:r,userState:a,language:s}=i;let n=null,h=-1/0;for(const d of t){if(K(d)!==s)continue;const u=Ce(d),p=Fe(a,u)+De(r,d)+25;p>h&&(h=p,n=d)}return n}function Pe(t){const i=t?.durationSec??t?.duration_seconds??(t?.duration_minutes!=null?t.duration_minutes*60:void 0)??t?.duration??t?.lengthSec??t?.length_seconds;if(typeof i=="number"&&isFinite(i))return i;if(typeof i=="string"){const r=Number(i);if(isFinite(r))return r}return 8*60}function Be(t){const i=(t?.title??t?.name??"").toString().toLowerCase(),r=Array.isArray(t?.tags)?t.tags.join(" ").toLowerCase():"",a=(t?.category??"").toString().toLowerCase();return`${i} ${r} ${a}`}function Le(t,i){return t.filter(r=>K(r)===i)}function Te(t){const i=Be(t);return Pe(t)<=5*60?"short":i.includes("morgon")||i.includes("morning")||i.includes("sunrise")?"morning":i.includes("sömn")||i.includes("sleep")||i.includes("night")||i.includes("dream")||i.includes("starlight")?"sleep":i.includes("heal")||i.includes("läkning")||i.includes("chakra")?"healing":i.includes("focus")||i.includes("fokus")||i.includes("intention")?"focus":i.includes("nature")||i.includes("skog")||i.includes("ocean")?"nature":"all"}function Ee(t){const i={short:[],morning:[],sleep:[],healing:[],focus:[],nature:[],all:[]};for(const a of t){const s=Te(a);i[s].push(a)}const r=new Set(["short","morning","sleep","healing","focus","nature"].flatMap(a=>i[a].map(s=>s?.id??s?.slug??s?.title)));return i.all=t.filter(a=>{const s=a?.id??a?.slug??a?.title;return!r.has(s)}),i}function V(){const{t}=k(),[i,r]=g.useState(!1);return g.useEffect(()=>{const a=()=>r(window.scrollY>800);return a(),window.addEventListener("scroll",a,{passive:!0}),()=>window.removeEventListener("scroll",a)},[]),i?e.jsx("button",{onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),className:"fixed bottom-24 right-4 z-50 rounded-full border border-border bg-muted/80 backdrop-blur-sm px-4 py-3 text-sm text-foreground hover:bg-muted transition shadow-lg",children:t("meditations.backToTop")}):null}const E=`
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

  /* ── Jyotish banner (emerald glass) ── */
  .jyotish-banner {
    background: linear-gradient(135deg, rgba(16,185,129,.05), rgba(34,211,238,.04));
    border: 1px solid rgba(16,185,129,.2) !important;
    border-radius: var(--radius-xl);
    padding: 18px 22px;
    margin: 0 20px 20px;
  }
  .jyotish-banner .micro-label {
    font-size: 8px; font-weight: 800; letter-spacing: .4em;
    text-transform: uppercase; color: rgba(16,185,129,.7);
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
    padding: 18px 24px;
    cursor: pointer;
    border-radius: var(--radius-xl);
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
`,qe=()=>{const t=g.useRef(null);return g.useEffect(()=>{const i=t.current;if(!i)return;const r=i.getContext("2d"),a=()=>{i.width=window.innerWidth,i.height=window.innerHeight};a(),window.addEventListener("resize",a);const s=Array.from({length:150},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*1.3,alpha:Math.random()*.5,speed:.003+Math.random()*.009,phase:Math.random()*Math.PI*2,gold:Math.random()>.8}));let n;const h=()=>{r.clearRect(0,0,i.width,i.height),s.forEach(d=>{d.phase+=d.speed;const l=d.alpha*(.5+.5*Math.sin(d.phase));r.beginPath(),r.arc(d.x,d.y,d.r,0,Math.PI*2),r.fillStyle=d.gold?`rgba(212,175,55,${l})`:`rgba(255,255,255,${l*.5})`,r.fill()}),n=requestAnimationFrame(h)};return h(),()=>{cancelAnimationFrame(n),window.removeEventListener("resize",a)}},[]),e.jsx("canvas",{ref:t,className:"sqi-stars"})},We=()=>{const{t}=k(),i=ke();return i.isLoading||!i.mahadasha?null:e.jsxs("div",{className:"jyotish-banner",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8},children:[e.jsx("span",{style:{fontSize:16},children:"⚕"}),e.jsx("span",{className:"micro-label",children:t("meditations.jyotishGuidanceLabel")})]}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,1)",lineHeight:1.6,margin:0},children:t("meditations.jyotishGuidanceBody",{mahadasha:i.mahadasha,meditationType:i.meditationType,karmaFocus:i.karmaFocus})})]})},Z=({med:t,lang:i,currentAudio:r,isPlaying:a,playerProgress:s,hasMeditationAccess:n,onPlay:h,onLock:d})=>{const{t:l}=k(),u=r?.id===t.id,p=u&&a,m=(t.is_premium||t.tier==="prana_flow")&&!n,b=!t.is_premium&&t.tier!=="prana_flow",w=!!(t.audio_url&&t.audio_url_sv),x=i==="sv"&&t.title_sv?t.title_sv:t.title;return e.jsxs("div",{className:`meditation-row${p?" sqi-active-card":""}`,style:p?void 0:{border:u?"1px solid rgba(212,175,55,.3)":"1px solid transparent",background:u?"rgba(212,175,55,.04)":void 0},onClick:()=>m?d():h(t,i),children:[e.jsxs("div",{style:{position:"relative",flexShrink:0},children:[e.jsx("div",{className:`play-btn${p?" playing":""}`,children:p?e.jsx(Q,{size:14}):e.jsx(C,{size:14,style:{marginLeft:2}})}),p&&e.jsx("div",{className:"scalar-ring"})]}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontFamily:"'Cinzel', serif",fontSize:13,fontWeight:500,letterSpacing:".02em",color:p?"#D4AF37":"rgba(255,255,255,0.88)",lineHeight:1.35,marginBottom:3,wordBreak:"break-word",overflowWrap:"anywhere",textShadow:p?"0 0 18px rgba(212,175,55,0.45), 0 0 36px rgba(212,175,55,0.12)":void 0},children:x}),e.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:10.5,color:"rgba(255,255,255,.4)"},children:[t.duration_minutes!=null&&t.duration_minutes>0&&e.jsxs("span",{children:["⏱ ",t.duration_minutes," ",l("meditations.duration")]}),t.shc_reward!=null&&t.shc_reward>0&&e.jsxs("span",{style:{color:"#D4AF37"},children:["✦ ",l("meditations.shcRewardLine",{amount:t.shc_reward})]}),w&&e.jsx("span",{className:"badge-bilingual",children:l("meditations.bilingualBadge")})]}),p&&s!==void 0&&e.jsx("div",{className:"progress-track",style:{marginTop:8},children:e.jsx("div",{className:"progress-fill",style:{width:`${s*100}%`}})})]}),e.jsx("div",{style:{flexShrink:0},children:b?e.jsx("span",{className:"badge-free",children:l("meditations.badgeFree")}):e.jsxs("span",{className:"badge-premium",children:[m?"🔒":"+"," ",l("meditations.badgePranaPlus")]})}),m&&e.jsxs("div",{className:"lock-overlay",children:[e.jsx(ve,{size:18,color:"#D4AF37",style:{margin:"0 auto 4px"}}),e.jsx("span",{style:{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#D4AF37"},children:l("meditations.upgradeLabel")})]})]})},Ie=`
  @keyframes scalarExpand {
    0%   { transform: scale(0.55); opacity: 0.55; }
    100% { transform: scale(2.2);  opacity: 0; }
  }
  @keyframes goldPulse {
    0%,100% { box-shadow: 0 0 18px rgba(212,175,55,0.35), 0 0 40px rgba(212,175,55,0.12), inset 0 0 30px rgba(212,175,55,0.04); }
    50%      { box-shadow: 0 0 32px rgba(212,175,55,0.6),  0 0 80px rgba(212,175,55,0.22), inset 0 0 50px rgba(212,175,55,0.08); }
  }
  @keyframes titleShimmer {
    0%,100% { text-shadow: 0 0 12px rgba(212,175,55,0.5); }
    50%      { text-shadow: 0 0 28px rgba(212,175,55,0.95), 0 0 60px rgba(212,175,55,0.35); }
  }
  .smc-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.55);
    animation: scalarExpand 3s ease-out infinite;
    pointer-events: none;
    top: 50%; left: 50%;
    transform-origin: center;
    margin-top: -1px; margin-left: -1px;
  }
`,Re=({navigate:t})=>{const[i,r]=q.useState(!1),a=[0,.8,1.6,2.4,3.2];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:Ie}),e.jsxs("div",{style:{margin:"0 0 12px",borderRadius:20,border:"1px solid rgba(212,175,55,0.45)",background:"linear-gradient(135deg, rgba(212,175,55,0.09) 0%, rgba(5,5,5,0.97) 55%, rgba(212,175,55,0.06) 100%)",overflow:"hidden",position:"relative",animation:"goldPulse 4s ease-in-out infinite"},children:[e.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:20},children:[a.map((s,n)=>e.jsx("div",{className:"smc-ring",style:{width:60,height:60,marginTop:-30,marginLeft:-30,animationDelay:`${s}s`,opacity:.55,left:"50%",top:"50%"}},n)),a.map((s,n)=>e.jsx("div",{className:"smc-ring",style:{width:40,height:40,marginTop:-20,marginLeft:-20,animationDelay:`${s+.4}s`,opacity:.3,left:"50%",top:"50%",borderColor:"rgba(212,175,55,0.3)"}},`b${n}`)),e.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:120,height:120,background:"radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}),e.jsx("div",{style:{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:"linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)"}})]}),e.jsxs("div",{onClick:()=>r(s=>!s),style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",cursor:"pointer",position:"relative",zIndex:1},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:7,fontWeight:800,letterSpacing:".45em",textTransform:"uppercase",color:"rgba(212,175,55,0.6)",marginBottom:5},children:"◈ SIDDHA QUANTUM INTELLIGENCE"}),e.jsx("div",{style:{fontFamily:"'Cinzel', serif",fontWeight:600,fontSize:16,color:"#D4AF37",letterSpacing:".02em",animation:"titleShimmer 4s ease-in-out infinite"},children:"Supreme Siddha Meditation"}),e.jsx("div",{style:{fontSize:11,color:"rgba(212,175,55,0.45)",marginTop:4},children:"18 Masters · 14 Modules · Scalar Transmissions"})]}),e.jsx("div",{style:{color:"rgba(212,175,55,0.6)",fontSize:13,fontWeight:700,marginLeft:12},children:i?"▲":"▼"})]}),i&&e.jsxs("div",{style:{position:"relative",zIndex:1,paddingBottom:16},children:[e.jsx("div",{style:{height:1,background:"linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent)",margin:"0 20px 12px"}}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 16px"},children:[e.jsxs("div",{onClick:()=>t("/meditation-course"),style:{background:"rgba(139,115,85,0.07)",border:"1px solid rgba(139,115,85,0.35)",borderRadius:16,padding:"14px 12px",cursor:"pointer"},children:[e.jsx("div",{style:{fontSize:7,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(139,115,85,.8)",marginBottom:5},children:"FREE"}),e.jsx("div",{style:{fontWeight:700,fontSize:12,color:"rgba(255,255,255,.88)",marginBottom:3,lineHeight:1.3},children:"Foundation of Stillness"}),e.jsx("div",{style:{fontSize:9.5,color:"rgba(255,255,255,.38)",lineHeight:1.5,marginBottom:8},children:"3 modules · Agastya · Thirumoolar · Nandhi"}),e.jsx("div",{style:{fontSize:8,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"rgba(139,115,85,.9)",padding:"4px 9px",border:"1px solid rgba(139,115,85,.4)",borderRadius:100,display:"inline-block"},children:"Open Access ›"})]}),e.jsxs("div",{onClick:()=>t("/meditation-course"),style:{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.3)",borderRadius:16,padding:"14px 12px",cursor:"pointer"},children:[e.jsx("div",{style:{fontSize:7,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(212,175,55,.75)",marginBottom:5},children:"PRANA-FLOW"}),e.jsx("div",{style:{fontWeight:700,fontSize:12,color:"rgba(255,255,255,.88)",marginBottom:3,lineHeight:1.3},children:"8 Pranayamas of Immortality"}),e.jsx("div",{style:{fontSize:9.5,color:"rgba(255,255,255,.38)",lineHeight:1.5,marginBottom:8},children:"3 modules · Kechari · Samadhi · Chakra"}),e.jsx("div",{style:{fontSize:8,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"#D4AF37",padding:"4px 9px",border:"1px solid rgba(212,175,55,.45)",borderRadius:100,display:"inline-block"},children:"€19/mo ›"})]}),e.jsxs("div",{onClick:()=>t("/meditation-course"),style:{background:"rgba(34,211,238,0.04)",border:"1px solid rgba(34,211,238,0.25)",borderRadius:16,padding:"14px 12px",cursor:"pointer"},children:[e.jsx("div",{style:{fontSize:7,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(34,211,238,.7)",marginBottom:5},children:"SIDDHA-QUANTUM"}),e.jsx("div",{style:{fontWeight:700,fontSize:12,color:"rgba(255,255,255,.88)",marginBottom:3,lineHeight:1.3},children:"Shakti Awakening & Nada Yoga"}),e.jsx("div",{style:{fontSize:9.5,color:"rgba(255,255,255,.38)",lineHeight:1.5,marginBottom:8},children:"4 modules · Kundalini · Dream Yoga · Turiya"}),e.jsx("div",{style:{fontSize:8,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"#22D3EE",padding:"4px 9px",border:"1px solid rgba(34,211,238,.35)",borderRadius:100,display:"inline-block"},children:"€45/mo ›"})]}),e.jsxs("div",{onClick:()=>t("/meditation-course"),style:{background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))",border:"1px solid rgba(212,175,55,0.45)",borderRadius:16,padding:"14px 12px",cursor:"pointer",boxShadow:"0 0 18px rgba(212,175,55,.08)"},children:[e.jsx("div",{style:{fontSize:7,fontWeight:800,letterSpacing:".4em",textTransform:"uppercase",color:"rgba(212,175,55,.9)",marginBottom:5},children:"AKASHA-INFINITY"}),e.jsx("div",{style:{fontWeight:700,fontSize:12,color:"rgba(255,255,255,.92)",marginBottom:3,lineHeight:1.3},children:"Deathlessness & Liberation"}),e.jsx("div",{style:{fontSize:9.5,color:"rgba(255,255,255,.38)",lineHeight:1.5,marginBottom:8},children:"4 modules · Maha Samadhi · Babaji · Siddha Body"}),e.jsx("div",{style:{fontSize:8,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:"#D4AF37",padding:"4px 9px",background:"rgba(212,175,55,.15)",border:"1px solid rgba(212,175,55,.6)",borderRadius:100,display:"inline-block"},children:"€2,997 Lifetime ›"})]})]})]})]})]})},$e=({title:t,subtitle:i,meditations:r,lang:a,currentAudio:s,isPlaying:n,playerProgress:h,hasMeditationAccess:d,onPlay:l,onLock:u,defaultOpen:p=!1})=>{const{t:m}=k(),[b,w]=g.useState(p);return e.jsxs("div",{className:"glass-card",style:{marginBottom:12,overflow:"visible"},children:[e.jsxs("div",{className:"section-header",onClick:()=>w(x=>!x),children:[e.jsxs("div",{children:[e.jsx("div",{className:"sqi-micro",style:{marginBottom:4},children:m("meditations.sectionMicroLabel")}),e.jsx("div",{style:{fontWeight:800,fontSize:15,letterSpacing:"-0.01em",color:"rgba(255,255,255,0.9)"},children:t}),i&&e.jsx("div",{style:{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2},children:i})]}),e.jsx("div",{className:`chevron${b?" open":""}`,children:b?"▲":"▼"})]}),b&&e.jsxs("div",{style:{paddingBottom:12},children:[e.jsx("div",{className:"akasha-divider"}),r.map((x,y)=>e.jsxs(q.Fragment,{children:[e.jsx(Z,{med:x,lang:a,currentAudio:s,isPlaying:n,playerProgress:h,hasMeditationAccess:d,onPlay:l,onLock:u}),y<r.length-1&&e.jsx("div",{style:{height:1,background:"rgba(255,255,255,.03)",margin:"0 20px"}})]},x.id))]})]})},He=({audio:t,isPlaying:i,progress:r,onToggle:a})=>e.jsxs("div",{className:`now-playing-bar${i?" np-siddha-live":""}`,children:[e.jsx("div",{className:`np-play-icon${i?" np-pulse":""}`,onClick:a,style:{cursor:"pointer"},children:i?e.jsx(Q,{size:14}):e.jsx(C,{size:14,style:{marginLeft:2}})}),e.jsxs("div",{className:"np-track",children:[e.jsx("div",{className:`np-title${i?" np-cinzel-gold":""}`,children:t.title}),e.jsx("div",{className:"np-bar-track",children:e.jsx("div",{className:"np-bar-fill",style:{width:`${(r??0)*100}%`}})})]}),e.jsx(J,{size:14,className:"nadi-pulse"})]}),st=()=>{const{t}=k(),i=oe(),[r]=le(),{user:a}=ce(),{isAdmin:s,adminGranted:n,isPremium:h,tier:d}=ge(),{language:l,setLanguage:u}=we(),{playUniversalAudio:p,currentAudio:m,isPlaying:b,togglePlay:w,progress:x}=pe(),{playlists:y,getPlaylistItems:N}=Ae("meditation"),[v,X]=g.useState([]),[ee,te]=g.useState(!0),[f,W]=g.useState(null),[F,I]=g.useState([]),D=g.useRef(!1),{reading:ie,generateReading:R}=me(),$=je(),M=ue(),ae=t(`meditations.dayPhase.${M}`),S=g.useMemo(()=>Me(v,{dayPhase:M,userState:$?.userState??"calm",language:l}),[v,$,l,M]);g.useEffect(()=>{const o=r.get("success"),c=r.get("wealth_success"),j=r.get("cancelled"),L=r.get("membership_success"),z=r.get("membership_cancelled");o==="true"?_.success(t("meditations.paymentSuccess")):c==="true"?_.success(t("meditations.wealthSuccess")):L==="true"?_.success(t("meditations.membershipSuccess")):(j==="true"||z==="true")&&_.info(t("meditations.paymentCancelled"))},[r,t]),g.useEffect(()=>{re()},[]);const re=async()=>{const{data:o}=await A.from("meditations").select("*").order("created_at",{ascending:!1});o&&X(o),te(!1)};g.useEffect(()=>{if(!a)return;(async()=>{const{data:c}=await A.from("profiles").select("birth_name, birth_date, birth_time, birth_place").eq("user_id",a.id).maybeSingle();if(c?.birth_name&&c?.birth_date&&c?.birth_time&&c?.birth_place){const j={name:c.birth_name,birthDate:c.birth_date,birthTime:c.birth_time,birthPlace:c.birth_place,plan:"compass"};await R(j,0,"Europe/Stockholm",a.id)}})()},[a,ie,R]);const H=(a?.subscription_tier??d??"free").toString().toLowerCase(),se=["prana_flow","soma","brahman","admin","lifetime"].includes(H)||H.includes("premium"),P=!!a&&(s||n||h||se),G=g.useMemo(()=>Le(v,l),[v,l]),ne=g.useMemo(()=>{const o=Ee(G),c=["short","morning","sleep","healing","focus","nature","all"],j={short:t("meditations.sections.short","Short resets"),morning:t("meditations.sections.morning","Morning"),sleep:t("meditations.sections.sleep","Sleep"),healing:t("meditations.sections.healing","Healing"),focus:t("meditations.sections.focus","Focus"),nature:t("meditations.sections.nature","Nature"),all:t("meditations.sections.more","More")},L={short:t("meditations.sections.shortDesc","2–5 minutes. Easy to begin."),morning:t("meditations.sections.morningDesc","Start your day gently."),sleep:t("meditations.sections.sleepDesc","Unwind the body and mind."),healing:t("meditations.sections.healingDesc","Support what's tender."),focus:t("meditations.sections.focusDesc","Clear and steady attention."),nature:t("meditations.sections.natureDesc","Ground in the presence of earth."),all:t("meditations.sections.moreDesc","Explore when you feel ready.")};return c.map(z=>({title:j[z],subtitle:L[z],items:o[z]||[]}))},[G,t]),B=(o,c)=>{const j=c==="sv"&&o.audio_url_sv?o.audio_url_sv:o.audio_url;if(!j){_.error("Audio not yet uploaded for this meditation. Please check the admin panel.");return}p({id:o.id,title:o.title,audio_url:j,artist:"",cover_image_url:null,duration_seconds:0,shc_reward:0,contentType:"meditation"})},O=g.useCallback(async()=>{if(!a){i("/auth");return}if(!D.current){D.current=!0;try{await Se({successPath:"/meditations?membership_success=true",sourcePage:"meditations-prana-upgrade"})}catch(o){D.current=!1,_.error(o instanceof Error?o.message:t("meditations.checkoutFailed"))}}},[a,i,t]);return ee?e.jsxs("div",{className:"sqi-page",style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh"},children:[e.jsx("style",{children:E}),e.jsx(_e,{}),e.jsx(U,{size:28,className:"nadi-pulse",style:{margin:"0 auto 12px",display:"block",color:"#22D3EE"}}),e.jsx("div",{className:"sqi-micro",children:t("meditations.loadingArchive")})]}):f?e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:E}),e.jsxs("div",{className:"sqi-content",style:{padding:"48px 20px 20px 32px"},children:[e.jsxs(he,{variant:"ghost",size:"sm",onClick:()=>{W(null),I([])},className:"mb-4",children:[e.jsx(fe,{size:16,className:"mr-1"}),t("common.back")]}),e.jsxs("div",{className:"glass-card",style:{padding:24,marginBottom:24},children:[f.cover_image_url&&e.jsx("img",{src:f.cover_image_url,alt:f.title,style:{width:96,height:96,borderRadius:16,objectFit:"cover",marginBottom:12}}),e.jsx("h2",{style:{fontWeight:800,fontSize:20,color:"rgba(255,255,255,.9)",marginBottom:4},children:f.title}),f.description&&e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:8},children:f.description}),e.jsx("p",{style:{fontSize:12,color:"rgba(255,255,255,.35)"},children:f.track_count===1?t("meditations.playlistSessionOne"):t("meditations.playlistSessions",{count:f.track_count})})]}),e.jsx("div",{className:"glass-card",style:{overflow:"visible"},children:F.length===0?e.jsx("div",{style:{textAlign:"center",padding:24},children:e.jsx(U,{className:"animate-spin",size:24,style:{color:"rgba(212,175,55,.6)"}})}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"akasha-divider"}),F.map((o,c)=>e.jsxs(q.Fragment,{children:[e.jsx(Z,{med:o,lang:l,currentAudio:m,isPlaying:b,playerProgress:x??0,hasMeditationAccess:P,onPlay:B,onLock:O}),c<F.length-1&&e.jsx("div",{style:{height:1,background:"rgba(255,255,255,.03)",margin:"0 20px"}})]},o.id))]})})]})]}):e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:E}),e.jsx(qe,{}),e.jsxs("div",{className:"sqi-content",children:[e.jsxs("div",{className:"sqi-hero",children:[e.jsx("div",{className:"sqi-orb",style:{width:200,height:200,top:-60,right:-60,"--dur":"12s","--dl":"0s"}}),e.jsx("div",{className:"sqi-orb",style:{width:100,height:100,top:"60%",left:-30,"--dur":"8s","--dl":"-3s"}}),e.jsx("div",{className:"sqi-micro",style:{marginBottom:8},children:t("meditations.heroMicro")}),e.jsx("h1",{className:"sqi-shimmer-title",children:t("meditations.hallOfStillness")}),e.jsx("p",{style:{fontSize:13,color:"rgba(255,255,255,.42)",marginTop:8,marginBottom:20,lineHeight:1.6},children:t("meditations.heroSubtitle")}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:0},children:[e.jsx(ye,{size:14,style:{color:"rgba(255,255,255,.35)"}}),e.jsx("span",{className:"sqi-micro",style:{marginBottom:0},children:t("meditations.audioLanguageLabel").toUpperCase()}),e.jsx(Y,{language:l,setLanguage:u})]})]}),S&&e.jsx("div",{style:{padding:"0 20px 20px"},children:e.jsxs("div",{className:"glass-card",style:{padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",border:"1px solid rgba(212,175,55,.18)",background:"linear-gradient(135deg, rgba(212,175,55,.06), rgba(212,175,55,.02))"},onClick:()=>B(S,l),children:[e.jsx("div",{style:{position:"relative",flexShrink:0},children:e.jsx("div",{className:"play-btn playing",children:e.jsx(C,{size:14,style:{marginLeft:2}})})}),e.jsxs("div",{style:{flex:1,minWidth:0},children:[e.jsx("div",{style:{fontFamily:"'Cinzel', serif",fontSize:13,fontWeight:500,letterSpacing:".02em",color:"#D4AF37",marginBottom:4,lineHeight:1.35,wordBreak:"break-word",overflowWrap:"anywhere"},children:l==="sv"&&S.title_sv?S.title_sv:S.title}),e.jsxs("div",{style:{fontSize:11,color:"rgba(255,255,255,.35)"},children:[ae," · ",t("meditations.startComfort")]})]}),S.audio_url_sv&&e.jsx("span",{className:"badge-bilingual",children:t("meditations.bilingualBadge")})]})}),e.jsx(Re,{navigate:i}),e.jsx(We,{}),a&&!P&&e.jsx("div",{style:{padding:"0 20px 20px"},children:e.jsxs("div",{onClick:()=>i("/prana-flow"),style:{background:"linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(5,5,5,0.98) 60%)",border:"1px solid rgba(212,175,55,0.25)",borderRadius:24,padding:"24px 22px",cursor:"pointer",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"60%",height:1,background:"linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)"}}),e.jsx("div",{style:{fontWeight:800,fontSize:7,letterSpacing:"0.5em",textTransform:"uppercase",color:"rgba(212,175,55,0.45)",marginBottom:8},children:"◈ Prana–Flow · 19€/mo"}),e.jsx("div",{style:{fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",fontSize:"1.4rem",color:"white",marginBottom:6},children:"Unlock the Full Meditation Library"}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,0.3)",lineHeight:1.6,marginBottom:14},children:"Complete guided meditations · Yoga Nidra · Mantra library · Sacred frequencies"}),e.jsx("div",{style:{display:"inline-flex",alignItems:"center",gap:8,background:"#D4AF37",color:"#050505",borderRadius:100,padding:"10px 22px",fontWeight:800,fontSize:8,letterSpacing:"0.35em",textTransform:"uppercase"},children:"◈ Start Free — 7 Days"})]})}),y.length>0&&e.jsxs("div",{style:{padding:"0 20px 24px"},children:[e.jsx("div",{className:"sqi-micro",style:{marginBottom:8,color:"rgba(212,175,55,.5)"},children:t("meditations.featuredCollections")}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:y.map(o=>e.jsx(ze,{playlist:o,onClick:async()=>{W(o);const c=await N(o.id);I(c||[])}},o.id))})]}),e.jsxs("div",{style:{padding:"0 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{className:"sqi-micro",style:{marginBottom:4},children:t("meditations.sectionMicroLabel")}),e.jsx("div",{style:{fontWeight:800,fontSize:17,letterSpacing:"-0.02em",color:"rgba(255,255,255,.9)"},children:t("meditations.allMeditations")})]}),e.jsx(Y,{language:l,setLanguage:u,compact:!0})]}),e.jsx("div",{style:{padding:"0 20px"},children:ne.map((o,c)=>o.items.length>0&&e.jsx($e,{title:o.title,subtitle:o.subtitle,meditations:o.items,lang:l,currentAudio:m,isPlaying:b,playerProgress:x??0,hasMeditationAccess:P,onPlay:B,onLock:O,defaultOpen:c===0},o.title))}),V&&e.jsx(V,{}),e.jsx("div",{style:{height:100}})]}),m&&m.contentType==="meditation"&&e.jsx(He,{audio:m,isPlaying:b,progress:x??0,onToggle:w})]})};export{st as default};
