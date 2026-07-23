import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { PranayamaTechniqueType } from '@/lib/tierAccess';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  techniqueType: PranayamaTechniqueType;
  onCleared: () => void;
}

const CONDITIONS: { key: string; label: string }[] = [
  { key: 'is_pregnant', label: 'Currently pregnant' },
  { key: 'has_heart_condition', label: 'Any heart condition' },
  { key: 'has_blood_pressure_condition', label: 'Uncontrolled high or low blood pressure' },
  { key: 'has_epilepsy_or_seizures', label: 'Epilepsy or a history of seizures' },
  { key: 'has_glaucoma_or_eye_condition', label: 'Glaucoma or a retinal condition' },
  { key: 'has_recent_surgery', label: 'Recent surgery (last 3 months)' },
  { key: 'has_panic_or_anxiety_disorder', label: 'Panic disorder or a diagnosed anxiety condition' },
];

/**
 * One-time (revisitable) safety screen shown before a user's first
 * retention (Kumbhaka) or forceful (Kapalabhati/Bhastrika) technique.
 * Any flagged condition blocks that technique class — this is not
 * medical advice, it is a conservative gate that points people back
 * to gentle practice and toward their own doctor.
 */
export const PranayamaHealthScreen: React.FC<Props> = ({ open, onOpenChange, techniqueType, onCleared }) => {
  const { user } = useAuth();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const anyFlagged = Object.values(checked).some(Boolean);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const cleared = !anyFlagged;
    const payload: Record<string, unknown> = {
      user_id: user.id,
      ...checked,
      cleared_for_retention: cleared,
      cleared_for_forceful: cleared,
      screened_at: new Date().toISOString(),
    };
    const { error } = await (supabase as any)
      .from('user_pranayama_health_screening')
      .upsert(payload, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return;
    if (cleared) {
      onOpenChange(false);
      onCleared();
    } else {
      setBlocked(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border-[#D4AF37]/25 p-6 max-h-[85vh] overflow-y-auto">
        {!blocked ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <ShieldCheck size={20} color="#D4AF37" />
              <div style={{ fontWeight: 800, fontSize: 17, color: 'rgba(255,255,255,.92)' }}>
                Before You Begin
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, marginBottom: 18 }}>
              {techniqueType === 'retention'
                ? 'Breath retention (Kumbhaka) is a powerful practice, but it isn\'t safe for everyone. Please check anything that applies to you.'
                : 'This forceful breathing practice raises heart rate and internal pressure quickly. Please check anything that applies to you.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {CONDITIONS.map((c) => (
                <label
                  key={c.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 12.5,
                    color: 'rgba(255,255,255,.75)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[c.key]}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#D4AF37', flexShrink: 0 }}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,.35)', lineHeight: 1.5, marginBottom: 16 }}>
              This is a safety check, not medical advice. When unsure, ask your doctor before practicing.
            </p>
            <button
              onClick={submit}
              disabled={saving}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 100,
                background: 'linear-gradient(135deg,#D4AF37,#f0d878)', color: '#050505',
                fontWeight: 800, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase',
                border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Confirm & Continue'}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={20} color="#f0b03c" />
              <div style={{ fontWeight: 800, fontSize: 17, color: 'rgba(255,255,255,.92)' }}>
                Let's Keep You Safe
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 14 }}>
              Based on what you shared, this technique isn't recommended for you right now. Please speak with
              your doctor before attempting breath retention or forceful breathing practices.
            </p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 20 }}>
              The gentle, beginner practices — Sama Vritti, foundation Nadi Shodhana, and Bhramari — remain fully
              safe and available to you.
            </p>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 100,
                background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
                fontWeight: 800, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase',
                border: '1px solid rgba(212,175,55,0.4)', cursor: 'pointer',
              }}
            >
              Understood
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
