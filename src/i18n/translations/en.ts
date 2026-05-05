// src/i18n/translations/en.ts
export const en = {
  common: {
    continue: "Continue",
    manage_subscription: "Manage subscription",
    open: "Open",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
  },

  profile: {
    your_sacred_space: {
      title: "Your Siddha Quantum Nexus Space",
      body:
        "This app is a daily support space.\n" +
        "You don’t need to learn anything or believe anything.\n" +
        "Just come, choose how you feel, and follow a short practice.\n" +
        "Over time your mind, sleep and emotions naturally reorganize.",
    },
    start_here: {
      title: "Start here",
      body:
        "If this is your first time, this short guide explains how Siddha Quantum Nexus works and how to begin gently.",
      button: "Open guide",
    },
    how_to_use: {
      title: "How to use this app",
      line1: "1. Open Home → follow today's suggestion",
      line2: "2. If stressed → go to Soul",
      line3: "3. If curious → explore Astrology or Ayurveda",
    },
    tabs_explained: {
      title: "What each tab does",
      home: { title: "Home", body: "Your daily step. Just follow it." },
      meditate: { title: "Meditate", body: "Guided practices when you want quiet." },
      music: { title: "Music", body: "Background sound for focus, sleep or calm." },
      soul: { title: "Soul", body: "Receive deeper sessions (you can just rest)." },
      library: { title: "Library", body: "All tools in one place." },
      community: { title: "Community", body: "Talk or listen to others (optional)." },
    },
    reassurance: {
      title: "What is happening to me?",
      body:
        "Many people notice better sleep, calmer reactions, or emotional release after some days.\n" +
        "This is normal — just go gently and continue daily.",
    },
    language: {
      title: "Language",
      english: "English",
      swedish: "Swedish",
    },
  },

  nav: {
    home: "Home",
    meditate: "Meditate",
    music: "Music",
    soul: "Soul",
    library: "Library",
    community: "Community",
    profile: "Profile",
    guide: "Guide",
  },

  community: {
    welcome: {
      title: "Welcome — you can just listen here",
      body:
        "Many people come here quietly at first.\n" +
        "You don’t need to post anything.\n" +
        "You can simply read, breathe, or share when ready.",
      cta: "Read today's reflections",
    },
    today_in_space: {
      title: "Today in the space",
      item1: "🌿 Someone slept better after 4 days",
      item2: "💭 A member noticed calmer reactions",
      item3: "🌙 Evening silence gathering later",
    },
    arriving: {
      title: "How are you arriving today?",
      heavy: "Heavy",
      restless: "Restless",
      calm: "Calm",
      grateful: "Grateful",
      looking: "Just looking",
      for_moments: "Reflections for {{mood}} moments",
    },
    daily_arrival: {
      title: "🌅 Daily Arrival",
      body:
        "Take one slow breath before reading.\n" +
        "You can share one word about your day — or simply read others.",
    },
  },

  audioErrorBoundary: {
    title: "Audio transmission paused",
    body: "Your device needs a moment to align. Tap to reconnect the frequency.",
    reconnect: "↺ Reconnect",
  },

  audioPlayer: {
    tap_to_start: "Tap play to start audio.",
    load_failed: "Audio failed to load",
    default_title: "Sacred Healing Meditation",
    default_artist: "Sacred Healing",
    default_album: "Siddha-Quantum Intelligence",
  },
} as const;

