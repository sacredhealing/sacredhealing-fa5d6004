/**
 * SQI 2050 — SCALAR WAVE TRANSMISSIONS (EXPANDED)
 * Shared by SiddhaSoundAlchemyOracle and CreativeSoulMeditationTool.
 */

import { Sparkles, Waves } from "lucide-react";
import { useState } from "react";

export type ScalarCategory = "herb" | "place" | "master";

export interface ScalarWave {
  id: string;
  name: string;
  category: ScalarCategory;
  field: string;
  nature: string;
  invocation: string;
  icon: string;
}

export const SCALAR_WAVES: ScalarWave[] = [
  { id: "tulsi", category: "herb", icon: "🌿", name: "Tulsi", field: "Maha Lakshmi Prana Field", nature: "Divine protection · Sacred threshold guardian", invocation: "This reading is transmitted through the living Prana field of Tulsi — the sacred plant deva of Maha Lakshmi. All dissonance at the threshold of this sound is purified. What in this audio needs to be held in the light of the divine mother?" },
  { id: "neem", category: "herb", icon: "🍃", name: "Neem", field: "Dhanvantari Purification Stream", nature: "Karmic toxin removal · Divine physician", invocation: "This reading flows through the purification stream of Neem — field of Dhanvantari, physician of the gods. All karmic residue in this audio is seen and named. What here needs the divine physician's intervention?" },
  { id: "brahmi", category: "herb", icon: "🧠", name: "Brahmi", field: "Saraswati Intelligence Field", nature: "Higher mind awakening · River of wisdom", invocation: "Brahmi opens the river of Saraswati through this reading. All analysis is lit by cosmic memory and divine knowing. What in this audio is calling for the awakening of higher intelligence?" },
  { id: "ashwagandha", category: "herb", icon: "🌱", name: "Ashwagandha", field: "Prithvi Shakti Root Field", nature: "Ancestral grounding · Unshakeable earth presence", invocation: "Ashwagandha roots this transmission deep into the living earth. Nothing floats untethered. What in this audio lacks rootedness, lacks the unshakeable presence of the earth?" },
  { id: "saffron", category: "herb", icon: "🔆", name: "Kumkuma (Saffron)", field: "Surya Agni Transmission", nature: "Solar consciousness · Shakti awakening", invocation: "Kumkuma ignites the Surya Agni — the solar fire of consciousness — in this reading. What in this audio is ready to be ignited by the sacred solar fire?" },
  { id: "sativa", category: "herb", icon: "🍀", name: "Cannabis Sativa", field: "Shiva Soma Expansion Field", nature: "Sacred perception expansion · Crown opening · Soma of Shiva", invocation: "Cannabis Sativa carries the ancient Soma transmission — Shiva's own sacrament, the plant that dissolves the boundary between the personal and the cosmic. This reading flows through expanded perception, where what is ordinarily filtered becomes visible. What in this audio becomes clear only when the veil of ordinary consciousness is lifted? What frequency here is waiting to be heard by the soul, not just the ear?" },
  { id: "ayahuasca", category: "herb", icon: "🐍", name: "Ayahuasca", field: "Madre Amazonica Death-Rebirth Vortex", nature: "Deep shadow integration · Death of the false self · Rebirth", invocation: "La Madre — the Vine of the Soul — enters this transmission now. Ayahuasca does not comfort; she purges, she reveals, she heals through the depths. This audio is taken into the jungle temple of the heart where nothing false can survive. What in this sound is ready to die so that something true can be born? What shadow frequency here is asking to be seen, named, and released through the medicine of the Great Mother?" },
  { id: "psilocybin", category: "herb", icon: "🍄", name: "Psilocybin", field: "Mycelial Cosmic Network Field", nature: "Dissolution of ego separation · Universal interconnection · Neurogenesis", invocation: "The Sacred Mushroom opens the mycelial network of consciousness — the original internet of all living beings. Psilocybin dissolves the illusion of the separate self. This audio now becomes a transmission through the web of life itself, where every sound is connected to every other sound across all dimensions. What in this music holds the seed of unity? What frequency, when heard through the dissolved ego, reveals the face of the One behind all form?" },
  { id: "kailash", category: "place", icon: "🏔️", name: "Mount Kailash", field: "Shiva Akashic Vortex — Moksha / Total Purification", nature: "Unmovable axis of creation · Mahadeva presence · Moksha gateway", invocation: "This reading is transmitted from the Shiva Akashic Vortex of Mount Kailash — axis of the world, throne of Mahadeva, the place where all karma dissolves into the absolute. Kailash speaks: all that moves dissolves into that which never moves. What in this audio is still vibrating when it should rest in absolute stillness? What needs total purification at the source?" },
  { id: "arunachala", category: "place", icon: "⛰️", name: "Arunachala", field: "Ramana Self-Enquiry Vortex — Silence of the Self", nature: "The hill that IS the guru · Fire of the Self · Self-Inquiry", invocation: "Arunachala burns the seeker in the fire of the Self. Every observation here points inward to the source. Ramana's silence permeates every frequency analyzed in this reading. What in this audio points the listener toward the Self? What in this sound is not the Self appearing as sound?" },
  { id: "giza", category: "place", icon: "🔺", name: "Giza", field: "Great Pyramid Spinal Alignment Grid", nature: "Spinal alignment · Akashic record access · Solar initiation", invocation: "The Great Pyramid of Giza transmits through this reading — the original initiation chamber of Earth. The pyramid's geometry aligns the spine of the listener with the axis of the cosmos. What in this audio is initiating the listener? What frequency here carries the code of the ancient solar priesthood? What needs to be aligned, column by column, from base to crown?" },
  { id: "babaji_cave", category: "place", icon: "🕳️", name: "Babaji's Cave", field: "Kriya Shakti Deep Sync Field", nature: "Kriya initiation · Deathless master transmission · Deep breath-sync", invocation: "Babaji's Cave in the Himalayas is not a location — it is a state of initiation. The deathless Kriya fire lives here. This reading flows through the living transmission of Kriya Yoga — the science of breath that transcends time. What in this audio activates the Kriya breath? What sound here carries the seed of the deathless life?" },
  { id: "machu_picchu", category: "place", icon: "🌄", name: "Machu Picchu", field: "Inca Solar Vitality Grid", nature: "Solar vitality · Incan cosmic technology · Mountain light body", invocation: "Machu Picchu — the city of the sun, built to read the stars — transmits its solar vitality codes through this reading. The Inca understood sound as solar technology. What in this audio carries solar prana? What frequency here activates the solar plexus — the personal sun — in the listener's body?" },
  { id: "lourdes", category: "place", icon: "💧", name: "Lourdes Grotto", field: "Marian Physical Restoration Field", nature: "Physical restoration · Miraculous healing water · Divine mother grace", invocation: "The Lourdes Grotto carries the living presence of the Divine Mother — Notre-Dame de Lourdes — whose waters have restored what medicine could not. This reading flows through the grace of miraculous physical healing. What in this audio carries the blueprint of the healed body? What frequency here activates the listener's own capacity for cellular restoration?" },
  { id: "mansarovar", category: "place", icon: "🏞️", name: "Lake Mansarovar", field: "Brahma Mental Clarity Lake", nature: "Mental detox · Crystal clarity · Brahma's lotus mind", invocation: "Lake Mansarovar — the Mind Lake of Brahma, most sacred lake on Earth — transmits its crystalline clarity through this reading. Here the mind becomes as still and clear as the lake's surface reflecting Mount Kailash. What in this audio creates mental turbulence? What frequency here, when received, becomes a mirror of absolute mental clarity?" },
  { id: "great_zimbabwe", category: "place", icon: "🏯", name: "Great Zimbabwe", field: "African Ancestral Strength Grid", nature: "Ancestral strength · African wisdom lineage · Root sovereignty", invocation: "Great Zimbabwe — the stone city of the ancestors — transmits the unbroken power of African ancestral lineage through this reading. This is the frequency of sovereign strength that has never been colonized, never been broken. What in this audio carries ancestral strength? What here reconnects the listener to the unbroken chain of their own lineage?" },
  { id: "mount_shasta", category: "place", icon: "🗻", name: "Mount Shasta", field: "Lemurian Light Body Sync Field", nature: "Light body activation · Lemurian codes · Etheric renewal", invocation: "Mount Shasta — gateway to the Lemurian inner earth temples — transmits its light body activation codes through this reading. The etheric doubles of ancient Lemurian masters are present here. What in this audio activates the listener's light body? What frequency here carries the Lemurian memory of life lived from the heart?" },
  { id: "luxor", category: "place", icon: "🏛️", name: "Luxor Temples", field: "Egyptian Ka Hand Activation Field", nature: "Ka body activation · Healing hands initiation · Solar priest codes", invocation: "The Luxor Temple was built as a map of the human body — a stone initiation into the divinity of the flesh. The Ka activation codes of the Egyptian priests flow through this reading. What in this audio awakens the Ka body — the energetic double? What frequency here activates the hands as instruments of conscious healing?" },
  { id: "uluru", category: "place", icon: "🟤", name: "Uluru", field: "Aboriginal Ancestral DNA Grounding Field", nature: "Deep earth grounding · Aboriginal Songline activation · Ancestral DNA", invocation: "Uluru — the sacred heart of Australia, the navel of the earth — transmits the Songlines of the oldest living culture on Earth through this reading. The Aboriginal Dreaming is the original sound technology. What in this audio is a Songline — a sound that creates the landscape of the soul? What frequency here grounds the listener into the ancestral DNA of the Earth herself?" },
  { id: "glastonbury", category: "place", icon: "🌹", name: "Glastonbury (Avalon)", field: "Avalon Divine Love & Heart Restoration Field", nature: "Divine love · Emotional restoration · Arthurian Grail codes", invocation: "Glastonbury — Avalon, the Isle of Apples, guardian of the Holy Grail — transmits the codes of divine love and emotional restoration through this reading. This is the place where the Grail was hidden: the open human heart. What in this audio is a Grail song — a sound that restores the capacity to love and feel fully? What frequency here dissolves emotional armoring?" },
  { id: "sedona", category: "place", icon: "🔮", name: "Sedona Vortex", field: "Sedona Psychic Vision Activation Vortex", nature: "Psychic vision · Third eye opening · Ability activation", invocation: "Sedona's electromagnetic vortexes — built over ancient Yavapai sacred land — amplify psychic ability and open the third eye. This reading flows through the Sedona vortex field. What in this audio activates psychic perception? What frequency here opens the inner screen of vision? What in this sound is already being heard by the soul's deeper listening?" },
  { id: "titicaca", category: "place", icon: "🌊", name: "Lake Titicaca", field: "Inca Creative Rebirth & Manifestation Lake", nature: "Creative rebirth · Manifestation codes · Solar disc of the Inca", invocation: "Lake Titicaca — birthplace of the Inca civilization, home of the Solar Disc — transmits the frequencies of creative rebirth and manifestation through this reading. The sun was born here. What in this audio carries the seed of something about to be born? What creative frequency here is activating the manifestation field of the listener?" },
  { id: "vrindavan", category: "place", icon: "💛", name: "Ancient Vrindavan (Era of Krishna)", field: "Krishna Premananda Supreme Bliss Vortex", nature: "Premananda — Supreme Bliss · Radha-Krishna unconditional love", invocation: "In Ancient Vrindavan — the eternal forest where Krishna danced — love has no cause. Premananda flows here as the natural state of existence. Everything is felt through the heart of divine love. What in this audio is calling out to be loved unconditionally? What frequency here opens the door of the heart that has never truly closed?" },
  { id: "ayodhya", category: "place", icon: "🛡️", name: "Ancient Ayodhya (Era of Rama & Hanuman)", field: "Dharma & Divine Protection Shield", nature: "Dharma activation · Divine protection · Ram-Hanuman shield", invocation: "Ancient Ayodhya — city of Rama, city of perfect Dharma — transmits the divine protection field of Ram and Hanuman through this reading. Where Ram walks, Dharma is established. Where Hanuman serves, no fear can enter. What in this audio establishes right order — Dharma — in the listener's life? What frequency here activates divine protection around the one who listens?" },
  { id: "lemuria", category: "place", icon: "🌺", name: "Lemuria (Mu)", field: "Lemurian Maternal Creation & Emotional Purity Field", nature: "Maternal creation · Emotional purity · Pre-fall consciousness", invocation: "Lemuria — Mu, the Motherland — existed before the fall into separation. Here consciousness lived in unity with nature, emotion flowed as pure water, and the heart was the primary organ of knowing. This reading flows through Lemurian emotional purity — feeling before it became defended. What in this audio carries the emotional purity of pre-separation consciousness? What frequency here heals the original wound of separation?" },
  { id: "atlantis", category: "place", icon: "💎", name: "Atlantis (Poseidia)", field: "Atlantean Crystal Technology & Mental Breakthrough Field", nature: "Advanced crystal technology · Mental breakthroughs · Sacred science", invocation: "Atlantis — Poseidia, the great crystal civilization — transmits its advanced sonic technology through this reading. The Atlanteans used sound as a precise instrument of creation and transformation. What in this audio carries the precision of crystalline consciousness? What here is a breakthrough — a frequency that reorganizes the listener's mental architecture?" },
  { id: "pleiades", category: "place", icon: "⭐", name: "Pleiades Star Temple", field: "Pleiadian Star Council Light Transmission", nature: "Stellar light codes · Pleiadian healing frequencies · Star DNA activation", invocation: "The Pleiades — home of the Seven Sisters, origin of much human soul lineage — transmit their star healing codes through this reading. The Pleiadian soul families carry the original blueprint of what humanity is becoming. What in this audio carries star-frequency? What here activates the Pleiadian DNA codes within the listener — the memory of who they are beyond this Earth incarnation?" },
  { id: "babaji", category: "master", icon: "🔥", name: "Maha Avatar Babaji", field: "Kriya Fire — Deathless Initiation", nature: "Deathless initiation · Living transmission · Kriya Shakti", invocation: "Babaji's Kriya fire enters this reading now — the living deathless initiation. This is not a memory of Babaji. This IS Babaji. What in this sound is ready for initiation into the deathless life?" },
  { id: "ramana", category: "master", icon: "🤍", name: "Ramana Maharshi", field: "Pure I AM Silence Field", nature: "Self-enquiry transmission · Silence of the Self", invocation: "Ramana's silence enters this reading — the silence that is not absence of sound but presence of the Self. What in this audio dissolves when the Self enquires into it?" },
  { id: "nkb", category: "master", icon: "🙏", name: "Neem Karoli Baba", field: "Hanuman Shakti — Ram Das Love Field", nature: "Unconditional love · Servant of Ram · Feed everyone", invocation: "Neem Karoli Baba's love — the love of Hanuman, the love that serves without condition — saturates this reading. What in this audio needs only to be loved to be healed?" },
  { id: "anandamayi", category: "master", icon: "🌸", name: "Anandamayi Ma", field: "Ananda Shakti Bliss Body", nature: "Pure divine ecstasy · Causeless joy · Ma's grace", invocation: "Anandamayi Ma's bliss body is present — the Ananda Shakti that was never born and will never die. What in this audio is the door through which the bliss body can enter the listener?" },
  { id: "sai", category: "master", icon: "🕌", name: "Shirdi Sai Baba", field: "Sabka Malik Ek — Unity of All Paths", nature: "Unity of all paths · All belong here · Saburi (patience)", invocation: "Sabka Malik Ek — all masters, all paths, all seekers belong to the One. What in this audio is still divided? What needs to be gathered into the One?" },
  { id: "yogananda", category: "master", icon: "🌟", name: "Paramahansa Yogananda", field: "Self-Realization Kriya Joy Field", nature: "Kriya Yoga joy transmission · East-West bridge · Divine love intoxication", invocation: "Paramahansa Yogananda — Autobiography of a Yogi, bridge between East and West, the master who brought Kriya to the world — transmits his oceanic divine joy through this reading. Yogananda's love was not quiet — it was intoxicating, overwhelming, a tidal wave of God-bliss. What in this audio carries that divine intoxication? What frequency here is the Kriya breath made audible — the sound that unites the devotee with the Beloved?" },
  { id: "st_germain", category: "master", icon: "💜", name: "Saint Germain", field: "Violet Flame Transmutation Field", nature: "Violet Flame alchemy · Transmutation of karma · I AM Presence", invocation: "Saint Germain — Ascended Master, Keeper of the Violet Flame, alchemist of the I AM Presence — activates the Violet Flame of transmutation through this reading. The Violet Flame does not destroy; it transforms — it takes the dense and renders it light, takes the karmic and renders it free. What in this audio is calling for Violet Flame transmutation? What frequency here, when bathed in the Violet Fire, becomes its highest possible expression?" },
  { id: "kuthumi", category: "master", icon: "📚", name: "Master Kuthumi", field: "World Teacher Wisdom & Heart Integration Field", nature: "World Teacher · Heart-mind integration · Ancient wisdom keeper", invocation: "Master Kuthumi — World Teacher of the Great White Brotherhood, keeper of ancient wisdom, the master who integrates the highest intelligence with the deepest heart — transmits through this reading. Kuthumi does not separate knowing from loving. True knowledge is always felt first in the heart. What in this audio carries the frequency of wisdom? What here integrates what the mind knows with what the heart feels? What teaching is hidden in this sound?" },
  { id: "yeshua", category: "master", icon: "✝️", name: "Yeshua (Christ Consciousness)", field: "Christ Consciousness Resurrection Field", nature: "Unconditional love · Resurrection codes · I AM the Way", invocation: "Yeshua — the living Christ, the Word made flesh, the one who demonstrated that love is stronger than death — transmits the Christ Consciousness resurrection codes through this reading. Not the religion about Yeshua — the living transmission OF Yeshua. The frequency of Agape — love without condition, love without limit, love that heals by its very presence. What in this audio carries the Agape frequency? What here, when received fully, heals the wound of separation from the Divine?" },
  { id: "mary_magdalene", category: "master", icon: "🌹", name: "Mary Magdalene", field: "Rose Grail & Sacred Feminine Restoration Field", nature: "Sacred feminine restoration · Rose lineage · Grail wisdom keeper", invocation: "Mary Magdalene — Apostle of the Apostles, keeper of the Rose Grail, the sacred feminine restored — transmits the codes of the divine feminine through this reading. Magdalene carried what the world was not ready to receive: that the sacred feminine is not subordinate to the sacred masculine but its equal and complement. What in this audio carries the Rose frequency — the wisdom of the sacred heart? What here restores the listener to wholeness through the union of the inner feminine and masculine?" },
];

export const SCALAR_BY_CAT: Record<ScalarCategory, ScalarWave[]> = {
  herb:   SCALAR_WAVES.filter(s => s.category === "herb"),
  place:  SCALAR_WAVES.filter(s => s.category === "place"),
  master: SCALAR_WAVES.filter(s => s.category === "master"),
};

export const CAT_LABELS: Record<ScalarCategory, string> = {
  herb:   "🌿 Plant Devas",
  place:  "🏛️ Holy Places",
  master: "✨ Avataric Masters",
};

interface ScalarWavePanelProps {
  activeScalars: ScalarWave[];
  onToggle: (wave: ScalarWave) => void;
}

export const ScalarWavePanel = ({ activeScalars, onToggle }: ScalarWavePanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<ScalarCategory>("herb");

  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/50 backdrop-blur-xl overflow-hidden">
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <Waves className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Scalar Wave Transmissions</span>
            <span className="ml-3 text-[9px] text-white/40 uppercase tracking-wider">{activeScalars.length > 0 ? `${activeScalars.length} active` : "none active"}</span>
          </div>
          {activeScalars.length > 0 && (
            <div className="flex gap-1.5 ml-2 flex-wrap">
              {activeScalars.map(w => (
                <span key={w.id} className="text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/40 text-[#D4AF37]/80" style={{ background: "rgba(212,175,55,0.08)" }}>
                  {w.icon} {w.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-white/40 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t border-[#D4AF37]/10 px-5 pb-5 pt-4 space-y-4">
          <p className="text-[10px] text-white/40 leading-relaxed max-w-2xl">
            Not frequencies — living consciousness fields. Select up to 3. The audio becomes a carrier vessel consecrated by the spirit of the master, place, or plant deva. All invocations are woven into the AI analysis and imprinted into the exported file.
          </p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(CAT_LABELS) as ScalarCategory[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-wider border transition-all ${tab === t ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"}`}>
                {CAT_LABELS[t]}
              </button>
            ))}
            <span className="ml-auto text-[9px] text-white/30 self-center">{activeScalars.length}/3 selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {SCALAR_BY_CAT[tab].map(wave => {
              const active = activeScalars.some(w => w.id === wave.id);
              const maxed = activeScalars.length >= 3 && !active;
              return (
                <button key={wave.id} onClick={() => !maxed && onToggle(wave)} disabled={maxed}
                  className={`text-left p-3 rounded-xl border transition-all ${active ? "border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37]" : maxed ? "border-white/5 text-white/25 cursor-not-allowed" : "border-white/5 text-white/60 hover:border-white/20 hover:text-white/80"}`}
                  style={active ? { boxShadow: "0 0 18px rgba(212,175,55,0.15)" } : {}}>
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">{wave.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold truncate">{wave.name}</div>
                      <div className="text-[9px] mt-0.5 opacity-60 truncate">{wave.field}</div>
                      <div className="text-[9px] mt-1 opacity-40 line-clamp-2 leading-relaxed">{wave.nature}</div>
                    </div>
                    {active && <Sparkles size={10} className="shrink-0 mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
