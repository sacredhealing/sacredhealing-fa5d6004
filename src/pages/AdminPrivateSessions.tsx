import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, Save, User, Upload, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  calendly_url: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  practitioner: string;
}

interface SessionPackage {
  id: string;
  name: string;
  description: string | null;
  session_count: number;
  price_eur: number;
  order_index: number;
  is_active: boolean;
}

interface Practitioner {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  image_url: string | null;
  description: string | null;
}

interface PractitionerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practitioner: Practitioner | null;
  form: {
    name: string;
    subtitle: string;
    image_url: string;
    description: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    name: string;
    subtitle: string;
    image_url: string;
    description: string;
  }>>;
  onSave: () => void;
}

const PractitionerDialog: React.FC<PractitionerDialogProps> = ({
  open,
  onOpenChange,
  practitioner,
  form,
  setForm,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${practitioner?.slug || 'practitioner'}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('practitioners')
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('practitioners').getPublicUrl(fileName);
      setForm({ ...form, image_url: data.publicUrl });
      toast.success('Image uploaded');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {practitioner?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="e.g. Yogi & Sound Healer"
            />
          </div>
          <div>
            <Label>Profile Image</Label>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Full description..."
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={onSave} className="flex-1">
              <Save size={16} className="mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminPrivateSessions: React.FC = () => {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<SessionType | null>(null);
  const [editingPackage, setEditingPackage] = useState<SessionPackage | null>(null);
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [practitionerDialogOpen, setPractitionerDialogOpen] = useState(false);

  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    category: 'spiritual',
    calendly_url: '',
    image_url: '',
    order_index: 0,
    is_active: true,
    practitioner: 'both',
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    session_count: 1,
    price_eur: 79,
    order_index: 0,
    is_active: true,
  });

  const [practitionerForm, setPractitionerForm] = useState({
    name: '',
    subtitle: '',
    image_url: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, packagesRes, practitionersRes] = await Promise.all([
        supabase.from('session_types').select('*').order('order_index'),
        supabase.from('session_packages').select('*').order('order_index'),
        supabase.from('practitioners').select('*'),
      ]);

      if (typesRes.data) setSessionTypes(typesRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (practitionersRes.data) setPractitioners(practitionersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openTypeDialog = (type?: SessionType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({
        name: type.name,
        description: type.description || '',
        category: type.category,
        calendly_url: type.calendly_url || '',
        image_url: type.image_url || '',
        order_index: type.order_index,
        is_active: type.is_active,
        practitioner: type.practitioner || 'both',
      });
    } else {
      setEditingType(null);
      setTypeForm({
        name: '',
        description: '',
        category: 'spiritual',
        calendly_url: '',
        image_url: '',
        order_index: sessionTypes.length + 1,
        is_active: true,
        practitioner: 'both',
      });
    }
    setTypeDialogOpen(true);
  };

  const openPackageDialog = (pkg?: SessionPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        name: pkg.name,
        description: pkg.description || '',
        session_count: pkg.session_count,
        price_eur: pkg.price_eur,
        order_index: pkg.order_index,
        is_active: pkg.is_active,
      });
    } else {
      setEditingPackage(null);
      setPackageForm({
        name: '',
        description: '',
        session_count: 1,
        price_eur: 79,
        order_index: packages.length + 1,
        is_active: true,
      });
    }
    setPackageDialogOpen(true);
  };

  const openPractitionerDialog = (practitioner: Practitioner) => {
    setEditingPractitioner(practitioner);
    setPractitionerForm({
      name: practitioner.name,
      subtitle: practitioner.subtitle || '',
      image_url: practitioner.image_url || '',
      description: practitioner.description || '',
    });
    setPractitionerDialogOpen(true);
  };

  const saveType = async () => {
    try {
      if (editingType) {
        const { error } = await supabase
          .from('session_types')
          .update(typeForm)
          .eq('id', editingType.id);
        if (error) throw error;
        toast.success('Session type updated');
      } else {
        const { error } = await supabase.from('session_types').insert(typeForm);
        if (error) throw error;
        toast.success('Session type created');
      }
      setTypeDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving session type:', error);
      toast.error(error.message || 'Failed to save');
    }
  };

  const savePackage = async () => {
    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('session_packages')
          .update(packageForm)
          .eq('id', editingPackage.id);
        if (error) throw error;
        toast.success('Package updated');
      } else {
        const { error } = await supabase.from('session_packages').insert(packageForm);
        if (error) throw error;
        toast.success('Package created');
      }
      setPackageDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving package:', error);
      toast.error(error.message || 'Failed to save');
    }
  };

  const savePractitioner = async () => {
    if (!editingPractitioner) return;
    try {
      const { error } = await supabase
        .from('practitioners')
        .update(practitionerForm)
        .eq('id', editingPractitioner.id);
      if (error) throw error;
      toast.success('Practitioner updated');
      setPractitionerDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving practitioner:', error);
      toast.error(error.message || 'Failed to save');
    }
  };

  const deleteType = async (id: string) => {
    if (!confirm('Delete this session type?')) return;
    try {
      const { error } = await supabase.from('session_types').delete().eq('id', id);
      if (error) throw error;
      toast.success('Session type deleted');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    try {
      const { error } = await supabase.from('session_packages').delete().eq('id', id);
      if (error) throw error;
      toast.success('Package deleted');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  const getPractitionerLabel = (p: string) => {
    if (p === 'adam') return 'Adam only';
    if (p === 'laila') return 'Laila only';
    return 'Both';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-heading font-bold">Private Sessions Admin</h1>
        </div>

        {/* Practitioners */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Practitioners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {practitioners.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.subtitle}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openPractitionerDialog(p)}>
                  <Pencil size={16} />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Session Types */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Session Types</CardTitle>
            <Button onClick={() => openTypeDialog()} size="sm">
              <Plus size={16} className="mr-2" />
              Add Type
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {type.category} • {type.is_active ? 'Active' : 'Inactive'} • {getPractitionerLabel(type.practitioner)}
                  </div>
                  {type.calendly_url && (
                    <a
                      href={type.calendly_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 mt-1"
                    >
                      Calendly <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openTypeDialog(type)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteType(type.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {sessionTypes.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No session types yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Packages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Packages</CardTitle>
            <Button onClick={() => openPackageDialog()} size="sm">
              <Plus size={16} className="mr-2" />
              Add Package
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium">{pkg.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.session_count} session(s) • €{pkg.price_eur} • {pkg.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openPackageDialog(pkg)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deletePackage(pkg.id)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No packages yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Dialog */}
        <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Session Type' : 'New Session Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  placeholder="Session type name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  placeholder="Describe this session type"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={typeForm.category}
                    onValueChange={(v) => setTypeForm({ ...typeForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spiritual">Spiritual</SelectItem>
                      <SelectItem value="healing">Healing</SelectItem>
                      <SelectItem value="men">Men's Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Practitioner</Label>
                  <Select
                    value={typeForm.practitioner}
                    onValueChange={(v) => setTypeForm({ ...typeForm, practitioner: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="adam">Adam only</SelectItem>
                      <SelectItem value="laila">Laila only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Calendly URL (optional)</Label>
                <Input
                  value={typeForm.calendly_url}
                  onChange={(e) => setTypeForm({ ...typeForm, calendly_url: e.target.value })}
                  placeholder="https://calendly.com/..."
                />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  value={typeForm.image_url}
                  onChange={(e) => setTypeForm({ ...typeForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={saveType} className="flex-1">
                  <Save size={16} className="mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Package Dialog */}
        <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'New Package'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="Package name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Describe this package"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Session Count</Label>
                  <Input
                    type="number"
                    value={packageForm.session_count}
                    onChange={(e) => setPackageForm({ ...packageForm, session_count: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Price (EUR)</Label>
                  <Input
                    type="number"
                    value={packageForm.price_eur}
                    onChange={(e) => setPackageForm({ ...packageForm, price_eur: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={savePackage} className="flex-1">
                  <Save size={16} className="mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Practitioner Dialog */}
        <PractitionerDialog
          open={practitionerDialogOpen}
          onOpenChange={setPractitionerDialogOpen}
          practitioner={editingPractitioner}
          form={practitionerForm}
          setForm={setPractitionerForm}
          onSave={savePractitioner}
        />
      </div>
    </div>
  );
};

export default AdminPrivateSessions;