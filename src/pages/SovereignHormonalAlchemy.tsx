/**
 * SHAKTI CYCLE INTELLIGENCE — Single Unified Tool
 * Route: /sovereign-hormonal-alchemy  (already in App.tsx — zero routing changes needed)
 * Delete src/pages/WomanCode.tsx — this file replaces it entirely.
 *
 * FREE          → Phase + day, mantra, scalar transmission, mudra ritual, secretion log, energy log
 * PRANA-FLOW    → + Activity recommendations, pranayama, nutrition list, Moon Milk recipe, Career Sync, Explore slider
 * SIDDHA/AKASHA → + Live hormone Chart.js graph, clickable mineral biochemistry modals, pattern insights, log history
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Lock, Zap, ChevronRight } from 'lucide-react';
import { useCyclePhase } from '@/hooks/useCyclePhase';
import { useMembership } from '@/hooks/useMembership';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const G  = '#D4AF37';
const GD = 'rgba(212,175,55,0.12)';
const GB = 'rgba(255,255,255,0.07)';
const W8 = 'rgba(255,255,255,0.85)';
const W6 = 'rgba(255,255,255,0.6)';
const W4 = 'rgba(255,255,255,0.35)';
const W2 = 'rgba(255,255,255,0.1)';
const F  = "'Plus Jakarta Sans', sans-serif";

/* ─── PHASE MASTER DATA ───────────────────────────────────────────────────── */
const PD = {
  Menstrual: {
    name:'Menstruationsfas', season:'Vinter', sIcon:'❄️', pColor:'#5B8FBF',
    dosha:'Vata', label:'Release',
    tagline:'Kroppen rensar — vila är din medicin',
    mantra:'Om Somaye Namaha — I release into the cosmic void.',
    freq:'396Hz · Grounding · Apana Vayu', hz:396,
    mudra:'Prithvi Mudra',
    mudraInst:'Touch ring fingertip to thumb tip. Visualize golden roots extending from your spine into the crystalline core of Gaia. Hold 10–15 minutes in silence.',
    ritual:'Rose water anointing & candlelight meditation',
    secretions:['heavy_flow','light_flow','spotting'],
    confirmText:'Blödning bekräftad — Vinterfasen. Östrogen och progesteron är som lägst.',
    activities:[
      {icon:'🧘',title:'Yin Yoga',sub:'Apasana, Supta Baddha Konasana. 20–30 min. Inga inversioner.',intensity:'low'},
      {icon:'🚶',title:'Lugn promenad',sub:'Grounded, max 30 min. Naturen läker.',intensity:'low'},
      {icon:'🛋️',title:'Aktiv vila',sub:'Läsa, kreativt skapande, meditativ tystnad.',intensity:'none'},
      {icon:'🚫',title:'Undvik HIIT',sub:'Inga tunga lyft dag 1–3. Kroppen avgiftar.',intensity:'avoid'},
    ],
    pranayama:{name:'Bhramari',icon:'🐝',desc:'Humleandedräkt — 5–10 omgångar. Vagusnerv-aktivering löser upp livmoderspänning och sänker kortisol direkt.'},
    nutrition:['Rödbetor + citron (järn + C-vitamin → syresätter blodet)','Pumpafrön (zink → reglerar prostaglandiner, minskar kramper)','Spenat & grönkål (folat → blodcellsproduktion)','Malda linfrön (omega-3 → anti-inflammatorisk, minskar mensvärk)'],
    herb:{name:'Shatavari',tagline:'Återuppbyggnad av Ojas efter blodförlust',steps:['1 tsk Shatavari-pulver i 240 ml varm havremjölk','1 tsk Ghi — smörjer slemhinnor, stöttar Apana Vayu','Sjud 3 minuter under omrörning','Kyl till handhett — tillsätt 1 tsk rå honung','Drick strax innan sömn dag 1–5']},
    career:'Reflektionsdag. Journaling & ensamt analysarbete. Kritisk blick är skarp — men fatta inga stora beslut. Skjut presentationer till ovulation.',
    minerals:[
      {icon:'🫐',mineral:'Järn + C-vitamin',food:'Rödbetor + citron',amount:'150g = 2.7mg järn',fn:'Syresätter blodet efter blodförlust',tags:['#järn','#syresättning','#anemi'],bio:'Järn är centralt i hemoglobin. Kombinera alltid med C-vitamin — konverterar Fe³⁺ till absorberbar Fe²⁺. Utan C absorberas bara 2–3% av järnet; med C upp till 30%. Rödbetor innehåller dessutom betain som stöttar leverns avgiftning och minskar inflammation.'},
      {icon:'🌰',mineral:'Zink',food:'Pumpafrön',amount:'30g = 2.2mg zink',fn:'Reglerar prostaglandiner → minskar kramper',tags:['#zink','#kramper','#immunitet'],bio:'Zink är kofaktor för 300+ enzymer. Reglerar prostaglandiner — de inflammatoriska lipid-signalerna som orsakar livmoderkontraktioner. Tillräckligt zink → signifikant minskad mensvärk. Pumpafrön är den rikaste växtbaserade källan.'},
      {icon:'🥬',mineral:'Folat (B9)',food:'Spenat & mörka blad',amount:'Stor näve = 100µg folat',fn:'Blodcellsproduktion & DNA-syntes',tags:['#folat','#B9','#blodceller'],bio:'Folat driver produktionen av nya röda blodkroppar efter menstruationens blodförlust. Kombinera med B12 (nutritionsjäst) för DNA-syntes. Välj lätt ångad — folat är värmekänsligt och förstörs vid överhettning.'},
      {icon:'🫚',mineral:'Omega-3 (ALA)',food:'Malda linfrön & valnötter',amount:'1 msk malda linfrön/dag',fn:'Minskar PGF2α → minskad livmoderkontraktion',tags:['#omega3','#inflammation','#mensvärk'],bio:'Omega-3 konkurrerar med arakidonsyra om COX/LOX-enzymerna som producerar prostaglandiner. Mer omega-3 = färre inflammatoriska PGF2α = minskad livmoderkontraktion och mensvärk. Effekten märks efter 2–3 cykler av konsekvent intag.'},
    ],
  },
  Follicular: {
    name:'Follikulärfas', season:'Vår', sIcon:'🌱', pColor:'#5FAD72',
    dosha:'Kapha', label:'Nourish',
    tagline:'FSH väcker äggstockarna — energin bygger',
    mantra:'Om Shrim Namaha — I nourish the temple of creation.',
    freq:'417Hz · Stimulating · Kapha-Pitta', hz:417,
    mudra:'Hakini Mudra',
    mudraInst:'Bring all fingertips together forming a tent shape. Direct awareness to Ajna (third eye). Invite creative Shakti to rise through Sushumna Nadi. Hold 10–15 minutes.',
    ritual:'Flower offering at sunrise with sandalwood incense',
    secretions:['dry','sticky','creamy'],
    confirmText:'Torrt → klibbigt → krämigt sekret bekräftar Vårfasen. FSH stiger, östrogen klättrar.',
    activities:[
      {icon:'☀️',title:'Vinyasa Flow',sub:'Surya Namaskar 12 runder. Bygg energi gradvis.',intensity:'medium'},
      {icon:'🏃',title:'Jogging / Dans',sub:'30–45 min. Prova ny träningsform! Variation aktiverar nya dopaminbanor.',intensity:'medium'},
      {icon:'🏋️',title:'Styrketräning',sub:'Börja bygga styrka — östrogenet skyddar musklerna nu.',intensity:'medium'},
      {icon:'🎨',title:'Kreativ rörelse',sub:'Klättring, simning, dans — följ nyfikenheten.',intensity:'medium'},
    ],
    pranayama:{name:'Kapalabhati',icon:'☀️',desc:'Skallskimrande andedräkt — 3 omgångar á 30 andetag. Rensar vinterns stagnation och aktiverar solar plexus (Manipura).'},
    nutrition:['Avokado (vitamin E → skyddar den växande follikeln)','Broccoli lätt ångad (I3C → lever metaboliserar stigande östrogen)','Kimchi & surkål (probiotika → östrobolonet i tarmen)','Cashewnötter (magnesium → ATP-produktion, energi på cellnivå)'],
    herb:{name:'Ashwagandha',tagline:'Binjurar & uthållighet inför den aktiva fasen',steps:['1 tsk Ashwagandha-pulver i 240 ml varm mandelmjölk','Nypa kardemumma + ½ tsk kanel (blodsockerstabiliserande)','1 tsk Ghi för maximal absorption av adaptogenet','Sjud 3 minuter. Kyl till handhett. Tillsätt 1 tsk rå honung','Drick på morgonen — stöttar binjurarna hela dagen']},
    career:'Initiera projekt, brainstorming, visionärt arbete. FSH höjer kognitiv flexibilitet — din kreativitet är biokemiskt på topp. Nätverka och nå ut.',
    minerals:[
      {icon:'🥑',mineral:'Vitamin E',food:'Avokado',amount:'½ = 2.7mg vitamin E',fn:'Skyddar follikeln från oxidativ stress',tags:['#vitaminE','#fertilitet'],bio:'Vitamin E är en fettlöslig antioxidant som skyddar den växande follikeln. Viktig för cervikalslemkvalitet och endometriums uppbyggnad via östrogenreceptorerna.'},
      {icon:'🥦',mineral:'Indol-3-karbinol (I3C)',food:'Broccoli & blomkål',amount:'100g lätt ångad',fn:'CYP1A2-enzymet → god östrogenmetabolism',tags:['#I3C','#lever','#östrogen'],bio:'I3C i korsblommiga grönsaker aktiverar CYP1A2 i levern för "god" östrogenmetabolism (2-hydroxyöstrogen). Mer 2-OH östrogen = bättre hormonbalans. Lätt ångad — överhettning förstör I3C.'},
      {icon:'🫙',mineral:'Probiotika',food:'Kimchi & surkål',amount:'2 msk dagligen',fn:'Östrobolomet — tarmbakteriernas hormonkontroll',tags:['#probiotika','#östrobolom'],bio:'Östrobolomet = tarmbakterierna som styr östrogenets enterohepatiska cirkulation. Dysbiose → beta-glukuronidas återaktiverar avkonjugerat östrogen → östrogendominans. Lactobacillus i kimchi håller balansen.'},
      {icon:'💚',mineral:'Magnesium',food:'Cashewnötter',amount:'30g = 83mg',fn:'ATP-produktion på cellnivå',tags:['#magnesium','#ATP'],bio:'Magnesium driver ATP-syntes i mitokondrierna. I follikulärfas stiger energin och cellerna behöver mer magnesium. Stöttar COMT-enzymet som bryter ner katekolöstrogen.'},
    ],
  },
  Ovulatory: {
    name:'Ovulationsfas', season:'Sommar', sIcon:'☀️', pColor:'#D4924A',
    dosha:'Pitta', label:'Radiate',
    tagline:'LH-spike — du är vid maximal kraft & magnetism',
    mantra:'Om Dum Durgaye Namaha — I radiate sovereign fire.',
    freq:'528Hz · Heart Resonance · LH Peak', hz:528,
    mudra:'Anahata Mudra',
    mudraInst:'Place right palm over heart center; left palm on top. Breathe golden-rose light into Anahata chakra on each inhale. Exhale radiance outward. Hold 10–15 minutes.',
    ritual:'Mirror gazing with sandalwood tika and rose water',
    secretions:['watery','egg_white'],
    confirmText:'🌟 FERTIL PEAK — äggvita bekräftar LH-spike. Maximalt östrogen + testosteron.',
    activities:[
      {icon:'🔥',title:'HIIT',sub:'Maximal intensitet — kroppen är på absolut topp. Ge allt!',intensity:'high'},
      {icon:'💪',title:'Tung styrketräning',sub:'Öka vikterna. Testosteron + östrogen skyddar muskler.',intensity:'high'},
      {icon:'🤸',title:'Gruppass',sub:'Spinning, CrossFit, lagspel. Social energi är maximalt höjd.',intensity:'high'},
      {icon:'⚔️',title:'Power Yoga',sub:'Virabhadrasana I & II, Ustrasana. Kraft och hjärtöppning.',intensity:'medium'},
    ],
    pranayama:{name:'Sitali',icon:'❄️',desc:'Svalkande andedräkt — kanaliserar peak-Pitta utan övervärmning. Rulla tungan, andas in kallt, ut genom näsan. 10–15 omgångar.'},
    nutrition:['Quinoa (B-komplex → CYP450-enzymer bryter ner östrogentoppen)','Spenat + grönkål (klorofyll → maximal syresättning vid peak output)','Hallon & jordgubbar (vitamin C → skyddar follikeln under LH-spike)','Sesamfrön (selen → sköldkörtelfunktion + hormonell koherens)'],
    herb:{name:'Shatavari (Full Dos)',tagline:'Anahata Elixir — Peak Ovulation',steps:['1.5 tsk Shatavari i 240 ml varm kokosmjölk','2–3 saffranstrådar — Pitta-svalkande och LH-stödjande','1 tsk Ghi + 3 droppar rosenvatten','Sjud 5 min. Kyl väl. Tillsätt 1 tsk rå honung','Drick mitt på dagen — vid peak-energi']},
    career:'⚡ BOKA DET VIKTIGASTE MÖTET HIT. LH + östrogen + testosteron på simultant topp. Lönesamtal, pitch, presentation — din karisma är kemiskt maximerad.',
    minerals:[
      {icon:'🌾',mineral:'B-komplex',food:'Quinoa & amarant',amount:'100g = B1,B2,B3,B6,folat',fn:'CYP450-enzymer bryter ner östrogentoppen',tags:['#Bvitaminer','#lever','#LH'],bio:'B6 och B2 är kofaktorer för CYP450-enzymerna i levern. Utan B6 → östrogen cirkulerar längre → finnar post-ovulation. Quinoa = komplett protein + komplett B-komplex.'},
      {icon:'🥬',mineral:'Klorofyll & Järn',food:'Spenat & grönkål',amount:'Stor handfull = 2mg järn',fn:'Maximal syresättning vid peak output',tags:['#klorofyll','#järn'],bio:'Klorofylls molekylstruktur är nästan identisk med hemoglobin. Under ovulation när kroppen är som mest aktiv är optimal syresättning avgörande för kondition och mental klarhet.'},
      {icon:'🍓',mineral:'Vitamin C',food:'Hallon & jordgubbar',amount:'100g = 60–80mg',fn:'Skyddar follikeln under LH-spike',tags:['#vitaminC','#kollagen'],bio:'Vitamin C koncentreras i äggstockvävnaden i höga nivåer. Skyddar follikeln från fri-radikalskada under LH-spike. Kofaktor för kollagensyntes — viktig för äggledartransport.'},
      {icon:'🌿',mineral:'Selen',food:'Sesamfrön',amount:'30g = 8µg selen',fn:'Thyreoperoxidas → sköldkörtelfunktion',tags:['#selen','#sköldkörtel'],bio:'Selen driver thyreoperoxidas som producerar T3/T4. Sköldkörteln är intimt kopplad till äggstockarnas funktion. Selenbrist → störd ägglossning och kortare lutealfas.'},
    ],
  },
  Luteal: {
    name:'Lutealfas', season:'Höst', sIcon:'🍂', pColor:'#B56057',
    dosha:'Pitta→Vata', label:'Transform',
    tagline:'Gulkroppen producerar progesteron — lugn inre kraft',
    mantra:'Om Dum Durgaye Namaha — I transform fire into wisdom.',
    freq:'741Hz · Intuition · Progesteron Rising', hz:741,
    mudra:'Yoni Mudra',
    mudraInst:'Interlace fingers with index fingers and thumbs forming a downward triangle (yoni). Rest at womb center. Invite Shakti inward. Breathe into the pelvis. Hold 10–15 minutes.',
    ritual:'Evening journaling under candlelight with ashwagandha milk',
    secretions:['thick_white','dry','spotting'],
    confirmText:'Tjockt vitt eller torrt sekret bekräftar Höstfasen. Progesteron dominerar — kroppens naturliga Valium.',
    activities:[
      {icon:'🌿',title:'Slow Flow Yoga',sub:'Malasana, Paschimottanasana. Grunda Vata. Håll länge (2–3 min).',intensity:'low'},
      {icon:'🎯',title:'Pilates',sub:'Core och stabilitet. Lågintensiv men djupt effektiv.',intensity:'low'},
      {icon:'🌳',title:'Naturpromenad',sub:'Grounding. Barfota på gräs om möjligt.',intensity:'low'},
      {icon:'⚠️',title:'Minska dag 25–28',sub:'Byt HIIT mot yin yoga och promenader i sen luteal.',intensity:'avoid'},
    ],
    pranayama:{name:'Nadi Shodhana',icon:'🌬️',desc:'Växelvis näsandning — 10–15 min dagligen. Balanserar hjärnhalvorna och stabiliserar HPA-axeln biokemiskt via vagusnerven.'},
    nutrition:['Råkakao (magnesium → slappnar av livmodern, dämpar sötsug, stöttar GABA)','Sötpotatis (B6 → direkt kofaktor för progesteronbiosyntes i gulkroppen)','Solrosfrön (B6 + selen → gulkroppens #1 näring dag 15–28)','Kikärter (fiber + zink → eliminerar överskottsöstrogen via tarmen)'],
    herb:{name:'Ashwagandha (Kritisk Fas)',tagline:'Kortisol-skölden för progesteron dag 15–28',steps:['1 tsk Ashwagandha + ½ tsk råkakao-pulver i 240 ml varm havremjölk','Nypa kanel (blodsockerstabiliserande och anti-inflammatorisk)','1 tsk Ghi (stöttar progesterons fettlösliga natur)','Sjud 3 min. Kyl till handhett. Tillsätt 1 tsk rå honung','Drick varje kväll dag 15–28']},
    career:'Detaljarbete, granskning, avsluta projekt. Stäng affärer. Dag 22–28: sätt gränser aktivt — det är neurobiologi, inte svaghet.',
    minerals:[
      {icon:'🍫',mineral:'Magnesium',food:'Råkakao',amount:'2 msk = 150mg',fn:'Livmodern slappnar av, sötsug & kramper minskar',tags:['#magnesium','#kramper','#GABA'],bio:'Magnesium är antagonist till kalcium — hindrar kraftiga livmodersammandragningar. Stöttar GABA-receptorerna (samma som progesteron och bensodiazepiner) → bättre sömn. Råkakao = upp till 500mg/100g.'},
      {icon:'🍠',mineral:'B6 & Betakaroten',food:'Sötpotatis',amount:'½ medelstor = 0.3mg B6',fn:'Direkt kofaktor för progesteronbiosyntes',tags:['#B6','#progesteron','#blodsocker'],bio:'B6 är direkt kofaktor för progesteronsyntesen i corpus luteum. Lågt B6 → lägre progesteron → östrogendominans → PMS. Betakaroten → Vitamin A stöttar gulkroppens funktion.'},
      {icon:'🌻',mineral:'B6 & Selen',food:'Solrosfrön',amount:'1 msk dagligen dag 15–28',fn:'Corpus luteums topp-näring — hela lutealfasen',tags:['#B6','#selen','#gulkropp'],bio:'B6 + selen + vitamin E stöttar corpus luteums progesteronproduktion under hela lutealfasen. Ät 1 msk dagligen dag 15–28 på sallad, soppa eller smoothie.'},
      {icon:'🫘',mineral:'Fiber & Zink',food:'Kikärter',amount:'100g = 5g fiber + 1.5mg zink',fn:'Eliminerar överskottsöstrogen via tarmen',tags:['#fiber','#zink','#östrogen'],bio:'Fiber binder konjugerat östrogen och förhindrar enterohepatisk recirkulation (återupptag). Brist → östrogen återabsorberas → relativ östrogendominans trots stigande progesteron → PMS.'},
    ],
  },
} as const;

type PhaseKey = keyof typeof PD;

/* ─── HORMONE CURVES ─────────────────────────────────────────────────────── */
const HC = {
  prog:[5,4,3,2,1,3,6,10,12,14,16,18,20,22,20,30,50,70,85,90,88,82,75,65,50,35,20,8],
  ostr:[10,12,14,16,20,28,38,52,65,75,80,85,90,95,85,70,60,55,55,58,55,52,48,45,42,38,28,15],
  fsh: [8,12,18,25,30,35,40,45,40,35,30,25,20,18,15,12,10,8,8,9,9,8,8,9,12,18,25,12],
  lh:  [3,3,4,4,5,6,7,8,9,10,12,14,18,95,20,8,5,4,4,4,5,5,4,4,4,4,5,3],
  test:[20,20,22,24,26,30,36,44,52,60,68,76,82,88,78,68,58,50,44,40,38,36,34,32,30,28,24,20],
};
const HM = [
  {key:'prog',label:'Progesteron',color:'#A78BFA',info:'Produceras i gulkroppen. Naturligt ångestdämpande via GABA-receptorer. Stiger kraftigt dag 16–22. Lågt progesteron relativt östrogen = PMS, ångest, sötsug.'},
  {key:'ostr',label:'Östrogen',color:'#F472B6',info:'Produceras i folliklarnas granulosaceller. Ökar serotonin och dopamin, förbättrar verbal förmåga. Peak dag 13–14 = din mest karismatiska dag.'},
  {key:'fsh', label:'FSH',color:'#60A5FA',info:'Follikelstimulerande hormon från hypofysen. Väcker 15–20 folliklar — bara en dominerar och går hela vägen till ägglossning.'},
  {key:'lh',  label:'LH',color:'#34D399',info:'LH-spiken (dag 13–14) ökar med 400–800% på 12–16 timmar. Brister follikeln och frigör ägget. Den tomma follikeln = gulkroppen som producerar progesteron.'},
  {key:'test', label:'Test.',color:'#FBBF24',info:'Testosteron hos kvinnor från äggstockar och binjurar. Peak vid ägglossning — det är DÄRFÖR du känner dig snyggast, modigast och mest magnetisk under ovulation.'},
];

/* ─── LOG OPTIONS ──────────────────────────────────────────────────────────── */
const SEC_OPTS = [
  {id:'heavy_flow', label:'Tung blödning',icon:'🔴'},
  {id:'light_flow', label:'Lätt blödning',icon:'💗'},
  {id:'spotting',   label:'Spotting',     icon:'🩸'},
  {id:'dry',        label:'Torrt',        icon:'🏜️'},
  {id:'sticky',     label:'Klibbigt',     icon:'🍯'},
  {id:'creamy',     label:'Krämigt',      icon:'🥛'},
  {id:'watery',     label:'Vattnigt',     icon:'💧'},
  {id:'egg_white',  label:'Äggvita ✨',   icon:'✨'},
  {id:'thick_white',label:'Tjockt vitt',  icon:'☁️'},
];
const NRG_OPTS = [
  {id:'e1',label:'Mycket låg',icon:'🌑'},{id:'e2',label:'Låg',icon:'🌒'},
  {id:'e3',label:'Medel',icon:'🌓'},{id:'e4',label:'Hög',icon:'🌔'},{id:'e5',label:'Mycket hög',icon:'🌕'},
];
const MOOD_OPTS = [
  {id:'anxious',label:'Ångestfylld',icon:'😰'},{id:'sensitive',label:'Känslig',icon:'🥺'},
  {id:'calm',label:'Lugn',icon:'😌'},{id:'creative',label:'Kreativ',icon:'✨'},
  {id:'confident',label:'Stark',icon:'💪'},{id:'social',label:'Social',icon:'🤝'},
  {id:'withdrawn',label:'Inåtvänd',icon:'🌙'},{id:'focused',label:'Fokuserad',icon:'🎯'},
];
const SYM_OPTS = [
  {id:'cramps',label:'Kramper',icon:'⚡'},{id:'bloating',label:'Uppblåst',icon:'🫧'},
  {id:'headache',label:'Huvudvärk',icon:'🤕'},{id:'tender',label:'Ömma bröst',icon:'💜'},
  {id:'acne',label:'Finnar',icon:'🔮'},{id:'cravings',label:'Sötsug',icon:'🍫'},
  {id:'insomnia',label:'Sömnlöshet',icon:'🌙'},{id:'libido',label:'Hög libido',icon:'🔥'},
];

const ICLR: Record<string,string> = {none:'#64748b',low:'#34D399',medium:'#FBBF24',high:'#F472B6',avoid:'#EF4444'};
const ILBL: Record<string,string> = {none:'Vila',low:'Låg',medium:'Medel',high:'Hög',avoid:'Undvik'};

/* ─── UTILS ─────────────────────────────────────────────────────────────── */
function todayStr(){return new Date().toISOString().split('T')[0];}

function phaseKeyFromName(n:string):PhaseKey{
  if(n==='Menstrual')  return 'Menstrual';
  if(n==='Follicular') return 'Follicular';
  if(n==='Ovulatory')  return 'Ovulatory';
  return 'Luteal';
}
function phaseKeyFromDay(day:number, cycleLen:number, bleedDays:number):PhaseKey{
  const ovStart = Math.round(cycleLen/2)-1;
  const ovEnd   = ovStart+3;
  if(day<=bleedDays)  return 'Menstrual';
  if(day<ovStart)     return 'Follicular';
  if(day<=ovEnd)      return 'Ovulatory';
  return 'Luteal';
}

/* ─── STYLE HELPERS ───────────────────────────────────────────────────────── */
const gc=(ex:React.CSSProperties={}):React.CSSProperties=>({background:'rgba(255,255,255,0.025)',backdropFilter:'blur(30px)',WebkitBackdropFilter:'blur(30px)',border:`1px solid ${GB}`,borderRadius:28,padding:20,marginBottom:12,...ex});
const sc=(ex:React.CSSProperties={}):React.CSSProperties=>({background:'rgba(255,255,255,0.02)',border:`1px solid ${GB}`,borderRadius:20,padding:14,...ex});
const LB:React.CSSProperties={fontSize:'7px',fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase',color:G,display:'block',marginBottom:10};
const ch=(a:boolean,c=G):React.CSSProperties=>({padding:'8px 13px',borderRadius:40,fontSize:11,fontWeight:700,cursor:'pointer',background:a?`${c}22`:W2,color:a?c:W6,border:`1px solid ${a?c+'55':'transparent'}`,transition:'all 0.18s',userSelect:'none',fontFamily:F,display:'inline-flex',alignItems:'center',gap:5});

/* ─── DAILY LOG HOOK ─────────────────────────────────────────────────────── */
function useDailyLog(date:string){
  const {user}=useAuth(); const qc=useQueryClient(); const {toast}=useToast();
  const {data:allLogs={}}=useQuery({
    queryKey:['shakti-logs',user?.id],
    queryFn:async()=>{
      const {data}=await supabase.from('profiles').select('shakti_cycle_logs').eq('user_id',user!.id).single();
      return (data as any)?.shakti_cycle_logs||{};
    },
    enabled:!!user?.id,
  });
  const log:Record<string,any>=(allLogs as any)[date]||{};
  const mut=useMutation({
    mutationFn:async(patch:Record<string,unknown>)=>{
      const next={...(allLogs as any),[date]:{...((allLogs as any)[date]||{}),...patch}};
      const {error}=await supabase.from('profiles').update({shakti_cycle_logs:next} as any).eq('user_id',user!.id);
      if(error)throw error; return next;
    },
    onSuccess:()=>qc.invalidateQueries({queryKey:['shakti-logs',user?.id]}),
    onError:()=>toast({title:'Could not save',variant:'destructive'}),
  });
  const updateLog=(patch:Record<string,unknown>)=>mut.mutate(patch);
  const toggle=(field:string,id:string)=>{
    const cur:string[]=log[field]||[];
    updateLog({[field]:cur.includes(id)?cur.filter((x:string)=>x!==id):[...cur,id]});
  };
  return {log,allLogs:allLogs as Record<string,any>,updateLog,toggle};
}

/* ─── HORMONE CHART ───────────────────────────────────────────────────────── */
declare global{interface Window{Chart:any;}}
function HormoneChart({day}:{day:number}){
  const ref=useRef<HTMLCanvasElement>(null);
  const chartRef=useRef<any>(null);
  useEffect(()=>{
    const build=()=>{
      if(!ref.current||!window.Chart)return;
      if(chartRef.current)chartRef.current.destroy();
      chartRef.current=new window.Chart(ref.current.getContext('2d'),{
        type:'line',
        data:{labels:Array.from({length:28},(_,i)=>i+1),datasets:HM.map(h=>({data:(HC as any)[h.key],borderColor:h.color,borderWidth:h.key==='lh'?2.5:1.5,fill:false,tension:0.4,pointRadius:0,borderDash:['fsh','test'].includes(h.key)?[4,3]:[]}))},
        options:{responsive:true,maintainAspectRatio:false,animation:{duration:200},plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'rgba(255,255,255,0.28)',font:{size:8},maxTicksLimit:7},border:{color:'transparent'}},y:{display:false,min:0,max:110}}},
      });
    };
    if(window.Chart)build();
    else{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';s.onload=build;document.head.appendChild(s);}
    return()=>{if(chartRef.current)chartRef.current.destroy();};
  },[]);
  useEffect(()=>{
    if(!chartRef.current)return;
    chartRef.current.data.datasets.forEach((ds:any,i:number)=>{
      const r=Array(28).fill(0);r[day-1]=5;
      ds.pointRadius=r;ds.pointBackgroundColor=HM[i].color;ds.pointBorderColor='#050505';ds.pointBorderWidth=2;
    });
    chartRef.current.update('none');
  },[day]);
  return <div style={{position:'relative',width:'100%',height:140}}><canvas ref={ref} style={{width:'100%',height:140}}/></div>;
}

/* ─── TIER GATE ──────────────────────────────────────────────────────────── */
function Gate({title,tier,children}:{title:string;tier:string;children:React.ReactNode}){
  const nav=useNavigate();
  return(
    <div style={gc({position:'relative',overflow:'hidden',minHeight:130})}>
      <div style={{filter:'blur(5px)',opacity:0.22,pointerEvents:'none',userSelect:'none'}}>{children}</div>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:20}}>
        <div style={{width:42,height:42,borderRadius:'50%',background:GD,border:`1px solid ${G}44`,display:'flex',alignItems:'center',justifyContent:'center'}}><Lock size={17} color={G}/></div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:4}}>{title}</div>
          <div style={{fontSize:11,color:W6,marginBottom:12}}>Kräver <span style={{color:G,fontWeight:700}}>{tier}</span></div>
          <button onClick={()=>nav('/membership')} style={{background:`linear-gradient(135deg,${G},#B8941F)`,border:'none',borderRadius:18,color:'#050505',fontFamily:F,fontSize:11,fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase',padding:'9px 18px',cursor:'pointer'}}>Uppgradera →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL ──────────────────────────────────────────────────────────────── */
function Modal({children,onClose}:{children:React.ReactNode;onClose:()=>void}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);},[onClose]);
  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <motion.div initial={{y:22,opacity:0}} animate={{y:0,opacity:1}} exit={{y:22,opacity:0}}
        style={{background:'#0C0C14',border:`1px solid ${GB}`,borderRadius:28,padding:'28px 24px',maxWidth:460,width:'100%',maxHeight:'84vh',overflowY:'auto',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,background:W2,border:'none',color:'#fff',width:30,height:30,borderRadius:'50%',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F}}>✕</button>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function SovereignHormonalAlchemy(){
  const nav=useNavigate();
  const {phase,cycleDay,isConfigured,settings,isLoading,updateCycleSettings,isSaving}=useCyclePhase();
  const {tier}=useMembership();
  const {isAdmin}=useAdminRole();

  const isPrana  = isAdmin || ['prana-flow','siddha-quantum','akasha-infinity'].includes(tier);
  const isSiddha = isAdmin || ['siddha-quantum','akasha-infinity'].includes(tier);

  const [tab,setTab]       = useState<'today'|'log'|'explore'|'insights'>('today');
  const [modal,setModal]   = useState<React.ReactNode|null>(null);
  const [showSetup,setShowSetup] = useState(false);
  const [exploreDay,setExploreDay] = useState<number|null>(null);
  const [logDate,setLogDate] = useState(todayStr());
  const [noteInput,setNoteInput] = useState('');
  const [tx,setTx]         = useState(false);
  const [txP,setTxP]       = useState(0);

  // Setup form
  const [fDate,setFDate]   = useState('');
  const [fLen,setFLen]     = useState(28);
  const [fBled,setFBled]   = useState(5);

  const {log,allLogs,updateLog,toggle} = useDailyLog(logDate);

  const cycleLen = settings?.cycleLength??28;
  const bleedDays= settings?.bleedDays??5;

  // Current phase data
  const pk  = phaseKeyFromName(phase.name);
  const pd  = PD[pk];

  // Display day for explore
  const dDay = exploreDay??cycleDay;
  const dpk  = exploreDay ? phaseKeyFromDay(exploreDay,cycleLen,bleedDays) : pk;
  const dpd  = PD[dpk];

  const daysToNext = cycleLen - cycleDay + 1;

  // Transmission timer
  useEffect(()=>{
    if(!tx)return;
    const id=window.setInterval(()=>setTxP(p=>{if(p>=100){setTx(false);return 0;}return p+0.6;}),100);
    return()=>window.clearInterval(id);
  },[tx]);

  useEffect(()=>{if(!isLoading&&!isConfigured)setShowSetup(true);},[isLoading,isConfigured]);
  useEffect(()=>{
    if(settings){
      if(settings.lastPeriodDate)setFDate(settings.lastPeriodDate);
      setFLen(settings.cycleLength??28); setFBled(settings.bleedDays??5);
    }
  },[settings]);

  const saveSetup=()=>{if(!fDate)return;updateCycleSettings(fDate,fLen,fBled);setShowSetup(false);};

  const todaySecretions:string[]=log?.secretions||[];
  const phaseConfirmed=todaySecretions.some(s=>pd.secretions.includes(s as any));

  // Modal helpers
  const openMineral=(m:any)=>setModal(
    <div>
      <div style={{fontSize:36,marginBottom:10}}>{m.icon}</div>
      <div style={{fontSize:20,fontWeight:900,color:G,letterSpacing:'-0.03em',marginBottom:4}}>{m.food}</div>
      <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:W4,marginBottom:16}}>{m.mineral}</div>
      <div style={{background:`${G}09`,border:`1px solid ${G}22`,borderRadius:14,padding:14,marginBottom:14}}>
        <div style={{...LB,marginBottom:6}}>Funktion idag</div>
        <div style={{fontSize:12,color:W8,lineHeight:1.65}}>{m.fn}</div>
      </div>
      <div style={{...LB,marginBottom:8}}>Biokemi</div>
      <p style={{fontSize:12,color:W6,lineHeight:1.8,marginBottom:14}}>{m.bio}</p>
      <div>{m.tags.map((t:string)=><span key={t} style={{display:'inline-block',fontSize:'9px',fontWeight:700,padding:'3px 9px',borderRadius:20,margin:2,background:GD,color:G,border:`1px solid ${G}22`}}>{t}</span>)}</div>
    </div>
  );

  const openHormone=(h:typeof HM[0])=>{
    const val=Math.round((HC as any)[h.key][dDay-1]);
    setModal(
      <div>
        <div style={{fontSize:22,fontWeight:900,color:h.color,letterSpacing:'-0.03em',marginBottom:4}}>{h.label}</div>
        <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:W4,marginBottom:16}}>Dag {dDay} — nivå</div>
        <div style={{marginBottom:18}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:10,fontWeight:700,color:h.color}}>Relativ nivå</span>
            <span style={{fontSize:10,fontWeight:700,color:h.color}}>{val}%</span>
          </div>
          <div style={{height:8,borderRadius:8,background:W2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:8,background:h.color,width:`${val}%`,transition:'width 0.6s ease'}}/></div>
        </div>
        <p style={{fontSize:12,color:W6,lineHeight:1.8}}>{h.info}</p>
      </div>
    );
  };

  const openMudra=()=>setModal(
    <div>
      <div style={{fontSize:40,marginBottom:12}}>🤲</div>
      <div style={{fontSize:20,fontWeight:900,color:G,letterSpacing:'-0.03em',marginBottom:4}}>{pd.mudra}</div>
      <div style={{...LB,marginBottom:12}}>Vedisk Mudra · {pd.name}</div>
      <p style={{fontSize:12,color:W6,lineHeight:1.8,marginBottom:16}}>{pd.mudraInst}</p>
      <div style={{background:`${G}09`,border:`1px solid ${G}22`,borderRadius:14,padding:14}}>
        <div style={{...LB,marginBottom:4}}>Ritual</div>
        <p style={{fontSize:11,color:W6,lineHeight:1.65}}>{pd.ritual}</p>
      </div>
    </div>
  );

  const TABS=[{id:'today',label:'⟁ Idag'},{id:'log',label:'📝 Logga'},{id:'explore',label:'🔭 Utforska'},{id:'insights',label:'💡 Insikter'}] as const;

  return(
    <div style={{background:'#050505',minHeight:'100vh',fontFamily:F,color:'#fff',paddingBottom:100}}>

      {/* SETUP MODAL */}
      <AnimatePresence>
        {showSetup&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',backdropFilter:'blur(14px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
            onClick={()=>isConfigured&&setShowSetup(false)}>
            <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.92,opacity:0}}
              onClick={e=>e.stopPropagation()}
              style={{background:'#0A0A12',border:`1px solid rgba(212,175,55,0.2)`,borderRadius:32,padding:32,maxWidth:400,width:'100%'}}>
              <div style={{textAlign:'center',marginBottom:26}}>
                <div style={{display:'inline-block',fontSize:'7px',fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color:G,border:'1px solid rgba(212,175,55,0.25)',padding:'5px 16px',borderRadius:40,background:GD,marginBottom:14}}>⟁ Shakti Cycle Intelligence</div>
                <h2 style={{fontSize:24,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.1,marginBottom:10}}>Aktivera din<br/><span style={{color:G}}>Cykelintelligens</span></h2>
                <p style={{fontSize:11,color:W6,lineHeight:1.7}}>Ange din senaste menstruation. Din Bhakti-Algoritm spårar sedan cykeln automatiskt — synkat till Supabase.</p>
              </div>
              <div style={{marginBottom:20}}>
                <div style={LB}>Startdatum senaste mens</div>
                <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} max={todayStr()}
                  style={{width:'100%',background:W2,border:`1px solid ${GB}`,borderRadius:14,color:'#fff',fontSize:14,padding:'12px 14px',fontFamily:F,outline:'none',colorScheme:'dark',marginBottom:16}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {[{l:'Cykellängd',v:fLen,s:setFLen,min:21,max:40},{l:'Blödningsdagar',v:fBled,s:setFBled,min:2,max:10}].map(({l,v,s,min,max})=>(
                    <div key={l}>
                      <div style={LB}>{l}</div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <button onClick={()=>s((x:number)=>Math.max(min,x-1))} style={{background:W2,border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:18,fontFamily:F}}>−</button>
                        <span style={{fontSize:26,fontWeight:900,color:G,minWidth:40,textAlign:'center'}}>{v}</span>
                        <button onClick={()=>s((x:number)=>Math.min(max,x+1))} style={{background:W2,border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:18,fontFamily:F}}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {fDate&&<div style={{background:`${G}09`,border:`1px solid ${G}22`,borderRadius:14,padding:'10px 14px',marginBottom:16}}><p style={{fontSize:11,color:W6}}>⟁ Dag <strong style={{color:'#fff'}}>{Math.max(1,(Math.floor((Date.now()-new Date(fDate).getTime())/86400000)%fLen)+1)}</strong> — preview</p></div>}
              <button onClick={saveSetup} disabled={!fDate||isSaving}
                style={{width:'100%',background:fDate?`linear-gradient(135deg,${G},#B8941F)`:W2,border:'none',borderRadius:20,color:fDate?'#050505':W4,fontFamily:F,fontSize:13,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase',padding:15,cursor:fDate?'pointer':'not-allowed'}}>
                {isSaving?'...':'⟁ Aktivera Cykelintelligens'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY HEADER */}
      <div style={{background:'rgba(5,5,5,0.96)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:`1px solid ${GB}`,padding:'13px 16px 11px',position:'sticky',top:0,zIndex:100}}>
        <div style={{maxWidth:840,margin:'0 auto',display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>nav(-1)} style={{background:W2,border:`1px solid ${GB}`,borderRadius:12,color:W6,fontFamily:F,fontSize:'8px',fontWeight:800,padding:'7px 10px',cursor:'pointer',letterSpacing:'0.2em',textTransform:'uppercase',flexShrink:0}}>← Tillbaka</button>
          <div style={{width:44,height:44,borderRadius:'50%',background:`${pd.pColor}20`,border:`2px solid ${pd.pColor}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{pd.sIcon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:1}}>
              <span style={{fontSize:28,fontWeight:900,letterSpacing:'-0.04em',color:G,lineHeight:1}}>{dDay}</span>
              <span style={{fontSize:'8px',fontWeight:800,color:exploreDay?'#FBBF24':W4,letterSpacing:'0.2em',textTransform:'uppercase'}}>{exploreDay?'UTFORSKAR':'CYKELDAG'}</span>
            </div>
            <div style={{fontSize:12,fontWeight:700}}>{pd.name} <span style={{color:pd.pColor,fontSize:10}}>· {pd.season}</span></div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
            {!exploreDay&&<div style={{textAlign:'right'}}><div style={{fontSize:16,fontWeight:900,color:W6}}>{daysToNext}d</div><div style={{fontSize:'7px',fontWeight:800,color:W4,letterSpacing:'0.15em',textTransform:'uppercase'}}>Till mens</div></div>}
            {!!exploreDay&&<button onClick={()=>{setExploreDay(null);setTab('today');}} style={{background:`${G}20`,border:`1px solid ${G}44`,borderRadius:18,color:G,fontFamily:F,fontSize:'8px',fontWeight:800,padding:'6px 10px',cursor:'pointer'}}>← Idag</button>}
            <button onClick={()=>setShowSetup(true)} style={{background:W2,border:`1px solid ${GB}`,borderRadius:12,color:W6,fontFamily:F,fontSize:'8px',fontWeight:800,padding:'7px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Calendar size={10}/>Cykel</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:840,margin:'0 auto',padding:'14px 14px 0'}}>

        {/* TIER BADGES */}
        <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap'}}>
          {[{l:'✦ Free',a:true},{l:'⟁ Prana-Flow',a:isPrana},{l:'⬡ Siddha-Quantum',a:isSiddha}].map(t=>(
            <span key={t.l} style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',padding:'4px 12px',borderRadius:40,background:t.a?GD:'transparent',color:t.a?G:W4,border:`1px solid ${t.a?G+'44':GB}`}}>{t.l}</span>
          ))}
        </div>

        {/* PHASE CONFIRM BANNER */}
        <AnimatePresence>
          {phaseConfirmed&&tab==='today'&&(
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{background:`${pd.pColor}15`,border:`1px solid ${pd.pColor}44`,borderRadius:18,padding:'12px 16px',marginBottom:12,display:'flex',gap:10,alignItems:'flex-start'}}>
              <span style={{fontSize:16}}>⟁</span>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.85)',lineHeight:1.6}}><strong style={{color:pd.pColor}}>Fas bekräftad: </strong>{pd.confirmText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABS */}
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {TABS.map(t=>(
            <button key={t.id} type="button" onClick={()=>{setTab(t.id);if(t.id!=='explore')setExploreDay(null);}}
              style={{flex:1,padding:'10px 4px',border:`1px solid ${tab===t.id?G+'55':GB}`,borderRadius:40,background:tab===t.id?GD:'transparent',color:tab===t.id?G:W6,fontFamily:F,fontSize:'8px',fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════ TODAY ══════ */}
        {tab==='today'&&(
          <div>
            {/* Phase banner — FREE */}
            <div style={sc({marginBottom:12,background:`${pd.pColor}0E`,border:`1px solid ${pd.pColor}33`})}>
              <div style={{display:'flex',gap:14,alignItems:'center'}}>
                <span style={{fontSize:34}}>{pd.sIcon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.4em',textTransform:'uppercase',color:pd.pColor,marginBottom:4}}>{pd.season} · Dag {dDay} · {pd.label} · {pd.dosha}</div>
                  <div style={{fontSize:16,fontWeight:900,letterSpacing:'-0.02em',marginBottom:4}}>{pd.tagline}</div>
                  <div style={{fontSize:11,color:W6,fontStyle:'italic'}}>"{pd.mantra}"</div>
                </div>
              </div>
            </div>

            {/* Scalar Transmission — FREE */}
            <div style={gc({textAlign:'center',padding:28})}>
              <div style={{...LB,textAlign:'center',marginBottom:16}}>⟁ Scalar Transmission · {pd.freq}</div>
              <motion.div animate={{scale:tx?[1,1.05,1]:1,rotate:tx?360:0}} transition={{duration:4,repeat:tx?Infinity:0,ease:'linear'}}
                style={{width:96,height:96,borderRadius:'50%',border:`1px solid ${G}22`,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:18}}>
                <div style={{width:76,height:76,borderRadius:'50%',border:`2px solid ${G}55`,background:GD,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Zap size={28} color={tx?G:`${G}44`}/>
                </div>
              </motion.div>
              <div>
                <button type="button" onClick={()=>{setTx(v=>!v);setTxP(0);}}
                  style={{padding:'11px 28px',borderRadius:40,border:`1px solid ${G}55`,background:tx?G:'transparent',color:tx?'#050505':G,fontFamily:F,fontSize:11,fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer',position:'relative',overflow:'hidden'}}>
                  {tx?'Deaktivera':'⟁ Aktivera Transmission'}
                  {tx&&<div style={{position:'absolute',bottom:0,left:0,height:3,background:'rgba(0,0,0,0.3)',width:`${txP}%`}}/>}
                </button>
              </div>
              {tx&&<p style={{fontSize:10,color:W6,marginTop:12,fontStyle:'italic'}}>Harmoniserar Anahata-fältet med {pd.hz}Hz skalarvågor...</p>}
            </div>

            {/* Mudra + Ritual — FREE */}
            <div onClick={openMudra} style={sc({cursor:'pointer',display:'flex',gap:14,alignItems:'center',marginBottom:12,transition:'border-color 0.2s'})}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=`${G}44`}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=GB}>
              <span style={{fontSize:28}}>🤲</span>
              <div style={{flex:1}}>
                <div style={LB}>Mudra · Ritual</div>
                <div style={{fontSize:13,fontWeight:800,marginBottom:2}}>{pd.mudra}</div>
                <div style={{fontSize:11,color:W6}}>{pd.ritual} · Tryck för fullständig instruktion</div>
              </div>
              <ChevronRight size={16} color={W4}/>
            </div>

            {/* Quick log — FREE */}
            <div style={gc()}>
              <div style={LB}>⟁ Snabblogg idag</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:W4,marginBottom:8}}>Sekret & Blödning</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {SEC_OPTS.map(o=><button key={o.id} type="button" onClick={()=>toggle('secretions',o.id)} style={ch(todaySecretions.includes(o.id))}>{o.icon} {o.label}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:W4,marginBottom:8}}>Energinivå</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {NRG_OPTS.map(o=><button key={o.id} type="button" onClick={()=>updateLog({energy:log?.energy===o.id?null:o.id})} style={ch(log?.energy===o.id)}>{o.icon} {o.label}</button>)}
                </div>
              </div>
            </div>

            {/* Activities — PRANA-FLOW+ */}
            {isPrana?(
              <div style={gc()}>
                <div style={LB}>⟁ Rekommenderade aktiviteter</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(158px,1fr))',gap:10,marginBottom:14}}>
                  {pd.activities.map((a,i)=>(
                    <div key={i} style={sc({background:`${ICLR[a.intensity]}0C`,border:`1px solid ${ICLR[a.intensity]}30`})}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <span style={{fontSize:22}}>{a.icon}</span>
                        <span style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:ICLR[a.intensity],padding:'2px 7px',borderRadius:10,background:`${ICLR[a.intensity]}18`}}>{ILBL[a.intensity]}</span>
                      </div>
                      <div style={{fontSize:12,fontWeight:800,color:'#fff',marginBottom:3}}>{a.title}</div>
                      <div style={{fontSize:10,color:W6,lineHeight:1.5}}>{a.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:18,padding:'14px 16px',display:'flex',gap:12}}>
                  <span style={{fontSize:24,flexShrink:0}}>{pd.pranayama.icon}</span>
                  <div>
                    <div style={LB}>Pranayama · Nu</div>
                    <div style={{fontSize:12,fontWeight:800,marginBottom:3}}>{pd.pranayama.name}</div>
                    <div style={{fontSize:11,color:W6,lineHeight:1.55}}>{pd.pranayama.desc}</div>
                  </div>
                </div>
              </div>
            ):(
              <Gate title="Aktiviteter & Pranayama" tier="Prana-Flow">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[0,1,2,3].map(i=><div key={i} style={sc({height:80})}/>)}</div>
              </Gate>
            )}

            {/* Nutrition + Moon Milk + Career — PRANA-FLOW+ */}
            {isPrana?(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div style={sc()}>
                  <div style={LB}>🌿 Näring idag</div>
                  {pd.nutrition.map((n,i)=><div key={i} style={{fontSize:11,color:W6,marginBottom:7,lineHeight:1.5,paddingLeft:10,borderLeft:`2px solid ${G}44`}}>{n}</div>)}
                </div>
                <div>
                  <div style={sc({background:`${G}0A`,border:`1px solid ${G}25`,marginBottom:10})}>
                    <div style={LB}>🥛 Moon Milk</div>
                    <div style={{fontSize:11,fontWeight:800,color:G,marginBottom:6}}>{pd.herb.name}</div>
                    {pd.herb.steps.map((r,i)=>(
                      <div key={i} style={{display:'flex',gap:8,marginBottom:6}}>
                        <span style={{width:18,height:18,borderRadius:'50%',background:GD,border:`1px solid ${G}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px',fontWeight:800,color:G,flexShrink:0}}>{i+1}</span>
                        <span style={{fontSize:10,color:W6,lineHeight:1.5,paddingTop:2}}>{r}</span>
                      </div>
                    ))}
                  </div>
                  <div style={sc({display:'flex',gap:10})}>
                    <span style={{fontSize:18}}>⚡</span>
                    <div><div style={LB}>Career Sync</div><p style={{fontSize:11,color:W6,lineHeight:1.6}}>{pd.career}</p></div>
                  </div>
                </div>
              </div>
            ):(
              <Gate title="Näring, Moon Milk & Career Sync" tier="Prana-Flow"><div style={{height:120}}/></Gate>
            )}

            {/* Hormone graph — SIDDHA-QUANTUM+ */}
            {isSiddha?(
              <div style={gc()}>
                <div style={LB}>⟁ Hormonprofil — klicka för djupinformation</div>
                <HormoneChart day={dDay}/>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                  {HM.map(h=>(
                    <button key={h.key} type="button" onClick={()=>openHormone(h)}
                      style={{padding:'5px 11px',borderRadius:40,fontSize:10,fontWeight:700,background:`${h.color}15`,color:h.color,border:`1px solid ${h.color}33`,cursor:'pointer',fontFamily:F}}>
                      {h.label} {Math.round((HC as any)[h.key][dDay-1])}%
                    </button>
                  ))}
                </div>
              </div>
            ):(
              <Gate title="Hormonprofil & Biokemi" tier="Siddha-Quantum"><div style={{height:140}}/></Gate>
            )}

            {/* Minerals — SIDDHA-QUANTUM+ */}
            {isSiddha?(
              <div style={gc()}>
                <div style={LB}>⟁ Mineraler & Biokemi — klicka för djupinfo</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(158px,1fr))',gap:10}}>
                  {pd.minerals.map((m,i)=>(
                    <div key={i} onClick={()=>openMineral(m)}
                      style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${GB}`,borderRadius:22,padding:16,cursor:'pointer',transition:'all 0.22s',position:'relative'}}
                      onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor=`${G}55`;el.style.transform='translateY(-2px)';}}
                      onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor=GB;el.style.transform='translateY(0)';}}>
                      <span style={{position:'absolute',top:13,right:14,fontSize:15,color:W4}}>›</span>
                      <div style={{fontSize:26,marginBottom:8}}>{m.icon}</div>
                      <div style={{fontSize:10,fontWeight:800,color:G,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{m.mineral}</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{m.food}</div>
                      <div style={{fontSize:10,color:W4,marginBottom:6}}>{m.amount}</div>
                      <p style={{fontSize:11,color:W6,lineHeight:1.5}}>{m.fn}</p>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <Gate title="Mineraler & Biokemisk Djupdykning" tier="Siddha-Quantum">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[0,1,2,3].map(i=><div key={i} style={sc({height:100})}/>)}</div>
              </Gate>
            )}
          </div>
        )}

        {/* ══════ LOG — all tiers ══════ */}
        {tab==='log'&&(
          <div>
            <div style={gc()}>
              <div style={LB}>⟁ Välj datum</div>
              <div style={{display:'flex',gap:6,marginBottom:12}}>
                {[0,1,2,3].map(d=>{
                  const dt=new Date();dt.setDate(dt.getDate()-d);const ds=dt.toISOString().split('T')[0];
                  return <button key={d} type="button" onClick={()=>setLogDate(ds)} style={{flex:1,padding:'10px 4px',borderRadius:14,border:`1px solid ${logDate===ds?G+'55':GB}`,background:logDate===ds?GD:'transparent',color:logDate===ds?G:W6,fontFamily:F,fontSize:'9px',fontWeight:800,cursor:'pointer',textAlign:'center'}}>{d===0?'Idag':d===1?'Igår':`−${d}d`}</button>;
                })}
              </div>
              <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} max={todayStr()}
                style={{width:'100%',background:W2,border:`1px solid ${GB}`,borderRadius:12,color:'#fff',fontSize:13,padding:'10px 12px',fontFamily:F,outline:'none',colorScheme:'dark'}}/>
            </div>

            <div style={gc()}>
              <div style={LB}>🩸 Sekret & Blödning</div>
              <p style={{fontSize:11,color:W4,marginBottom:12,lineHeight:1.55}}>Dessa data bekräftar din faktiska cykelposition och identifierar den fertila fasen.</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {SEC_OPTS.map(o=>{const a=(log?.secretions||[]).includes(o.id);return <button key={o.id} type="button" onClick={()=>toggle('secretions',o.id)} style={ch(a,G)}>{o.icon} {o.label}{a&&<span style={{fontSize:9,opacity:0.7}}>✓</span>}</button>;})}
              </div>
              {(log?.secretions||[]).some((s:string)=>pd.secretions.includes(s as any))&&(
                <div style={{marginTop:12,padding:'10px 14px',background:`${pd.pColor}12`,border:`1px solid ${pd.pColor}33`,borderRadius:14}}>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.82)',lineHeight:1.6}}><strong style={{color:pd.pColor}}>⟁ </strong>{pd.confirmText}</p>
                </div>
              )}
            </div>

            <div style={gc()}>
              <div style={LB}>🌙 Energinivå</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                {NRG_OPTS.map(o=>{const a=log?.energy===o.id;return(
                  <button key={o.id} type="button" onClick={()=>updateLog({energy:a?null:o.id})}
                    style={{padding:'12px 6px',borderRadius:16,border:`1px solid ${a?G+'66':GB}`,background:a?GD:'transparent',cursor:'pointer',textAlign:'center',fontFamily:F}}>
                    <div style={{fontSize:22,marginBottom:4}}>{o.icon}</div>
                    <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:a?G:W4}}>{o.label}</div>
                  </button>
                );})}
              </div>
            </div>

            <div style={gc()}>
              <div style={LB}>💫 Humör</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {MOOD_OPTS.map(o=><button key={o.id} type="button" onClick={()=>toggle('moods',o.id)} style={ch((log?.moods||[]).includes(o.id),'#A78BFA')}>{o.icon} {o.label}</button>)}
              </div>
            </div>

            <div style={gc()}>
              <div style={LB}>⚡ Symtom</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {SYM_OPTS.map(o=><button key={o.id} type="button" onClick={()=>toggle('symptoms',o.id)} style={ch((log?.symptoms||[]).includes(o.id),'#F472B6')}>{o.icon} {o.label}</button>)}
              </div>
            </div>

            <div style={gc()}>
              <div style={LB}>📝 Anteckning</div>
              <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} onBlur={()=>updateLog({note:noteInput})}
                placeholder="Hur känns kroppen? Vad behöver du idag?"
                style={{width:'100%',minHeight:88,background:W2,border:`1px solid ${GB}`,borderRadius:16,color:'#fff',fontSize:12,padding:'12px 14px',fontFamily:F,outline:'none',resize:'vertical',lineHeight:1.7,colorScheme:'dark'}}/>
              <button type="button" onClick={()=>updateLog({note:noteInput})}
                style={{marginTop:10,background:GD,border:`1px solid ${G}44`,borderRadius:14,color:G,fontFamily:F,fontSize:'8px',fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',padding:'9px 18px',cursor:'pointer'}}>
                ⟁ Spara
              </button>
            </div>
          </div>
        )}

        {/* ══════ EXPLORE — PRANA-FLOW+ ══════ */}
        {tab==='explore'&&(
          isPrana?(
            <div>
              <div style={gc()}>
                <div style={LB}>⟁ Utforska valfri dag</div>
                <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:14}}>
                  <div style={{fontSize:46,fontWeight:900,color:G,letterSpacing:'-0.04em',lineHeight:1,minWidth:62}}>{dDay}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:800,marginBottom:2}}>{dpd.name}</div>
                    <div style={{fontSize:9,color:W4,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase'}}>{dpd.season} · {dpd.dosha}</div>
                  </div>
                </div>
                <input type="range" min="1" max={cycleLen} value={dDay} onChange={e=>setExploreDay(+e.target.value)} style={{width:'100%',accentColor:G,cursor:'pointer',marginBottom:8}}/>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  {(['Menstrual','Follicular','Ovulatory','Luteal'] as PhaseKey[]).map((k,i)=>(
                    <span key={k} onClick={()=>setExploreDay(i===0?3:i===1?9:i===2?14:22)}
                      style={{fontSize:'8px',fontWeight:700,color:dpk===k?PD[k].pColor:W4,cursor:'pointer',letterSpacing:'0.1em'}}>
                      {PD[k].sIcon} {k==='Menstrual'?'1–5':k==='Follicular'?'6–13':k==='Ovulatory'?'14–15':'16–28'}
                    </span>
                  ))}
                </div>
              </div>

              <div style={sc({marginBottom:12,background:`${dpd.pColor}0E`,border:`1px solid ${dpd.pColor}33`})}>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <span style={{fontSize:28}}>{dpd.sIcon}</span>
                  <div>
                    <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.35em',textTransform:'uppercase',color:dpd.pColor,marginBottom:4}}>{dpd.season} · {dpd.dosha}</div>
                    <div style={{fontSize:14,fontWeight:800,marginBottom:3}}>{dpd.tagline}</div>
                    <div style={{fontSize:11,color:W6,fontStyle:'italic'}}>"{dpd.mantra}"</div>
                  </div>
                </div>
              </div>

              <div style={gc()}>
                <div style={LB}>⟁ Aktiviteter dag {dDay}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(158px,1fr))',gap:10,marginBottom:14}}>
                  {dpd.activities.map((a,i)=>(
                    <div key={i} style={sc({background:`${ICLR[a.intensity]}0C`,border:`1px solid ${ICLR[a.intensity]}30`})}>
                      <span style={{fontSize:22,display:'block',marginBottom:6}}>{a.icon}</span>
                      <span style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:ICLR[a.intensity],display:'block',marginBottom:4}}>{ILBL[a.intensity]}</span>
                      <div style={{fontSize:12,fontWeight:800,marginBottom:3}}>{a.title}</div>
                      <div style={{fontSize:10,color:W6,lineHeight:1.5}}>{a.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:`${G}0A`,border:`1px solid ${G}22`,borderRadius:18,padding:'14px 16px',display:'flex',gap:12}}>
                  <span style={{fontSize:24,flexShrink:0}}>{dpd.pranayama.icon}</span>
                  <div>
                    <div style={LB}>Pranayama</div>
                    <div style={{fontSize:12,fontWeight:800,marginBottom:3}}>{dpd.pranayama.name}</div>
                    <div style={{fontSize:11,color:W6,lineHeight:1.55}}>{dpd.pranayama.desc}</div>
                  </div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div style={sc()}>
                  <div style={LB}>🌿 Näring</div>
                  {dpd.nutrition.map((n,i)=><div key={i} style={{fontSize:11,color:W6,marginBottom:7,lineHeight:1.5,paddingLeft:10,borderLeft:`2px solid ${G}44`}}>{n}</div>)}
                </div>
                <div>
                  <div style={sc({background:`${G}0A`,border:`1px solid ${G}25`,marginBottom:10})}>
                    <div style={LB}>🥛 {dpd.herb.name}</div>
                    <p style={{fontSize:11,color:W6,lineHeight:1.6}}>{dpd.herb.tagline}</p>
                  </div>
                  <div style={sc()}>
                    <div style={LB}>⚡ Career</div>
                    <p style={{fontSize:11,color:W6,lineHeight:1.6}}>{dpd.career}</p>
                  </div>
                </div>
              </div>

              {isSiddha&&(
                <div style={gc()}>
                  <div style={LB}>⟁ Hormonprofil dag {dDay}</div>
                  <HormoneChart day={dDay}/>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                    {HM.map(h=>(
                      <button key={h.key} type="button" onClick={()=>openHormone(h)}
                        style={{padding:'4px 10px',borderRadius:40,fontSize:10,fontWeight:700,background:`${h.color}15`,color:h.color,border:`1px solid ${h.color}33`,cursor:'pointer',fontFamily:F}}>
                        {h.label} {Math.round((HC as any)[h.key][dDay-1])}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ):(
            <Gate title="Utforska alla 28 cykeldagar" tier="Prana-Flow"><div style={{height:200}}/></Gate>
          )
        )}

        {/* ══════ INSIGHTS ══════ */}
        {tab==='insights'&&(
          <div>
            {/* Basic stats — FREE */}
            <div style={gc()}>
              <div style={LB}>⟁ Cykeldashboard</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[{l:'Cykeldag',v:cycleDay},{l:'Cykellängd',v:`${cycleLen}d`},{l:'Till mens',v:`${daysToNext}d`},{l:'Fas',v:pd.sIcon},{l:'Dosha',v:pd.dosha.split('→')[0].trim()},{l:'Hz',v:`${pd.hz}`}].map((s,i)=>(
                  <div key={i} style={sc({textAlign:'center',padding:'12px 8px'})}>
                    <div style={{fontSize:22,fontWeight:900,color:G}}>{s.v}</div>
                    <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.25em',textTransform:'uppercase',color:W4,marginTop:3}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern analysis — SIDDHA+ */}
            {isSiddha?((()=>{
              const entries=Object.entries(allLogs);
              const total=entries.length;
              const fertile=entries.filter(([,v]:any)=>(v.secretions||[]).includes('egg_white')).length;
              const highE=entries.filter(([,v]:any)=>['e4','e5'].includes(v.energy||'')).length;
              const lowE=entries.filter(([,v]:any)=>['e1','e2'].includes(v.energy||'')).length;
              const cravings=entries.filter(([,v]:any)=>(v.symptoms||[]).includes('cravings')).length;
              const cramps=entries.filter(([,v]:any)=>(v.symptoms||[]).includes('cramps')).length;
              const recent=entries.sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7);
              return(
                <>
                  <div style={gc()}>
                    <div style={LB}>⟁ Mönsteranalys</div>
                    {[
                      {icon:'✨',label:'Ägglossningssignaler (äggvita)',val:fertile,note:fertile>0?'Ägglossning bekräftad ✓':'Logga äggvita-sekret för bekräftelse'},
                      {icon:'🌕',label:'Högenergi-dagar',val:highE,note:'Korrelera med ovulations- och follikulärfas'},
                      {icon:'🌑',label:'Lågenergi-dagar',val:lowE,note:'Korrelera med menstruations- och sen lutealfas'},
                      {icon:'🍫',label:'Sötsugsdagar',val:cravings,note:cravings>0?'Råkakao + sötpotatis i lutealfas — prova!':'Bra, inga sötsug loggade'},
                      {icon:'⚡',label:'Krampdagar',val:cramps,note:cramps>0?'Pumpafrön (zink) + linfrön (omega-3) varje cykel':'Bra!'},
                    ].map((s,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<4?`1px solid ${W2}`:'none'}}>
                        <div><div style={{fontSize:12,fontWeight:700}}>{s.icon} {s.label}</div><div style={{fontSize:10,color:W4,marginTop:2}}>{s.note}</div></div>
                        <div style={{fontSize:26,fontWeight:900,color:G,minWidth:40,textAlign:'right'}}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {recent.length>0&&(
                    <div style={gc()}>
                      <div style={LB}>⟁ Senaste loggarna</div>
                      {recent.map(([date,le]:any)=>{
                        const diff=Math.floor((new Date(date).getTime()-new Date(settings?.lastPeriodDate||date).getTime())/86400000);
                        const cd=diff>=0?(diff%cycleLen)+1:null;
                        const lpk=cd?phaseKeyFromDay(cd,cycleLen,bleedDays):'Menstrual';
                        const lpd=PD[lpk];
                        return(
                          <div key={date} style={{padding:'12px 0',borderBottom:`1px solid ${W2}`}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                <span style={{fontSize:14}}>{lpd.sIcon}</span>
                                <span style={{fontSize:11,fontWeight:700}}>{date}</span>
                                {cd&&<span style={{fontSize:'8px',fontWeight:700,color:lpd.pColor,letterSpacing:'0.15em',textTransform:'uppercase'}}>Dag {cd}</span>}
                              </div>
                              {le.energy&&<span style={{fontSize:16}}>{NRG_OPTS.find(e=>e.id===le.energy)?.icon}</span>}
                            </div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                              {(le.secretions||[]).map((s:string)=>{const o=SEC_OPTS.find(x=>x.id===s);return o?<span key={s} style={{fontSize:'9px',padding:'2px 7px',borderRadius:10,background:W2,color:W6}}>{o.icon} {o.label}</span>:null;})}
                              {(le.moods||[]).map((s:string)=>{const o=MOOD_OPTS.find(x=>x.id===s);return o?<span key={s} style={{fontSize:'9px',padding:'2px 7px',borderRadius:10,background:'rgba(167,139,250,0.1)',color:'#A78BFA'}}>{o.icon} {o.label}</span>:null;})}
                              {(le.symptoms||[]).map((s:string)=>{const o=SYM_OPTS.find(x=>x.id===s);return o?<span key={s} style={{fontSize:'9px',padding:'2px 7px',borderRadius:10,background:'rgba(244,114,182,0.1)',color:'#F472B6'}}>{o.icon} {o.label}</span>:null;})}
                            </div>
                            {le.note&&<p style={{fontSize:10,color:W4,marginTop:6,fontStyle:'italic'}}>"{le.note}"</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {total===0&&(
                    <div style={{...gc(),textAlign:'center',padding:32}}>
                      <div style={{fontSize:40,marginBottom:14}}>📊</div>
                      <p style={{fontSize:12,color:W4,lineHeight:1.7}}>Börja logga sekret, energi och symtom via Logga-fliken. Din Bhakti-Algoritm analyserar mönster över tid.</p>
                    </div>
                  )}
                </>
              );
            })()):(
              <Gate title="Mönsteranalys & Logghistorik" tier="Siddha-Quantum"><div style={{height:200}}/></Gate>
            )}
          </div>
        )}

      </div>

      <AnimatePresence>
        {modal&&<Modal onClose={()=>setModal(null)}>{modal}</Modal>}
      </AnimatePresence>
    </div>
  );
}
