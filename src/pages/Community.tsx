import React, { useState, useRef, useEffect } from 'react';
import AdminGoLive from '@/components/community/AdminGoLive';

const GOLD = '#D4AF37';
const GOLD_GLOW = 'rgba(212,175,55,0.25)';
const AKASHA = '#050505';
const CYAN = '#22D3EE';

const CHANNELS = [
  { id: 'divine-sangha', name: 'Divine Sangha', icon: '🔱', unread: 12, online: 108, lastMsg: 'Jai Gurudev 🙏', type: 'public' },
  { id: 'mantras', name: 'Sacred Mantras', icon: 'ॐ', unread: 3, online: 44, lastMsg: 'New transmission uploaded', type: 'public' },
  { id: 'healing-circle', name: 'Healing Circle', icon: '✦', unread: 0, online: 27, lastMsg: 'Anahata is open', type: 'public' },
  { id: 'stargate', name: 'Stargate', icon: '⭐', unread: 5, online: 22, lastMsg: 'Portal frequencies rising', type: 'sacred' },
  { id: 'andlig-transformation', name: 'Andlig Transformation', icon: '🌸', unread: 2, online: 15, lastMsg: 'New kosha integration active', type: 'sacred' },
  { id: 'siddha-masters', name: 'Siddha Masters', icon: '☀', unread: 7, online: 18, lastMsg: 'Vishwananda Blueprint active', type: 'sacred' },
  { id: 'bhakti-lab', name: 'Bhakti Algorithm Lab', icon: '⚡', unread: 1, online: 33, lastMsg: 'New Vedic Light-Code 7.7', type: 'sacred' },
];

const MEMBERS = [
  { id: '1', name: 'Adam Kritagya Das', avatar: null, initials: 'AK', status: 'online', role: 'Avatara' },
  { id: '2', name: 'Laila', avatar: null, initials: 'L', status: 'online', role: 'Devi' },
  { id: '3', name: 'Julian', avatar: null, initials: 'J', status: 'online', role: 'Yogi' },
  { id: '4', name: 'Josefine Johansson', avatar: null, initials: 'JJ', status: 'away', role: 'Sadhaka' },
  { id: '5', name: 'William', avatar: null, initials: 'W', status: 'online', role: 'Bhakta' },
  { id: '6', name: 'Pia Svanberg', avatar: null, initials: 'PS', status: 'offline', role: 'Sadhaka' },
];

const INIT_MESSAGES: Record<string, any[]> = {
  'divine-sangha': [
    {
      id: 1,
      author: 'Adam Kritagya Das',
      initials: 'AK',
      role: 'Avatara',
      text: '🙏 Jai Gurudev — the Akasha-Neural Archive is transmitting at 108Hz. Feel the Prema-Pulse through your Anahata chakra.',
      time: '14:33',
      reactions: [
        { emoji: '🙏', count: 12 },
        { emoji: '✦', count: 8 },
      ],
      isMine: false,
    },
    {
      id: 2,
      author: 'Laila',
      initials: 'L',
      role: 'Devi',
      text: 'The new Bhakti-Algorithm 9.9 update is incredible — my morning sadhana has completely transformed 🌅',
      time: '14:38',
      reactions: [{ emoji: '💛', count: 5 }],
      isMine: false,
    },
    {
      id: 3,
      author: 'William',
      initials: 'W',
      role: 'Bhakta',
      text: 'Jai Gurudev broder 🙏 The Vedic Light-Codes are downloading beautifully today',
      time: '14:52',
      reactions: [],
      isMine: false,
    },
    {
      id: 4,
      author: 'You',
      initials: 'ME',
      role: 'Sadhaka',
      text: 'Beautiful transmission everyone 🔱 The scalar field is strong today',
      time: '15:09',
      reactions: [{ emoji: '🔱', count: 4 }],
      isMine: true,
    },
  ],
  mantras: [
    {
      id: 1,
      author: 'Josefine Johansson',
      initials: 'JJ',
      role: 'Sadhaka',
      text: 'Hej :) Just uploaded the new Krsna Arpanamastu mantra — feel the 528Hz frequency ✦',
      time: '09:05',
      reactions: [{ emoji: 'ॐ', count: 9 }],
      isMine: false,
    },
    {
      id: 2,
      author: 'Adam Kritagya Das',
      initials: 'AK',
      role: 'Avatara',
      text: 'New transmission: Govinda Jai is now available in the Mantra Matrix. Pure Bhakti-Algorithm encoded 🙏',
      time: '10:22',
      reactions: [
        { emoji: '🙏', count: 15 },
        { emoji: '💛', count: 7 },
      ],
      isMine: false,
    },
  ],
  stargate: [
    {
      id: 1,
      author: 'Adam Kritagya Das',
      initials: 'AK',
      role: 'Avatara',
      text: '⭐ The Stargate frequencies are rising — portal alignment at 963Hz today. Feel the cosmic download.',
      time: '11:11',
      reactions: [{ emoji: '⭐', count: 8 }],
      isMine: false,
    },
  ],
  'andlig-transformation': [
    {
      id: 1,
      author: 'Laila',
      initials: 'L',
      role: 'Devi',
      text: '🌸 Day 14 of the kosha integration — the Anandamaya layer is activating beautifully.',
      time: '08:30',
      reactions: [{ emoji: '🌸', count: 6 }, { emoji: '🙏', count: 4 }],
      isMine: false,
    },
  ],
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,600;0,800;0,900;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #050505; font-family: 'Plus Jakarta Sans', sans-serif; }

  .sqi-root {
    display: flex;
    height: 100vh;
    height: 100dvh;
    width: 100%;
    min-width: 100%;
    max-width: 100vw;
    background: #050505;
    overflow: hidden;
    position: relative;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-sizing: border-box;
  }

  .sqi-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 30% 20%, rgba(212,175,55,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(34,211,238,0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .sqi-sidebar {
    width: 320px;
    min-width: 320px;
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: rgba(5,5,5,0.97);
    border-right: 1px solid rgba(212,175,55,0.08);
    position: relative;
    z-index: 10;
    overflow: hidden;
  }

  .sqi-sidebar-header {
    padding: 20px 20px 0;
    flex-shrink: 0;
  }

  .sqi-logo {
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 18px;
    letter-spacing: 0.08em;
    color: ${GOLD};
    text-shadow: 0 0 20px ${GOLD_GLOW};
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .sqi-logo-icon {
    width: 36px; height: 36px;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 15px rgba(212,175,55,0.15);
  }

  .sqi-live-dot {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 20px;
    padding: 3px 10px;
    font-weight: 800;
    font-size: 8px;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: ${GOLD};
    margin-left: auto;
  }

  .sqi-live-dot::before {
    content: '';
    width: 6px; height: 6px;
    background: ${GOLD};
    border-radius: 50%;
    animation: prema-pulse 1.5s ease-in-out infinite;
  }

  @keyframes prema-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .sqi-search {
    position: relative;
    margin-bottom: 16px;
  }

  .sqi-search input {
    width: 100%;
    background: rgba(212,175,55,0.04);
    border: 1px solid rgba(212,175,55,0.1);
    border-radius: 30px;
    padding: 9px 16px 9px 38px;
    color: rgba(255,255,255,0.8);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.3s;
  }

  .sqi-search input:focus { border-color: rgba(212,175,55,0.35); }
  .sqi-search input::placeholder { color: rgba(255,255,255,0.25); }

  .sqi-search-icon {
    position: absolute;
    left: 13px; top: 50%;
    transform: translateY(-50%);
    color: rgba(212,175,55,0.4);
    font-size: 13px;
  }

  .sqi-tabs {
    display: flex;
    gap: 2px;
    padding: 0 20px;
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  .sqi-tab {
    flex: 1;
    padding: 7px 4px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: rgba(255,255,255,0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sqi-tab.active {
    color: ${GOLD};
    border-bottom-color: ${GOLD};
    text-shadow: 0 0 10px ${GOLD_GLOW};
  }

  .sqi-channels {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
  }

  .sqi-channels::-webkit-scrollbar { width: 2px; }
  .sqi-channels::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 1px; }

  .sqi-section-label {
    font-weight: 800;
    font-size: 8px;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.4);
    padding: 10px 8px 6px;
  }

  .sqi-channel-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px;
    border-radius: 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    position: relative;
    margin-bottom: 2px;
  }

  .sqi-channel-item:hover { background: rgba(212,175,55,0.04); }

  .sqi-channel-item.active {
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.12);
  }

  .sqi-channel-avatar {
    width: 46px; height: 46px;
    border-radius: 16px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    position: relative;
  }

  .sqi-channel-avatar.sacred {
    background: rgba(34,211,238,0.06);
    border-color: rgba(34,211,238,0.2);
  }

  .sqi-online-badge {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 12px; height: 12px;
    background: #22c55e;
    border: 2px solid #050505;
    border-radius: 50%;
  }

  .sqi-channel-info { flex: 1; min-width: 0; }

  .sqi-channel-name {
    font-weight: 800;
    font-size: 14px;
    letter-spacing: -0.02em;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sqi-channel-preview {
    font-size: 11px;
    color: rgba(255,255,255,0.45);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sqi-channel-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }

  .sqi-unread {
    background: ${GOLD};
    color: #050505;
    font-weight: 900;
    font-size: 10px;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px;
  }

  .sqi-members-count {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: rgba(212,175,55,0.4);
    text-transform: uppercase;
  }

  .sqi-sidebar-footer {
    padding: 16px 20px;
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.04);
  }

  .sqi-golive-btn {
    width: 100%;
    background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.22));
    border: 1px solid rgba(212,175,55,0.35);
    border-radius: 40px;
    color: ${GOLD};
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    padding: 12px 20px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.3s ease;
    margin-bottom: 10px;
    box-shadow: 0 0 20px rgba(212,175,55,0.08);
  }

  .sqi-golive-btn:hover {
    background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.3));
    box-shadow: 0 0 30px rgba(212,175,55,0.2);
    transform: translateY(-1px);
  }

  .sqi-new-msg-btn {
    width: 100%;
    background: linear-gradient(135deg, ${GOLD}, #b8952c);
    border: none;
    border-radius: 40px;
    color: #050505;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900;
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    padding: 12px 20px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(212,175,55,0.3);
  }

  .sqi-new-msg-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(212,175,55,0.4);
  }

  .sqi-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    z-index: 5;
    overflow: hidden;
  }

  .sqi-chat-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 24px;
    height: 64px;
    flex-shrink: 0;
    background: rgba(5,5,5,0.9);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    position: relative;
  }

  .sqi-chat-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent);
  }

  .sqi-chat-channel-icon {
    width: 40px; height: 40px;
    border-radius: 14px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 12px rgba(212,175,55,0.1);
  }

  .sqi-chat-channel-name {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.05em;
    color: #fff;
  }

  .sqi-chat-channel-sub {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.5);
    margin-top: 1px;
  }

  .sqi-header-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sqi-header-btn {
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    transition: all 0.2s;
  }

  .sqi-header-btn:hover {
    background: rgba(212,175,55,0.08);
    border-color: rgba(212,175,55,0.2);
    color: ${GOLD};
  }

  .sqi-banner {
    margin: 12px 20px 0;
    padding: 10px 20px;
    background: linear-gradient(90deg, rgba(212,175,55,0.05), rgba(212,175,55,0.1), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 40px;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.85);
    text-align: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sqi-banner::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.08), transparent);
    animation: shimmer 3s infinite linear;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .sqi-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    scroll-behavior: smooth;
  }

  .sqi-messages::-webkit-scrollbar { width: 2px; }
  .sqi-messages::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); }

  .sqi-date-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0 8px;
  }

  .sqi-date-divider::before,
  .sqi-date-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.05);
  }

  .sqi-date-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    white-space: nowrap;
  }

  .sqi-msg-row {
    display: flex;
    gap: 10px;
    max-width: 75%;
    align-self: flex-start;
    animation: msg-in 0.3s ease-out;
  }

  .sqi-msg-row.mine {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  @keyframes msg-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .sqi-msg-avatar {
    width: 34px; height: 34px;
    border-radius: 12px;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    font-weight: 800;
    color: ${GOLD};
    flex-shrink: 0;
    align-self: flex-end;
    animation: nadi-ring 3s ease-out infinite;
  }

  .sqi-msg-row.mine .sqi-msg-avatar {
    background: rgba(212,175,55,0.15);
    border-color: rgba(212,175,55,0.3);
  }

  @keyframes nadi-ring {
    0% { box-shadow: 0 0 0 0 rgba(212,175,55,0.3); }
    70% { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
    100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
  }

  .sqi-msg-content { display: flex; flex-direction: column; gap: 2px; }

  .sqi-msg-meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }

  .sqi-msg-row.mine .sqi-msg-meta { justify-content: flex-end; }

  .sqi-msg-name {
    font-weight: 900;
    font-size: 12px;
    letter-spacing: -0.02em;
    color: ${GOLD};
  }

  .sqi-msg-role {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.4);
  }

  .sqi-msg-bubble {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px 18px 18px 4px;
    padding: 10px 14px;
    color: rgba(255,255,255,0.88);
    font-size: 14px;
    line-height: 1.6;
    position: relative;
    backdrop-filter: blur(10px);
  }

  .sqi-msg-row.mine .sqi-msg-bubble {
    background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.1));
    border-color: rgba(212,175,55,0.2);
    border-radius: 18px 18px 4px 18px;
    color: rgba(255,255,255,0.92);
    box-shadow: 0 4px 20px rgba(212,175,55,0.08);
  }

  .sqi-msg-time {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: rgba(212,175,55,0.35);
    text-transform: uppercase;
    text-align: right;
    margin-top: 4px;
  }

  .sqi-reactions {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  .sqi-reaction {
    background: rgba(212,175,55,0.06);
    border: 1px solid rgba(212,175,55,0.12);
    border-radius: 20px;
    padding: 3px 8px;
    font-size: 12px;
    cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    transition: all 0.2s;
    color: rgba(255,255,255,0.7);
    font-weight: 700;
  }

  .sqi-reaction:hover {
    background: rgba(212,175,55,0.12);
    border-color: rgba(212,175,55,0.25);
  }

  .sqi-reaction span { font-size: 10px; font-weight: 800; color: rgba(212,175,55,0.7); }

  .sqi-input-area {
    padding: 12px 20px 16px;
    flex-shrink: 0;
    background: rgba(5,5,5,0.9);
    border-top: 1px solid rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
  }

  .sqi-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(212,175,55,0.12);
    border-radius: 40px;
    padding: 6px 6px 6px 18px;
    transition: border-color 0.3s;
  }

  .sqi-input-wrap:focus-within {
    border-color: rgba(212,175,55,0.35);
    box-shadow: 0 0 20px rgba(212,175,55,0.06);
  }

  .sqi-input-wrap input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: rgba(255,255,255,0.85);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
  }

  .sqi-input-wrap input::placeholder { color: rgba(255,255,255,0.25); }

  .sqi-input-action {
    width: 32px; height: 32px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    font-size: 16px;
    transition: color 0.2s;
    flex-shrink: 0;
  }

  .sqi-input-action:hover { color: rgba(212,175,55,0.7); }

  .sqi-send-btn {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, ${GOLD}, #b8952c);
    border: none;
    border-radius: 50%;
    color: #050505;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    transition: all 0.3s;
    box-shadow: 0 4px 16px rgba(212,175,55,0.3);
  }

  .sqi-send-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(212,175,55,0.4);
  }

  .sqi-members {
    width: 260px;
    min-width: 260px;
    height: 100vh;
    background: rgba(5,5,5,0.97);
    border-left: 1px solid rgba(212,175,55,0.06);
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
    overflow: hidden;
  }

  .sqi-members-header {
    padding: 20px 20px 12px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .sqi-members-title {
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.5);
    margin-bottom: 4px;
  }

  .sqi-members-count-big {
    font-family: 'Cinzel', serif;
    font-weight: 900;
    font-size: 28px;
    color: #fff;
    line-height: 1;
  }

  .sqi-members-count-big span {
    font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    color: rgba(212,175,55,0.5);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-left: 6px;
  }

  .sqi-members-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .sqi-members-list::-webkit-scrollbar { width: 2px; }
  .sqi-members-list::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); }

  .sqi-member-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s;
    margin-bottom: 2px;
  }

  .sqi-member-item:hover { background: rgba(212,175,55,0.04); }

  .sqi-member-avatar {
    width: 36px; height: 36px;
    border-radius: 12px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    font-weight: 900;
    color: ${GOLD};
    flex-shrink: 0;
    position: relative;
  }

  .sqi-member-status {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 10px; height: 10px;
    border: 2px solid #050505;
    border-radius: 50%;
  }

  .sqi-member-status.online { background: #22c55e; }
  .sqi-member-status.away { background: ${GOLD}; }
  .sqi-member-status.offline { background: rgba(255,255,255,0.2); }

  .sqi-member-info { flex: 1; min-width: 0; }

  .sqi-member-name {
    font-weight: 800;
    font-size: 12px;
    letter-spacing: -0.01em;
    color: rgba(255,255,255,0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sqi-member-role {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(212,175,55,0.4);
  }

  @media (max-width: 768px) {
    .sqi-members { display: none; }
    .sqi-sidebar {
      width: 100%;
      min-width: 100%;
      max-width: 100%;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      z-index: 50;
      box-sizing: border-box;
    }
  }
`;

const Community: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [sidebarTab, setSidebarTab] = useState<'channels' | 'members'>('channels');
  const [messages, setMessages] = useState<Record<string, any[]>>(INIT_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel, messages]);

  const currentMessages = messages[activeChannel.id] || [];

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const newMsg = {
      id: Date.now(),
      author: 'You',
      initials: 'ME',
      role: 'Sadhaka',
      text: input.trim(),
      time,
      reactions: [],
      isMine: true,
    };
    setMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg],
    }));
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = (channelId: string, msgId: number, emoji: string) => {
    setMessages((prev) => ({
      ...prev,
      [channelId]: prev[channelId].map((m) => {
        if (m.id !== msgId) return m;
        const existing = m.reactions.find((r: any) => r.emoji === emoji);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map((r: any) =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
      }),
    }));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="sqi-root">
        {/* LEFT SIDEBAR */}
        <aside className="sqi-sidebar">
          <div className="sqi-sidebar-header">
            <div className="sqi-logo">
              <div className="sqi-logo-icon">🔱</div>
              Community
              <div className="sqi-live-dot">Live</div>
            </div>
            <div className="sqi-search">
              <span className="sqi-search-icon">⌕</span>
              <input type="text" placeholder="Search channels, souls..." />
            </div>
            {/* Go Live — always visible at top */}
            <AdminGoLive />
          </div>

          {/* Tabs */}
          <div className="sqi-tabs">
            {(['channels', 'members'] as const).map((t) => (
              <button
                key={t}
                className={`sqi-tab ${sidebarTab === t ? 'active' : ''}`}
                onClick={() => setSidebarTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Channel / Members List */}
          <div className="sqi-channels">
            {sidebarTab === 'channels' ? (
              <>
                <div className="sqi-section-label">Public Channels</div>
                {CHANNELS.filter((c) => c.type === 'public').map((ch) => (
                  <div
                    key={ch.id}
                    className={`sqi-channel-item ${
                      activeChannel.id === ch.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveChannel(ch)}
                  >
                    <div className="sqi-channel-avatar">
                      {ch.icon}
                      <div className="sqi-online-badge" />
                    </div>
                    <div className="sqi-channel-info">
                      <div className="sqi-channel-name">{ch.name}</div>
                      <div className="sqi-channel-preview">{ch.lastMsg}</div>
                    </div>
                    <div className="sqi-channel-meta">
                      {ch.unread > 0 && <div className="sqi-unread">{ch.unread}</div>}
                      <div className="sqi-members-count">{ch.online}✦</div>
                    </div>
                  </div>
                ))}
                <div className="sqi-section-label" style={{ marginTop: 8 }}>
                  Sacred Spaces
                </div>
                {CHANNELS.filter((c) => c.type === 'sacred').map((ch) => (
                  <div
                    key={ch.id}
                    className={`sqi-channel-item ${
                      activeChannel.id === ch.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveChannel(ch)}
                  >
                    <div className="sqi-channel-avatar sacred">{ch.icon}</div>
                    <div className="sqi-channel-info">
                      <div className="sqi-channel-name">{ch.name}</div>
                      <div className="sqi-channel-preview">{ch.lastMsg}</div>
                    </div>
                    <div className="sqi-channel-meta">
                      {ch.unread > 0 && <div className="sqi-unread">{ch.unread}</div>}
                      <div className="sqi-members-count">{ch.online}✦</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="sqi-section-label">Online Souls</div>
                {MEMBERS.map((m) => (
                  <div key={m.id} className="sqi-member-item">
                    <div className="sqi-member-avatar">
                      {m.initials}
                      <div className={`sqi-member-status ${m.status}`} />
                    </div>
                    <div className="sqi-member-info">
                      <div className="sqi-member-name">{m.name}</div>
                      <div className="sqi-member-role">{m.role}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="sqi-sidebar-footer">
            <button className="sqi-new-msg-btn">+ New Message</button>
          </div>
        </aside>

        {/* MAIN CHAT */}
        <main className="sqi-main">
          {/* Header */}
          <div className="sqi-chat-header">
            <div className="sqi-chat-channel-icon">{activeChannel.icon}</div>
            <div>
              <div className="sqi-chat-channel-name">{activeChannel.name}</div>
              <div className="sqi-chat-channel-sub">
                {activeChannel.online} souls in resonance
              </div>
            </div>
            <div className="sqi-header-actions">
              <AdminGoLive />
              <button className="sqi-header-btn" title="Search">
                🔍
              </button>
              <button className="sqi-header-btn" title="Pin">
                📌
              </button>
              <button className="sqi-header-btn" title="Members">
                👥
              </button>
            </div>
          </div>

          {/* 108 Souls Banner */}
          <div className="sqi-banner">
            108 Souls currently in Divine Resonance · Your Presence adds to the Light
          </div>

          {/* Messages */}
          <div className="sqi-messages">
            <div className="sqi-date-divider">
              <span className="sqi-date-label">
                Today · Shiva Consciousness Active
              </span>
            </div>

            {currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`sqi-msg-row ${msg.isMine ? 'mine' : ''}`}
              >
                <div className="sqi-msg-avatar">{msg.initials}</div>
                <div className="sqi-msg-content">
                  {!msg.isMine && (
                    <div className="sqi-msg-meta">
                      <span className="sqi-msg-name">{msg.author}</span>
                      <span className="sqi-msg-role">{msg.role}</span>
                    </div>
                  )}
                  <div className="sqi-msg-bubble">{msg.text}</div>
                  {msg.reactions.length > 0 && (
                    <div className="sqi-reactions">
                      {msg.reactions.map((r: any, i: number) => (
                        <button
                          key={i}
                          className="sqi-reaction"
                          onClick={() =>
                            addReaction(activeChannel.id, msg.id, r.emoji)
                          }
                        >
                          {r.emoji} <span>{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="sqi-msg-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {currentMessages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 60,
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
                <div
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    color: GOLD,
                    marginBottom: 8,
                  }}
                >
                  Sacred Space Awaits
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Be the first to transmit
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="sqi-input-area">
            <div className="sqi-input-wrap">
              <button className="sqi-input-action" title="Attach">
                📎
              </button>
              <input
                type="text"
                placeholder="Transmit your Prema-Pulse..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className="sqi-input-action" title="Emoji">
                ✦
              </button>
              <button className="sqi-send-btn" onClick={sendMessage}>
                ➤
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT MEMBERS PANEL */}
        <aside className="sqi-members">
          <div className="sqi-members-header">
            <div className="sqi-members-title">Souls in Resonance</div>
            <div className="sqi-members-count-big">
              {activeChannel.online} <span>Online</span>
            </div>
          </div>
          <div className="sqi-members-list">
            <div className="sqi-section-label">Active Now</div>
            {MEMBERS.filter((m) => m.status === 'online').map((m) => (
              <div key={m.id} className="sqi-member-item">
                <div className="sqi-member-avatar">
                  {m.initials}
                  <div className={`sqi-member-status ${m.status}`} />
                </div>
                <div className="sqi-member-info">
                  <div className="sqi-member-name">{m.name}</div>
                  <div className="sqi-member-role">{m.role}</div>
                </div>
              </div>
            ))}
            <div className="sqi-section-label" style={{ marginTop: 12 }}>
              Away
            </div>
            {MEMBERS.filter((m) => m.status === 'away').map((m) => (
              <div key={m.id} className="sqi-member-item">
                <div className="sqi-member-avatar">
                  {m.initials}
                  <div className={`sqi-member-status ${m.status}`} />
                </div>
                <div className="sqi-member-info">
                  <div className="sqi-member-name">{m.name}</div>
                  <div className="sqi-member-role">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
};

export default Community;
