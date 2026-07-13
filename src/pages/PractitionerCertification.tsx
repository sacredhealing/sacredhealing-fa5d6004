import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MONTHS } from '@/data/practitionerCertificationData';

type Lang = 'en' | 'sv' | 'no' | 'es';
const LANG_OPTS = [
  { code: 'en' as Lang, flag: '🇬🇧', label: 'English' },
  { code: 'sv' as Lang, flag: '🇸🇪', label: 'Svenska' },
  { code: 'no' as Lang, flag: '🇳🇴', label: 'Norsk' },
  { code: 'es' as Lang, flag: '🇪🇸', label: 'Español' },
];
const L = {
  monthLabel: { en:'MONTH', sv:'MÅNAD', no:'MÅNED', es:'MES' },
  init:       { en:'⚡ MONTHLY INITIATION', sv:'⚡ MÅNADSINITIERING', no:'⚡ MÅNEDLIG INNVIELSE', es:'⚡ INICIACIÓN MENSUAL' },
  teaching:   { en:'THE TEACHING', sv:'UNDERVISNINGEN', no:'UNDERVISNINGEN', es:'LA ENSEÑANZA' },
  weeks:      { en:'WEEK BY WEEK', sv:'VECKA FÖR VECKA', no:'UKE FOR UKE', es:'SEMANA A SEMANA' },
  med:        { en:'MEDITATION PRACTICE', sv:'MEDITATIONSÖVNING', no:'MEDITASJONSØVELSE', es:'MEDITACIÓN' },
  steps:      { en:'STEP-BY-STEP', sv:'STEG FÖR STEG', no:'TRINN FOR TRINN', es:'PASO A PASO' },
  mantra:     { en:'SACRED MANTRA', sv:'HELIG MANTRA', no:'HELLIG MANTRA', es:'MANTRA SAGRADO' },
  meaning:    { en:'MEANING', sv:'BETYDELSE', no:'BETYDNING', es:'SIGNIFICADO' },
  how:        { en:'HOW TO PRACTICE', sv:'HUR MAN PRAKTISERAR', no:'SLIK PRAKTISERER', es:'CÓMO PRACTICAR' },
  exercises:  { en:'PRACTICES & EXERCISES', sv:'ÖVNINGAR', no:'ØVELSER', es:'PRÁCTICAS' },
  reflect:    { en:'REFLECTION QUESTIONS', sv:'REFLEKTIONSFRÅGOR', no:'REFLEKSJONSSPØRSMÅL', es:'REFLEXIONES' },
  outcome:    { en:'MONTH OUTCOME', sv:'MÅNADSRESULTAT', no:'MÅNEDLIG RESULTAT', es:'RESULTADO DEL MES' },
  tabs:       { en:['CURRICULUM','INVEST','ABOUT'], sv:['KURSPLAN','INVESTERA','OM'], no:['PENSUM','INVESTER','OM'], es:['CURRÍCULO','INVERSIÓN','ACERCA'] },
  heroTitle:  { en:"The Siddha Healer's\nSovereign Path", sv:"Siddha-Helaren's\nSuveräna Väg", no:"Siddha-Heleren's\nSuverende Vei", es:"El Camino Soberano\ndel Sanador Siddha" },
  heroSub:    { en:'Complete 12-month healing education — full teachings, meditations, mantras and practices for every module', sv:'Komplett 12-månaders healingutbildning — fullständiga undervisningar, meditationer, mantran och övningar', no:'Komplett 12-måneders healingutdanning — fullstendige undervisninger, meditasjoner, mantras og øvelser', es:'Educación completa de sanación de 12 meses — enseñanzas, meditaciones, mantras y prácticas completas' },
  tags:       { en:['12 MONTHS','1 LIVE SESSION/MO','PERSONAL DIKSHA','CERTIFICATION'], sv:['12 MÅNADER','1 LIVESESSION/MÅN','PERSONLIG DIKSHA','CERTIFIERING'], no:['12 MÅNEDER','1 LIVØKT/MND','PERSONLIG DIKSHA','SERTIFISERING'], es:['12 MESES','1 SESIÓN EN VIVO/MES','DIKSHA PERSONAL','CERTIFICACIÓN'] },
  bestValue:  { en:'BEST VALUE', sv:'BÄST VÄRDE', no:'BEST VERDI', es:'MEJOR VALOR' },
  oneTime:    { en:'ONE-TIME PAYMENT', sv:'ENGÅNGSBETALNING', no:'ENGANGSBETALING', es:'PAGO ÚNICO' },
  fullYear:   { en:'Full year · Immediate access', sv:'Hela året · Omedelbar åtkomst', no:'Hele året · Umiddelbar tilgang', es:'Año completo · Acceso inmediato' },
  monthly:    { en:'MONTHLY PLAN', sv:'MÅNADSPLAN', no:'MÅNEDLIG PLAN', es:'PLAN MENSUAL' },
  perMonth:   { en:'per month · 12 months', sv:'per månad · 12 månader', no:'per måned · 12 måneder', es:'por mes · 12 meses' },
  enrollOnce: { en:'Enroll Now — €2,997', sv:'Anmäl dig — €2 997', no:'Meld deg på — €2 997', es:'Inscribirse — €2.997' },
  enrollM:    { en:'Start Monthly — €297/mo', sv:'Månadsvis — €297/mån', no:'Månedlig — €297/mnd', es:'Mensual — €297/mes' },
  processing: { en:'Processing...', sv:'Behandlar...', no:'Behandler...', es:'Procesando...' },
};
const t = (k: keyof typeof L, l: Lang) => (L[k] as Record<Lang,string>)[l] || (L[k] as Record<Lang,string>).en;
const ta = (k: 'tabs'|'tags', l: Lang) => (L[k] as Record<Lang,string[]>)[l] || (L[k] as Record<Lang,string[]>).en;



// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════
const PractitionerCertification = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<'onetime' | 'monthly' | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState<'curriculum' | 'invest' | 'about'>('curriculum');
  const [openMonth, setOpenMonth] = useState<number | null>(null);
  const [openSec, setOpenSec] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sqi_lang') as Lang | null;
    if (saved && ['en','sv','no','es'].includes(saved)) setLang(saved);
  }, []);

  const switchLang = (l: Lang) => { setLang(l); localStorage.setItem('sqi_lang', l); setLangOpen(false); };
  const toggleSec = (k: string) => setOpenSec(prev => prev === k ? null : k);

  const handleEnroll = async (paymentType: 'onetime' | 'monthly') => {
    if (!isAuthenticated) { toast.error('Please sign in to enroll'); return; }
    setIsLoading(paymentType);
    try {
      const { data, error } = await supabase.functions.invoke('create-certification-checkout', { body: { paymentType } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    } finally { setIsLoading(null); }
  };

  const cl = LANG_OPTS.find(l => l.code === lang)!;
  const tabs = ta('tabs', lang);

  return (
    <div style={{ background:'#050505', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'rgba(255,255,255,0.85)', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=Cinzel:wght@600&display=swap');
        *{box-sizing:border-box;} p{margin:0;}
        .gl{background:rgba(255,255,255,0.02);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.05);border-radius:36px;}
        .gs{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;}
        .lb{font-size:9px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.35);}
        .gw{color:#D4AF37;text-shadow:0 0 20px rgba(212,175,55,.4);}
        .fd{animation:fadeUp .4s ease forwards;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .mc{cursor:pointer;transition:all .25s;} .mc:hover{transform:translateY(-2px);}
        .tb{cursor:pointer;border:none;background:none;font-family:inherit;transition:all .25s;}
        .ab{cursor:pointer;background:none;border:none;width:100%;text-align:left;font-family:inherit;display:flex;align-items:center;justify-content:space-between;padding:11px 0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050505}::-webkit-scrollbar-thumb{background:rgba(212,175,55,.3);border-radius:2px}
        @keyframes rimG{0%,100%{box-shadow:0 0 12px rgba(212,175,55,.06)}50%{box-shadow:0 0 36px rgba(212,175,55,.2)}}
      `}</style>

      {/* STICKY HEADER */}
      <div style={{ position:'sticky',top:0,zIndex:100,background:'rgba(5,5,5,.93)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.04)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:800,letterSpacing:'.3em' }}>← BACK</button>
        <div style={{ position:'relative' }}>
          <button className="gs" onClick={() => setLangOpen(o=>!o)} style={{ padding:'6px 14px',cursor:'pointer',border:'none',background:'transparent',borderRadius:100,display:'flex',alignItems:'center',gap:6,fontFamily:'inherit' }}>
            <span style={{ fontSize:14 }}>{cl.flag}</span>
            <span className="lb">{lang.toUpperCase()}</span>
            <span style={{ color:'rgba(255,255,255,.3)',fontSize:10 }}>▾</span>
          </button>
          {langOpen && (
            <div style={{ position:'absolute',right:0,top:'calc(100% + 8px)',background:'#0d0d0d',border:'1px solid rgba(255,255,255,.08)',borderRadius:14,overflow:'hidden',zIndex:200,minWidth:140 }}>
              {LANG_OPTS.map(lo => (
                <button key={lo.code} onClick={() => switchLang(lo.code)} style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 16px',background:lang===lo.code?'rgba(212,175,55,.08)':'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>
                  <span style={{ fontSize:16 }}>{lo.flag}</span>
                  <span style={{ fontSize:11,fontWeight:600,color:lang===lo.code?'#D4AF37':'rgba(255,255,255,.6)' }}>{lo.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HERO */}
      <div style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.08) 0%,transparent 60%)',padding:'56px 20px 44px',textAlign:'center' }}>
        <div className="lb" style={{ marginBottom:14 }}>SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING</div>
        <div style={{ fontSize:52,marginBottom:12,filter:'drop-shadow(0 0 18px rgba(212,175,55,.4))' }}>☽✦☀</div>
        <h1 className="gw" style={{ fontSize:'clamp(26px,5vw,54px)',fontWeight:900,letterSpacing:'-.04em',lineHeight:1.08,marginBottom:12,whiteSpace:'pre-line' }}>{t('heroTitle',lang)}</h1>
        <p style={{ fontSize:14,color:'rgba(255,255,255,.45)',fontWeight:300,maxWidth:580,margin:'0 auto 24px',lineHeight:1.7 }}>{t('heroSub',lang)}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
          {ta('tags',lang).map(tag => <span key={tag} className="gs" style={{ padding:'6px 14px',fontSize:9,fontWeight:800,letterSpacing:'.35em',color:'#D4AF37' }}>{tag}</span>)}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex',justifyContent:'center',gap:8,padding:'0 20px 30px' }}>
        {(['curriculum','invest','about'] as const).map((id,i) => (
          <button key={id} className="tb" onClick={() => setTab(id)}
            style={{ padding:'9px 18px',fontSize:9,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',borderRadius:100,
              color:tab===id?'#D4AF37':'rgba(255,255,255,.3)',
              border:`1px solid ${tab===id?'rgba(212,175,55,.3)':'rgba(255,255,255,.06)'}`,
              background:tab===id?'rgba(212,175,55,.06)':'none' }}>{tabs[i]}</button>
        ))}
      </div>

      <div style={{ maxWidth:820,margin:'0 auto',padding:'0 16px 120px' }}>

        {/* ── CURRICULUM ── */}
        {tab==='curriculum' && (
          <div className="fd">
            {MONTHS.map((mod,i) => {
              const title = (mod.title as Record<Lang,string>)[lang] || mod.title.en;
              const sub = (mod.sub as Record<Lang,string>)[lang] || mod.sub.en;
              const isOpen = openMonth === i;
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <div className="mc gl" onClick={() => setOpenMonth(isOpen?null:i)}
                    style={{ padding:'22px 22px 18px',borderRadius:26,border:`1px solid ${isOpen?'rgba(212,175,55,.28)':'rgba(255,255,255,.05)'}`,background:isOpen?'rgba(212,175,55,.04)':'rgba(255,255,255,.02)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                      <div>
                        <div className="lb" style={{ marginBottom:5 }}>{t('monthLabel',lang)} {mod.n}</div>
                        <div style={{ fontSize:26,color:mod.color,filter:`drop-shadow(0 0 6px ${mod.color}60)`,marginBottom:4 }}>{mod.glyph}</div>
                      </div>
                      <div className="lb" style={{ textAlign:'right',lineHeight:2.2 }}>{mod.theme.map((th,j)=><div key={j}>{th}</div>)}</div>
                    </div>
                    <h3 style={{ fontWeight:900,fontSize:16,letterSpacing:'-.02em',color:'#fff',marginBottom:3 }}>{title}</h3>
                    <p style={{ fontSize:12,color:'rgba(255,255,255,.38)',fontWeight:300,lineHeight:1.5 }}>{sub}</p>
                    <div style={{ marginTop:10,display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ height:1,flex:1,background:`linear-gradient(90deg,${mod.color}40,transparent)` }}/>
                      <span style={{ fontSize:9,fontWeight:800,letterSpacing:'.3em',color:mod.color }}>{isOpen?'CLOSE ↑':'OPEN ↓'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="fd" style={{ marginTop:6,display:'flex',flexDirection:'column',gap:8 }}>

                      {/* INITIATION */}
                      <div style={{ padding:'16px 18px',background:'rgba(212,175,55,.05)',borderRadius:14,borderLeft:`3px solid #D4AF37` }}>
                        <div className="lb" style={{ color:'#D4AF37',marginBottom:8 }}>{t('init',lang)}</div>
                        <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.75)' }}>{mod.initiation}</p>
                      </div>

                      {/* TEACHING */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`t${i}`)}>
                          <span className="lb" style={{ color:mod.color }}>{t('teaching',lang)}</span>
                          <span style={{ color:mod.color }}>{openSec===`t${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`t${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            {mod.teaching.split('\n\n').map((p,pi) => (
                              <p key={pi} style={{ fontSize:13,lineHeight:1.82,color:'rgba(255,255,255,.68)',marginBottom:pi<mod.teaching.split('\n\n').length-1?14:0 }}>{p}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* WEEKS */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`w${i}`)}>
                          <span className="lb" style={{ color:mod.color }}>{t('weeks',lang)}</span>
                          <span style={{ color:mod.color }}>{openSec===`w${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`w${i}` && (
                          <div style={{ padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:10 }}>
                            {mod.weeks.map((w,wi) => (
                              <div key={wi} style={{ padding:'14px 14px',background:'rgba(255,255,255,.02)',borderRadius:12,borderLeft:`2px solid ${mod.color}60` }}>
                                <div className="lb" style={{ color:mod.color,marginBottom:4 }}>WEEK {wi+1}</div>
                                <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,.8)',marginBottom:6 }}>{w.title}</div>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.62)' }}>{w.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* MEDITATION */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`m${i}`)}>
                          <span className="lb" style={{ color:'#22D3EE' }}>{t('med',lang)}</span>
                          <span style={{ color:'#22D3EE' }}>{openSec===`m${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`m${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            <div style={{ fontSize:14,fontWeight:800,color:'#fff',marginBottom:4 }}>{mod.meditation.name}</div>
                            <div className="lb" style={{ color:'rgba(255,255,255,.38)',marginBottom:14 }}>{mod.meditation.duration}</div>
                            <div className="lb" style={{ color:'#22D3EE',marginBottom:10 }}>{t('steps',lang)}</div>
                            {mod.meditation.steps.map((s,si) => (
                              <div key={si} style={{ display:'flex',gap:10,marginBottom:10,alignItems:'flex-start' }}>
                                <div style={{ flexShrink:0,width:20,height:20,borderRadius:'50%',background:'rgba(34,211,238,.12)',border:'1px solid rgba(34,211,238,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#22D3EE',marginTop:2 }}>{si+1}</div>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.65)' }}>{s}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* MANTRA */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`mn${i}`)}>
                          <span className="lb" style={{ color:'#D4AF37' }}>{t('mantra',lang)}</span>
                          <span style={{ color:'#D4AF37' }}>{openSec===`mn${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`mn${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            <div style={{ textAlign:'center',padding:'16px',background:'rgba(212,175,55,.05)',borderRadius:12,marginBottom:14,border:'1px solid rgba(212,175,55,.15)' }}>
                              <div style={{ fontSize:'clamp(16px,3.5vw,24px)',fontWeight:900,color:'#D4AF37',letterSpacing:'0.04em',marginBottom:6,textShadow:'0 0 20px rgba(212,175,55,.4)' }}>{mod.mantra.text}</div>
                              <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'0.12em' }}>PRONUNCIATION: {mod.mantra.pronunciation}</div>
                            </div>
                            {[{l:t('meaning',lang),v:mod.mantra.meaning},{l:t('how',lang),v:mod.mantra.practice},{l:'BENEFITS',v:mod.mantra.benefits}].map(row => (
                              <div key={row.l} style={{ marginBottom:12 }}>
                                <div className="lb" style={{ color:'#D4AF37',marginBottom:5 }}>{row.l}</div>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.65)' }}>{row.v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* EXERCISES */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`e${i}`)}>
                          <span className="lb" style={{ color:mod.color }}>{t('exercises',lang)}</span>
                          <span style={{ color:mod.color }}>{openSec===`e${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`e${i}` && (
                          <div style={{ padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:10 }}>
                            {mod.exercises.map((ex,ei) => {
                              const colon = ex.indexOf(':');
                              const ttl = colon>-1 ? ex.substring(0,colon) : `PRACTICE ${ei+1}`;
                              const body = colon>-1 ? ex.substring(colon+1).trim() : ex;
                              return (
                                <div key={ei} style={{ padding:'12px 14px',background:'rgba(255,255,255,.02)',borderRadius:12 }}>
                                  <div style={{ fontSize:10,fontWeight:800,letterSpacing:'0.2em',color:mod.color,marginBottom:6 }}>{ttl}</div>
                                  <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.62)' }}>{body}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* REFLECTIONS */}
                      <div className="gs">
                        <button className="ab" style={{ padding:'12px 16px' }} onClick={() => toggleSec(`r${i}`)}>
                          <span className="lb" style={{ color:'rgba(255,255,255,.5)' }}>{t('reflect',lang)}</span>
                          <span style={{ color:'rgba(255,255,255,.4)' }}>{openSec===`r${i}`?'▲':'▼'}</span>
                        </button>
                        {openSec===`r${i}` && (
                          <div style={{ padding:'0 16px 16px' }}>
                            {mod.reflections.map((q,qi) => (
                              <div key={qi} style={{ display:'flex',gap:10,marginBottom:10,alignItems:'flex-start' }}>
                                <span style={{ color:mod.color,flexShrink:0,fontSize:14,marginTop:2 }}>?</span>
                                <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.62)',fontStyle:'italic' }}>{q}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* OUTCOME */}
                      <div style={{ padding:'14px 16px',background:`rgba(212,175,55,.05)`,borderRadius:14,border:`1px solid rgba(212,175,55,.15)` }}>
                        <div className="lb" style={{ color:mod.color,marginBottom:6 }}>{t('outcome',lang)}</div>
                        <p style={{ fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.72)' }}>{mod.outcome}</p>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVEST ── */}
        {tab==='invest' && (
          <div className="fd">
            <h2 style={{ fontWeight:900,fontSize:28,letterSpacing:'-.03em',color:'#fff',marginBottom:6,textAlign:'center' }}>
              {lang==='sv'?'Investering i din healingresa':lang==='no'?'Investering i din helingsreise':lang==='es'?'Inversión en tu Camino':'Investment in Your Healing Path'}
            </h2>
            <p style={{ textAlign:'center',color:'rgba(255,255,255,.35)',fontSize:13,marginBottom:36 }}>
              {lang==='sv'?'Välj det betalningsalternativ som resonerar':lang==='no'?'Velg betalingsalternativet som resonerer':lang==='es'?'Elige la opción que resuene':'Choose the payment option that resonates'}
            </p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,maxWidth:660,margin:'0 auto' }}>
              <div className="gl" style={{ padding:'32px 26px',borderRadius:34,border:'1px solid rgba(212,175,55,.35)',background:'rgba(212,175,55,.04)',position:'relative',overflow:'hidden',animation:'rimG 4s ease-in-out infinite' }}>
                <div style={{ position:'absolute',top:16,right:16,padding:'4px 12px',borderRadius:100,background:'#D4AF37',fontSize:9,fontWeight:800,letterSpacing:'.3em',color:'#050505' }}>{t('bestValue',lang)}</div>
                <div style={{ textAlign:'center',marginBottom:22 }}>
                  <div className="lb" style={{ marginBottom:8 }}>{t('oneTime',lang)}</div>
                  <div className="gw" style={{ fontSize:46,fontWeight:900,letterSpacing:'-.03em',marginBottom:4 }}>€2,997</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>{t('fullYear',lang)}</div>
                </div>
                {[
                  lang==='sv'?'Spara €567 jämfört med månadsplan':lang==='no'?'Spar €567 vs månedlig':lang==='es'?'Ahorra €567 vs plan mensual':'Save €567 vs monthly plan',
                  lang==='sv'?'Omedelbar full tillgång till alla 12 månader':lang==='no'?'Umiddelbar full tilgang':lang==='es'?'Acceso inmediato a los 12 meses':'Immediate access to all 12 months',
                  lang==='sv'?'Alla bonusar och gemenskapsåtkomst':lang==='no'?'Alle bonuser og fellesskaptilgang':lang==='es'?'Todos los bonos y comunidad':'All bonuses and community included',
                  lang==='sv'?'Personlig diksha varje månad':lang==='no'?'Personlig diksha hver måned':lang==='es'?'Diksha personal cada mes':'Personal diksha every month',
                ].map((b,ii) => (
                  <div key={ii} style={{ display:'flex',gap:10,marginBottom:9,alignItems:'flex-start' }}>
                    <span style={{ color:'#D4AF37',fontSize:12,flexShrink:0,marginTop:2 }}>◆</span>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.5 }}>{b}</p>
                  </div>
                ))}
                <button onClick={() => handleEnroll('onetime')} disabled={isLoading!==null}
                  style={{ width:'100%',marginTop:22,padding:'14px 20px',borderRadius:100,background:'#D4AF37',border:'none',color:'#050505',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,letterSpacing:'.3em',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?0.7:1 }}>
                  {isLoading==='onetime'?t('processing',lang):t('enrollOnce',lang)}
                </button>
              </div>
              <div className="gl" style={{ padding:'32px 26px',borderRadius:34 }}>
                <div style={{ textAlign:'center',marginBottom:22 }}>
                  <div className="lb" style={{ marginBottom:8 }}>{t('monthly',lang)}</div>
                  <div style={{ fontSize:46,fontWeight:900,letterSpacing:'-.03em',color:'#fff',marginBottom:4 }}>€297</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>{t('perMonth',lang)}</div>
                </div>
                {[
                  lang==='sv'?'Flexibel betalningsplan':lang==='no'?'Fleksibel betalingsplan':lang==='es'?'Plan de pago flexible':'Flexible payment plan',
                  lang==='sv'?'Månadsvis innehållsåtkomst':lang==='no'?'Månedlige innholdslåsninger':lang==='es'?'Contenido mensual desbloqueado':'Monthly content unlocks',
                  lang==='sv'?'Alla bonusar ingår':lang==='no'?'Alle bonuser inkludert':lang==='es'?'Todos los bonos incluidos':'All bonuses included',
                  lang==='sv'?'Personlig diksha varje månad':lang==='no'?'Personlig diksha hver måned':lang==='es'?'Diksha personal cada mes':'Personal diksha every month',
                ].map((b,ii) => (
                  <div key={ii} style={{ display:'flex',gap:10,marginBottom:9,alignItems:'flex-start' }}>
                    <span style={{ color:'rgba(255,255,255,.4)',fontSize:12,flexShrink:0,marginTop:2 }}>◆</span>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,.55)',lineHeight:1.5 }}>{b}</p>
                  </div>
                ))}
                <button onClick={() => handleEnroll('monthly')} disabled={isLoading!==null}
                  style={{ width:'100%',marginTop:22,padding:'14px 20px',borderRadius:100,background:'none',border:'1px solid rgba(212,175,55,.4)',color:'#D4AF37',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,letterSpacing:'.3em',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?0.7:1 }}>
                  {isLoading==='monthly'?t('processing',lang):t('enrollM',lang)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {tab==='about' && (
          <div className="fd">
            <div className="gl" style={{ padding:'34px 30px',borderRadius:36,marginBottom:14 }}>
              <div className="lb" style={{ color:'#D4AF37',marginBottom:14 }}>
                {lang==='sv'?'HEALERNS LÖFTE':lang==='no'?'HELERERENS LØFTE':lang==='es'?'LA PROMESA DEL SANADOR':"THE HEALER'S PROMISE"}
              </div>
              <p style={{ fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.65)',fontWeight:300,marginBottom:14 }}>
                This is not a certification course. This is a <span style={{ color:'#D4AF37',fontWeight:600 }}>living transmission</span> — a 12-month initiation into the Siddha healing lineage through the direct field of Kritagya Das (Shiva Siddhananda) and Laila Amrouche.
              </p>
              <p style={{ fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.65)',fontWeight:300,marginBottom:14 }}>
                Each module contains <span style={{ color:'#D4AF37',fontWeight:600 }}>complete written teachings</span>, a week-by-week breakdown, step-by-step meditation instructions, full mantra guidance (meaning, pronunciation, how to practice, benefits), detailed exercises and partner practices, deep reflection questions, and a clear monthly outcome.
              </p>
              <p style={{ fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.65)',fontWeight:300 }}>
                Students who complete all 12 months receive the <span style={{ color:'#D4AF37',fontWeight:600 }}>Siddha Healer Certification</span> and lineage blessing in a live ceremony with Kritagya and Laila.
              </p>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {[
                { icon:'◎', label:'LIVE SESSION', desc:'1× monthly group session with Kritagya & Laila — teaching, transmission, Q&A' },
                { icon:'✦', label:'PERSONAL DIKSHA', desc:'Monthly initiation and personal transmission for each student, every month' },
                { icon:'〜', label:'FULL TEACHINGS', desc:'Complete written lesson content — not bullet points but full Siddha teachings' },
                { icon:'◈', label:'MEDITATION GUIDES', desc:'Step-by-step instructions for every meditation practice in every module' },
                { icon:'✡', label:'EXERCISES & PRACTICES', desc:'Detailed partner exercises, solo practices, weekly assignments each month' },
                { icon:'⬡', label:'CERTIFICATION', desc:'Siddha Healer Certificate and lineage blessing at month 12 live ceremony' },
              ].map((p,pi) => (
                <div key={pi} className="gs" style={{ padding:'20px 16px',textAlign:'center' }}>
                  <div style={{ fontSize:24,marginBottom:10,color:'#D4AF37',filter:'drop-shadow(0 0 8px rgba(212,175,55,.4))' }}>{p.icon}</div>
                  <div className="lb" style={{ color:'#D4AF37',marginBottom:6 }}>{p.label}</div>
                  <p style={{ fontSize:12,color:'rgba(255,255,255,.45)',lineHeight:1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign:'center',padding:'26px 20px',borderTop:'1px solid rgba(255,255,255,.04)' }}>
        <div style={{ fontSize:20,marginBottom:8,color:'#D4AF37',filter:'drop-shadow(0 0 8px rgba(212,175,55,.4))' }}>☽ OM ☀</div>
        <div className="lb">KRITAGYA DAS · LAILA AMROUCHE · SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING</div>
      </div>
    </div>
  );
};

export default PractitionerCertification;
