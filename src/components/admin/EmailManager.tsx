import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type ContentType = 'meditation' | 'beat' | 'song' | 'course' | 'mantra' | 'feature' | 'tool' | 'announcement';
type EmailType = 'welcome' | 'weekly_digest' | 'lakshmi_friday' | 'custom';
type TierRequired = 'free' | 'prana-flow' | 'siddha-quantum' | 'akasha-infinity';

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string | null;
  subject: string | null;
  status: string;
  sent_at: string;
}

interface ContentEntry {
  id: string;
  content_type: string;
  content_title: string;
  content_description: string | null;
  tier_required: string;
  auto_announced: boolean;
  included_in_digest: boolean;
  created_at: string;
}

const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  meditation: '🧘',
  beat: '🎵',
  song: '🎶',
  course: '📿',
  mantra: '🕉️',
  feature: '⚡',
  tool: '🔮',
  announcement: '✨',
};

export default function EmailManager() {
  const [activeTab, setActiveTab] = useState<'announce' | 'send' | 'logs'>('announce');

  const [contentType, setContentType] = useState<ContentType>('meditation');
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [tierRequired, setTierRequired] = useState<TierRequired>('free');
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [announcing, setAnnouncing] = useState(false);
  const [announceMsg, setAnnounceMsg] = useState('');

  const [emailType, setEmailType] = useState<EmailType>('welcome');
  const [targetEmail, setTargetEmail] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [triggerLoading, setTriggerLoading] = useState('');
  const [triggerMsg, setTriggerMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'announce') loadContentEntries();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  async function loadContentEntries() {
    const { data } = await supabase
      .from('content_changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setContentEntries(data as ContentEntry[]);
  }

  async function loadLogs() {
    setLoadingLogs(true);
    const { data } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);
    if (data) setLogs(data as EmailLog[]);
    setLoadingLogs(false);
  }

  async function handleAnnounce() {
    if (!contentTitle.trim()) {
      setAnnounceMsg('⚠ Content title is required.');
      return;
    }
    setAnnouncing(true);
    setAnnounceMsg('');

    const { error } = await supabase.from('content_changelog').insert({
      content_type: contentType,
      content_title: contentTitle.trim(),
      content_description: contentDescription.trim() || null,
      tier_required: tierRequired,
    });

    if (error) {
      setAnnounceMsg(`✗ Error: ${error.message}`);
    } else {
      setAnnounceMsg(`✓ "${contentTitle}" logged — in-app announcement created & queued for Monday digest.`);
      setContentTitle('');
      setContentDescription('');
      loadContentEntries();
    }
    setAnnouncing(false);
  }

  async function handleSendToUser() {
    if (!targetEmail.trim()) {
      setSendMsg('⚠ Target email required.');
      return;
    }
    setSending(true);
    setSendMsg('');

    const body: Record<string, unknown> = {
      target_email: targetEmail.trim(),
      email_type: emailType,
    };
    if (emailType === 'custom') {
      if (!customSubject || !customBody) {
        setSendMsg('⚠ Custom subject and body required.');
        setSending(false);
        return;
      }
      body.custom_subject = customSubject;
      body.custom_body = customBody;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-to-user', {
        body,
      });
      if (error) {
        setSendMsg(`✗ Error: ${error.message}`);
      } else if (data && (data as { success?: boolean }).success) {
        setSendMsg(`✓ Email sent to ${targetEmail}`);
        setTargetEmail('');
        setCustomSubject('');
        setCustomBody('');
      } else {
        setSendMsg(`✗ Failed: ${JSON.stringify(data)}`);
      }
    } catch (e: unknown) {
      setSendMsg(`✗ Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setSending(false);
  }

  async function triggerEmailBlast(type: 'weekly_digest' | 'lakshmi_friday') {
    setTriggerLoading(type);
    setTriggerMsg('');
    try {
      const fnName = type === 'weekly_digest' ? 'weekly-digest' : 'lakshmi-friday';
      const { data, error } = await supabase.functions.invoke(fnName, { body: {} });
      if (error) {
        setTriggerMsg(`✗ ${error.message}`);
      } else {
        const sent = (data as { sent?: number })?.sent ?? 0;
        setTriggerMsg(`✓ ${type === 'weekly_digest' ? 'Weekly Digest' : 'Lakshmi Friday'} sent to ${sent} users.`);
      }
    } catch (e: unknown) {
      setTriggerMsg(`✗ ${e instanceof Error ? e.message : String(e)}`);
    }
    setTriggerLoading('');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
    color: '#050505',
    border: 'none',
    borderRadius: 100,
    padding: '12px 28px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    opacity: announcing || sending ? 0.6 : 1,
  };

  const btnSecondary: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    color: '#D4AF37',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 100,
    padding: '10px 22px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 28,
    marginBottom: 16,
  };

  const label: React.CSSProperties = {
    color: 'rgba(212,175,55,0.7)',
    fontSize: 9,
    letterSpacing: '0.5em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 8,
  };

  const tabs = ['announce', 'send', 'logs'] as const;
  const tabLabels = { announce: '✦ New Content', send: '✉ Send Email', logs: '📋 Logs' };

  return (
    <div style={{ color: '#fff', fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif", maxWidth: 800, margin: '0 auto', padding: '0 0 60px' }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{ color: 'rgba(212,175,55,0.5)', fontSize: 9, letterSpacing: '0.6em', textTransform: 'uppercase', marginBottom: 8 }}>
          ADMIN · EMAIL AUTOMATION
        </div>
        <div style={{ color: '#D4AF37', fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>
          ⟁ Email Intelligence System
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          Log new content → auto-announces in-app + queues Monday digest.<br />
          Friday Lakshmi emails scan each user&apos;s activity automatically.
        </div>
      </div>

      <div style={{ ...card, borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(212,175,55,0.03)', marginBottom: 24 }}>
        <div style={{ ...label, marginBottom: 12 }}>⚡ MANUAL TRIGGERS</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" style={btnSecondary} onClick={() => triggerEmailBlast('weekly_digest')} disabled={triggerLoading === 'weekly_digest'}>
            {triggerLoading === 'weekly_digest' ? 'Sending...' : '📨 Send Monday Digest Now'}
          </button>
          <button type="button" style={btnSecondary} onClick={() => triggerEmailBlast('lakshmi_friday')} disabled={triggerLoading === 'lakshmi_friday'}>
            {triggerLoading === 'lakshmi_friday' ? 'Sending...' : '🌸 Send Lakshmi Email Now'}
          </button>
        </div>
        {triggerMsg && (
          <div style={{ marginTop: 12, color: triggerMsg.startsWith('✓') ? '#6EE7B7' : '#FCA5A5', fontSize: 13 }}>
            {triggerMsg}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)',
              border: activeTab === tab ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 100,
              padding: '9px 20px',
              color: activeTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'announce' && (
        <div>
          <div style={card}>
            <div style={{ ...label, marginBottom: 20 }}>LOG NEW CONTENT</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <span style={label}>Content Type</span>
                <select value={contentType} onChange={e => setContentType(e.target.value as ContentType)} style={selectStyle}>
                  {Object.entries(CONTENT_TYPE_ICONS).map(([type, icon]) => (
                    <option key={type} value={type}>{icon} {type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <span style={label}>Access Tier</span>
                <select value={tierRequired} onChange={e => setTierRequired(e.target.value as TierRequired)} style={selectStyle}>
                  <option value="free">Free</option>
                  <option value="prana-flow">Prana-Flow (€19)</option>
                  <option value="siddha-quantum">Siddha-Quantum (€45)</option>
                  <option value="akasha-infinity">Akasha-Infinity (€1,111)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={label}>Content Title *</span>
              <input
                type="text"
                placeholder="e.g. Soma Moon Meditation — Deep Delta Healing"
                value={contentTitle}
                onChange={e => setContentTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={label}>Description (shown in digest & announcement)</span>
              <textarea
                placeholder="What is this? How will it benefit the user?"
                value={contentDescription}
                onChange={e => setContentDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button type="button" style={btnPrimary} onClick={handleAnnounce} disabled={announcing}>
                {announcing ? 'Logging...' : `${CONTENT_TYPE_ICONS[contentType]} Log & Announce`}
              </button>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Creates in-app announcement + queues for Monday email
              </span>
            </div>

            {announceMsg && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 12,
                background: announceMsg.startsWith('✓') ? 'rgba(110,231,183,0.08)' : 'rgba(252,165,165,0.08)',
                border: `1px solid ${announceMsg.startsWith('✓') ? 'rgba(110,231,183,0.2)' : 'rgba(252,165,165,0.2)'}`,
                color: announceMsg.startsWith('✓') ? '#6EE7B7' : '#FCA5A5',
                fontSize: 13,
              }}>
                {announceMsg}
              </div>
            )}
          </div>

          {contentEntries.length > 0 && (
            <div style={card}>
              <div style={{ ...label, marginBottom: 16 }}>RECENT CONTENT LOG</div>
              {contentEntries.map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ fontSize: 20, marginTop: 2 }}>
                    {CONTENT_TYPE_ICONS[entry.content_type as ContentType] || '✦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{entry.content_title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#D4AF37', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase' }}>{entry.content_type}</span>
                      {entry.auto_announced && <span style={{ color: 'rgba(110,231,183,0.7)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase' }}>ANNOUNCED</span>}
                      {entry.included_in_digest && <span style={{ color: 'rgba(212,175,55,0.5)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase' }}>IN DIGEST</span>}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'send' && (
        <div style={card}>
          <div style={{ ...label, marginBottom: 20 }}>SEND EMAIL TO USER</div>

          <div style={{ marginBottom: 16 }}>
            <span style={label}>Target Email</span>
            <input
              type="email"
              placeholder="user@email.com (or your own to test)"
              value={targetEmail}
              onChange={e => setTargetEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={label}>Email Type</span>
            <select value={emailType} onChange={e => setEmailType(e.target.value as EmailType)} style={selectStyle}>
              <option value="welcome">⟁ Welcome Email (new user onboarding)</option>
              <option value="weekly_digest">📨 Monday Digest (this week&apos;s content)</option>
              <option value="lakshmi_friday">🌸 Lakshmi Friday (activity scan)</option>
              <option value="custom">✍ Custom Message</option>
            </select>
          </div>

          {emailType === 'custom' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <span style={label}>Subject Line</span>
                <input
                  type="text"
                  placeholder="✨ An important transmission for you..."
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={label}>Message Body</span>
                <textarea
                  placeholder="Write your message here."
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </>
          )}

          <button type="button" style={btnPrimary} onClick={handleSendToUser} disabled={sending}>
            {sending ? 'Sending...' : '✉ Send Now'}
          </button>

          {sendMsg && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 12,
              background: sendMsg.startsWith('✓') ? 'rgba(110,231,183,0.08)' : 'rgba(252,165,165,0.08)',
              border: `1px solid ${sendMsg.startsWith('✓') ? 'rgba(110,231,183,0.2)' : 'rgba(252,165,165,0.2)'}`,
              color: sendMsg.startsWith('✓') ? '#6EE7B7' : '#FCA5A5',
              fontSize: 13,
            }}>
              {sendMsg}
            </div>
          )}

          <div style={{ marginTop: 24, padding: 16, background: 'rgba(212,175,55,0.03)', borderRadius: 12, border: '1px solid rgba(212,175,55,0.08)' }}>
            <div style={{ color: '#D4AF37', fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 8 }}>TIPS</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.7 }}>
              • Use <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Welcome</strong> to re-send welcome email.<br />
              • Use <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Custom</strong> for one-off messages.<br />
              • Test templates on your own inbox first.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ ...label, margin: 0 }}>EMAIL LOGS (LAST 50)</div>
            <button type="button" style={{ ...btnSecondary, padding: '7px 16px', fontSize: 10 }} onClick={loadLogs}>↻ Refresh</button>
          </div>

          {loadingLogs ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 32 }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 32 }}>No emails logged yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Type', 'Recipient', 'Status', 'Sent'].map(h => (
                      <th key={h} style={{ textAlign: 'left', color: 'rgba(212,175,55,0.6)', fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', padding: '0 12px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ padding: '10px 12px 10px 0', color: '#D4AF37', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {log.email_type.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.03)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.recipient_email ?? '—'}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{
                          background: log.status === 'sent' ? 'rgba(110,231,183,0.1)' : 'rgba(252,165,165,0.1)',
                          color: log.status === 'sent' ? '#6EE7B7' : '#FCA5A5',
                          padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0', color: 'rgba(255,255,255,0.3)', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {new Date(log.sent_at).toLocaleDateString()} {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
