import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Send, Trash2, UserPlus, Mail, Users, Download, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_active: boolean;
  subscribed_at: string;
}

const AdminEmailList = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Add subscriber form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  
  // Email form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch subscribers');
      console.error(error);
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  };

  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    const { error } = await supabase
      .from('email_subscribers')
      .insert({ email: newEmail.trim(), name: newName.trim() || null, source: 'manual' });
    
    if (error) {
      if (error.code === '23505') {
        toast.error('Email already exists');
      } else {
        toast.error('Failed to add subscriber');
      }
    } else {
      toast.success('Subscriber added');
      setNewEmail('');
      setNewName('');
      setShowAddDialog(false);
      fetchSubscribers();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('email_subscribers')
      .update({ 
        is_active: !isActive,
        unsubscribed_at: !isActive ? null : new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update subscriber');
    } else {
      fetchSubscribers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscriber?')) return;
    
    const { error } = await supabase
      .from('email_subscribers')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete subscriber');
    } else {
      toast.success('Subscriber deleted');
      fetchSubscribers();
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
      
      const emailsToImport: { email: string; name: string | null; source: string }[] = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        const email = parts[0];
        const name = parts[1] || null;
        
        if (email && email.includes('@')) {
          emailsToImport.push({ email, name, source: 'csv_import' });
        }
      }

      if (emailsToImport.length === 0) {
        toast.error('No valid emails found in CSV');
        return;
      }

      // Insert in batches
      const batchSize = 100;
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < emailsToImport.length; i += batchSize) {
        const batch = emailsToImport.slice(i, i + batchSize);
        const { error, data } = await supabase
          .from('email_subscribers')
          .upsert(batch, { onConflict: 'email', ignoreDuplicates: true })
          .select();
        
        if (error) {
          console.error('Batch import error:', error);
        } else {
          imported += data?.length || 0;
        }
      }

      skipped = emailsToImport.length - imported;
      toast.success(`Imported ${imported} emails${skipped > 0 ? `, ${skipped} duplicates skipped` : ''}`);
      fetchSubscribers();
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Failed to import CSV');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    const activeSubscribers = subscribers.filter(s => s.is_active);
    const csv = 'email,name,source,subscribed_at\n' + 
      activeSubscribers.map(s => `"${s.email}","${s.name || ''}","${s.source}","${s.subscribed_at}"`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error('Subject and content are required');
      return;
    }

    const activeCount = subscribers.filter(s => s.is_active).length;
    if (!confirm(`Send email to ${activeCount} active subscribers?`)) return;

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          subject: emailSubject,
          htmlContent: emailContent,
        },
      });

      if (error) throw error;

      toast.success(`Email sent to ${data.sent} subscribers`);
      if (data.errors > 0) {
        toast.warning(`${data.errors} emails failed to send`);
      }
      setShowEmailDialog(false);
      setEmailSubject('');
      setEmailContent('');
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = subscribers.filter(s => s.is_active).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-accent/10 px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email List</h1>
            <p className="text-muted-foreground text-sm">Manage subscribers and send emails</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{subscribers.length}</div>
            <div className="text-xs text-muted-foreground">Total Subscribers</div>
          </Card>
          <Card className="p-4 text-center">
            <Mail className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subscriber</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <Button onClick={handleAddSubscriber} className="w-full">
                  Add Subscriber
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />

          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default">
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Email to All Subscribers</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  This will send an email to {activeCount} active subscribers.
                  Use {"{{name}}"} to personalize with subscriber name.
                </p>
                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Your email subject"
                  />
                </div>
                <div>
                  <Label>Content (HTML) *</Label>
                  <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="<h1>Hello {{name}}</h1><p>Your message here...</p>"
                    rows={8}
                  />
                </div>
                <Button onClick={handleSendBulkEmail} disabled={sending} className="w-full">
                  {sending ? 'Sending...' : `Send to ${activeCount} Subscribers`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="ghost" onClick={fetchSubscribers}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="pl-10"
          />
        </div>

        {/* Subscribers List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSubscribers.map((sub) => (
              <Card key={sub.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{sub.email}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {sub.name && <span>{sub.name}</span>}
                      <Badge variant="outline" className="text-[10px]">{sub.source}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sub.is_active}
                      onCheckedChange={() => handleToggleActive(sub.id, sub.is_active)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(sub.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredSubscribers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No subscribers found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmailList;
