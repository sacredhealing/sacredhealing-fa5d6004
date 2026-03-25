import React, { useEffect } from 'react';
import { ExternalLink, X, Star } from 'lucide-react';

export interface AnnouncementModalProps {
  title: string;
  message: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  onDismiss: () => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;900&display=swap');

  .sqi-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 9999;
    animation: fadeIn 0.25s ease both;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .sqi-modal {
    background: #0c0c0c;
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 28px;
    width: 100%;
    max-width: 360px;
    max-height: min(90vh, 640px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 8px 48px rgba(0, 0, 0, 0.7),
      0 0 60px rgba(212, 175, 55, 0.08);
    animation: rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes rise {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);     }
  }

  .sqi-topbar {
    height: 3px;
    flex-shrink: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      #D4AF37 25%,
      #B8960C 55%,
      #D4AF37 80%,
      transparent 100%
    );
  }

  .sqi-body {
    padding: 24px 22px 22px;
    position: relative;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .sqi-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }
  .sqi-close:hover {
    background: rgba(255, 255, 255, 0.09);
    color: rgba(255, 255, 255, 0.7);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .sqi-icon-row {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 16px;
  }
  .sqi-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sqi-badge {
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(212, 175, 55, 0.55);
    background: rgba(212, 175, 55, 0.07);
    border: 1px solid rgba(212, 175, 55, 0.14);
    padding: 3px 10px;
    border-radius: 100px;
  }

  .sqi-title {
    font-size: 19px;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: #D4AF37;
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.22);
    line-height: 1.18;
    margin-bottom: 13px;
    padding-right: 22px;
  }

  .sqi-message {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.68;
    color: rgba(255, 255, 255, 0.58);
    margin-bottom: 16px;
  }

  .sqi-media {
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .sqi-media img {
    width: 100%;
    max-height: 160px;
    object-fit: cover;
    display: block;
  }
  .sqi-audio {
    width: 100%;
    margin-bottom: 16px;
    border-radius: 12px;
  }

  .sqi-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 18px;
  }

  .sqi-btn-row {
    display: flex;
    gap: 10px;
  }

  .sqi-btn-link {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 13px 12px;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.22s ease;
  }
  .sqi-btn-link:hover {
    border-color: rgba(212, 175, 55, 0.25);
    color: #D4AF37;
    background: rgba(212, 175, 55, 0.06);
  }

  .sqi-btn-gold {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 13px 12px;
    border-radius: 100px;
    background: #D4AF37;
    border: none;
    color: #050505;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 0 22px rgba(212, 175, 55, 0.28);
    transition: all 0.25s ease;
  }
  .sqi-btn-gold:hover {
    box-shadow: 0 0 36px rgba(212, 175, 55, 0.45);
    transform: translateY(-1px);
  }
  .sqi-btn-gold:active {
    transform: translateY(0);
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.2);
  }
`;

export default function AnnouncementModal({
  title,
  message,
  linkUrl,
  linkLabel,
  imageUrl,
  audioUrl,
  onDismiss,
}: AnnouncementModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <>
      <style>{styles}</style>
      <div className="sqi-overlay" onClick={onDismiss} role="presentation">
        <div
          className="sqi-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-modal-title"
        >
          <div className="sqi-topbar" />

          <div className="sqi-body">
            <button type="button" className="sqi-close" onClick={onDismiss} aria-label="Close">
              <X size={11} />
            </button>

            <div className="sqi-icon-row">
              <div className="sqi-icon-wrap">
                <Star size={16} color="#D4AF37" fill="none" />
              </div>
              <span className="sqi-badge">✦ NY TRANSMISSION</span>
            </div>

            <div id="announcement-modal-title" className="sqi-title">
              {title}
            </div>

            <div className="sqi-message">{message}</div>

            {imageUrl ? (
              <div className="sqi-media">
                <img src={imageUrl} alt="" />
              </div>
            ) : null}

            {audioUrl ? <audio className="sqi-audio" controls src={audioUrl} /> : null}

            <div className="sqi-divider" />

            <div className="sqi-btn-row">
              {linkUrl ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sqi-btn-link"
                  onClick={onDismiss}
                >
                  <ExternalLink size={11} />
                  {linkLabel || 'Utforska'}
                </a>
              ) : null}
              <button type="button" className="sqi-btn-gold" onClick={onDismiss}>
                Jag förstår!
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
