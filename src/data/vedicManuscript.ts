import { Manuscript, VedicBook, LibraryArchive } from '@/types/vedicTranslation';

const BHAGAVAD_GITA_MANUSCRIPT: Manuscript = {
  frontMatter: {
    editorialNote: "Denna översättning bygger på Paramahamsa Vishwanandas undervisning och kommentarer. Den prioriterar hängiven klarhet och levd andlig förståelse framför strikt ord-för-ord-literalism. Sanskrittermer bevaras där de bär en väsentlig andlig betydelse. Språket är avsett att vara kontemplativt, tidlöst och tillgängligt för svenska läsare.",
    aboutGuru: `Det oförnekliga budskapet i Bhagavad Gita är att vår sanna varelse och vår eviga, glädjefyllda relation med det Högsta är skymd av vår identitet, kroppen och sinnet. Krsna förklarar att vårt mål är gemenskap med Gud och att vägen dit är Bhakti – ren hängivenhet – som skiftar oss från begränsad själviskhet till obegränsad kärlek.`,
    foreword: `Nåd är där det ultimata blir intimt. Paramahamsa Vishwananda är själva personifieringen av denna nåd...`,
    introduction: {
      main: "Sanatana-dharma (Hinduism) grundar sig på idén att det finns en sanning...",
      subsections: [
        { title: "BHAGAVAD GITA SOM SKRIFT", content: "Bland alla dessa element har Bhagavad Gita framträtt som flaggskeppsskriften..." },
        { title: "KRSNA´S ROLL", content: "Krsna, den Högste Herren, träder in för att återställa rättfärdighet..." }
      ]
    },
    specialMessage: "Bhagavad Gita är inte en novel. Den är inte bara en bok man läser när man har tid. Du måste sjunka in i den, dyka djupt i varje rad, för varje ord Krsna uttalat är laddat med mening för ditt liv."
  },
  chapter1: {
    title: "Kapitel 1: Arjuna-Visada-Yoga – Arjunas klagsång",
    summary: `Gita börjar med en levande skildring av scenen på Kuruksetra-slagfältet...`,
    verses: [{ verse: 1, sanskrit: "dhṛtarāṣṭra uvāca...", devanagari: "धृतराष्ट्र उवाच..." }]
  }
};

const GURU_GITA_MANUSCRIPT: Manuscript = {
  frontMatter: {
    editorialNote: "Översättning av Sri Guru Gita enligt Paramahamsa Vishwanandas sanna kärlek till Gurun.",
    aboutGuru: "Gurun är porten till den Högsta verkligheten. I Paramahamsa Vishwanandas närvaro blir Gurun den levande sanningen som andas genom varje lärjunge.",
    foreword: "Utan Gurun finns ingen väg. Sri Guru Gita är kartan för hjärtats resa hem.",
    introduction: {
      main: "Guru Gita återfinns i Skanda Purana, i den del som kallas Uttarakhanda. Den presenteras som en dialog mellan Lord Shiva och gudinnan Parvati.",
      subsections: [
        { title: "GURUNS NATUR", content: "Gurun är inte bara en person; Gurun är en princip. Det är den princip som fördriver mörkret (gu) och för in ljuset (ru)." },
        { title: "LÄRJUNGENS KVALITÉER", content: "En sann sökare närmar sig Gurun med ödmjukhet, uppriktighet och en längtan efter att tjäna." }
      ]
    },
    specialMessage: "Tjäna Gurun med hela ditt hjärta. Hans lotusfötter är din enda sanna tillflykt i denna föränderliga värld."
  },
  chapter1: {
    title: "Kapitel 1: Guru-Mahima - Guruns storhet",
    summary: "Här beskrivs storheten i den andliga läraren. Dialogen börjar med att Parvati observerar Lord Shivas hängivenhet mot Gurun och frågar honom vem det är han vördar så djupt.",
    verses: [{
      verse: 1,
      sanskrit: "oṁ namas-śivāya gurave, sac-cid-ānanda-mūrtaye,\nniṣprapañcāya śāntāya, nirālambāya tejase.",
      devanagari: "ॐ नमः शिवाय गुरवे सच्चिदानन्दमूर्तये |\nनिष्प्रपञ्चाय शान्ताय निरालम्बाय तेजसे || १ ||"
    }]
  }
};

const BHAGAVATAM_MANUSCRIPT: Manuscript = {
  frontMatter: {
    editorialNote: "Shreemad Bhagavatam - Den mogna frukten av vedisk kunskap.",
    aboutGuru: "Sukadeva Goswami talar till kung Pariksit.",
    foreword: "En flod av gudomlig kärlek.",
    introduction: {
      main: "Bhagavatam är den högsta Puranan.",
      subsections: [{ title: "SKAPELSENS URSPRUNG", content: "Allt utgår från Krsna." }]
    },
    specialMessage: "Lyssna till Herrens lekar."
  },
  chapter1: {
    title: "Kapitel 1: Sökandet efter sanningen",
    summary: "Sagesmännen i Naimisaranya frågar Suta Goswami.",
    verses: [{ verse: 1, sanskrit: "janmādy asya yato...", devanagari: "जन्माद्यस्य यतो" }]
  }
};

export const INITIAL_ARCHIVE: LibraryArchive = {
  [VedicBook.BHAGAVAD_GITA]: BHAGAVAD_GITA_MANUSCRIPT,
  [VedicBook.GURU_GITA]: GURU_GITA_MANUSCRIPT,
  [VedicBook.SHREEMAD_BHAGAVATAM]: BHAGAVATAM_MANUSCRIPT
};
