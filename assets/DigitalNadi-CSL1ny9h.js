import{r as o,j as e,g as ye,N as ce}from"./vendor-react--OR-uH7S.js";import{n as ve,s as ee,u as je,a as we,h as Se,F as ke}from"./index-RRXEvQfm.js";import{u as _e}from"./useAdminRole-CCeebBaS.js";import{A as pe,m as ie}from"./vendor-motion-Dm4zQNot.js";import{W as he,a as fe,P as ne,c as re,d as Ne,aq as Ce,aX as Re,R as oe,h as Pe,E as xe,O as Te,g as de,cj as ue}from"./vendor-icons-CZmAPI07.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-i18n-BS5B6gzd.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";const Ae=({bpm:i})=>{const[t,r]=o.useState("inhale"),[l,s]=o.useState(0),a=4,c=2,n=i&&i>80?6:4;return o.useEffect(()=>{let u;const d=()=>{r("inhale"),u=setTimeout(()=>{r("hold"),u=setTimeout(()=>{r("exhale"),u=setTimeout(()=>{s(h=>h+1),d()},n*1e3)},c*1e3)},a*1e3)};return d(),()=>clearTimeout(u)},[n]),e.jsxs("div",{className:"flex flex-col items-center gap-12 p-8 rounded-[32px] border border-white/10 bg-white/[0.02] max-w-md w-full mx-auto overflow-hidden backdrop-blur-xl",children:[e.jsxs("div",{className:"relative flex items-center justify-center w-64 h-64",children:[e.jsx(pe,{mode:"wait",children:e.jsx(ie.div,{initial:{scale:t==="inhale"?.6:1.2,opacity:.3},animate:{scale:t==="inhale"||t==="hold"?1.2:.6,opacity:t==="hold"?.8:.5},transition:{duration:t==="inhale"?a:t==="hold"?c:n,ease:"easeInOut"},className:"absolute w-full h-full rounded-full bg-gradient-to-br from-[#FF6B4A]/40 to-[#5AE4A8]/40 blur-xl"},t)}),e.jsxs(ie.div,{animate:{scale:t==="inhale"||t==="hold"?1.1:.7},transition:{duration:t==="inhale"?a:t==="hold"?c:n,ease:"easeInOut"},className:"relative z-10 w-48 h-48 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm",children:[e.jsx(he,{className:"text-white/40 mb-2",size:32}),e.jsx("span",{className:"text-2xl font-serif font-light tracking-widest uppercase text-white/90",children:t})]}),e.jsx("div",{className:"absolute w-full h-full rounded-full border border-white/5 animate-[spin_20s_linear_infinite]",style:{animation:"spin 20s linear infinite"}}),e.jsx("div",{className:"absolute w-[110%] h-[110%] rounded-full border border-white/5",style:{animation:"spin 30s linear infinite reverse"}})]}),e.jsxs("div",{className:"text-center space-y-2",children:[e.jsx("h3",{className:"text-xl font-serif italic text-white/80",children:i&&i>80?"Calming the Nadi…":"Balanced Flow"}),e.jsxs("p",{className:"text-sm text-white/40 font-light max-w-[240px]",children:[t==="inhale"&&"Draw in the life force (Prana)",t==="hold"&&"Let the energy settle",t==="exhale"&&"Release all tension and doubt"]})]}),e.jsx("div",{className:"flex gap-2",children:[...Array(5)].map((u,d)=>e.jsx("div",{className:`w-2 h-2 rounded-full transition-colors duration-500 ${d<l%6?"bg-[#FF6B4A]":"bg-white/10"}`},d))})]})},ge=[{title:"The Silent Witness",subtitle:"Grounding & Presence",lyrics:["I am not the body.","I am not even the mind.","I am the silent witness of all that arises.","Peace is my natural state."],color:"from-stone-900 to-orange-950"},{title:"Ocean of Calm",subtitle:"Stress Release",lyrics:["Every breath is a wave.","The ocean is deep and still.","The surface may ripple,","But the depths remain untouched."],color:"from-blue-900 to-emerald-950"}],Be=({bpm:i,hrv:t})=>{const[r,l]=o.useState(!1),[s,a]=o.useState(0),[c,n]=o.useState(0),u=ge[s];return o.useEffect(()=>{if(!r)return;const d=setInterval(()=>{n(h=>(h+1)%u.lyrics.length)},5e3);return()=>clearInterval(d)},[r,u.lyrics.length]),o.useEffect(()=>{i&&i>90&&s!==1?(a(1),n(0)):i&&i<=75&&s!==0&&(a(0),n(0))},[i,s]),e.jsxs("div",{className:`flex flex-col p-8 rounded-[32px] border border-white/10 overflow-hidden relative min-h-[400px] transition-all duration-1000 bg-gradient-to-br ${u.color}`,children:[e.jsx("div",{className:"absolute inset-0 opacity-20 pointer-events-none",children:e.jsx("div",{className:"absolute top-0 left-0 w-full h-full mix-blend-overlay",style:{backgroundImage:"url('https://www.transparenttextures.com/patterns/carbon-fibre.png')"}})}),e.jsxs("div",{className:"relative z-10 flex flex-col h-full",children:[e.jsxs("div",{className:"flex justify-between items-start mb-12",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1 block",children:"Current Session"}),e.jsx("h2",{className:"text-3xl font-serif italic text-white",children:u.title}),e.jsx("p",{className:"text-sm text-white/40 font-light",children:u.subtitle})]}),e.jsx("div",{className:"p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10",children:e.jsx(fe,{size:20,className:"text-[#FF6B4A]"})})]}),e.jsxs("div",{className:"flex-grow flex flex-col justify-center items-center text-center space-y-6 py-12",children:[e.jsx(pe,{mode:"wait",children:e.jsx(ie.p,{initial:{y:20,opacity:0},animate:{y:0,opacity:1},exit:{y:-20,opacity:0},transition:{duration:1.5,ease:"easeOut"},className:"text-2xl font-serif italic text-white/90 leading-relaxed max-w-xs",children:u.lyrics[c]},`${s}-${c}`)}),e.jsx("div",{className:"flex gap-1",children:u.lyrics.map((d,h)=>e.jsx("div",{className:`h-0.5 transition-all duration-1000 ${h===c?"w-8 bg-white":"w-2 bg-white/20"}`},h))})]}),e.jsxs("div",{className:"mt-auto pt-8 border-t border-white/5 flex flex-col gap-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("button",{onClick:()=>l(!r),className:"w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform",children:r?e.jsx(ne,{fill:"currentColor"}):e.jsx(re,{fill:"currentColor",className:"ml-1"})}),e.jsx("button",{onClick:()=>{a(d=>(d+1)%ge.length),n(0)},className:"text-white/40 hover:text-white transition-colors",children:e.jsx(Ne,{size:24})})]}),e.jsxs("div",{className:"flex items-center gap-2 text-white/40",children:[e.jsx(Ce,{size:18}),e.jsx("div",{className:"w-24 h-1 bg-white/10 rounded-full overflow-hidden",children:e.jsx("div",{className:"w-2/3 h-full bg-white/40"})})]})]}),i&&e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/5 self-start",children:[e.jsx("div",{className:"w-2 h-2 rounded-full bg-[#FF6B4A] animate-pulse"}),e.jsxs("span",{className:"text-[10px] uppercase tracking-widest text-white/60",children:["Resonating with your Nadi: ",i," BPM"]})]})]})]})]})};function ze(i,t,r){const l=t>60,s=t>35;return{meditation:{limit:3,meditationCategories:l?["Healing","Relaxation","Stress","Sleep","Yoga Nidra"]:s?["Mindfulness","Healing","Relaxation","Breathing"]:["Manifestation","Spiritual","Chakra","Mindfulness"],sectionLabel:"Dhyāna · Meditation",sectionReason:l?"Deep rest for your nervous system":s?"Balance and centre your mind":"Deepen your stillness",color:"#B084FF",icon:"◎"},mantra:{limit:3,mantraCategories:i==="Pitta"?["Cooling","Peace","Shiva","Moon"]:i==="Kapha"?["Energising","Fire","Sun","Activation"]:i==="Vāta"?["Grounding","Earth","Root","Stability"]:["Universal","OM","Heart","Love"],sectionLabel:"Mantra · Sacred Sound",sectionReason:i==="Pitta"?"Cooling vibrations to pacify inner fire":i==="Kapha"?"Activating frequencies to awaken your fire":i==="Vāta"?"Grounding tones to anchor scattered energy":"Harmonising vibrations for your natural state",color:"#FFB84A",icon:"ॐ"},healing:{limit:3,healingCategories:l?["Stress","Anxiety","Nervous System","Relaxation","432Hz","Sleep"]:i==="Pitta"?["Cooling","Heart","Anti-inflammatory","Peace"]:i==="Kapha"?["Energy","Motivation","Lymphatic","Activation"]:i==="Vāta"?["Grounding","Nervous System","Root","Stability"]:["Balance","Chakra","DNA","Frequency"],sectionLabel:"Healing Audio · Scalar Waves",sectionReason:l?"Restore your bioenergetic field":"Fine-tune your frequency today",color:"#5AE4A8",icon:"∿"},music:{limit:3,musicMoods:l?["calm","peaceful","soothing","relaxing"]:s?["uplifting","balanced","meditative"]:["joyful","devotional","blissful","uplifting"],musicEnergyLevels:l?["low","gentle"]:s?["medium","gentle"]:["medium","high"],musicBestTime:Fe(),sectionLabel:"Sacred Music · Nāda Yoga",sectionReason:"Resonant frequencies aligned to your pulse",color:"#FF6B4A",icon:"♪"}}}function Fe(){const i=new Date().getHours();return i<5?"night":i<10?"morning":i<14?"midday":i<18?"afternoon":i<21?"evening":"night"}function Me(i){if(!i)return"—";const t=Math.floor(i/60),r=Math.floor(i%60);return t>0?`${t}m${r>0?` ${r}s`:""}`:`${r}s`}async function qe(i,t){try{const{data:r,error:l}=await ee.from("meditations").select("id, title, description, cover_image_url, duration_minutes, audio_url, shc_reward, category, language").eq("language","en").limit(t*4);if(l||!r)return[];const s=r.map(a=>{const c=(a.category||"").toLowerCase(),n=i.some(u=>c.includes(u.toLowerCase()))?2:1;return{...a,_score:n}});return s.sort((a,c)=>c._score-a._score),s.slice(0,t).map(a=>({id:a.id,title:a.title,description:a.description,cover_image_url:a.cover_image_url,duration_seconds:(a.duration_minutes||0)*60,audio_url:a.audio_url,shc_reward:a.shc_reward||0,category:"meditation"}))}catch{return[]}}async function Ee(i,t){try{const{data:r,error:l}=await ee.from("mantras").select("id, title, description, cover_image_url, duration_seconds, audio_url, shc_reward, category, is_active").eq("is_active",!0).limit(t*4);if(l||!r)return[];const s=r.map(a=>{const c=(a.category||"").toLowerCase(),n=i.some(u=>c.includes(u.toLowerCase()))?2:1;return{...a,_score:n}});return s.sort((a,c)=>c._score-a._score),s.slice(0,t).map(a=>({id:a.id,title:a.title,description:a.description,cover_image_url:a.cover_image_url,duration_seconds:a.duration_seconds||0,audio_url:a.audio_url,shc_reward:a.shc_reward||0,category:"mantra"}))}catch{return[]}}async function Ie(i,t){try{const{data:r,error:l}=await ee.from("healing_audio").select("id, title, description, cover_image_url, duration_seconds, audio_url, price_shc, category, tags, is_free").limit(t*4);if(l||!r)return[];const s=r.map(a=>{const c=(a.category||"").toLowerCase(),n=(a.tags||[]).map(m=>m.toLowerCase()),u=i.some(m=>c.includes(m.toLowerCase())),d=i.some(m=>n.some(p=>p.includes(m.toLowerCase())));return{...a,_score:u?3:d?2:1}});return s.sort((a,c)=>c._score-a._score),s.slice(0,t).map(a=>({id:a.id,title:a.title,description:a.description,cover_image_url:a.cover_image_url,duration_seconds:a.duration_seconds||0,audio_url:a.audio_url,shc_reward:a.price_shc||0,category:"healing"}))}catch{return[]}}async function Le(i,t,r,l){try{const{data:s,error:a}=await ee.from("music_tracks").select("id, title, artist, description, cover_image_url, duration_seconds, full_audio_url, preview_url, shc_reward, genre, bpm, mood, energy_level, best_time_of_day, spiritual_path, price_usd, play_count, release_date, created_at, affirmation, creator_notes, spiritual_description, auto_generated_description, auto_generated_affirmation, analysis_status, intended_use, rhythm_type, vocal_type, frequency_band, auto_analysis_data").limit(l*4);if(a||!s)return[];const c=s.map(n=>{const u=(n.mood||"").toLowerCase(),d=(n.energy_level||"").toLowerCase(),h=(n.best_time_of_day||"").toLowerCase(),m=i.some(R=>u.includes(R))?3:0,p=t.some(R=>d.includes(R))?2:0,x=h.includes(r)?2:0;return{...n,_score:m+p+x}});return c.sort((n,u)=>u._score-n._score),c.slice(0,l).map(n=>({id:n.id,title:n.title,description:n.description||n.spiritual_description||n.auto_generated_description,cover_image_url:n.cover_image_url,duration_seconds:n.duration_seconds||0,audio_url:n.full_audio_url,shc_reward:n.shc_reward||0,category:"music",artist:n.artist,full_audio_url:n.full_audio_url,preview_url:n.preview_url,genre:n.genre,bpm:n.bpm,mood:n.mood,energy_level:n.energy_level,best_time_of_day:n.best_time_of_day,spiritual_path:n.spiritual_path,_rawTrack:n}))}catch{return[]}}const me=({track:i,color:t,isPlaying:r,isCurrentTrack:l,onPlay:s,onNavigate:a,navigatePath:c})=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:l?`${t}0f`:"rgba(255,255,255,0.015)",border:`1px solid ${l?t+"30":"rgba(255,255,255,0.05)"}`,borderRadius:16,cursor:"pointer",transition:"all 0.25s ease",position:"relative",overflow:"hidden"},children:[l&&e.jsx("div",{style:{position:"absolute",left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg, ${t}88, ${t}22)`,borderRadius:"3px 0 0 3px"}}),e.jsxs("div",{style:{width:46,height:46,borderRadius:10,flexShrink:0,background:`${t}18`,border:`1px solid ${t}25`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"},onClick:s,children:[i.cover_image_url?e.jsx("img",{src:i.cover_image_url,alt:i.title,style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}):e.jsx("span",{style:{fontSize:18,color:t},children:i.category==="meditation"?"◎":i.category==="mantra"?"ॐ":i.category==="healing"?"∿":"♪"}),e.jsx("div",{style:{position:"absolute",inset:0,borderRadius:10,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",opacity:l?1:0,transition:"opacity 0.2s"},className:"track-play-overlay",children:r&&l?e.jsx(ne,{size:16,color:"#fff",fill:"#fff"}):e.jsx(re,{size:16,color:"#fff",fill:"#fff",style:{marginLeft:2}})})]}),e.jsxs("div",{style:{flex:1,minWidth:0},onClick:s,children:[e.jsx("p",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontWeight:700,fontSize:13,color:l?"#fff":"rgba(255,255,255,0.85)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:i.title}),i.artist&&e.jsx("p",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:11,color:"rgba(255,255,255,0.35)",margin:"2px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:i.artist}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginTop:4},children:[e.jsx(Te,{size:10,color:t,style:{opacity:.6}}),e.jsx("span",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase"},children:Me(i.duration_seconds)}),l&&r&&e.jsx("span",{style:{display:"flex",gap:2,alignItems:"flex-end",height:12},children:[1,2,3].map(n=>e.jsx("span",{style:{width:2,borderRadius:1,background:t,height:`${6+n*2}px`,animation:`nadi-bar-${n} 0.6s ease-in-out ${n*.1}s infinite alternate`,display:"inline-block"}},n))})]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:8,alignItems:"center",flexShrink:0},children:[e.jsx("button",{onClick:s,style:{width:34,height:34,borderRadius:"50%",background:l?t:`${t}18`,border:`1px solid ${t}40`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"},children:r&&l?e.jsx(ne,{size:13,color:l?"#050505":t,fill:l?"#050505":t}):e.jsx(re,{size:13,color:l?"#050505":t,fill:l?"#050505":t,style:{marginLeft:2}})}),e.jsx("button",{onClick:a,title:`Open in ${c.replace("/","")}`,style:{width:24,height:24,borderRadius:"50%",background:"transparent",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},children:e.jsx(xe,{size:10,color:"rgba(255,255,255,0.3)"})})]})]}),De=({icon:i,label:t,reason:r,color:l,tracks:s,loading:a,currentAudioId:c,isPlaying:n,onPlay:u,navigatePath:d,onNavigate:h})=>{const[m,p]=o.useState(!1);return e.jsxs("div",{style:{padding:"18px 20px",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:24,marginBottom:12},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:m||a?16:0,cursor:"pointer"},onClick:()=>p(x=>!x),children:[e.jsx("span",{style:{fontSize:20,color:l,filter:`drop-shadow(0 0 8px ${l}66)`},children:i}),e.jsxs("div",{style:{flex:1},children:[e.jsx("p",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:9,fontWeight:800,letterSpacing:"0.35em",textTransform:"uppercase",color:l+"cc",margin:0,marginBottom:2},children:t}),e.jsx("p",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:12,fontWeight:400,lineHeight:1.5,color:"rgba(255,255,255,0.45)",margin:0},children:r})]}),e.jsx("div",{style:{fontSize:11,color:"rgba(255,255,255,0.25)",transform:m?"rotate(180deg)":"none",transition:"transform 0.3s"},children:"▾"})]}),a?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"8px 0"},children:[e.jsx(Pe,{size:14,color:l,style:{animation:"spin 1s linear infinite"}}),e.jsx("span",{style:{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"'Plus Jakarta Sans', sans-serif"},children:"Scanning Akasha Archive…"})]}):s.length===0?e.jsx("p",{style:{fontSize:12,color:"rgba(255,255,255,0.2)",fontFamily:"'Plus Jakarta Sans', sans-serif",margin:0},children:"No transmissions found — more content arriving soon."}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:8},children:[e.jsx(me,{track:s[0],color:l,isCurrentTrack:c===s[0].id,isPlaying:n&&c===s[0].id,onPlay:()=>u(s[0]),onNavigate:()=>h(d),navigatePath:d}),s.length>1&&!m&&e.jsxs("button",{onClick:()=>p(!0),style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:10,fontWeight:800,letterSpacing:"0.25em",textTransform:"uppercase",color:l+"88",background:"none",border:"none",cursor:"pointer",padding:"4px 0",textAlign:"left"},children:["+ ",s.length-1," more transmissions"]}),m&&s.slice(1).map(x=>e.jsx(me,{track:x,color:l,isCurrentTrack:c===x.id,isPlaying:n&&c===x.id,onPlay:()=>u(x),onNavigate:()=>h(d),navigatePath:d},x.id)),e.jsxs("button",{onClick:()=>h(d),style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:10,fontWeight:800,letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer",padding:"4px 0",textAlign:"left",display:"flex",alignItems:"center",gap:4,marginTop:2},children:[e.jsx(xe,{size:10})," Open full ",d.replace("/","")," library"]})]})]})},He=({bpm:i,hrv:t,dosha:r,stress:l})=>{const{playUniversalAudio:s,playTrack:a,currentAudio:c,currentTrack:n,isPlaying:u,stopTrack:d}=ve(),h=ye(),[m,p]=o.useState([]),[x,R]=o.useState([]),[N,H]=o.useState([]),[v,F]=o.useState([]),[k,j]=o.useState(!0),[S,T]=o.useState(!0),[w,M]=o.useState(!0),[E,B]=o.useState(!0),g=o.useMemo(()=>ze(r,l),[r,l,i]),O=o.useCallback(async()=>{j(!0),T(!0),M(!0),B(!0);const[y,L,I,V]=await Promise.all([qe(g.meditation.meditationCategories,g.meditation.limit),Ee(g.mantra.mantraCategories,g.mantra.limit),Ie(g.healing.healingCategories,g.healing.limit),Le(g.music.musicMoods,g.music.musicEnergyLevels,g.music.musicBestTime,g.music.limit)]);p(y),j(!1),R(L),T(!1),H(I),M(!1),F(V),B(!1)},[g]);o.useEffect(()=>{O()},[O]);const te=c?.id||n?.id||null,C=o.useCallback(y=>{if(y.category==="music"&&y._rawTrack)a(y._rawTrack);else{const L=y.category==="meditation"?"meditation":y.category==="healing"?"healing":"meditation",I={id:y.id,title:y.title,artist:y.artist||"Sacred Healing",audio_url:y.audio_url,preview_url:null,cover_image_url:y.cover_image_url,duration_seconds:y.duration_seconds,shc_reward:y.shc_reward,contentType:L,originalData:y};s(I)}},[a,s]),Y=o.useCallback(y=>{h(y)},[h]),ae=r==="Pitta"?[{key:"mantra",tracks:x,loading:S,navigatePath:"/mantras"},{key:"healing",tracks:N,loading:w,navigatePath:"/healing"},{key:"meditation",tracks:m,loading:k,navigatePath:"/meditations"},{key:"music",tracks:v,loading:E,navigatePath:"/music"}]:r==="Kapha"?[{key:"music",tracks:v,loading:E,navigatePath:"/music"},{key:"mantra",tracks:x,loading:S,navigatePath:"/mantras"},{key:"healing",tracks:N,loading:w,navigatePath:"/healing"},{key:"meditation",tracks:m,loading:k,navigatePath:"/meditations"}]:l>60?[{key:"healing",tracks:N,loading:w,navigatePath:"/healing"},{key:"meditation",tracks:m,loading:k,navigatePath:"/meditations"},{key:"mantra",tracks:x,loading:S,navigatePath:"/mantras"},{key:"music",tracks:v,loading:E,navigatePath:"/music"}]:[{key:"meditation",tracks:m,loading:k,navigatePath:"/meditations"},{key:"mantra",tracks:x,loading:S,navigatePath:"/mantras"},{key:"healing",tracks:N,loading:w,navigatePath:"/healing"},{key:"music",tracks:v,loading:E,navigatePath:"/music"}];return e.jsxs("div",{style:{position:"relative"},children:[e.jsx("style",{children:`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes nadi-bar-1 { from { height: 4px; } to { height: 10px; } }
        @keyframes nadi-bar-2 { from { height: 7px; } to { height: 14px; } }
        @keyframes nadi-bar-3 { from { height: 3px; } to { height: 8px; } }
        .track-play-overlay { opacity: 0 !important; }
        div:hover > .track-play-overlay { opacity: 1 !important; }
      `}),e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},children:[e.jsxs("div",{children:[e.jsx("p",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:9,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase",color:"rgba(212,175,55,0.5)",margin:0,marginBottom:4},children:"Akasha-Neural Recommendations"}),e.jsx("p",{style:{fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:13,color:"rgba(255,255,255,0.55)",margin:0,lineHeight:1.5},children:"Curated from your live Nāḍī reading"})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[(c||n)&&e.jsxs("button",{type:"button",onClick:()=>d(),style:{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:999,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",cursor:"pointer",fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:9,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(248,113,113,0.95)"},title:"Stop playback and clear the player",children:[e.jsx(Re,{size:10,fill:"currentColor"}),"Stop"]}),e.jsx("button",{type:"button",onClick:O,style:{width:32,height:32,borderRadius:"50%",background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.15)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},title:"Refresh recommendations",children:e.jsx(oe,{size:13,color:"rgba(212,175,55,0.5)"})})]})]}),ae.map(({key:y,tracks:L,loading:I,navigatePath:V})=>{const W=g[y];return e.jsx(De,{icon:W.icon,label:W.sectionLabel,reason:W.sectionReason,color:W.color,tracks:L,loading:I,currentAudioId:te,isPlaying:u,onPlay:C,navigatePath:V,onNavigate:Y},y)})]})},K=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

  :root {
    --siddha-gold: #D4AF37;
    --akasha-black: #050505;
    --glass-base: rgba(255,255,255,0.02);
    --glass-border: rgba(255,255,255,0.05);
    --vayu-cyan: #22D3EE;
    --coral: #FF6B4A;
    --amber: #FFB84A;
    --sage: #5AE4A8;
    --violet: #B084FF;
  }

  .sqi-page {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #050505;
    color: #fff;
    min-height: 100vh;
    /* App BottomNav + inner SQI pill + safe area — avoid clipped controls */
    padding-bottom: calc(10.5rem + env(safe-area-inset-bottom, 0px));
    position: relative;
    overflow-x: hidden;
  }

  .sqi-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% -10%, rgba(212,175,55,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(34,211,238,0.03) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .glass-card {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 40px;
  }

  .glass-card-sharp {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
  }

  .gold-glow {
    text-shadow: 0 0 20px rgba(212,175,55,0.4);
    color: #D4AF37;
  }

  .gold-border {
    border: 1px solid rgba(212,175,55,0.2);
    box-shadow: 0 0 20px rgba(212,175,55,0.05), inset 0 0 20px rgba(212,175,55,0.02);
  }

  .sqi-label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 8px;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
  }

  .sqi-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900;
    letter-spacing: -0.05em;
  }

  .sqi-body {
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255,255,255,0.6);
  }

  .btn-gold {
    padding: 14px 36px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 9999px;
    color: #D4AF37;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(212,175,55,0.05);
  }
  .btn-gold:hover {
    background: rgba(212,175,55,0.15);
    box-shadow: 0 0 30px rgba(212,175,55,0.15);
    border-color: rgba(212,175,55,0.5);
  }

  .btn-ghost {
    padding: 12px 28px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9999px;
    color: rgba(255,255,255,0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-ghost:hover {
    border-color: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
  }

  .btn-gold-outline {
    padding: 12px 28px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 9999px;
    color: #D4AF37;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-gold-outline:hover {
    background: rgba(212,175,55,0.14);
    box-shadow: 0 0 20px rgba(212,175,55,0.1);
  }

  /* Pulse ring animation for scan state */
  @keyframes sqi-pulse-ring {
    0% { transform: scale(0.92); opacity: 0.8; }
    50% { transform: scale(1.08); opacity: 0.3; }
    100% { transform: scale(0.92); opacity: 0.8; }
  }

  @keyframes sqi-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes sqi-orbit-rev {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }

  @keyframes sqi-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes sqi-waveform {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  @keyframes tap-ripple {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .animate-fade-in {
    animation: sqi-fade-in 0.5s ease both;
  }

  .nadi-pulse-ring {
    animation: sqi-pulse-ring 3s ease-in-out infinite;
  }

  .nadi-orbit {
    animation: sqi-orbit 25s linear infinite;
  }

  .nadi-orbit-rev {
    animation: sqi-orbit-rev 18s linear infinite;
  }

  /* Nav — above AppLayout BottomNav (z-50), clear home-indicator safe area */
  .sqi-nav {
    position: fixed;
    bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    z-index: 60;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border-radius: 9999px;
    background: rgba(5,5,5,0.7);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.04);
  }

  .sqi-nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: 9999px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s ease;
    border: none;
  }

  .sqi-nav-btn.active {
    background: rgba(212,175,55,0.12);
    color: #D4AF37;
    box-shadow: 0 0 16px rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.2);
  }

  .sqi-nav-btn.inactive {
    background: transparent;
    color: rgba(255,255,255,0.3);
    border: 1px solid transparent;
  }

  .sqi-nav-btn.inactive:hover {
    color: rgba(255,255,255,0.6);
  }

  /* Dosha badge */
  .dosha-badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 9999px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  /* Tap BPM button */
  .tap-zone {
    position: relative;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(212,175,55,0.05);
    border: 1px solid rgba(212,175,55,0.25);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
    overflow: hidden;
    margin: 0 auto;
  }
  .tap-zone:active {
    transform: scale(0.95);
    background: rgba(212,175,55,0.1);
  }
  .tap-zone .ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(212,175,55,0.15);
    animation: tap-ripple 0.6s ease-out forwards;
    pointer-events: none;
  }

  /* Vital stats display */
  .vital-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .vital-number {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 300;
    font-size: 48px;
    letter-spacing: -0.04em;
    line-height: 1;
  }
`;function We(i,t=5e3){return new Promise(r=>{const l=performance.now(),s=()=>{if(i.current){r(i.current);return}if(performance.now()-l>=t){r(null);return}requestAnimationFrame(s)};s()})}class $e{constructor(){this.buffer=[],this.timestamps=[],this.bufferSize=256,this.bpmHistory=[],this.signalQuality=0}addSample(t,r,l,s){const a=3*r-2*t;this.buffer.push(a),this.timestamps.push(s),this.buffer.length>this.bufferSize&&(this.buffer.shift(),this.timestamps.shift())}getSignalQuality(){if(this.buffer.length<64)return 0;const t=this.buffer.slice(-64),r=t.reduce((c,n)=>c+n,0)/t.length,l=t.reduce((c,n)=>c+(n-r)**2,0)/t.length,s=Math.sqrt(l),a=r!==0?Math.abs(r)/(s+.001):0;return this.signalQuality=Math.min(1,Math.max(0,1-a*.3)),this.signalQuality}bandpassFilter(t){if(t.length<32)return t;const r=t.length,s=1e3/(this.timestamps.length>1?(this.timestamps[this.timestamps.length-1]-this.timestamps[0])/(this.timestamps.length-1):33.33),a=Math.max(2,Math.round(s/.7)),c=Math.max(2,Math.round(s/3.5)),n=new Array(r).fill(0);for(let d=0;d<r;d++){let h=0,m=0;for(let p=Math.max(0,d-a);p<=Math.min(r-1,d+a);p++)h+=t[p],m++;n[d]=t[d]-h/m}const u=new Array(r).fill(0);for(let d=0;d<r;d++){let h=0,m=0;for(let p=Math.max(0,d-c);p<=Math.min(r-1,d+c);p++)h+=n[p],m++;u[d]=h/m}return u}computeFFTBPM(){if(this.buffer.length<128)return null;const t=this.bandpassFilter([...this.buffer]),r=t.length,s=1e3/((this.timestamps[this.timestamps.length-1]-this.timestamps[0])/(r-1));let a=0,c=-1/0;const n=Math.round(s/3.5),u=Math.round(s/.7),d=t.reduce((p,x)=>p+x,0)/r,h=t.map(p=>p-d);for(let p=n;p<=Math.min(u,r-1);p++){let x=0,R=0;for(let N=0;N<r-p;N++)x+=h[N]*h[N+p],R++;x/=R,x>c&&(c=x,a=p)}if(a===0)return null;const m=s/a*60;return m>=42&&m<=180?(this.bpmHistory.push(m),this.bpmHistory.length>10&&this.bpmHistory.shift(),Math.round(this.bpmHistory.reduce((p,x)=>p+x,0)/this.bpmHistory.length)):null}computeHRV(){if(this.bpmHistory.length<5)return null;const t=this.bpmHistory.map(s=>6e4/s),r=t.reduce((s,a)=>s+a,0)/t.length,l=t.reduce((s,a)=>s+(a-r)**2,0)/t.length;return Math.round(Math.sqrt(l))}getFilteredSignal(){return this.buffer.length<32?this.buffer:this.bandpassFilter([...this.buffer])}reset(){this.buffer=[],this.timestamps=[],this.bpmHistory=[],this.signalQuality=0}}function Je(i,t){const r=Math.max(0,Math.min(1,(i-55)/60)),l=t!==null?Math.max(0,Math.min(1,1-(t-10)/80)):.5,s=r*.5+l*.5;let a="Balanced";return i>85&&(t===null||t<40)?a="Pitta":i<65&&t!==null&&t>60?a="Kapha":t!==null&&t>50&&(a="Vāta"),{dosha:a,stress:Math.round(s*100)}}function Oe(){const[i,t]=o.useState(null),[r,l]=o.useState(0),[s,a]=o.useState("idle"),[c,n]=o.useState(0),[u,d]=o.useState([]),h=o.useRef([]),m=o.useRef(null),p=10,x=o.useCallback(()=>{const v=h.current;if(v.length<3)return;const F=[];for(let S=1;S<v.length;S++)F.push(v[S]-v[S-1]);const k=F.reduce((S,T)=>S+T,0)/F.length,j=Math.round(6e4/k);j>=40&&j<=200&&t(j)},[]),R=o.useCallback(()=>{h.current=[],l(0),t(null),n(0),a("tapping"),m.current=setInterval(()=>{n(v=>v+1>=p?(clearInterval(m.current),x(),a("done"),p):v+1)},1e3)},[x]),N=o.useCallback(()=>{if(s!=="tapping")return;const v=performance.now();h.current.push(v),l(j=>j+1);const F=Date.now();d(j=>[...j,F]),setTimeout(()=>d(j=>j.filter(S=>S!==F)),600);const k=h.current;if(k.length>=3){const j=[];for(let w=1;w<k.length;w++)j.push(k[w]-k[w-1]);const S=j.reduce((w,M)=>w+M,0)/j.length,T=Math.round(6e4/S);T>=40&&T<=200&&t(T)}},[s]),H=o.useCallback(()=>{clearInterval(m.current),h.current=[],l(0),t(null),n(0),a("idle"),d([])},[]);return o.useEffect(()=>()=>clearInterval(m.current),[]),{tapBpm:i,tapCount:r,tapPhase:s,tapElapsed:c,ripples:u,startTapping:R,recordTap:N,resetTap:H,TAP_DURATION:p}}function Ve(){const[i,t]=o.useState("sensor"),[r,l]=o.useState("scan"),[s,a]=o.useState("idle"),[c,n]=o.useState(null),[u,d]=o.useState(null),[h,m]=o.useState([]),[p,x]=o.useState(0),[R,N]=o.useState(0),[H,v]=o.useState(null),[F,k]=o.useState(!1),j=o.useRef(null),S=o.useRef(null),T=o.useRef(new $e),w=o.useRef(null),M=o.useRef(null),E=o.useRef(null),B=o.useRef(0),g=Oe(),[O,te]=o.useState(!0);o.useEffect(()=>{const f=()=>te(typeof window<"u"&&window.innerWidth>400);return f(),window.addEventListener("resize",f),()=>window.removeEventListener("resize",f)},[]);const C=o.useCallback(()=>{M.current&&cancelAnimationFrame(M.current),E.current&&clearInterval(E.current),w.current&&(w.current.getTracks().forEach(f=>f.stop()),w.current=null),T.current.reset()},[]),Y=o.useRef(null);o.useEffect(()=>{Y.current=c},[c]);const ae=o.useCallback(()=>{C(),k(!0),a("manual"),g.resetTap()},[C,g]);o.useEffect(()=>{if(s!=="initializing")return;const f=window.setTimeout(()=>{B.current+=1,C(),a("idle"),v("Scanner did not start in time. Try again — or use tap pulse when prompted.")},14e3);return()=>window.clearTimeout(f)},[s,C]),o.useEffect(()=>{if(s!=="scanning"&&s!=="reading")return;const f=window.setTimeout(()=>{Y.current==null&&(C(),k(!0),a("manual"))},32e3);return()=>window.clearTimeout(f)},[s,C]);const y=o.useCallback(async()=>{B.current+=1;const f=B.current;v(null),a("initializing"),n(null),d(null),m([]),x(0),N(0),T.current.reset();try{const b=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:320},height:{ideal:240}}});if(f!==B.current){b.getTracks().forEach(A=>A.stop());return}w.current=b;const _=await We(j,5e3);if(f!==B.current){b.getTracks().forEach(A=>A.stop()),w.current=null;return}if(!_){b.getTracks().forEach(A=>A.stop()),w.current=null,k(!0),a("manual");return}if(_.setAttribute("playsinline","true"),_.playsInline=!0,_.muted=!0,_.srcObject=b,await _.play(),f!==B.current){b.getTracks().forEach(A=>A.stop()),w.current=null;return}const z=S.current,U=z.getContext("2d",{willReadFrequently:!0});z.width=320,z.height=240,a("scanning"),E.current=setInterval(()=>N(A=>A+1),1e3);const P=()=>{if(!w.current)return;U.drawImage(_,0,0,320,240);const $=U.getImageData(100,40,120,60).data;let D=0,q=0,Z=0;const J=120*60;for(let Q=0;Q<$.length;Q+=4)D+=$[Q],q+=$[Q+1],Z+=$[Q+2];const G=T.current;G.addSample(D/J,q/J,Z/J,performance.now()),x(G.getSignalQuality());const le=G.computeFFTBPM();le&&(n(le),a("reading"),d(G.computeHRV())),m([...G.getFilteredSignal()]),M.current=requestAnimationFrame(P)};M.current=requestAnimationFrame(P)}catch(b){b.name==="NotAllowedError"||b.name==="NotFoundError"||b.name==="PermissionDeniedError"||b.message?.includes("device not found")||b.message?.includes("Permission denied")?(k(!0),a("manual"),v(null)):(v(b.message||"Camera access denied"),a("idle"))}},[]),L=o.useCallback(()=>{g.tapBpm&&(n(g.tapBpm),d(null),a("manualDone"))},[g.tapBpm]),I=o.useCallback(()=>{C(),l("results")},[C]),V=o.useCallback(()=>{l("scan"),a("idle"),n(null),d(null),m([]),x(0),N(0),k(!1),g.resetTap()},[g]);o.useEffect(()=>()=>C(),[C]);const W=f=>`${Math.floor(f/60)}:${String(f%60).padStart(2,"0")}`,se=(f,b,_)=>e.jsxs("button",{onClick:()=>t(f),className:`sqi-nav-btn ${i===f?"active":"inactive"}`,children:[e.jsx(_,{size:15}),e.jsx("span",{style:{display:O?"inline":"none"},children:b})]},f),X=()=>e.jsxs("nav",{className:"sqi-nav",children:[se("sensor","Nāḍī",de),se("breathing","Prāṇa",he),se("meditation","Dhyāna",fe)]}),be=({data:f,width:b=280,height:_=56})=>{const z=o.useRef(null);return o.useEffect(()=>{const U=z.current;if(!U||!f.length)return;const P=U.getContext("2d");P.clearRect(0,0,b,_);const A=Math.max(1,Math.floor(f.length/b)),$=_/2,D=P.createLinearGradient(0,0,b,0);D.addColorStop(0,"rgba(212,175,55,0.2)"),D.addColorStop(.5,"#22D3EE"),D.addColorStop(1,"rgba(212,175,55,0.2)"),P.strokeStyle=D,P.lineWidth=1.5,P.shadowBlur=6,P.shadowColor="#22D3EE",P.beginPath();for(let q=0;q<b;q++){const Z=Math.min(q*A,f.length-1),J=$-(f[Z]||0)*12;q===0?P.moveTo(q,J):P.lineTo(q,J)}P.stroke()},[f,b,_]),e.jsx("canvas",{ref:z,width:b,height:_,style:{display:"block",margin:"0 auto",opacity:.85}})};if(i==="breathing")return e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:K}),e.jsxs("div",{style:{maxWidth:440,margin:"0 auto",padding:"48px 24px",textAlign:"center",position:"relative",zIndex:1},children:[e.jsx("p",{className:"sqi-label",style:{marginBottom:10},children:"Prāṇāyāma · Vedic Light-Code"}),e.jsx("h1",{className:"sqi-title",style:{fontSize:26,marginBottom:6},children:"Breath is the bridge"}),e.jsx("p",{className:"sqi-body",style:{fontSize:13,marginBottom:36,letterSpacing:"0.1em"},children:"between body and spirit."}),e.jsx(Ae,{bpm:c}),e.jsx("button",{onClick:()=>t("meditation"),className:"btn-ghost",style:{marginTop:28},children:"Continue to Dhyāna →"})]}),e.jsx(X,{})]});if(i==="meditation")return e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:K}),e.jsxs("div",{style:{maxWidth:480,margin:"0 auto",padding:"48px 24px",position:"relative",zIndex:1},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:36},children:[e.jsx("p",{className:"sqi-label",style:{marginBottom:10},children:"Mantra · Dhyāna · Transmission"}),e.jsx("h1",{className:"sqi-title",style:{fontSize:26,marginBottom:6},children:"Resonating with peace"}),e.jsx("p",{className:"sqi-body",style:{fontSize:13,letterSpacing:"0.1em"},children:"The frequency of stillness."})]}),e.jsx(Be,{bpm:c,hrv:u})]}),e.jsx(X,{})]});if(r==="scan")return e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:K}),e.jsx("video",{ref:j,style:{display:"none"},playsInline:!0,muted:!0}),e.jsx("canvas",{ref:S,style:{display:"none"}}),e.jsxs("div",{style:{maxWidth:440,margin:"0 auto",padding:"56px 24px",textAlign:"center",position:"relative",zIndex:1},children:[e.jsx("p",{className:"sqi-label",style:{marginBottom:12},children:"रक्त नाडी परीक्षा"}),e.jsx("h1",{className:"sqi-title gold-glow",style:{fontSize:32,marginBottom:8},children:"DIGITAL NĀḌĪ"}),e.jsx("p",{className:"sqi-body",style:{fontSize:11,letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:48},children:s==="manual"||s==="manualDone"?"Bhakti-Algorithm · Tap-Pulse Mode":"Remote Photoplethysmography"}),s==="idle"&&e.jsxs("div",{className:"animate-fade-in",children:[e.jsxs("div",{style:{position:"relative",width:200,height:200,margin:"0 auto 40px"},children:[e.jsx("div",{style:{position:"absolute",inset:0,borderRadius:"50%",background:"radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",border:"1px solid rgba(212,175,55,0.12)"},className:"nadi-pulse-ring"}),e.jsx("div",{style:{position:"absolute",inset:20,borderRadius:"50%",border:"1px solid rgba(212,175,55,0.08)"},className:"nadi-orbit"}),e.jsx("div",{style:{position:"absolute",inset:40,borderRadius:"50%",border:"1px solid rgba(34,211,238,0.06)"},className:"nadi-orbit-rev"}),e.jsx("div",{style:{position:"absolute",inset:"50%",transform:"translate(-50%,-50%)",width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(de,{size:24,color:"#D4AF37",opacity:.6})})]}),e.jsxs("p",{className:"sqi-body",style:{fontSize:13,lineHeight:1.8,marginBottom:32,maxWidth:300,margin:"0 auto 32px"},children:["Position your face within camera view.",e.jsx("br",{}),"Ensure even, natural lighting — avoid direct sunlight."]}),e.jsx("button",{onClick:y,className:"btn-gold",children:"Begin Scan"})]}),s==="initializing"&&e.jsxs("div",{className:"animate-fade-in",children:[e.jsxs("div",{style:{position:"relative",width:160,height:160,margin:"0 auto 32px"},children:[e.jsx("div",{style:{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(212,175,55,0.2)"},className:"nadi-orbit"}),e.jsx("div",{style:{position:"absolute",inset:"50%",transform:"translate(-50%,-50%)",color:"#D4AF37",fontSize:13,fontWeight:800,letterSpacing:"0.2em",whiteSpace:"nowrap"},children:"INIT…"})]}),e.jsx("p",{style:{color:"#D4AF37",fontSize:12,letterSpacing:"0.3em",textTransform:"uppercase"},children:"Calibrating Nāḍī Scanner"}),e.jsx("button",{type:"button",onClick:()=>{B.current+=1,C(),a("idle")},className:"btn-ghost",style:{marginTop:24},children:"Cancel"})]}),(s==="scanning"||s==="reading")&&e.jsxs("div",{className:"animate-fade-in",children:[e.jsxs("p",{className:"sqi-label",style:{marginBottom:16},children:[s==="scanning"?"Acquiring Prema-Pulse":"Reading Nāḍī"," · ",W(R)]}),e.jsx("div",{style:{margin:"0 auto 20px",width:220,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2},children:e.jsx("div",{style:{width:`${p*100}%`,height:"100%",borderRadius:2,background:p>.5?"linear-gradient(90deg, #22D3EE, #5AE4A8)":"linear-gradient(90deg, #FF6B4A, #FFB84A)",transition:"width 0.3s",boxShadow:p>.5?"0 0 8px rgba(34,211,238,0.4)":"0 0 8px rgba(255,107,74,0.4)"}})}),e.jsx("div",{style:{margin:"0 0 20px"},children:e.jsx(be,{data:h})}),c&&e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("div",{className:"vital-number gold-glow",children:c}),e.jsx("p",{className:"sqi-label",style:{color:"rgba(255,255,255,0.4)",marginTop:4},children:"BPM"}),u!==null&&e.jsxs("p",{style:{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:8,letterSpacing:"0.2em"},children:["HRV · ",u," ms"]})]}),e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"},children:[e.jsx("button",{type:"button",onClick:()=>{B.current+=1,C(),a("idle")},className:"btn-ghost",children:"Cancel"}),c&&e.jsx("button",{type:"button",onClick:I,className:"btn-gold-outline",children:"View Reading →"})]}),!c&&R>=8&&e.jsxs("div",{style:{marginTop:20,padding:"14px 16px",borderRadius:16,border:"1px solid rgba(212,175,55,0.15)",background:"rgba(255,255,255,0.02)"},children:[e.jsx("p",{className:"sqi-body",style:{fontSize:12,marginBottom:12,lineHeight:1.6},children:"Pulse lock still calibrating. Hold still, face the camera, and add soft front light — or use tap mode for an immediate reading."}),e.jsx("button",{type:"button",onClick:ae,className:"btn-gold",style:{width:"100%"},children:"Use tap pulse instead →"})]}),c&&e.jsx("button",{type:"button",onClick:()=>t("breathing"),className:"btn-ghost",style:{marginTop:12},children:"Begin Prāṇāyāma →"})]}),(s==="manual"||s==="manualDone")&&e.jsxs("div",{className:"animate-fade-in",children:[e.jsxs("div",{className:"glass-card-sharp",style:{padding:"14px 20px",marginBottom:32,border:"1px solid rgba(212,175,55,0.12)",textAlign:"left",display:"flex",gap:12,alignItems:"flex-start"},children:[e.jsx(ue,{size:18,color:"#D4AF37",style:{flexShrink:0,marginTop:2}}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.3em",color:"#D4AF37",textTransform:"uppercase",marginBottom:4},children:"Bhakti-Algorithm Mode"}),e.jsx("p",{className:"sqi-body",style:{fontSize:12},children:"Camera not available in this environment. Tap to the rhythm of your heartbeat for 10 seconds."})]})]}),g.tapPhase==="idle"&&s==="manual"&&e.jsxs("div",{children:[e.jsxs("div",{className:"tap-zone",onClick:g.startTapping,children:[e.jsx(ue,{size:36,color:"rgba(212,175,55,0.6)"}),e.jsx("p",{style:{fontSize:9,fontWeight:800,letterSpacing:"0.3em",color:"rgba(212,175,55,0.5)",textTransform:"uppercase",marginTop:10},children:"Tap to Begin"})]}),e.jsx("p",{className:"sqi-body",style:{fontSize:12,marginTop:20},children:"Tap 10× in the rhythm of your pulse"})]}),g.tapPhase==="tapping"&&e.jsxs("div",{children:[e.jsx("div",{style:{position:"relative",marginBottom:20},children:e.jsxs("div",{className:"tap-zone",onClick:g.recordTap,style:{borderColor:"rgba(212,175,55,0.5)",boxShadow:"0 0 30px rgba(212,175,55,0.1)"},children:[g.ripples.map(f=>e.jsx("div",{className:"ripple"},f)),e.jsx("p",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.2em",color:"rgba(212,175,55,0.4)",textTransform:"uppercase",marginBottom:6},children:"TAP YOUR PULSE"}),g.tapBpm?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"vital-number gold-glow",style:{fontSize:36},children:g.tapBpm}),e.jsx("p",{className:"sqi-label",children:"BPM"})]}):e.jsx("p",{style:{fontSize:28,color:"rgba(212,175,55,0.5)",fontWeight:300},children:g.tapCount})]})}),e.jsx("div",{style:{width:200,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,margin:"0 auto 8px"},children:e.jsx("div",{style:{width:`${g.tapElapsed/g.TAP_DURATION*100}%`,height:"100%",background:"linear-gradient(90deg, #D4AF37, #22D3EE)",borderRadius:2,transition:"width 1s linear",boxShadow:"0 0 8px rgba(212,175,55,0.3)"}})}),e.jsxs("p",{className:"sqi-label",children:[g.tapElapsed,"s / ",g.TAP_DURATION,"s"]})]}),(g.tapPhase==="done"||s==="manualDone")&&g.tapBpm&&e.jsxs("div",{children:[e.jsxs("div",{style:{padding:"28px 32px",background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.15)",borderRadius:24,marginBottom:24},children:[e.jsx("p",{className:"sqi-label",style:{marginBottom:12},children:"Pulse Reading"}),e.jsx("div",{className:"vital-number gold-glow",style:{fontSize:56},children:g.tapBpm}),e.jsx("p",{className:"sqi-label",style:{marginTop:8,color:"rgba(255,255,255,0.4)"},children:"BPM"})]}),s!=="manualDone"?e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"},children:[e.jsxs("button",{onClick:g.resetTap,className:"btn-ghost",children:[e.jsx(oe,{size:12,style:{marginRight:6}})," Retry"]}),e.jsx("button",{onClick:L,className:"btn-gold",children:"Accept Reading →"})]}):e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"},children:[e.jsx("button",{onClick:I,className:"btn-gold",children:"View Nāḍī Reading →"}),e.jsx("button",{onClick:()=>t("breathing"),className:"btn-ghost",children:"Begin Prāṇāyāma →"})]})]}),g.tapPhase==="done"&&!g.tapBpm&&e.jsxs("div",{children:[e.jsx("p",{className:"sqi-body",style:{fontSize:13,marginBottom:20},children:"Not enough taps detected. Please try again."}),e.jsx("button",{onClick:g.resetTap,className:"btn-ghost",children:"↺ Retry"})]})]}),H&&e.jsxs("div",{style:{marginTop:16,padding:"12px 20px",borderRadius:12,background:"rgba(255,107,74,0.06)",border:"1px solid rgba(255,107,74,0.15)"},children:[e.jsx("p",{style:{fontSize:12,color:"#FF6B4A"},children:H}),e.jsx("button",{onClick:()=>{v(null),a("idle")},className:"btn-ghost",style:{marginTop:12},children:"Try Again"})]})]}),e.jsx(X,{})]});if(r==="results"&&c){const{dosha:f,stress:b}=Je(c,u),z={Pitta:"#FF6B4A",Kapha:"#5AE4A8",Vāta:"#B084FF",Balanced:"#D4AF37"}[f]||"#D4AF37";return e.jsxs("div",{className:"sqi-page",children:[e.jsx("style",{children:K}),e.jsxs("div",{style:{maxWidth:440,margin:"0 auto",padding:"48px 24px",position:"relative",zIndex:1},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:36},children:[e.jsx("p",{className:"sqi-label",style:{marginBottom:12},children:"Nāḍī Reading Complete"}),e.jsxs("div",{style:{display:"flex",justifyContent:"center",gap:24,marginBottom:20},children:[e.jsxs("div",{className:"vital-stat",children:[e.jsx("span",{className:"vital-number gold-glow",children:c}),e.jsx("p",{className:"sqi-label",style:{color:"rgba(255,255,255,0.4)"},children:"BPM"})]}),u!==null&&e.jsx("div",{style:{width:1,background:"rgba(255,255,255,0.06)",alignSelf:"stretch"}}),u!==null&&e.jsxs("div",{className:"vital-stat",children:[e.jsx("span",{className:"vital-number",style:{fontSize:48,fontWeight:300},children:u}),e.jsx("p",{className:"sqi-label",style:{color:"rgba(255,255,255,0.4)"},children:"HRV ms"})]}),e.jsx("div",{style:{width:1,background:"rgba(255,255,255,0.06)",alignSelf:"stretch"}}),e.jsxs("div",{className:"vital-stat",children:[e.jsxs("span",{className:"vital-number",style:{fontSize:48,fontWeight:300},children:[b,"%"]}),e.jsx("p",{className:"sqi-label",style:{color:"rgba(255,255,255,0.4)"},children:"STRESS"})]})]}),e.jsxs("span",{className:"dosha-badge",style:{background:`${z}14`,border:`1px solid ${z}33`,color:z,boxShadow:`0 0 16px ${z}15`},children:[f," Dosha"]}),F&&e.jsx("p",{style:{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:12,letterSpacing:"0.15em"},children:"* Reading via Bhakti-Algorithm tap mode"})]}),e.jsx(He,{bpm:c,hrv:u,dosha:f,stress:b}),e.jsxs("div",{style:{textAlign:"center",marginTop:32,display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"},children:[e.jsxs("button",{onClick:V,className:"btn-ghost",children:[e.jsx(oe,{size:12,style:{marginRight:6}})," Re-scan"]}),e.jsx("button",{onClick:()=>t("breathing"),className:"btn-gold",children:"Begin Prāṇāyāma →"})]})]}),e.jsx(X,{})]})}return e.jsxs("div",{className:"sqi-page",style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsx("style",{children:K}),e.jsx("video",{ref:j,style:{display:"none"},playsInline:!0,muted:!0}),e.jsx("canvas",{ref:S,style:{display:"none"}}),e.jsx("p",{className:"sqi-label",children:"Loading Digital Nāḍī…"})]})}function st(){const{user:i,isLoading:t}=je(),{tier:r,loading:l,settled:s}=we(),{isAdmin:a,isLoading:c}=_e();return t||l||c||!s?e.jsx("div",{className:"flex min-h-screen items-center justify-center bg-[#050505] text-white",children:e.jsx("span",{className:"text-sm uppercase tracking-[0.3em] text-white/40",children:"Loading Digital Nāḍī…"})}):i?Se(a,r,ke.digitalNadi)?e.jsx(Ve,{}):e.jsx(ce,{to:"/siddha-quantum",replace:!0}):e.jsx(ce,{to:"/auth",replace:!0})}export{st as default};
