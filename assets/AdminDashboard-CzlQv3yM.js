import{i as _,r as h,j as a,L as A}from"./vendor-react-DdWqvjvq.js";import{B as o,s as g}from"./index-DPalQnOV.js";import{C as d}from"./card-DDAEinu4.js";import{f as M}from"./dashboardAggregateStats-MUmxQE5h.js";import{A as C,U as b,az as q,a as l,N as u,c as f,M as k,aA as D,G as E,al as z,o as p,ab as T,aB as F,aC as x,v as H,aD as B,O as L,aE as P,aF as I,W as G,as as U,aG as V,aH as W,aI as O,av as K}from"./vendor-icons-DQ9y02-X.js";import"./vendor-crypto-Cz0s2Wb9.js";import"./vendor-radix-E_JnJsxb.js";import"./vendor-i18n-CLO2ZSBh.js";import"./vendor-query-DDdS-q50.js";import"./vendor-supabase-C8XXFrAR.js";import"./vendor-motion-BWTr00U0.js";const Y=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  .sqi-admin-dash {
    font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
    background: #050505;
    color: rgba(255, 255, 255, 0.92);
    min-height: 100vh;
  }
  .sqi-admin-dash .ad-glass {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 40px;
    box-shadow: 0 0 48px rgba(212, 175, 55, 0.06);
  }
  .sqi-admin-dash .ad-glass:hover {
    border-color: rgba(212, 175, 55, 0.14);
    box-shadow: 0 0 56px rgba(212, 175, 55, 0.1);
  }
  .sqi-admin-dash .ad-kicker {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
  }
  .sqi-admin-dash .ad-h1 {
    font-weight: 900;
    letter-spacing: -0.05em;
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.25);
  }
  .sqi-admin-dash .ad-body {
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.6);
  }
  .sqi-admin-dash .ad-stat-lbl {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.38);
  }
  /* Sealed sigil wells — light contained (no diffuse bleed) */
  .sqi-admin-dash .ad-sigil {
    position: relative;
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 18px;
    padding: 1px;
    isolation: isolate;
    contain: layout style paint;
    background: linear-gradient(155deg, rgba(212, 175, 55, 0.42), rgba(212, 175, 55, 0.06));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.55);
  }
  .sqi-admin-dash .ad-sigil--sm {
    width: 46px;
    height: 46px;
    border-radius: 16px;
  }
  .sqi-admin-dash .ad-sigil--sm .ad-sigil__inner {
    border-radius: 15px;
  }
  .sqi-admin-dash .ad-sigil--cyan {
    background: linear-gradient(155deg, rgba(34, 211, 238, 0.38), rgba(34, 211, 238, 0.05));
  }
  .sqi-admin-dash .ad-sigil__inner {
    width: 100%;
    height: 100%;
    border-radius: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.22);
    background:
      radial-gradient(ellipse 90% 75% at 35% 22%, rgba(212, 175, 55, 0.14), transparent 58%),
      linear-gradient(168deg, rgba(22, 20, 16, 0.99), rgba(5, 5, 5, 1));
  }
  .sqi-admin-dash .ad-sigil--cyan .ad-sigil__inner {
    border-color: rgba(34, 211, 238, 0.28);
    background:
      radial-gradient(ellipse 90% 75% at 35% 22%, rgba(34, 211, 238, 0.12), transparent 58%),
      linear-gradient(168deg, rgba(12, 22, 26, 0.99), rgba(5, 5, 5, 1));
  }
  .sqi-admin-dash .ad-sigil__svg {
    width: 22px;
    height: 22px;
    stroke-width: 1.35px;
    opacity: 0.94;
    color: #D4AF37;
  }
  .sqi-admin-dash .ad-sigil--sm .ad-sigil__svg {
    width: 19px;
    height: 19px;
    stroke-width: 1.45px;
  }
  .sqi-admin-dash .ad-sigil--cyan .ad-sigil__svg {
    color: #22D3EE;
  }
  .sqi-admin-dash .ad-sigil--mini {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    padding: 1px;
  }
  .sqi-admin-dash .ad-sigil--mini .ad-sigil__inner {
    border-radius: 9px;
  }
  .sqi-admin-dash .ad-sigil--mini .ad-sigil__svg {
    width: 14px;
    height: 14px;
    stroke-width: 1.5px;
  }
  .sqi-admin-dash .ad-back-sigil {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    padding: 1px;
    isolation: isolate;
    contain: layout style paint;
    background: linear-gradient(155deg, rgba(212, 175, 55, 0.28), rgba(212, 175, 55, 0.04));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 12px rgba(0, 0, 0, 0.45);
  }
  .sqi-admin-dash .ad-back-sigil__inner {
    width: 100%;
    height: 100%;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.18);
    background: linear-gradient(168deg, rgba(14, 13, 10, 0.98), rgba(5, 5, 5, 1));
  }
  .sqi-admin-dash .ad-back-sigil__svg {
    width: 18px;
    height: 18px;
    stroke-width: 1.4px;
    color: #D4AF37;
    opacity: 0.9;
  }
  .sqi-admin-dash .ad-btn-outline {
    border-radius: 40px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.85);
  }
  .sqi-admin-dash .ad-btn-outline:hover {
    border-color: rgba(212, 175, 55, 0.35);
    color: #D4AF37;
    background: rgba(212, 175, 55, 0.06);
  }
`;function e({icon:s,variant:r="gold",size:t="md"}){const i=["ad-sigil",r==="cyan"?"ad-sigil--cyan":"",t==="sm"?"ad-sigil--sm":"",t==="mini"?"ad-sigil--mini":""].filter(Boolean).join(" "),n=t==="mini"?1.5:t==="sm"?1.4:1.35;return a.jsx("div",{className:i,"aria-hidden":!0,children:a.jsx("div",{className:"ad-sigil__inner",children:a.jsx(s,{className:"ad-sigil__svg",strokeWidth:n})})})}const J=[{title:"User Management",description:"View, edit, ban, delete users and manage membership tiers",icon:D,href:"/admin/users",color:"text-amber-500"},{title:"Grant Access",description:"Give users free access to courses, membership, Sri Yantra, Creative Soul & more",icon:E,href:"/admin/grant-access",color:"text-amber-500"},{title:"Announcements",description:"Send notices and updates to all users",icon:z,href:"/admin/announcements",color:"text-yellow-500"},{title:"Site Content",description:"Edit text, titles, and descriptions throughout the app",icon:u,href:"/admin/content",color:"text-blue-500"},{title:"Courses",description:"Create and manage courses with lessons & certificates",icon:p,href:"/admin/courses",color:"text-orange-500"},{title:"Income Streams",description:"Share money-making opportunities with users",icon:T,href:"/admin/income-streams",color:"text-green-500"},{title:"YouTube Channels",description:"Manage channels for Spiritual Education videos",icon:F,href:"/admin/youtube",color:"text-red-500"},{title:"Meditations",description:"Upload and manage meditation audio files",icon:f,href:"/admin/meditations",color:"text-purple-500"},{title:"Healing Audio",description:"Manage healing space audio content",icon:l,href:"/admin/healing",color:"text-pink-500"},{title:"Music Store",description:"Upload and manage music tracks for sale",icon:k,href:"/admin/music",color:"text-emerald-500"},{title:"Divine Transmissions",description:"Manage Explore Akasha audio talks, oracle teachings & series",icon:x,href:"/admin/divine-transmissions",color:"text-violet-500"},{title:"Mantras",description:"Manage sacred mantras for users to earn 111 SHC",icon:H,href:"/admin/mantras",color:"text-amber-500"},{title:"Shop Products",description:"Manage Laila's clothing and art for sale",icon:B,href:"/admin/shop",color:"text-pink-500"},{title:"Private Sessions",description:"Manage session types, packages, and Calendly links",icon:b,href:"/admin/private-sessions",color:"text-indigo-500"},{title:"Transformation Program",description:"Manage program details, variations, and pricing",icon:l,href:"/admin/transformation",color:"text-amber-500"},{title:"Email List",description:"Manage subscribers and send bulk emails",icon:L,href:"/admin/email-list",color:"text-cyan-500"},{title:"Email Automation",description:"Weekly digest, Lakshmi Friday, welcome flows & send logs",icon:P,href:"/admin/email-automation",color:"text-amber-400"},{title:"Admin System",description:"Manage projects, tasks, content, events & settings",icon:I,href:"/admin/system",color:"text-violet-500"},{title:"Breathing Exercises",description:"Manage breathing patterns and exercises",icon:G,href:"/admin/breathing",color:"text-cyan-500"},{title:"Ambient Sounds",description:"Manage background audio loops for meditation",icon:U,href:"/admin/ambient-sounds",color:"text-teal-500"},{title:"Affirmation Soundtrack",description:"Manage content and pricing for affirmation page",icon:x,href:"/admin/affirmation",color:"text-purple-500"},{title:"Analytics & KPIs",description:"View conversion, retention, ARPU and churn metrics",icon:V,href:"/admin/analytics",color:"text-emerald-500"},{title:"Spiritual Paths",description:"Manage daily content for all 114 spiritual path days",icon:W,href:"/admin/paths",color:"text-teal-500"},{title:"Sacred Circles",description:"Manage chat rooms, moderation, and community circles",icon:O,href:"/admin/circles",color:"text-pink-500"},{title:"Vedic Translation Tool",description:"Bhagavad Gita, Guru Gita & Bhagavatam – devotional Swedish translations",icon:K,href:"/admin/vedic-translation",color:"text-amber-500"},{title:"Scriptural Books",description:"Automated book creation from audio with Sanskrit verse detection",icon:p,href:"/admin/books",color:"text-purple-500"}],ra=()=>{const s=_(),[r,t]=h.useState({members:0,activeThisMonth:0,totalSHC:0});return h.useEffect(()=>{(async()=>{const n=await M();if(n){t({members:n.total_profiles,activeThisMonth:n.active_this_month,totalSHC:Number(n.total_shc_distributed)||0});return}const{count:v}=await g.from("profiles").select("*",{count:"exact",head:!0}),c=new Date;c.setDate(1),c.setHours(0,0,0,0);const{data:j}=await g.from("shc_transactions").select("user_id").gte("created_at",c.toISOString()),w=new Set(j?.map(m=>m.user_id)||[]),{data:y}=await g.from("user_balances").select("total_earned"),S=y?.reduce((m,N)=>m+Number(N.total_earned),0)||0;t({members:v||0,activeThisMonth:w.size,totalSHC:S})})()},[]),a.jsxs(a.Fragment,{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:Y}}),a.jsx("div",{className:"sqi-admin-dash pb-28 px-4 pt-6 sm:px-6",children:a.jsxs("div",{className:"max-w-4xl mx-auto space-y-6",children:[a.jsxs("div",{className:"flex items-center gap-3 sm:gap-4",children:[a.jsx(o,{variant:"ghost",size:"icon",onClick:()=>s("/profile"),className:"h-auto w-auto p-0 shrink-0 rounded-[14px] border-0 bg-transparent hover:bg-transparent text-[#D4AF37] shadow-none","aria-label":"Back to profile",children:a.jsx("div",{className:"ad-back-sigil",children:a.jsx("div",{className:"ad-back-sigil__inner",children:a.jsx(C,{className:"ad-back-sigil__svg",strokeWidth:1.4})})})}),a.jsxs("div",{className:"min-w-0",children:[a.jsx("p",{className:"ad-kicker mb-1",children:"NADA · ADMIN NEXUS"}),a.jsx("h1",{className:"ad-h1 text-xl sm:text-2xl",children:"Admin Dashboard"}),a.jsx("p",{className:"ad-body text-sm mt-1",children:"Manage all your app content — Vedic Light-Codes & Bhakti-Algorithms"})]})]}),a.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4",children:[a.jsxs(d,{className:"ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 text-center",children:[a.jsx("div",{className:"mx-auto mb-3 flex justify-center",children:a.jsx(e,{icon:b,variant:"gold",size:"sm"})}),a.jsx("p",{className:"text-2xl font-black tracking-tight text-[#D4AF37] tabular-nums",children:r.members.toLocaleString()}),a.jsx("p",{className:"ad-stat-lbl mt-2",children:"Total Members"})]}),a.jsxs(d,{className:"ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 text-center",children:[a.jsx("div",{className:"mx-auto mb-3 flex justify-center",children:a.jsx(e,{icon:q,variant:"cyan",size:"sm"})}),a.jsx("p",{className:"text-2xl font-black tracking-tight text-[#22D3EE] tabular-nums",children:r.activeThisMonth.toLocaleString()}),a.jsx("p",{className:"ad-stat-lbl mt-2",children:"Active This Month"})]}),a.jsxs(d,{className:"ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 text-center",children:[a.jsx("div",{className:"mx-auto mb-3 flex justify-center",children:a.jsx(e,{icon:l,variant:"gold",size:"sm"})}),a.jsxs("p",{className:"text-2xl font-black tracking-tight text-[#D4AF37] tabular-nums",children:[(r.totalSHC/1e3).toFixed(1),"K"]}),a.jsx("p",{className:"ad-stat-lbl mt-2",children:"SHC Distributed"})]})]}),a.jsx("div",{className:"grid gap-3 md:gap-4 md:grid-cols-2",children:J.map(i=>a.jsx(A,{to:i.href,children:a.jsx(d,{className:"ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6 cursor-pointer h-full transition-transform hover:scale-[1.01]",children:a.jsxs("div",{className:"flex items-start gap-4",children:[a.jsx(e,{icon:i.icon,variant:"gold",size:"md"}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("h3",{className:"font-black tracking-tight text-[15px] sm:text-base text-[#D4AF37]",style:{textShadow:"0 0 12px rgba(212,175,55,0.2)"},children:i.title}),a.jsx("p",{className:"ad-body text-sm mt-1.5",children:i.description})]})]})})},i.href))}),a.jsxs(d,{className:"ad-glass border-0 shadow-none bg-transparent p-5 sm:p-6",children:[a.jsx("h2",{className:"ad-kicker mb-4 block",children:"Quick Actions"}),a.jsxs("div",{className:"flex flex-wrap gap-2",children:[a.jsxs(o,{variant:"outline",size:"sm",onClick:()=>s("/admin/content"),className:"ad-btn-outline rounded-[40px] border-0 gap-2",children:[a.jsx(e,{icon:u,size:"mini"}),"Edit Healing Page"]}),a.jsxs(o,{variant:"outline",size:"sm",onClick:()=>s("/admin/meditations"),className:"ad-btn-outline rounded-[40px] border-0 gap-2",children:[a.jsx(e,{icon:f,size:"mini"}),"Add Meditation"]}),a.jsxs(o,{variant:"outline",size:"sm",onClick:()=>s("/admin/healing"),className:"ad-btn-outline rounded-[40px] border-0 gap-2",children:[a.jsx(e,{icon:l,size:"mini"}),"Add Healing Audio"]}),a.jsxs(o,{variant:"outline",size:"sm",onClick:()=>s("/admin/music"),className:"ad-btn-outline rounded-[40px] border-0 gap-2",children:[a.jsx(e,{icon:k,size:"mini"}),"Add Music Track"]})]})]})]})})]})};export{ra as default};
