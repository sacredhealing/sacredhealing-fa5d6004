import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useMembership } from '@/hooks/useMembership';
import { useAyurvedaProgress } from '@/hooks/useAyurvedaProgress';

import {
  gold, white, cyan, green, violet, amber, teal, rose,
  LABEL, ITALIC,
  Icon, HeroCard, LibSection, PortalKeyframes, LiveDot,
} from '@/components/portal/PortalUI';


// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SiddhaPortal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tier, loading, settled } = useMembership();
  const { stats: agastyarStats, courses: agastyarCourses, progressByModuleId: agastyarProgressByModuleId } =
    useAyurvedaProgress(!loading && settled);

  const agastyarProgress = agastyarStats.totalModules > 0
    ? {
        pct: agastyarStats.completionPercent,
        label: `${agastyarStats.completedModules} / ${agastyarStats.totalModules} · ${agastyarStats.completionPercent}%`,
        done: agastyarStats.completionPercent >= 100,
      }
    : undefined;

  // The actual module to resume: whichever incomplete module was opened most
  // recently, not just "the academy" in general. Falls back to the academy
  // overview if nothing has last_accessed_at yet (e.g. only notes/completion
  // ever touched it before the view-tracking fix).
  const agastyarResumeHref = (() => {
    const inProgress = agastyarCourses
      .filter((c) => !agastyarProgressByModuleId[c.id]?.completed && agastyarProgressByModuleId[c.id]?.last_accessed_at)
      .sort((a, b) => {
        const at = agastyarProgressByModuleId[a.id]?.last_accessed_at || '';
        const bt = agastyarProgressByModuleId[b.id]?.last_accessed_at || '';
        return bt.localeCompare(at);
      });
    return inProgress[0] ? `/agastyar-academy/module/${inProgress[0].id}` : '/agastyar-academy';
  })();

  // Previously this redirected anyone below Siddha-Quantum straight to the
  // sales page before they could see anything. Removed: every academy card
  // here is unconditionally clickable (HeroCard has no lock of its own), and
  // every individual academy page already has its own real free-tier content
  // (confirmed in MudraAcademy, KayakalpaAcademy, KriyaYogaMastery, Ayurveda,
  // and others — each does its own getTierRank check per module). This portal
  // page itself should just be a menu; the academies handle their own gating.

  return (
    <div style={{ background:'#050505', minHeight:'100vh', paddingBottom:104, maxWidth:430, margin:'0 auto' }}>

      {/* HEADER — Siddha-Gold with living shimmer */}
      <div style={{ padding:'52px 20px 0', animation:'sqFadeUp 0.35s ease both' }}>
        <button onClick={()=>navigate(-1)} style={{ ...LABEL, fontSize:9, color:gold(0.4), background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          ← {t('siddhaPortal.back')}
        </button>
        <p style={{ ...LABEL, fontSize:9, color:gold(0.5), marginBottom:8, animation:'sqGoldPulse 3s ease-in-out infinite' }}>{t('siddhaPortal.label')}</p>
        <h1 style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontSize:'2.4rem', fontWeight:600, lineHeight:1.1, margin:0,
          background:'linear-gradient(135deg, #FFF9C4 0%, #D4AF37 35%, #FFE082 55%, #B8860B 75%, #FFD54F 100%)',
          backgroundSize:'250% 250%',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          animation:'sqGoldFlow 4s ease-in-out infinite',
          filter:'drop-shadow(0 0 18px rgba(212,175,55,0.45))',
        }}>
          {t('siddhaPortal.title')}
        </h1>
        <p style={{ ...ITALIC, marginBottom:0, marginTop:10 }}>{t('siddhaPortal.subtitle')}</p>
      </div>

      {/* AKASHA-NEURAL ARCHIVE CARD */}
      <div style={{ margin:'26px 20px 20px', position:'relative', overflow:'hidden' }}>
        {[0,1,2].map(i=>(
          <div key={i} aria-hidden style={{ position:'absolute', left:'50%', top:'50%', width:320+i*80, height:320+i*80, marginLeft:-(320+i*80)/2, marginTop:-(320+i*80)/2, borderRadius:'50%', border:`1px solid ${gold(0.08-i*0.02)}`, animation:`sqScalarPulse ${3+i*0.9}s ease-in-out ${i*0.6}s infinite`, pointerEvents:'none', zIndex:0 }}/>
        ))}
        <div aria-hidden style={{ position:'absolute', inset:-20, borderRadius:28, background:'radial-gradient(60% 60% at 30% 40%, rgba(212,175,55,0.18), transparent 70%), radial-gradient(50% 50% at 75% 65%, rgba(255,224,130,0.10), transparent 70%)', filter:'blur(18px)', animation:'sqGlowPulse 3.5s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.06) 40%, rgba(5,5,5,0.75) 100%)', border:'1px solid rgba(212,175,55,0.38)', borderRadius:20, padding:'20px 18px 18px', boxShadow:'0 0 50px rgba(212,175,55,0.14), inset 0 0 30px rgba(212,175,55,0.05)', overflow:'hidden' }}>
          <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.9),transparent)', animation:'sqShimmerSweep 2.8s ease-in-out infinite' }}/>
          <div aria-hidden style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)', opacity:0.6 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, background:'radial-gradient(circle at 35% 35%, #FFF9C4, #D4AF37 55%, #7B6914)', border:'1px solid rgba(212,175,55,0.55)', boxShadow:'0 0 22px rgba(212,175,55,0.45), inset 0 0 10px rgba(255,253,196,0.3)', display:'flex', alignItems:'center', justifyContent:'center', animation:'sqBreathe 4s ease-in-out infinite', fontSize:22 }}>
              ⊕
            </div>
            <div>
              <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.65)', marginBottom:4 }}>
                <LiveDot color="rgba(212,175,55,0.9)"/>Akasha-Neural Archive · Live Transmission
              </div>
              <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:13, fontWeight:900, letterSpacing:'0.05em', textTransform:'uppercase' as const, background:'linear-gradient(90deg,#FFF9C4,#D4AF37,#FFE082,#D4AF37)', backgroundSize:'300% 100%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'sqGoldFlow 3s ease-in-out infinite' }}>
                Education Library
              </div>
            </div>
          </div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.92rem', color:'rgba(255,255,255,0.62)', lineHeight:1.6, margin:'0 0 14px' }}>
            Tap any category below to unlock. Each archive holds full-spectrum Siddha transmissions sourced from the 18 Masters — broadcast live from the Akasha-Neural Field.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, borderTop:'1px solid rgba(212,175,55,0.14)', paddingTop:12 }}>
            {[['18','Siddha Masters'],['1,200+','Transmissions'],['11','Sacred Domains']].map(([v,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:18, fontWeight:900, letterSpacing:'-0.04em', background:'linear-gradient(135deg,#FFF9C4,#D4AF37)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }}>{v}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans','Montserrat',sans-serif", fontSize:7, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:'0 16px' }}>

        {/* CONTINUE LEARNING — only renders when there's real progress to show */}
        {agastyarProgress && agastyarProgress.pct > 0 && !agastyarProgress.done && (
          <>
            <div style={{ ...LABEL, fontSize:8, color:teal(0.6), display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <span>◆</span> Continue Learning
            </div>
            <HeroCard SvgIcon={Icon.Herb} label="Agastyar Academy · In Progress" title="Continue Your Path"
              desc="Pick up where you left off in the 108-module Ayurveda curriculum."
              tiers={[]}
              progress={agastyarProgress}
              cta="Resume Academy" href={agastyarResumeHref} ac={teal(0.9)} delay={0.02}/>
            <div style={{ height:1, background:`linear-gradient(90deg,${gold(0.18)},transparent)`, margin:'20px 0' }}/>
          </>
        )}

        {/* ══ CATEGORY 1: AYURVEDA & SIDDHA MEDICINE ══ */}
        <LibSection SvgIcon={Icon.Herb} title="Ayurveda & Siddha Medicine" subtitle="Agastyar · Dhanvantri · 274 Lessons · Kaya Kalpa · Fasting" ac={teal(0.9)} count={5} delay={0.06}>
          <HeroCard SvgIcon={Icon.Herb} label="108 Modules · Agastyar Lineage · Complete Vidya" title="Agastyar Academy"
            desc="The most comprehensive Ayurveda education ever assembled — 108 modules across all four tiers, rooted entirely in Agastyar's direct transmission from the Tamil Siddha lineage."
            tiers={[{l:'Free · M1–27',c:white(0.5)},{l:'Prana · M28–54',c:green(0.85)},{l:'Siddha · M55–81',c:teal(0.9)},{l:'Akasha · M82–108',c:gold(0.95)}]}
            progress={agastyarProgress}
            cta="Enter the Academy" href="/agastyar-academy" ac={teal(0.9)} badge="LIVE"
            features={['108 Modules','Panchakarma','Rasayana','Nadi Vaidya','Pulse Reading','Kaya Kalpa']}/>
          <HeroCard SvgIcon={Icon.Moon} label="274 Lessons · Varma · Rasayana · 4 Tiers" title="Siddha Medicine Academy"
            desc="The complete Tamil Siddha medical tradition — Varma therapy, Rasayana alchemy, Siddha herbology, Muppu (the three salts), and the 64 alchemical arts of Bogar and Agastya."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:teal(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Academy" href="/siddha-medicine" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lotus} label="Kaya Kalpa · 12 Modules · Bogar & Babaji" title="Kayakalpa Immortality Academy"
            desc="The supreme Siddha science of physical immortality — the complete Kaya Kalpa protocol for radical cellular rejuvenation, mercury alchemy, and longevity beyond 200 years."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–5',c:green(0.85)},{l:'Siddha · M6–9',c:teal(0.9)},{l:'Akasha · M10–12',c:gold(0.95)}]}
            cta="Enter the Academy" href="/kayakalpa-academy" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Flame} label="Siddha Fasting · Detox · Ojas Renewal" title="Siddha Fasting Academy"
            desc="The complete Siddha science of therapeutic fasting — from one-day Ekadashi fasts through extended Langhana protocols for disease reversal, Ojas renewal, and spiritual purification."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:teal(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Academy" href="/siddha-fasting-academy" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Shield} label="12 Months · Personal Diksha · Certification" title="Siddha Healer's Sovereign Path"
            desc="The complete 12-month practitioner certification — personal Diksha transmission, the 18 Siddhas' healing science, chakra sovereignty, pranic surgery, and full certification with Kritagya & Laila. Akasha-Infinity exclusive."
            tiers={[{l:'Akasha-Infinity Only',c:gold(0.95)}]}
            cta="Enter the Sovereign Path" href="/certification-path" ac={gold(0.9)} badge="AKASHA"/>
        </LibSection>

        {/* ══ CATEGORY 2: YOGA, KRIYA & BREATH SCIENCE ══ */}
        <LibSection SvgIcon={Icon.Trishul} title="Yoga, Kriya & Breath Science" subtitle="Babaji · Thirumoolar · Brahma Muhurta · Pranayama · Breatharian" ac={gold(0.9)} count={5}>
          <HeroCard SvgIcon={Icon.Flame} label="Kriya · 10 Modules · Babaji" title="Kriya Yoga Mastery"
            desc="Mahavatar Babaji's direct Kriya transmission — the 18 Kriyas of the Siddha tradition, Pranayama alchemy, Khechari Mudra, and the complete path from Mantra Yoga to Samadhi."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–5',c:green(0.85)},{l:'Siddha · M6–8',c:amber(0.9)},{l:'Akasha · M9–10',c:gold(0.95)}]}
            cta="Enter the Path" href="/kriya-yoga" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Kundalini} label="Pranayama · 8 Modules · 3000 Years" title="Thirumoolar's Pranayama Codex"
            desc="3,000 years of Tamil Siddha breath-science — from Prana & Nadi anatomy through Kevala Kumbhaka and Babaji's Kriya Pranayama, decoded from the Tirumantiram."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:amber(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Science" href="/thirumoolar-pranayama" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Galaxy} label="12 Modules · Pre-Dawn Science" title="Brahma Muhurta — The Creator's Hour"
            desc="The most complete Siddha transmission on the sacred pre-dawn window — cosmology, Nadi science, secret mantras, Kala Vortex mechanics, and the 12 practices of the dawn masters."
            tiers={[{l:'Free · M1–3',c:white(0.5)},{l:'Prana · M4–6',c:green(0.85)},{l:'Siddha · M7–9',c:amber(0.9)},{l:'Akasha · M10–12',c:gold(0.95)}]}
            cta="Enter the Hour" href="/brahma-muhurta" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Chakra} label="14 Modules · 51 Practices · 18 Siddhas" title="Supreme Siddha Meditation"
            desc="The complete Siddha meditation system — from foundational Dharana through advanced Nirvikalpa Samadhi, Trataka, Yoga Nidra, and direct transmission from 18 Siddha masters."
            tiers={[{l:'Free · M1–3',c:white(0.5)},{l:'Prana · M4–7',c:green(0.85)},{l:'Siddha · M8–11',c:amber(0.9)},{l:'Akasha · M12–14',c:gold(0.95)}]}
            cta="Enter the Silence" href="/meditation-course" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lotus} label="Breatharian Science · Prana Nutrition · 8 Modules" title="Breatharian Academy"
            desc="The Siddha science of living on Prana — documented cases from the 18 Siddha tradition, the Ojas-building protocol toward reduced food dependency, and the complete Breatharian preparation path."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:amber(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Academy" href="/breatharian-academy" ac={gold(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 3: SACRED TEXTS & SIDDHA SAGES ══ */}
        <LibSection SvgIcon={Icon.Scroll} title="Sacred Texts & Siddha Sages" subtitle="Yogananda · Yukteshwar · Hanuman · Ramayana · Alchemical Shiva · Narasimha" ac={violet(0.9)} count={6} delay={0.08}>
          <HeroCard SvgIcon={Icon.Galaxy} label="Autobiography Decoded · Kriya Lineage" title="Yogananda Codex"
            desc="Paramahansa Yogananda's Autobiography of a Yogi decoded through the Siddha lens — 49 chapters of hidden Kriya science, Babaji's direct transmissions, and the miracles explained through Siddha physics."
            tiers={[{l:'Free · Ch1–12',c:white(0.5)},{l:'Prana · Ch13–24',c:green(0.85)},{l:'Siddha · Ch25–37',c:violet(0.9)},{l:'Akasha · Ch38–49',c:gold(0.95)}]}
            cta="Enter the Codex" href="/yogananda-codex" ac={violet(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.SriYantra} label="Kaivalya Darsanam · 8 Modules · 24 Lessons" title="Holy Science — Sri Yukteshwar"
            subtitle="Yuga Science · Kriya Physics · Five Koshas"
            desc="Sri Yukteshwar's Kaivalya Darsanam — the Holy Science — decoded in full: Yuga cycle mathematics, the five Koshas of the subtle body, and the scientific proof of soul evolution."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:violet(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Science" href="/holy-science" ac={violet(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Vanara} label="Chalisa · 8 Weapons · Siddhis · Physical Alchemy" title="Hanuman Codex"
            desc="The complete Hanuman transmission — 40 Chaupais decoded, 8 divine weapons of Hanuman, Ghata movements, 9 Siddhis activation, and Babaji's direct Hanuman mantra transmissions."
            tiers={[{l:'Free · P1–10',c:white(0.5)},{l:'Prana · P11–20',c:green(0.85)},{l:'Siddha · P21–30',c:amber(0.9)},{l:'Akasha · P31–40',c:gold(0.95)}]}
            cta="Enter the Codex" href="/hanuman-codex" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Bow} label="7 Kāṇḍas · 35 Secrets · Bābājī Transmission" title="Ramayana Codex"
            desc="The Ramayana decoded as a Siddha initiatory path — each of the 7 Kandas as a stage of consciousness evolution, with 35 hidden secrets revealed by Babaji and the 18 Siddhas."
            tiers={[{l:'Free · K1–2',c:white(0.5)},{l:'Prana · K3–4',c:green(0.85)},{l:'Siddha · K5–6',c:amber(0.9)},{l:'Akasha · K7',c:gold(0.95)}]}
            cta="Enter the Epic" href="/ramayana" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Trishul} label="Shiva Lingam · Nath Science · 5 Modules" title="Alchemical Shiva"
            desc="The Nath Siddha transmission on Shiva Lingam — the bio-geometry of the Lingam as a Pranic antenna, Gorakshanath's Khechari Maha Mudra, Panchakshara Nyasa, and Midnight Sadhana protocols."
            tiers={[{l:'Free · M1',c:white(0.5)},{l:'Prana · M2',c:green(0.85)},{l:'Siddha · M3–4',c:amber(0.9)},{l:'Akasha · M5',c:gold(0.95)}]}
            cta="Enter the Transmission" href="/shiva-lingam" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lion} label="Nine Seals · Man-Lion Avatar · Protection Science" title="Narasimha Sacred Path"
            desc="The nine protective seals of Lord Narasimha — Prahladha's devotion science, Hiranyakashipu's dissolution as karmic alchemy, and Kavach practices for absolute divine protection."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Path" href="/narasimha" ac={amber(0.9)} ac2={gold(0.8)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 4: BODY IMMORTALITY & VITAL FORCE ══ */}
        <LibSection SvgIcon={Icon.Moon} title="Body Immortality & Vital Force" subtitle="Ojas · Brahmacharya · Hormonal Alchemy" ac={teal(0.9)} count={3} delay={0.1}>
          <HeroCard SvgIcon={Icon.Lotus} label="15 Modules · 108+ Lessons · 4 Tiers" title="Ojas Rasayana Academy"
            desc="The complete Siddha science of Ojas — the primordial vital essence that underlies immunity, consciousness, and immortality. Rasayana herbs, sexual alchemy, sleep science, and Soma cultivation."
            tiers={[{l:'Free · M1–3',c:white(0.5)},{l:'Prana · M4–7',c:green(0.85)},{l:'Siddha · M8–11',c:teal(0.9)},{l:'Akasha · M12–15',c:gold(0.95)}]}
            cta="Enter the Academy" href="/ojas-rasayana" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Trishul} label="8 Modules · 53 Lessons · Ojas Science" title="Brahmacharya Siddha Academy"
            desc="The complete Siddha science of vital force preservation — the eight stages of Brahmacharya, sexual energy transmutation, Bindu retention, and Urdhva Retas (upward flow) activation."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:teal(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Science" href="/brahmacharya-academy" ac={teal(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Moon} label="Shakti Cycle · 5 Modules · Siddha Feminine Wisdom" title="Sovereign Hormonal Alchemy"
            desc="Shakti Cycle Intelligence — cycle phases, Siddha modules, plant medicine, planetary timing & protocols. The complete Siddha map of the feminine cosmic body."
            tiers={[{l:'Free · Phases',c:white(0.5)},{l:'Prana · Modules',c:green(0.85)},{l:'Akasha · Full',c:gold(0.95)}]}
            cta="Enter the Shakti Portal" href="/shakti-alchemy" ac={rose(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 5: SOUND, MANTRA & NADA SCIENCE ══ */}
        <LibSection SvgIcon={Icon.Om} title="Sound, Mantra & Nada Science" subtitle="Siddha Sound Alchemy · Mantra Academy · Mudra · Nada Yoga" ac={amber(0.9)} count={3} delay={0.12}>
          <HeroCard SvgIcon={Icon.Om} label="Nada Vijnana · 10 Modules · 18 Siddhas" title="Siddha Sound Alchemy"
            desc="The complete Siddha science of sacred sound — Nada Yoga, 432Hz vs 528Hz science, mantra physics, singing bowl alchemy, and how sound reshapes the Nadi field and cellular structure."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–5',c:green(0.85)},{l:'Siddha · M6–8',c:amber(0.9)},{l:'Akasha · M9–10',c:gold(0.95)}]}
            cta="Enter the Sound Field" href="/siddha-sound-alchemy" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Om} label="24 Modules · Bija Mantras · Nada Yoga" title="Mantra Academy"
            desc="24 modules of complete Mantra science — Bija (seed) mantras for each chakra and deity, Japa technique, mantra activation (Mantra Chaitanya), and the 18 Siddhas' secret mantra transmissions."
            tiers={[{l:'Free · M1–6',c:white(0.5)},{l:'Prana · M7–12',c:green(0.85)},{l:'Siddha · M13–18',c:amber(0.9)},{l:'Akasha · M19–24',c:gold(0.95)}]}
            cta="Enter the Academy" href="/mantra-academy" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Mudra} label="10 Modules · Hand Seals · Neural Rewiring" title="Mudra Academy"
            desc="The complete science of sacred hand seals — from elemental Pancha-Bhuta mudras through Siddha neurological rewiring, Prana redirection, and Siddhi activation mudras with full SVG illustrations."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:cyan(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Academy" href="/mudra-academy" ac={gold(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 6: CONSCIOUSNESS & MYSTICAL ARTS ══ */}
        <LibSection SvgIcon={Icon.ThirdEye} title="Consciousness & Mystical Arts" subtitle="Mediumship · Dream Science · Sacred Geometry" ac={violet(0.9)} count={3} delay={0.14}>
          <HeroCard SvgIcon={Icon.ThirdEye} label="8 Modules · 30 Transmissions · 18 Siddhas" title="Siddha Mediumship Academy"
            desc="The world's most comprehensive mediumship education — Third Eye activation, 14-Loka maps, ancestor communication, Deva contact, Akashic Record access, and 8 Siddhi development protocols."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–4',c:green(0.85)},{l:'Siddha · M5–6',c:violet(0.9)},{l:'Akasha · M7–8',c:gold(0.95)}]}
            cta="Enter the Akasha Transmission" href="/siddha-mediumship-academy" ac={violet(0.9)} badge="LIVE"
            features={['14-Loka Map','Third Eye Activation','Ancestor Contact','7-Layer Kavach','Deva Mantras','8 Siddhis']}/>
          <HeroCard SvgIcon={Icon.Galaxy} label="Dream Science · 15 Modules · Scalar Transmission" title="Svapna Vidyā"
            desc="The world's most advanced Siddha dream science — from Taijasa & dream anatomy to Turīya-Svapna, Bardo preparation, prophetic timing, lucid dream protocols, and the 40-night Tapas."
            tiers={[{l:'Free · M1–2',c:white(0.5)},{l:'Prana · M3–6',c:green(0.85)},{l:'Siddha · M7–9',c:violet(0.9)},{l:'Akasha · M10–15',c:gold(0.95)}]}
            cta="Enter the Dream Stream" href="/dream-academy" ac={violet(0.9)} ac2={gold(0.8)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.SriYantra} label="Sacred Geometry · Yantra · Merkaba" title="Sacred Geometry Education"
            desc="Sri Yantra, Merkaba, Platonic Solids, Flower of Life — the complete Siddha science of sacred form and its direct activation of consciousness fields through geometric resonance."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:cyan(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Transmission" href="/sacred-geometry" ac={gold(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 7: VEDIC ASTROLOGY & NADI SCIENCE ══ */}
        <LibSection SvgIcon={Icon.SriYantra} title="Vedic Astrology & Nadi Science" subtitle="Jyotish Vidya · Bhrigu Oracle · Nadi Leaf · Palm Oracle · 9 Grahas · 27 Nakshatras" ac={cyan(0.9)} count={3} delay={0.15}>
          <HeroCard SvgIcon={Icon.SriYantra} label="Vedic Astrology · Bhrigu Nadi · 9 Grahas" title="Jyotish Vidya"
            desc="The full 32-module path of Vedic astrology — from the 9 Grahas to Bhrigu Nadi mastery, with live Bhrigu Oracle readings, Nakshatra science, Dasha timing, and Siddha remedies."
            tiers={[{l:'Free · M1–8',c:white(0.5)},{l:'Prana · M9–16',c:green(0.85)},{l:'Siddha · M17–24',c:cyan(0.9)},{l:'Akasha · M25–32',c:gold(0.95)}]}
            cta="Enter the Observatory" href="/jyotish-vidya" ac={cyan(0.9)} badge="LIVE"
            features={['Birth Chart','Dasha Timing','Bhrigu Oracle','Nakshatra Map','Siddha Remedies']}/>
          <HeroCard SvgIcon={Icon.Lotus} label="12 Transmissions · Agastiya Nadi · Angushtha Biometric" title="Nadi Leaf Oracle"
            desc="5,000 years of Agastiya Muni's Akashic Records — scan your thumb (right for men, left for women), receive your karma classification, and enter the complete Nadi Shastra education."
            tiers={[{l:'Free · M1',c:white(0.5)},{l:'Prana · M2',c:green(0.85)},{l:'Siddha · M3',c:gold(0.95)},{l:'Akasha · M4',c:'#F59E0B'}]}
            cta="Begin Angushtha Scan" href="/nadi-leaf" ac={gold(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Mudra} label="29 Transmissions · 18 Siddhas · Hasta Science" title="Palm Oracle"
            desc="Hasta Samudrika — the complete Tamil Siddha science of palm reading as a living transmission from 18 masters: Life Line as Ida Nadi, Heart Line as Pingala, Head Line as Sushumna."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:violet(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Oracle" href="/palm-oracle" ac={violet(0.9)} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 8: WEALTH & ABUNDANCE SADHANA ══ */}
        <LibSection SvgIcon={Icon.Yantra} title="Wealth & Abundance Sadhana" subtitle="Lakshmi · Kubera · Pachamama · 18 Siddhas" ac={gold(0.9)} count={1} delay={0.16}>
          <HeroCard SvgIcon={Icon.Yantra} label="8 Modules · 32 Lessons · Scalar Transmission Active" title="Abundance Sadhana"
            subtitle="Lakshmi · Kubera · Pachamama · 18 Siddhas · Babaji"
            desc="The most comprehensive Siddha abundance transmission — poverty-dissolution, Ashta-Lakshmi attunement, Kubera's cosmic economics, and Babaji's direct scalar activation of the causal abundance body."
            tiers={[{l:'Free · M1–3',c:white(0.55)},{l:'Prana · M4–5',c:green(0.85)},{l:'Siddha · M6–7',c:gold(0.95)},{l:'Akasha · M8',c:violet(0.95)}]}
            cta="Enter the Wealth Transmission" href="/abundance-curriculum" ac={gold(0.9)}
            features={['Mantra Counter','Journal Prompts','Progress Badges','PDF Downloads']} badge="LIVE"/>
        </LibSection>

        {/* ══ CATEGORY 9: SACRED RITUALS & COSMOLOGY ══ */}
        <LibSection SvgIcon={Icon.Flame} title="Sacred Rituals & Cosmology" subtitle="Puja · Yagna · Vastu · Sacred Water" ac={amber(0.9)} count={4} delay={0.18}>
          <HeroCard SvgIcon={Icon.Flame} label="Rishi Transmission · Agnihotra · Cosmic Fire" title="Yagna Fire Academy"
            desc="The complete science of sacred fire — Agnihotra protocol, Vedic Havan sequences, the 7 fire geometries, and direct Rishi transmissions for planetary purification and abundance manifestation."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Fire Transmission" href="/yagna" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.Lotus} label="Sacred Ritual · 4 Tiers · Pancha Bhuta" title="Puja Education"
            desc="The complete Siddha science of devotional ritual — altar construction, invocation sequences, Pancha Bhuta offerings, and Siddha mantra protocols for each Deva and Devi."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Puja Hall" href="/puja-education" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.SriYantra} label="Vedic Space · Pancha Bhuta · Quantum Architecture" title="Vastu Shastra Curriculum"
            desc="The complete Vedic science of sacred space — home and temple alignment with the five elements, Vastu Purusha Mandala, directional energy zones, and the Siddha protocols for space purification."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:amber(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Architecture" href="/vastu-curriculum" ac={amber(0.9)} badge="LIVE"/>
          <HeroCard SvgIcon={Icon.WaterDrop} label="Living Water · 40 Modules · Emoto Science" title="Sacred Water Alchemy"
            desc="The complete Siddha science of living water — from Dr Emoto's crystal codes to the 18 Siddhas' water charging protocols, structured water science, and Amrita (nectar) preparation."
            tiers={[{l:'Free',c:white(0.5)},{l:'Prana',c:green(0.85)},{l:'Siddha',c:cyan(0.9)},{l:'Akasha',c:gold(0.95)}]}
            cta="Enter the Transmission" href="/sacred-water" ac={cyan(0.9)} badge="LIVE"/>
        </LibSection>

      </div>

      <PortalKeyframes />
      {/* sqGoldPulse is still used directly on this page (header label) and
          isn't part of the shared PortalKeyframes set. sqLiveFlash was dead
          (defined but unused) even before this refactor. */}
      <style>{`
        @keyframes sqGoldPulse { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
      `}</style>
    </div>
  );
}
