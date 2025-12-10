import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Sparkles, User, Upload, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TransformationProgram {
  id: string;
  name: string;
  description: string;
  price_eur: number;
  duration_months: number;
  modules: any[];
  features: string[];
  installment_price_eur: number;
  installment_count: number;
  practitioner: string;
  is_active: boolean;
}

interface Variation {
  id: string;
  program_id: string;
  name: string;
  description: string;
  features: string[];
  price_eur: number;
  installment_price_eur: number;
  installment_count: number;
  duration_months: number;
  is_active: boolean;
  order_index: number;
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

const AdminTransformation = () => {
  const navigate = useNavigate();
  const [program, setProgram] = useState<TransformationProgram | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [editingProgram, setEditingProgram] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editInstallmentPrice, setEditInstallmentPrice] = useState('');
  const [editInstallmentCount, setEditInstallmentCount] = useState('3');
  const [editPractitioner, setEditPractitioner] = useState('both');
  const [editFeatures, setEditFeatures] = useState('');
  
  // Variation dialog
  const [variationDialogOpen, setVariationDialogOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [varName, setVarName] = useState('');
  const [varDescription, setVarDescription] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varInstallmentPrice, setVarInstallmentPrice] = useState('');
  const [varInstallmentCount, setVarInstallmentCount] = useState('3');
  const [varDuration, setVarDuration] = useState('6');
  const [varFeatures, setVarFeatures] = useState('');

  // Practitioner dialog
  const [practitionerDialogOpen, setPractitionerDialogOpen] = useState(false);
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
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
    setLoading(true);
    
    // Fetch program
    const { data: programData } = await supabase
      .from('transformation_programs')
      .select('*')
      .single();
    
    if (programData) {
      setProgram({
        ...programData,
        modules: programData.modules as any[],
        features: programData.features as string[],
        installment_price_eur: programData.installment_price_eur || 0,
        installment_count: programData.installment_count || 3,
        practitioner: programData.practitioner || 'both'
      });
    }
    
    // Fetch variations
    const { data: variationsData } = await supabase
      .from('transformation_variations')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (variationsData) {
      setVariations(variationsData.map(v => ({
        ...v,
        features: v.features as string[]
      })));
    }
    
    // Fetch practitioners
    const { data: practitionerData } = await supabase
      .from('practitioners')
      .select('*');
    
    if (practitionerData) {
      setPractitioners(practitionerData);
    }
    
    setLoading(false);
  };

  const startEditingProgram = () => {
    if (!program) return;
    setEditName(program.name);
    setEditDescription(program.description || '');
    setEditPrice(program.price_eur.toString());
    setEditInstallmentPrice(program.installment_price_eur?.toString() || '');
    setEditInstallmentCount(program.installment_count?.toString() || '3');
    setEditPractitioner(program.practitioner || 'both');
    setEditFeatures(program.features.join('\n'));
    setEditingProgram(true);
  };

  const saveProgram = async () => {
    if (!program) return;
    setSaving(true);

    const { error } = await supabase
      .from('transformation_programs')
      .update({
        name: editName,
        description: editDescription,
        price_eur: parseFloat(editPrice),
        installment_price_eur: parseFloat(editInstallmentPrice) || 0,
        installment_count: parseInt(editInstallmentCount) || 3,
        practitioner: editPractitioner,
        features: editFeatures.split('\n').filter(f => f.trim())
      })
      .eq('id', program.id);

    if (error) {
      toast.error('Failed to save program');
    } else {
      toast.success('Program updated');
      setEditingProgram(false);
      fetchData();
    }
    setSaving(false);
  };

  const openVariationDialog = (variation?: Variation) => {
    if (variation) {
      setEditingVariation(variation);
      setVarName(variation.name);
      setVarDescription(variation.description || '');
      setVarPrice(variation.price_eur.toString());
      setVarInstallmentPrice(variation.installment_price_eur?.toString() || '');
      setVarInstallmentCount(variation.installment_count?.toString() || '3');
      setVarDuration(variation.duration_months?.toString() || '6');
      setVarFeatures(variation.features?.join('\n') || '');
    } else {
      setEditingVariation(null);
      setVarName('');
      setVarDescription('');
      setVarPrice('');
      setVarInstallmentPrice('');
      setVarInstallmentCount('3');
      setVarDuration('6');
      setVarFeatures('');
    }
    setVariationDialogOpen(true);
  };

  const saveVariation = async () => {
    if (!program) return;
    setSaving(true);

    const variationData = {
      program_id: program.id,
      name: varName,
      description: varDescription,
      price_eur: parseFloat(varPrice),
      installment_price_eur: parseFloat(varInstallmentPrice) || 0,
      installment_count: parseInt(varInstallmentCount) || 3,
      duration_months: parseInt(varDuration) || 6,
      features: varFeatures.split('\n').filter(f => f.trim())
    };

    if (editingVariation) {
      const { error } = await supabase
        .from('transformation_variations')
        .update(variationData)
        .eq('id', editingVariation.id);

      if (error) {
        toast.error('Failed to update variation');
      } else {
        toast.success('Variation updated');
      }
    } else {
      const { error } = await supabase
        .from('transformation_variations')
        .insert([{ ...variationData, order_index: variations.length }]);

      if (error) {
        toast.error('Failed to create variation');
      } else {
        toast.success('Variation created');
      }
    }

    setVariationDialogOpen(false);
    fetchData();
    setSaving(false);
  };

  const deleteVariation = async (id: string) => {
    if (!confirm('Delete this variation?')) return;

    const { error } = await supabase
      .from('transformation_variations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete variation');
    } else {
      toast.success('Variation deleted');
      fetchData();
    }
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

  const savePractitioner = async () => {
    if (!editingPractitioner) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">Transformation Program</h1>
          <p className="text-xs text-muted-foreground">Manage program and variations</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Practitioners */}
        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-4">Practitioners</h2>
          <div className="space-y-3">
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
          </div>
        </Card>

        {/* Practitioner Dialog */}
        <PractitionerDialog
          open={practitionerDialogOpen}
          onOpenChange={setPractitionerDialogOpen}
          practitioner={editingPractitioner}
          form={practitionerForm}
          setForm={setPractitionerForm}
          onSave={savePractitioner}
        />

        {/* Main Program */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-foreground">Main Program</h2>
            </div>
            {!editingProgram ? (
              <Button variant="outline" size="sm" onClick={startEditingProgram}>
                <Edit size={16} className="mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingProgram(false)}>
                  <X size={16} />
                </Button>
                <Button size="sm" onClick={saveProgram} disabled={saving}>
                  <Save size={16} className="mr-1" /> Save
                </Button>
              </div>
            )}
          </div>

          {!editingProgram && program ? (
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="text-foreground">{program.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-foreground text-sm">{program.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Full Price</Label>
                  <p className="text-foreground font-semibold">€{program.price_eur}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Installment Price (x{program.installment_count})</Label>
                  <p className="text-foreground font-semibold">€{program.installment_price_eur}/month</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Practitioner</Label>
                <p className="text-foreground capitalize">{program.practitioner}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Features</Label>
                <ul className="text-sm text-foreground list-disc list-inside">
                  {program.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Program Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Price (€)</Label>
                  <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Installment Price (€/month)</Label>
                  <Input type="number" value={editInstallmentPrice} onChange={(e) => setEditInstallmentPrice(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Number of Installments</Label>
                <Select value={editInstallmentCount} onValueChange={setEditInstallmentCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 payments</SelectItem>
                    <SelectItem value="3">3 payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default Practitioner</Label>
                <Select value={editPractitioner} onValueChange={setEditPractitioner}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (User chooses)</SelectItem>
                    {practitioners.map(p => (
                      <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Features (one per line)</Label>
                <Textarea 
                  value={editFeatures} 
                  onChange={(e) => setEditFeatures(e.target.value)} 
                  rows={6}
                  placeholder="2 Zoom sessions per month&#10;Daily WhatsApp connection&#10;..."
                />
              </div>
            </div>
          )}
        </Card>

        {/* Variations */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Package Variations</h2>
            <Dialog open={variationDialogOpen} onOpenChange={setVariationDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => openVariationDialog()}>
                  <Plus size={16} className="mr-1" /> Add Variation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingVariation ? 'Edit Variation' : 'New Variation'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Variation Name</Label>
                    <Input value={varName} onChange={(e) => setVarName(e.target.value)} placeholder="e.g. Intensive Package" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={varDescription} onChange={(e) => setVarDescription(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Price (€)</Label>
                      <Input type="number" value={varPrice} onChange={(e) => setVarPrice(e.target.value)} />
                    </div>
                    <div>
                      <Label>Duration (months)</Label>
                      <Input type="number" value={varDuration} onChange={(e) => setVarDuration(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Installment Price (€/month)</Label>
                      <Input type="number" value={varInstallmentPrice} onChange={(e) => setVarInstallmentPrice(e.target.value)} />
                    </div>
                    <div>
                      <Label>Number of Installments</Label>
                      <Select value={varInstallmentCount} onValueChange={setVarInstallmentCount}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 payments</SelectItem>
                          <SelectItem value="3">3 payments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Features (one per line)</Label>
                    <Textarea 
                      value={varFeatures} 
                      onChange={(e) => setVarFeatures(e.target.value)} 
                      rows={5}
                      placeholder="Weekly 1-on-1 sessions&#10;Priority support&#10;..."
                    />
                  </div>
                  <Button onClick={saveVariation} disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Save Variation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {variations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No variations yet. Add package options for users to choose from.
            </p>
          ) : (
            <div className="space-y-3">
              {variations.map((v) => (
                <Card key={v.id} className="p-3 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{v.name}</h3>
                      <p className="text-sm text-muted-foreground">{v.description}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-amber-500 font-semibold">€{v.price_eur}</span>
                        {v.installment_price_eur > 0 && (
                          <span className="text-muted-foreground">
                            or €{v.installment_price_eur}/mo x{v.installment_count}
                          </span>
                        )}
                        <span className="text-muted-foreground">{v.duration_months} months</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openVariationDialog(v)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteVariation(v.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminTransformation;