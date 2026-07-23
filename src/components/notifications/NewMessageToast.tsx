import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';

export const NewMessageToast: React.FC = () => {
  const { latest, clearLatest } = useUnreadMessages();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!latest) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    const cleanup = setTimeout(() => clearLatest(), 3400);
    return () => {
      clearTimeout(t);
      clearTimeout(cleanup);
    };
  }, [latest, clearLatest]);

  if (!latest) return null;

  const initials = latest.senderName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed top-[calc(env(safe-area-inset-top)+14px)] left-1/2 z-[200] w-[92%] max-w-[420px] pointer-events-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div
        onClick={() => {
          setVisible(false);
          navigate(`/community?dm=${latest.senderId}`);
        }}
        className="flex items-center gap-3 rounded-[20px] px-4 py-3 cursor-pointer pointer-events-auto"
        style={{
          background: 'rgba(8,8,8,.88)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,.1)',
          boxShadow: '0 14px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(212,175,55,.06) inset',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-160%) scale(.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform .45s cubic-bezier(.2,.9,.25,1.35), opacity .35s ease',
        }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: '#D4AF37', animation: 'sqi-toast-ping 1.8s infinite' }}
        />
        <div
          className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center font-extrabold text-xs"
          style={{
            background: 'linear-gradient(145deg,#1a1a1a,#0a0a0a)',
            border: '1px solid rgba(255,255,255,.1)',
            color: 'rgba(212,175,55,.7)',
          }}
        >
          {latest.senderAvatar ? (
            <img src={latest.senderAvatar} alt="" className="w-full h-full rounded-[10px] object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-extrabold uppercase"
            style={{ fontSize: '7px', letterSpacing: '.35em', color: 'rgba(212,175,55,.55)', marginBottom: 2 }}
          >
            New Message
          </div>
          <div className="font-extrabold text-[12.5px] truncate">{latest.senderName}</div>
          <div className="text-[11.5px] truncate" style={{ color: 'rgba(255,255,255,.6)' }}>
            {latest.content}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes sqi-toast-ping {
          0% { box-shadow: 0 0 0 0 rgba(212,175,55,.55); }
          70% { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
        }
      `}</style>
    </div>
  );
};
