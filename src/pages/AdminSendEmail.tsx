import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AdminSendEmail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const wrapInTemplate = (text: string) => {
    const paragraphs = text.split(/\n\n+/).map(p => 
      `<p style="margin:0 0 16px;line-height:1.6;color:#333333;">${p.replace(/\n/g, '<br/>')}</p>`
    ).join('');
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f1ec;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
<div style="background:linear-gradient(135deg,#8B5E3C,#A0522D);padding:30px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:normal;letter-spacing:1px;">Sacred Healing</h1>
</div>
<div style="padding:30px 35px;">${paragraphs}</div>
<div style="background:#f4f1ec;padding:20px;text-align:center;font-size:12px;color:#999;">
<p style="margin:0;">Sacred Healing &bull; Spiritual Growth &amp; Wellness</p>
</div></div></body></html>`;
  };

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      setActiveCount(count || 0);
    };
    fetchCount();
  }, []);

  useEffect(() => {
    if (user?.email && !testEmail) setTestEmail(user.email);
  }, [user, testEmail]);

  const handleTestSend = async () => {
    if (!testEmail.trim()) {
      toast.error('Enter an email address to send the test to');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setTestSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: { subject: `[TEST] ${subject}`, plainText: message, testEmail: testEmail.trim() },
      });
      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error) {
      console.error('Send test email error:', error);
      toast.error('Test send failed — check the console for details');
    } finally {
      setTestSending(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    if (!confirm(`Send email to ${activeCount} active subscribers?`)) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: { subject, plainText: message },
      });

      if (error) throw error;

      toast.success(`Email sent to ${data.sent} subscribers`);
      if (data.errors > 0) {
        toast.warning(`${data.errors} emails failed to send`);
      }
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-primary/20 via-background to-accent/10 px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/email-list')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Email List
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Send className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Send Email</h1>
            <p className="text-muted-foreground text-sm">Compose and send to all active subscribers</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Recipient info */}
        <Card className="p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Recipients</p>
            <p className="text-xs text-muted-foreground">{activeCount} active subscribers will receive this email</p>
          </div>
        </Card>

        <p className="text-sm text-muted-foreground">
          Use <code className="bg-muted px-1 rounded text-xs">{'{{name}}'}</code> to personalize with subscriber name and{' '}
          <code className="bg-muted px-1 rounded text-xs">{'{{email}}'}</code> for their email.
        </p>

        <div className="space-y-2">
          <Label className="text-foreground font-medium">Subject *</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your email subject"
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-medium">Message *</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={'Hello {{name}},\n\nYour message here...\n\nWarm regards,\nSiddha Quantum Nexus'}
            rows={14}
            className="text-sm"
          />
        </div>

        {message && (
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            {showPreview && (
              <Card className="p-0 overflow-auto max-h-[500px]">
                <div
                  dangerouslySetInnerHTML={{
                    __html: wrapInTemplate(
                      message
                        .replace(/\{\{name\}\}/g, 'John')
                        .replace(/\{\{email\}\}/g, 'john@example.com')
                    ),
                  }}
                />
              </Card>
            )}
          </div>
        )}

        <Card className="p-4 space-y-3 border-dashed">
          <div>
            <p className="text-sm font-medium text-foreground">Send a test first</p>
            <p className="text-xs text-muted-foreground">Verify delivery and branding before sending to everyone — doesn't touch your subscriber list.</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              className="text-sm"
            />
            <Button
              variant="outline"
              onClick={handleTestSend}
              disabled={testSending || !subject.trim() || !message.trim()}
            >
              {testSending ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
        </Card>

        <Separator />

        <Button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()} className="w-full h-12 text-base">
          {sending ? 'Sending...' : `Send to ${activeCount} Subscribers`}
        </Button>
      </div>
    </div>
  );
};

export default AdminSendEmail;
