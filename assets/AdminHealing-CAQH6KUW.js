import{g as Y,r as u,j as e,L as I}from"./vendor-react--OR-uH7S.js";import{d as D,s as g,B as l}from"./index-RRXEvQfm.js";import{I as p}from"./input-DkvArLBf.js";import{T as x}from"./textarea-Dwdxoc6F.js";import{C as j}from"./card-CmK9RDpa.js";import{L as d}from"./label-BG-pvaqY.js";import{D as R,a as O,b as U,c as M,e as H}from"./dialog-BkQpXw4Q.js";import{A as N}from"./AudioUpload-DDoN_6j6.js";import{A as P,$ as T,ad as z,h as Q,v as W,M as $,av as G,an as B,aY as X,E as V}from"./vendor-icons-CZmAPI07.js";import"./vendor-crypto-DfHPQj82.js";import"./vendor-radix-7CUZPdy3.js";import"./vendor-i18n-BS5B6gzd.js";import"./vendor-query-D1GokQmc.js";import"./vendor-supabase-DRj4EguU.js";import"./vendor-motion-Dm4zQNot.js";const _=[{value:"free",label:"Atma-Seed"},{value:"prana-flow",label:"Prana-Flow"},{value:"siddha-quantum",label:"Siddha-Quantum"},{value:"akasha-infinity",label:"Akasha-Infinity"}],he=()=>{const{toast:s}=D(),A=Y(),[m,y]=u.useState([]),[b,v]=u.useState(!1),[C,f]=u.useState(!1),[r,n]=u.useState({title:"",description:"",audioUrl:"",previewUrl:"",durationMinutes:3,requiredTier:"free",priceUsd:4.99,category:"healing",scriptText:"",language:"en"});u.useEffect(()=>{h()},[]);const h=async()=>{try{let a=g.from("healing_audio").select("*").order("created_at",{ascending:!1});const{data:t,error:o}=await a;if(o)if(console.error("Error fetching audios:",o),o.message.includes("script_text")||o.message.includes("schema cache")){console.log("script_text column not found, fetching without it...");const{data:i,error:c}=await g.from("healing_audio").select("id, title, description, audio_url, preview_url, duration_seconds, is_free, price_usd, price_shc, category, created_at").order("created_at",{ascending:!1});if(c){s({title:"Error",description:`Failed to load healing audio: ${c.message}`,variant:"destructive"});return}i&&(y(i.map(q=>({...q,script_text:null}))),s({title:"Migration Required",description:'The script_text column is missing. Click "Run Migration" button above to fix this automatically.',variant:"default",duration:1e4}));return}else{s({title:"Error",description:`Failed to load healing audio: ${o.message}`,variant:"destructive"});return}t?(console.log("Fetched healing audios:",t.length),y(t.map(i=>({...i,script_text:i.script_text||null,language:i.language||"en"})))):(console.log("No healing audio data returned"),y([]))}catch(a){console.error("Unexpected error fetching audios:",a),s({title:"Error",description:`Unexpected error: ${a.message}`,variant:"destructive"})}},k=async a=>{a.preventDefault(),v(!0);try{const{error:t}=await g.from("healing_audio").insert({title:r.title,description:r.description||null,audio_url:r.audioUrl,preview_url:r.previewUrl||null,duration_seconds:r.durationMinutes*60,is_free:r.requiredTier==="free",required_tier:r.requiredTier,price_usd:r.priceUsd,price_shc:0,category:r.category,script_text:r.scriptText||null,language:r.language});if(t)throw t;s({title:"Success",description:"Healing audio added successfully!"}),n({title:"",description:"",audioUrl:"",previewUrl:"",durationMinutes:3,requiredTier:"free",priceUsd:4.99,category:"healing",scriptText:"",language:"en"}),h()}catch(t){s({title:"Error",description:t.message,variant:"destructive"})}finally{v(!1)}},E=async a=>{if(!confirm("Are you sure you want to delete this audio?"))return;const{error:t}=await g.from("healing_audio").delete().eq("id",a);t?s({title:"Error",description:t.message,variant:"destructive"}):(s({title:"Deleted",description:"Audio removed successfully"}),h())},S=a=>{A(`/admin/healing/${a.id}`)},L=(a,t)=>{const o={chakra:`Chakra Healing Meditation: ${t}

Welcome to this sacred healing space. Find a comfortable position where you won't be disturbed. Close your eyes gently. Take three deep breaths, inhaling peace and exhaling any tension.

Bring your awareness to your energy centers. Visualize a beautiful, spinning wheel of light at your [chakra location]. This is your [chakra name] chakra, the center of [chakra purpose].

As you breathe, imagine a warm, [color] light flowing into this chakra. Feel it expanding, clearing, and balancing. Any blockages or stored emotions begin to dissolve in this healing light.

With each breath, this chakra becomes more vibrant, more open, more aligned. Feel the energy flowing freely, connecting you to your highest self.

Rest in this healing energy. Allow the frequency to work on all levels - physical, emotional, mental, and spiritual. You are safe. You are healing. You are whole.

When you are ready, gently bring your awareness back to your body. Take a deep breath, and open your eyes, feeling refreshed and balanced.`,emotional:`Emotional Healing Meditation: ${t}

Welcome to a safe space for deep emotional healing. Find a comfortable position. Close your eyes. Take several deep, cleansing breaths.

Bring your awareness to your heart center. Notice any emotions that are present - sadness, anger, fear, or pain. Acknowledge them without judgment. They are valid. They are part of your journey.

Now, imagine a warm, golden light surrounding your heart. This is the light of unconditional love and acceptance. As you breathe, this light gently penetrates any emotional wounds, any stored pain, any old patterns.

Feel the light dissolving layers of hurt, releasing what no longer serves you. With each breath, you are creating space for new emotions - peace, joy, love, compassion.

Visualize any difficult emotions being transformed into wisdom, into strength, into understanding. You are not your pain. You are the awareness that observes it. You are the light that heals it.

Rest in this healing space. Allow yourself to feel whatever needs to be felt. You are safe. You are supported. You are loved.

When you are ready, gently return to the present moment, carrying this healing energy with you.`,sleep:`Sleep Healing Meditation: ${t}

Welcome to your sleep sanctuary. Lie down comfortably. Close your eyes. Let go of the day.

Take a deep breath in through your nose... hold for a moment... and release slowly through your mouth. Repeat this three times, feeling your body begin to relax.

Starting from your toes, consciously relax each part of your body. Your feet... your legs... your hips... your stomach... your chest... your arms... your shoulders... your neck... your face. Let all tension melt away.

Now, imagine yourself in a peaceful, safe place - perhaps a quiet beach at sunset, or a serene forest, or a cozy room. Feel the peace of this place. You are completely safe here.

As you rest, feel healing energy flowing through your entire being. Your nervous system is calming. Your mind is quieting. Your body is preparing for deep, restorative sleep.

With each breath, you sink deeper into relaxation. Any worries or thoughts gently drift away like clouds in the sky. You are letting go. You are surrendering to rest.

You are safe. You are loved. You are ready for peaceful sleep. Allow yourself to drift into deep, healing slumber.`,frequency:`Frequency Healing: ${t}

Welcome to this frequency healing session. Find a comfortable position. Close your eyes. Take a few deep breaths to center yourself.

The healing frequency you are about to receive works on a cellular level, harmonizing your energy field and promoting natural healing. Simply allow yourself to receive.

As the frequency plays, feel it resonating through your body. Notice any areas that respond - perhaps a gentle vibration, a sense of warmth, or a feeling of release.

This frequency is designed to [specific healing purpose]. Trust the process. Your body knows how to heal. Your energy knows how to balance.

Breathe naturally. There's nothing you need to do. Just be present. Just receive. The frequency is doing the work.

Rest in this healing space. Allow the vibrations to penetrate every cell, every tissue, every energy center. You are being harmonized. You are being healed.

When the session ends, take a moment to notice how you feel. Gently open your eyes when you're ready, carrying this healing energy with you.`,energy_clearing:`Energy Clearing Meditation: ${t}

Welcome to this powerful energy clearing session. Sit or lie comfortably. Close your eyes. Take three deep, cleansing breaths.

Visualize yourself surrounded by a beautiful, protective bubble of white light. This is your sacred space. Nothing can harm you here.

Now, imagine roots growing from your feet deep into the earth. You are grounded. You are connected to the earth's healing energy.

As you breathe, visualize any negative energy, any attachments, any lower vibrations being drawn down through your body, through your roots, and into the earth, where it is transformed into pure light.

Feel your energy field becoming lighter, clearer, brighter. Any energetic cords or attachments are being released. Any heavy emotions are being cleared.

Now, imagine a beautiful waterfall of white light flowing from above, through the crown of your head, washing through your entire being, clearing and purifying every cell, every chakra, every energy center.

Feel yourself becoming lighter, more aligned, more connected to your highest self. You are clear. You are protected. You are free.

Rest in this cleared, purified state. When you're ready, gently return to the present moment, feeling refreshed and energetically clean.`},i=t.toLowerCase(),c=a.toLowerCase();return i.includes("chakra")||c.includes("chakra")?o.chakra:i.includes("sleep")||i.includes("rest")||c.includes("sleep")?o.sleep:i.includes("frequency")||i.includes("hz")||c.includes("frequency")?o.frequency:i.includes("clear")||i.includes("energy")||c.includes("clearing")?o.energy_clearing:o.emotional},F=()=>{if(!r.title){s({title:"Error",description:"Please enter a title first",variant:"destructive"});return}const a=L(r.category,r.title);n({...r,scriptText:a}),s({title:"Script Generated",description:"A template script has been generated based on your title and category"})},w=`-- Add script_text column to healing_audio table
-- Copy this entire SQL and run it in Supabase SQL Editor

ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;

CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));`;return e.jsx("div",{className:"min-h-screen bg-background p-6",children:e.jsxs("div",{className:"max-w-4xl mx-auto space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx(I,{to:"/admin",children:e.jsx(l,{variant:"ghost",size:"icon",children:e.jsx(P,{className:"w-5 h-5"})})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-foreground",children:"Healing Audio Manager"}),e.jsx("p",{className:"text-muted-foreground",children:"Add and manage healing audio tracks"})]})]}),e.jsxs(l,{onClick:()=>f(!0),variant:"outline",className:"flex items-center gap-2",children:[e.jsx(T,{className:"w-4 h-4"}),"Migration SQL"]})]}),e.jsxs(j,{className:"p-6",children:[e.jsxs("h2",{className:"text-lg font-semibold mb-4 flex items-center gap-2",children:[e.jsx(z,{className:"w-5 h-5"}),"Add New Healing Audio"]}),e.jsxs("form",{onSubmit:k,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx(d,{htmlFor:"title",children:"Title *"}),e.jsx(p,{id:"title",value:r.title,onChange:a=>n({...r,title:a.target.value}),placeholder:"432Hz Heart Chakra Healing",required:!0})]}),e.jsxs("div",{children:[e.jsx(d,{htmlFor:"description",children:"Description"}),e.jsx(x,{id:"description",value:r.description,onChange:a=>n({...r,description:a.target.value}),placeholder:"A gentle healing frequency to open and balance your heart chakra..."})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsx(N,{value:r.audioUrl,onChange:a=>n({...r,audioUrl:a}),folder:"healing",label:"Full Audio File *"}),e.jsx(N,{value:r.previewUrl,onChange:a=>n({...r,previewUrl:a}),folder:"healing/previews",label:"Preview Audio (30s)"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx(d,{htmlFor:"duration",children:"Duration (minutes)"}),e.jsx(p,{id:"duration",type:"number",min:"1",value:r.durationMinutes,onChange:a=>n({...r,durationMinutes:parseInt(a.target.value)||1})})]}),e.jsxs("div",{children:[e.jsx(d,{htmlFor:"priceUsd",children:"Price (USD)"}),e.jsx(p,{id:"priceUsd",type:"number",step:"0.01",value:r.priceUsd,onChange:a=>n({...r,priceUsd:parseFloat(a.target.value)})})]})]}),e.jsxs("div",{children:[e.jsx(d,{htmlFor:"category",children:"Category"}),e.jsx(p,{id:"category",value:r.category,onChange:a=>n({...r,category:a.target.value}),placeholder:"healing, chakra, frequency, sleep, emotional, etc."})]}),e.jsxs("div",{children:[e.jsx(d,{htmlFor:"language",children:"Meditation language"}),e.jsxs("select",{id:"language",value:r.language,onChange:a=>n({...r,language:a.target.value}),className:"w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground mt-2",children:[e.jsx("option",{value:"en",children:"English"}),e.jsx("option",{value:"sv",children:"Svenska"}),e.jsx("option",{value:"es",children:"Español"}),e.jsx("option",{value:"no",children:"Norsk"})]}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"Controls which language filter shows this healing audio"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx(d,{htmlFor:"scriptText",children:"Meditation Script"}),e.jsxs(l,{type:"button",variant:"outline",size:"sm",onClick:F,disabled:!r.title,children:[e.jsx(T,{className:"w-4 h-4 mr-1"}),"Generate Template"]})]}),e.jsx(x,{id:"scriptText",value:r.scriptText,onChange:a=>n({...r,scriptText:a.target.value}),placeholder:"Enter the meditation script here, or click 'Generate Template' to create a template based on title and category...",rows:12,className:"font-mono text-sm"}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"This script will be used for recording. Generate a template or write your own."})]}),e.jsxs("div",{children:[e.jsx(d,{htmlFor:"requiredTier",children:"Required Tier"}),e.jsx("select",{id:"requiredTier",value:r.requiredTier,onChange:a=>n({...r,requiredTier:a.target.value}),className:"w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground mt-2",children:_.map(a=>e.jsx("option",{value:a.value,children:a.label},a.value))}),e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"Atma-Seed plays for everyone. Anything above that requires the matching membership (or the one-time price below for people who haven't upgraded yet)."})]}),e.jsx(l,{type:"submit",disabled:b,className:"w-full",children:b?e.jsxs(e.Fragment,{children:[e.jsx(Q,{className:"w-4 h-4 mr-2 animate-spin"}),"Adding..."]}):e.jsxs(e.Fragment,{children:[e.jsx(W,{className:"w-4 h-4 mr-2"}),"Add Healing Audio"]})})]})]}),e.jsxs(j,{className:"p-6",children:[e.jsxs("h2",{className:"text-lg font-semibold mb-4 flex items-center gap-2",children:[e.jsx($,{className:"w-5 h-5"}),"Existing Healing Audio (",m.length,")"]}),m.length===0?e.jsx("p",{className:"text-muted-foreground text-center py-8",children:"No healing audio added yet"}):e.jsx("div",{className:"space-y-3",children:m.map(a=>e.jsx("div",{className:"p-4 bg-muted/30 rounded-lg border border-border/50",children:e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-medium text-foreground",children:a.title}),e.jsxs("div",{className:"text-sm text-muted-foreground",children:[Math.floor(a.duration_seconds/60),":",(a.duration_seconds%60).toString().padStart(2,"0")," •"," ",a.category," •"," ",e.jsx("span",{className:a.required_tier==="free"||!a.required_tier&&a.is_free?"text-green-500":"text-[#D4AF37]",children:_.find(t=>t.value===(a.required_tier||(a.is_free?"free":"prana-flow")))?.label??"Atma-Seed"}),!(a.required_tier==="free"||!a.required_tier&&a.is_free)&&e.jsxs(e.Fragment,{children:[" · ",e.jsxs("span",{children:["$",a.price_usd]})]})]}),a.description&&e.jsx("p",{className:"text-xs text-muted-foreground mt-1 line-clamp-2",children:a.description})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(l,{variant:"outline",size:"sm",onClick:()=>S(a),children:[e.jsx(G,{className:"w-4 h-4 mr-1"}),"Edit"]}),e.jsx(l,{variant:"ghost",size:"icon",onClick:()=>E(a.id),className:"text-destructive hover:text-destructive",children:e.jsx(B,{className:"w-4 h-4"})})]})]})},a.id))})]}),e.jsx(R,{open:C,onOpenChange:f,children:e.jsxs(O,{className:"w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[100] bg-background border rounded-lg shadow-lg",children:[e.jsxs(U,{children:[e.jsx(M,{children:"Database Migration SQL"}),e.jsx(H,{children:"Copy this SQL and run it in Supabase SQL Editor to add the script_text column"})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Steps: 1) Copy SQL below → 2) Go to Supabase Dashboard → SQL Editor → 3) Paste & Run → 4) Refresh this page"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(l,{variant:"outline",size:"sm",onClick:async()=>{try{await navigator.clipboard.writeText(w),s({title:"SQL Copied!",description:"Now paste it into Supabase SQL Editor",variant:"default"})}catch{s({title:"Copy Failed",description:"Please manually select and copy the SQL",variant:"destructive"})}},children:[e.jsx(X,{className:"w-4 h-4 mr-2"}),"Copy SQL"]}),e.jsxs(l,{variant:"outline",size:"sm",onClick:()=>window.open("https://supabase.com/dashboard/project/_/sql","_blank"),children:[e.jsx(V,{className:"w-4 h-4 mr-2"}),"Open SQL Editor"]})]})]}),e.jsx("div",{className:"relative",children:e.jsx(x,{value:w,readOnly:!0,className:"font-mono text-xs h-[400px] bg-muted",onClick:a=>a.target.select()})}),e.jsx("div",{className:"bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4",children:e.jsxs("p",{className:"text-sm text-blue-900 dark:text-blue-100",children:[e.jsx("strong",{children:"After running the SQL:"})," Refresh this page and the script_text column will be available. You'll be able to add and save scripts for your healing audio entries."]})}),e.jsx("div",{className:"flex justify-end gap-2",children:e.jsx(l,{variant:"outline",onClick:()=>{f(!1),setTimeout(()=>h(),1e3)},children:"Done - Refresh Page"})})]})]})})]})})};export{he as default};
