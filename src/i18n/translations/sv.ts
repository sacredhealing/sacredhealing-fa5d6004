// src/i18n/translations/sv.ts
export const sv = {
  common: {
    continue: "Fortsätt",
    manage_subscription: "Hantera prenumeration",
    open: "Öppna",
    close: "Stäng",
    save: "Spara",
    cancel: "Avbryt",
  },

  profile: {
    your_sacred_space: {
      title: "Din Siddha Quantum Nexus-plats",
      body:
        "Det här är en daglig stödplats.\n" +
        "Du behöver inte lära dig något eller tro på något.\n" +
        "Kom bara, välj hur du mår och följ en kort praktik.\n" +
        "Med tiden organiseras ditt sinne, din sömn och dina känslor naturligt.",
    },
    start_here: {
      title: "Börja här",
      body:
        "Om det här är din första gång förklarar denna korta guide hur Siddha Quantum Nexus fungerar och hur du börjar varsamt.",
      button: "Öppna guide",
    },
    how_to_use: {
      title: "Så använder du appen",
      line1: "1. Öppna Home → följ dagens förslag",
      line2: "2. Om du är stressad → gå till Soul",
      line3: "3. Om du är nyfiken → utforska Astrology eller Ayurveda",
    },
    tabs_explained: {
      title: "Vad varje flik gör",
      home: { title: "Home", body: "Ditt dagliga steg. Följ bara." },
      meditate: { title: "Meditate", body: "Guidad praktik när du vill ha lugn." },
      music: { title: "Music", body: "Bakgrundsljud för fokus, sömn eller ro." },
      soul: { title: "Soul", body: "Ta emot djupare sessioner (du kan bara vila)." },
      library: { title: "Library", body: "Alla verktyg på ett ställe." },
      community: { title: "Community", body: "Prata eller lyssna på andra (valfritt)." },
    },
    reassurance: {
      title: "Vad händer i mig?",
      body:
        "Många märker bättre sömn, lugnare reaktioner eller känslomässig release efter några dagar.\n" +
        "Det är normalt — gå varsamt och fortsätt dagligen.",
    },
    language: {
      title: "Språk",
      english: "Engelska",
      swedish: "Svenska",
    },
  },

  nav: {
    home: "Home",
    meditate: "Meditate",
    music: "Music",
    soul: "Soul",
    library: "Library",
    community: "Community",
    profile: "Profil",
    guide: "Guide",
  },

  community: {
    welcome: {
      title: "Välkommen — du kan bara lyssna här",
      body:
        "Många kommer hit tyst i början.\n" +
        "Du behöver inte posta något.\n" +
        "Du kan bara läsa, andas eller dela när du är redo.",
      cta: "Läs dagens reflektioner",
    },
    today_in_space: {
      title: "Idag i rummet",
      item1: "🌿 Någon sov bättre efter 4 dagar",
      item2: "💭 En medlem märkte lugnare reaktioner",
      item3: "🌙 Kvällens stillhetsstund senare",
    },
    arriving: {
      title: "Hur kommer du in idag?",
      heavy: "Tungt",
      restless: "Oroligt",
      calm: "Lugnt",
      grateful: "Tacksam",
      looking: "Bara tittar",
      for_moments: "Reflektioner för {{mood}} stunder",
    },
    daily_arrival: {
      title: "🌅 Dagens ankomst",
      body:
        "Ta ett långsamt andetag innan du läser.\n" +
        "Du kan dela ett ord om din dag — eller bara läsa andras.",
    },
  },
} as const;

