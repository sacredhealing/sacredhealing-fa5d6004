import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { TRANSMISSION_SCRIPTS } from './vastuConstants';
import { useTranslation } from '@/hooks/useTranslation';

// ─────────────────────────────────────────────────────────────────
// SQI 2050 · VASTU CHAT
// Siddha-Gold  #D4AF37  │  Akasha-Black  #050505
// Glass        rgba(255,255,255,0.025)
// Border       rgba(255,255,255,0.07)
// Vayu-Cyan    #22D3EE  (scanner pulses only)
// ─────────────────────────────────────────────────────────────────

export interface VastuMessage {
  role: 'user' | 'model';
  text: string;
  images?: string[];
  timestamp: number;
}

const GOLD      = '#D4AF37';
const AKASHA    = '#050505';
const GLASS     = 'rgba(255,255,255,0.025)';
const BORDER    = 'rgba(255,255,255,0.07)';
const GOLD_DIM  = 'rgba(212,175,55,0.12)';
const GOLD_GLOW = 'rgba(212,175,55,0.35)';
const BODY_TEXT = 'rgba(255,255,255,0.55)';
const MUTED     = 'rgba(255,255,255,0.28)';

const lbl: React.CSSProperties = {
  fontSize:'8px', fontWeight:800, letterSpacing:'0.5em',
  textTransform:'uppercase', color: GOLD, margin:0,
};

/* ─────────────────────────────────────────────────────────────── */
/* AUDIO TRANSMISSION CARD                                         */
/* ─────────────────────────────────────────────────────────────── */
interface AudioTransmissionCardProps { id: number; title: string; }

const AudioTransmissionCard: React.FC<AudioTransmissionCardProps> = ({ id, title }) => {
  const { t } = useTranslation();
  const [showScript, setShowScript]     = useState(false);
  const [isRecording, setIsRecording]   = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mrRef    = useRef<MediaRecorder | null>(null);
  const chunks   = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mrRef.current = mr; chunks.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => { setRecordedBlob(new Blob(chunks.current,{type:'audio/webm'})); stream.getTracks().forEach(t=>t.stop()); };
      mr.start(); setIsRecording(true);
    } catch { alert(t('vastuChat.micRequired', 'Microphone access is required to record your transmission.')); }
  };
  const stopRecording = () => { if (mrRef.current && isRecording) { mrRef.current.stop(); setIsRecording(false); } };
  const playRecording = () => { if (recordedBlob) new Audio(URL.createObjectURL(recordedBlob)).play(); };

  const scriptData = TRANSMISSION_SCRIPTS[id];

  return (
    <div style={{
      margin:'16px 0', background:'rgba(212,175,55,0.03)',
      border:'1px solid rgba(212,175,55,0.18)', borderRadius:'20px',
      overflow:'hidden', position:'relative',
    }}>
      <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:'1px',
        background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)' }} />
      <div style={{ padding:'16px', display:'flex', alignItems:'flex-start', gap:'12px', flexWrap:'wrap' }}>
        <div style={{ width:44, height:44, borderRadius:'14px', flexShrink:0,
          background: GOLD_DIM, border:'1px solid rgba(212,175,55,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'22px', boxShadow:'0 0 20px rgba(212,175,55,0.15)' }}>🕉</div>
        <div style={{ flexGrow:1 }}>
          <p style={{ ...lbl, marginBottom:'6px' }}>{t('vastuChat.soundAlchemyLayer', { defaultValue: 'Sound Alchemy Layer: {{lid}}', lid: String(id) })}</p>
          <h3 style={{ fontFamily:'Georgia,serif', fontSize:'18px', fontWeight:600,
            color:'#fff', letterSpacing:'-0.01em', margin:'0 0 8px' }}>{title}</h3>
          <p style={{ fontSize:'12px', color: BODY_TEXT, lineHeight:1.7, margin:'0 0 16px' }}>
            {t('vastuChat.recordBeejaDesc', 'Record the Beeja Mantras into this sanctuary. Vibrate your intention into the physical walls.')}
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            <button onClick={() => setShowScript(v=>!v)} style={{
              padding:'8px 18px', borderRadius:'100px', cursor:'pointer',
              fontSize:'10px', fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase',
              background: GLASS, border:`1px solid ${BORDER}`, color:'rgba(255,255,255,0.65)', fontFamily:'inherit',
            }}>{showScript ? `📖 ${t('vastuChat.sealScript', 'Seal Script')}` : `📜 ${t('vastuChat.unveilScript', 'Unveil Script')}`}</button>
            {!isRecording
              ? <button onClick={startRecording} style={{
                  padding:'8px 18px', borderRadius:'100px', cursor:'pointer',
                  fontSize:'10px', fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase',
                  background:`linear-gradient(135deg,${GOLD},#b8962a)`, border:'none',
                  color: AKASHA, fontFamily:'inherit', boxShadow:`0 0 20px ${GOLD_GLOW}` }}>
                  🔴 {t('vastuChat.performTransmission', 'Perform Transmission')}</button>
              : <button onClick={stopRecording} style={{
                  padding:'8px 18px', borderRadius:'100px', cursor:'pointer',
                  fontSize:'10px', fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase',
                  background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.4)',
                  color:'#ef4444', fontFamily:'inherit', animation:'sqiPulse 1.5s ease infinite' }}>
                  ⏹ {t('vastuChat.sealRecording', 'Seal Recording')}</button>}
            {recordedBlob && !isRecording && (
              <button onClick={playRecording} style={{
                padding:'8px 18px', borderRadius:'100px', cursor:'pointer',
                fontSize:'10px', fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase',
                background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.3)',
                color:'#22D3EE', fontFamily:'inherit' }}>▶ {t('vastuChat.reviewFrequency', 'Review Frequency')}</button>)}
          </div>
        </div>
      </div>
      {showScript && scriptData && (
        <div style={{ background:'rgba(212,175,55,0.03)', borderTop:'1px solid rgba(212,175,55,0.12)', padding:'20px' }}>
          <p style={{ ...lbl, marginBottom:'12px' }}>📜 {t('vastuChat.sacredScript', 'Sacred Script')}</p>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'14px', fontStyle:'italic',
            color:'rgba(255,255,255,0.7)', lineHeight:1.8, margin:'0 0 14px' }}>"{scriptData.script}"</p>
          <p style={{ ...lbl, color: MUTED }}>{t('vastuChat.speakSlowly', 'Speak slowly. Let the sound emerge from your heart center.')}</p>
        </div>)}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────── */
/* MARKDOWN — logic unchanged, SQI 2050 colours                   */
/* ─────────────────────────────────────────────────────────────── */
const inlineMd = (text: string): React.ReactNode => text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p,i)=>{
  if (p.startsWith('**')&&p.endsWith('**')) return <strong key={i} style={{fontWeight:800,color:GOLD,textDecoration:'underline',textDecorationColor:'rgba(212,175,55,0.3)'}}>{p.slice(2,-2)}</strong>;
  if (p.startsWith('*')&&p.endsWith('*')) return <em key={i} style={{fontStyle:'italic',color:'rgba(255,255,255,0.8)'}}>{p.slice(1,-1)}</em>;
  if (p.startsWith('`')&&p.endsWith('`')) return <code key={i} style={{background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.2)',padding:'1px 6px',borderRadius:'6px',fontSize:'11px',fontFamily:'monospace',color:GOLD}}>{p.slice(1,-1)}</code>;
  return p;
});

const renderMd = (text: string): React.ReactNode[] => text.split('\n').map((line,i)=>{
  if (line.startsWith('### ')) return <h3 key={i} style={{fontSize:'14px',fontWeight:800,marginTop:'18px',marginBottom:'6px',color:GOLD}}>{line.slice(4)}</h3>;
  if (line.startsWith('## '))  return <h2 key={i} style={{fontFamily:'Georgia,serif',fontSize:'18px',fontWeight:600,marginTop:'22px',marginBottom:'10px',color:'#fff'}}>{line.slice(3)}</h2>;
  if (line.startsWith('# '))   return <h1 key={i} style={{fontFamily:'Georgia,serif',fontSize:'22px',fontWeight:300,fontStyle:'italic',color:GOLD,textShadow:'0 0 20px rgba(212,175,55,0.3)',borderBottom:'1px solid rgba(212,175,55,0.15)',paddingBottom:'10px',margin:'24px 0 12px'}}>{line.slice(2)}</h1>;
  if (line.startsWith('> '))   return <blockquote key={i} style={{borderLeft:`3px solid ${GOLD}`,background:'rgba(212,175,55,0.04)',padding:'12px 18px',fontFamily:'Georgia,serif',fontStyle:'italic',fontSize:'13px',color:'rgba(255,255,255,0.7)',margin:'14px 0',borderRadius:'0 12px 12px 0'}}>{line.slice(2)}</blockquote>;
  if (line.startsWith('- ')||line.startsWith('* ')) return <li key={i} style={{marginLeft:'20px',listStyleType:'disc',fontSize:'13px',marginBottom:'4px',color:BODY_TEXT}}>{inlineMd(line.slice(2))}</li>;
  if (/^\d+\.\s/.test(line)) return <li key={i} style={{marginLeft:'20px',listStyleType:'decimal',fontSize:'13px',marginBottom:'4px',color:BODY_TEXT}}>{inlineMd(line.replace(/^\d+\.\s/,''))}</li>;
  if (line.trim()==='') return <div key={i} style={{height:'8px'}} />;
  return <p key={i} style={{fontSize:'13px',lineHeight:1.8,marginBottom:'6px',color:BODY_TEXT}}>{inlineMd(line)}</p>;
});

/* renderMessageContent — LOGIC UNCHANGED */
const renderMsgContent = (text: string): React.ReactNode => {
  const cleaned = text.replace(/\[MODULE_START:\s*\d+\]/g,'').replace(/\[MODULE_COMPLETE:\s*\d+\]/g,'');
  const re = /\[AUDIO:\s*(\d+)\s*-\s*([^\]]+)\]/g;
  const parts: Array<{type:'text'|'audio';content?:string;id?:number;title?:string}> = [];
  let last=0, m;
  while((m=re.exec(cleaned))!==null){
    if(m.index>last) parts.push({type:'text',content:cleaned.substring(last,m.index)});
    parts.push({type:'audio',id:parseInt(m[1]),title:m[2].trim()});
    last=re.lastIndex;
  }
  const rem=cleaned.substring(last); if(rem) parts.push({type:'text',content:rem});
  if(parts.length===0) return <div>{renderMd(cleaned)}</div>;
  return <>{parts.map((p,i)=>{
    if(p.type==='text'&&p.content) return <div key={i}>{renderMd(p.content)}</div>;
    if(p.type==='audio'&&p.id!==undefined&&p.title) return <AudioTransmissionCard key={i} id={p.id} title={p.title}/>;
    return null;
  })}</>;
};

/* ─────────────────────────────────────────────────────────────── */
/* WELCOME SCREEN — SQI 2050 full drama                           */
/* ─────────────────────────────────────────────────────────────── */
const WelcomeScreen: React.FC<{onSendMessage:(t:string)=>void}> = ({onSendMessage}) => {
  const { t } = useTranslation();
  const ctaCards = [
    {
      label: t('vastuChat.welcomeCard1Label', 'Initiate Path →'),
      title: t('vastuChat.welcomeCard1Title', 'The Living Field'),
      icon: '🏛️',
      desc: t('vastuChat.welcomeCard1Desc', "Begin Module 1: Overview of your home's energetic anatomy."),
      msg: t('vastuChat.welcomeCard1Msg', 'Architect, I am ready to begin the transformation. Open the first module.'),
    },
    {
      label: t('vastuChat.welcomeCard2Label', 'Third Eye Audit →'),
      title: t('vastuChat.welcomeCard2Title', '360° Diagnostic'),
      icon: '👁️',
      desc: t('vastuChat.welcomeCard2Desc', 'Upload multiple photos for complete spatial synthesis.'),
      msg: t('vastuChat.welcomeCard2Msg', 'I have photos of my room from multiple angles. I request a holistic Diagnostic Darshan.'),
    },
  ];
  return (
  <div style={{
    flex:1, display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'flex-start', textAlign:'center', padding:'16px 16px',
    maxWidth:'620px', margin:'0 auto', width:'100%', minHeight:0,
    overflowY:'auto',
  }}>
    {/* Animated Yantra */}
    <div style={{position:'relative',width:90,height:90,marginBottom:'16px',flexShrink:0}}>
      {[0,14,30].map((inset,i)=>(
        <div key={i} aria-hidden style={{
          position:'absolute', inset, borderRadius:'50%',
          border:`1px solid ${i===2?'rgba(34,211,238,0.2)':`rgba(212,175,55,${0.28-i*0.08})`}`,
          animation:`sqiSpin ${[32,20,14][i]}s linear ${i%2===1?'reverse':'normal'} infinite`,
        }}/>
      ))}
      <div style={{
        position:'absolute', inset:28, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(212,175,55,0.15) 0%,transparent 70%)',
        border:'1px solid rgba(212,175,55,0.45)',
        boxShadow:'0 0 40px rgba(212,175,55,0.2),inset 0 0 20px rgba(212,175,55,0.07)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <span style={{fontSize:26,animation:'sqiBreathe 4s ease infinite',display:'block',
          filter:`drop-shadow(0 0 10px ${GOLD})`}}>᯽</span>
      </div>
      {/* cardinal glyph markers */}
      {[['N','50%','2px','auto','auto','translateX(-50%)'],
        ['S','50%','auto','2px','auto','translateX(-50%)'],
        ['E','auto','50%','auto','2px','translateY(-50%)'],
        ['W','auto','50%','2px','auto','translateY(-50%)']].map(([d,l,t,b,r,tf])=>(
        <span key={d as string} style={{position:'absolute',fontSize:'7px',fontWeight:800,
          letterSpacing:'0.3em',color:'rgba(212,175,55,0.6)',
          left:l as string,top:t as string,bottom:b as string,right:r as string,transform:tf as string}}>{d}</span>
      ))}
    </div>

    {/* eyebrow */}
    <div style={{
      display:'inline-flex', alignItems:'center', gap:'8px',
      fontSize:'8px', fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase',
      color: GOLD, background: GOLD_DIM,
      border:'1px solid rgba(212,175,55,0.22)', borderRadius:'100px',
      padding:'7px 18px', marginBottom:'12px',
    }}>
      <span style={{width:5,height:5,borderRadius:'50%',background:GOLD,
        boxShadow:`0 0 8px ${GOLD}`,display:'inline-block',animation:'sqiPulse 2s ease infinite'}}/>
      {t('vastuChat.welcomeEyebrow', 'Akasha-Neural Archive · Active')}
      <span style={{width:5,height:5,borderRadius:'50%',background:GOLD,
        boxShadow:`0 0 8px ${GOLD}`,display:'inline-block',animation:'sqiPulse 2s 1s ease infinite'}}/>
    </div>

    {/* title */}
    <h2 style={{
      fontFamily:'Georgia,serif', fontSize:'clamp(22px,5vw,34px)',
      fontWeight:300, fontStyle:'italic', letterSpacing:'-0.02em',
      color:'#fff', margin:'0 0 8px',
      textShadow:'0 0 60px rgba(212,175,55,0.2)',
    }}>The Siddha Architect</h2>

    <p style={{fontSize:'13px',color:BODY_TEXT,lineHeight:1.7,margin:'0 0 20px',maxWidth:'400px'}}>
      Welcome, Initiate. We do not just decorate; we consecrate.
      Prepare to align your physical realm with cosmic abundance.
    </p>

    {/* CTA cards */}
    <div style={{
      display:'grid', gridTemplateColumns:'1fr 1fr',
      gap:'8px', width:'100%', maxWidth:'490px',
    }}>
      {[
        { label:'Initiate Path →', title:'The Living Field', icon:'🏛️',
          desc:"Begin Module 1: Overview of your home's energetic anatomy.",
          msg:'Architect, I am ready to begin the transformation. Open the first module.' },
        { label:'Third Eye Audit →', title:'360° Diagnostic', icon:'👁️',
          desc:'Upload multiple photos for complete spatial synthesis.',
          msg:'I have photos of my room from multiple angles. I request a holistic Diagnostic Darshan.' },
      ].map(card=>(
        <button key={card.label} onClick={()=>onSendMessage(card.msg)} style={{
          padding:'14px 12px', textAlign:'left', cursor:'pointer',
          background: GLASS, border:`1px solid ${BORDER}`, borderRadius:'24px',
          fontFamily:'inherit', transition:'all 0.25s',
        }}
          onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;
            b.style.borderColor='rgba(212,175,55,0.35)';b.style.background='rgba(212,175,55,0.05)';
            b.style.transform='translateY(-3px)';b.style.boxShadow='0 12px 40px rgba(212,175,55,0.1)';}}
          onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;
            b.style.borderColor=BORDER;b.style.background=GLASS;
            b.style.transform='none';b.style.boxShadow='none';}}
        >
          <div style={{fontSize:'22px',marginBottom:'8px',
            filter:`drop-shadow(0 0 8px ${GOLD_GLOW})`}}>{card.icon}</div>
          <p style={{...lbl,marginBottom:'4px',fontSize:'7px'}}>{card.label}</p>
          <p style={{fontSize:'13px',fontWeight:700,letterSpacing:'-0.02em',
            color:'#fff',margin:'0 0 4px'}}>{card.title}</p>
          <p style={{fontSize:'10px',color:MUTED,lineHeight:1.5,margin:0}}>{card.desc}</p>
        </button>
      ))}
    </div>

    {/* directional compass strip */}
    <div style={{display:'flex',gap:'14px',marginTop:'16px',flexWrap:'wrap',
      justifyContent:'center',opacity:.55}} className="hidden sm:flex">
      {[
        ['💧', t('vastuChat.compassWealthN', 'Wealth · N'), '#60a5fa'],
        ['🔥', t('vastuChat.compassEnergySE', 'Energy · SE'), '#f87171'],
        ['⛰', t('vastuChat.compassStabilitySW', 'Stability · SW'), GOLD],
        ['☀️', t('vastuChat.compassGraceNE', 'Grace · NE'), '#fbbf24'],
      ].map(([icon,label,color])=>(
        <div key={label as string} style={{display:'flex',alignItems:'center',gap:'4px'}}>
          <span style={{fontSize:'11px',color:color as string}}>{icon}</span>
          <span style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.35em',
            textTransform:'uppercase',color:MUTED}}>{label}</span>
        </div>
      ))}
    </div>
  </div>
  );
};

/* ─────────────────────────────────────────────────────────────── */
/* MAIN CHAT WINDOW                                                */
/* ─────────────────────────────────────────────────────────────── */
interface VastuChatWindowProps {
  messages: VastuMessage[];
  onSendMessage: (text: string, images?: string[]) => void;
  isThinking: boolean;
}

export const VastuChatWindow: React.FC<VastuChatWindowProps> = ({
  messages, onSendMessage, isThinking,
}) => {
  const { t } = useTranslation();
  const [inputValue,setInputValue]         = useState('');
  const [selectedImages,setSelectedImages] = useState<string[]>([]);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scrollRef.current || (messages.length === 0 && !isThinking)) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  /* handlers: LOGIC UNCHANGED */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!inputValue.trim()&&selectedImages.length===0) return;
    onSendMessage(inputValue, selectedImages.length>0 ? selectedImages : undefined);
    setInputValue(''); setSelectedImages([]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files||[]).forEach(f=>{
      const r=new FileReader();
      r.onloadend=()=>setSelectedImages(p=>[...p,r.result as string]);
      r.readAsDataURL(f);
    });
    e.target.value='';
  };
  const removeImage = (i: number) => setSelectedImages(p=>p.filter((_,j)=>j!==i));

  const canSubmit = (inputValue.trim() || selectedImages.length > 0) && !isThinking;

  return (
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0,
      background: AKASHA, overflow:'hidden', position:'relative'}}>

      {/* gold shimmer line top */}
      <div aria-hidden style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
        width:'60%',height:'1px',
        background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)',
        pointerEvents:'none',zIndex:2}}/>

      {/* ── MESSAGES ── */}
      <div ref={scrollRef} style={{
        flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden',
        padding:'16px 12px', WebkitOverflowScrolling:'touch',
        display:'flex', flexDirection:'column', gap:'14px',
        scrollbarWidth:'none',
      }}>
        {messages.length===0 && <WelcomeScreen onSendMessage={onSendMessage}/>}

        {messages.map((msg,idx)=>(
          <motion.div key={idx}
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
            transition={{duration:0.3,ease:'easeOut'}}
            style={{display:'flex',
              justifyContent:msg.role==='user'?'flex-end':'flex-start',
              alignItems:'flex-end',gap:'10px'}}>

            {msg.role==='model' && (
              <div style={{width:36,height:36,borderRadius:'12px',flexShrink:0,
                background:GOLD_DIM,border:'1px solid rgba(212,175,55,0.25)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',
                boxShadow:'0 0 14px rgba(212,175,55,0.12)'}}>🕉</div>
            )}

            <div style={{
              maxWidth:'min(85%, 340px)', padding:'12px 14px',
              background: msg.role==='user'
                ? 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.07))'
                : GLASS,
              border:`1px solid ${msg.role==='user'?'rgba(212,175,55,0.28)':BORDER}`,
              borderRadius: msg.role==='user' ? '22px 22px 4px 22px' : '22px 22px 22px 4px',
              boxShadow: msg.role==='user'
                ? '0 4px 24px rgba(212,175,55,0.12)'
                : '0 4px 24px rgba(0,0,0,0.35)',
              backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            }}>
              {msg.images&&msg.images.length>0&&(
                <div style={{marginBottom:'12px',display:'grid',
                  gridTemplateColumns:'repeat(2,1fr)',gap:'8px'}}>
                  {msg.images.map((img,i)=>(
                    <div key={i} style={{borderRadius:'14px',overflow:'hidden',
                      border:'1px solid rgba(212,175,55,0.15)'}}>
                      <img src={img} alt={t('vastuChat.spaceImageAlt', { defaultValue: 'Space {{n}}', n: i + 1 })}
                        style={{width:'100%',height:'120px',objectFit:'cover'}}/>
                    </div>))}
                </div>)}

              <div>
                {msg.role==='user'
                  ? <p style={{fontSize:'13px',color:'rgba(255,255,255,0.88)',margin:0,lineHeight:1.7}}>{msg.text}</p>
                  : renderMsgContent(msg.text)}
              </div>

              <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',
                textTransform:'uppercase',color:MUTED,textAlign:'right',marginTop:'10px'}}>
                {new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · {t('vastuChat.transmissionStamp', 'Transmission')}
              </div>
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:36,height:36,borderRadius:'12px',
              background:GOLD_DIM,border:'1px solid rgba(212,175,55,0.25)',
              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Loader2 style={{width:16,height:16,color:GOLD,animation:'sqiSpin 1s linear infinite'}}/>
            </div>
            <div style={{padding:'14px 20px',background:GLASS,border:`1px solid ${BORDER}`,
              borderRadius:'20px 20px 20px 4px',display:'flex',alignItems:'center',gap:'12px',
              backdropFilter:'blur(20px)'}}>
              <div style={{display:'flex',gap:'4px'}}>
                {[0,0.15,0.3].map((d,i)=>(
                  <div key={i} style={{width:7,height:7,borderRadius:'50%',background:GOLD,
                    animation:`sqiBounce 0.8s ${d}s ease infinite`}}/>))}
              </div>
              <span style={{fontSize:'9px',fontWeight:800,letterSpacing:'0.35em',
                textTransform:'uppercase',color:MUTED}}>
                {t('vastuChat.analyzingField', 'Siddha Third Eye is analyzing your field…')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        flexShrink:0, padding:'8px 10px 10px',
        background:'rgba(255,255,255,0.015)',
        borderTop:`1px solid ${BORDER}`,
        backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}>
        <form onSubmit={handleSubmit} style={{maxWidth:'860px',margin:'0 auto',width:'100%'}}>
          {selectedImages.length>0&&(
            <div style={{marginBottom:'12px',background:'rgba(212,175,55,0.04)',
              border:'1px solid rgba(212,175,55,0.15)',borderRadius:'18px',padding:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <p style={{...lbl}}>{t('vastuChat.multiViewReady', 'Multi-View Diagnostic Ready')}</p>
                <button type="button" onClick={()=>setSelectedImages([])} style={{
                  fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',
                  color:'rgba(239,68,68,0.8)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                  {t('vastuChat.clearAll', 'Clear All')}</button>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {selectedImages.map((img,i)=>(
                  <div key={i} style={{position:'relative',width:60,height:60,borderRadius:'12px',
                    overflow:'hidden',border:'1px solid rgba(212,175,55,0.2)'}}>
                    <img src={img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="Selected"/>
                    <button type="button" onClick={()=>removeImage(i)} style={{
                      position:'absolute',inset:0,background:'rgba(0,0,0,0.65)',
                      border:'none',cursor:'pointer',color:'#fff',fontSize:'12px',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      opacity:0,transition:'opacity 0.2s'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.opacity='1'}
                      onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity='0'}>✕</button>
                  </div>))}
                <button type="button" onClick={()=>fileInputRef.current?.click()} style={{
                  width:60,height:60,borderRadius:'12px',
                  border:'1px dashed rgba(212,175,55,0.25)',background:'rgba(212,175,55,0.04)',
                  color:'rgba(212,175,55,0.5)',fontSize:'20px',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>)}

          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <button type="button" onClick={()=>fileInputRef.current?.click()}
              title={t('vastuChat.uploadPhotosTitle', 'Upload room photos for diagnostic')}
              style={{flexShrink:0,width:44,height:44,borderRadius:'14px',
                background:GLASS,border:`1px solid ${BORDER}`,
                color:'rgba(255,255,255,0.45)',fontSize:'20px',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all 0.2s',fontFamily:'inherit'}}
              onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;
                b.style.background=GOLD_DIM;b.style.borderColor='rgba(212,175,55,0.3)';}}
              onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;
                b.style.background=GLASS;b.style.borderColor=BORDER;}}>📷</button>

            <div style={{flexGrow:1,position:'relative'}}>
              <input type="text" value={inputValue}
                onChange={e=>setInputValue(e.target.value)}
                placeholder={t('vastuChat.inputPlaceholder', 'Direct your inquiry to the Architect…')}
                disabled={isThinking}
                style={{width:'100%',background:GLASS,border:`1px solid ${BORDER}`,
                  borderRadius:'14px',padding:'12px 52px 12px 16px',
                  fontSize:'13px',color:'#fff',outline:'none',
                  fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.2s,box-shadow 0.2s'}}
                onFocus={e=>{e.target.style.borderColor='rgba(212,175,55,0.4)';
                  e.target.style.boxShadow='0 0 0 3px rgba(212,175,55,0.07)';}}
                onBlur={e=>{e.target.style.borderColor=BORDER;e.target.style.boxShadow='none';}}/>
              <button type="submit" disabled={!canSubmit} style={{
                position:'absolute',right:'8px',top:'8px',
                width:36,height:36,borderRadius:'12px',
                background: canSubmit ? `linear-gradient(135deg,${GOLD},#b8962a)` : 'rgba(255,255,255,0.05)',
                border:'none',
                color: canSubmit ? AKASHA : 'rgba(255,255,255,0.18)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontSize:'16px',fontWeight:900,
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all 0.2s',
                boxShadow: canSubmit ? `0 0 16px ${GOLD_GLOW}` : 'none',
              }}>↑</button>
            </div>
          </div>

            <div className="hidden sm:flex" style={{display:'none',justifyContent:'center',gap:'12px',
            marginTop:'8px',overflowX:'auto',flexWrap:'wrap',paddingBottom:'4px'}}>
            {[
              ['💧', t('vastuChat.quickWealthN', 'Wealth (N)'), '#60a5fa'],
              ['🔥', t('vastuChat.quickEnergySE', 'Energy (SE)'), '#f87171'],
              ['⛰', t('vastuChat.quickStabilitySW', 'Stability (SW)'), GOLD],
              ['☀️', t('vastuChat.quickGraceNE', 'Grace (NE)'), '#fbbf24'],
            ].map(([icon,label,color])=>(
              <div key={label as string} style={{display:'flex',alignItems:'center',gap:'5px',
                opacity:.35,whiteSpace:'nowrap',cursor:'default',transition:'opacity 0.2s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.opacity='0.85'}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.opacity='0.35'}>
                <span style={{fontSize:'11px',color:color as string}}>{icon}</span>
                <span style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',
                  textTransform:'uppercase',color:MUTED}}>{label}</span>
              </div>))}
          </div>
        </form>
        <input type="file" accept="image/*" multiple
          style={{display:'none'}} ref={fileInputRef} onChange={handleFileChange}/>
      </div>

      {/* KEYFRAMES */}
      <style>{`
        @keyframes sqiSpin    { to{transform:rotate(360deg)} }
        @keyframes sqiBreathe { 0%,100%{opacity:.8;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes sqiPulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes sqiBounce  { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-7px);opacity:1} }
      `}</style>
    </div>
  );
};
