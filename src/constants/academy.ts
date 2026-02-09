import { CourseModule } from '@/types/academy';

export const ALL_MONTHS_SKELETON: CourseModule[] = [
  {
    id: 1,
    month: 1,
    topic: "Initiation & Foundations: Preparation, Sankalpa, Yogic Way, Morning Attention, Gratitude",
    content: {
      title: { en: "Initiation & Foundations", sv: "Initiering & Grunder" },
      objective: {
        en: "Prepare the vessel through initiation, setting intentions (Sankalpa), and adopting the yogic lifestyle.",
        sv: "Förbered kärlet genom initiering, sätt intentioner (Sankalpa) och anta den yogiska livsstilen."
      },
      videoScript: {
        sections: [
          { label: { en: "Preparation", sv: "Förberedelse" }, content: { en: "How to prepare for the initiation: Cleanse your space and quiet the mind.", sv: "Hur du förbereder dig för initieringen: Rena ditt utrymme och stilla sinnet." } },
          { label: { en: "Sankalpa", sv: "Sankalpa" }, content: { en: "Setting your sacred intention. This is the seed of your transformation.", sv: "Att sätta din heliga intention. Detta är fröet till din transformation." } },
          { label: { en: "The Yogic Way", sv: "Den Yogiska Vägen" }, content: { en: "Integrating ancient discipline into modern healing practice.", sv: "Att integrera uråldrig disciplin i modern healingpraktik." } }
        ]
      },
      meditationScript: { en: "Visualize your Sankalpa as a golden light...", sv: "Visualisera din Sankalpa som ett gyllene ljus..." },
      workbook: {
        reflectionQuestions: [{ en: "What is your primary Sankalpa?", sv: "Vad är din främsta Sankalpa?" }],
        practicalExercise: { en: "7-Day Gratitude Journal.", sv: "7-dagars tacksamhetsdagbok." }
      },
      socialHook: { en: "Module 1 is open!", sv: "Modul 1 är öppen!" }
    }
  },
  { id: 2, month: 2, topic: "Healing Essentials: Intention, Sacred Space, Self-Healing, Aura Work, Distance Healing" },
  { id: 3, month: 3, topic: "Emotions, Resistance & Mind: Clearing Resistance, Breaking Loops, Dharma Expression, Reflection" },
  { id: 4, month: 4, topic: "Meditation & Energy Activation: Fire/Water Spirits, Sensing Guide, Om-chanting, Elemental Meditations" },
  { id: 5, month: 5, topic: "Breathwork / Pranayama: Full Yogic Breath, Anuloma Viloma, Kapalabhati, Belly Vacuum, Nauli steps" },
  { id: 6, month: 6, topic: "Elements & Nature Connection: Mother Tree, Shamanic Push, Water Flow, Fire Gazing, Nature Connection" },
  { id: 7, month: 7, topic: "Herbs & Plant Spirits: Rosemary, Mint, Tulsi, Rose, Sage, Basil, Moringa, Cilantro" },
  { id: 8, month: 8, topic: "Mantra & Sound: Using Mantras, Om-chanting, Healing Instruments" },
  { id: 9, month: 9, topic: "Ancestors & Higher Guidance: Connecting with the Ancestors" },
  { id: 10, month: 10, topic: "Crystals & Energy Tools: Activating, Cleansing, and Reading Crystals" },
  { id: 11, month: 11, topic: "Advanced Teachings: Analyzing vs Observation, Surrender, Full Allowance" },
  { id: 12, month: 12, topic: "Medulla & Energy Boost: Medulla Prana Shot Technique" }
];
