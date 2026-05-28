import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Calendar, Home, DollarSign, PawPrint, MessageSquare } from 'lucide-react';

export interface QualificationData {
  preferredAreas: string[];
  moveTimeline: string;
  bedrooms: string;
  bathrooms: string;
  budget: string;
  pets?: string;
  notes?: string;
}

interface QualificationPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQualify: (data: QualificationData) => void;
  onSkip?: () => void;
  /** Pass existing answers to support "Edit my preferences" flow */
  initialData?: Partial<QualificationData>;
}

const budgetOptions = [
  "Under $1,000",
  "$1,000 – $1,500",
  "$1,500 – $2,000",
  "$2,000 – $2,500",
  "$2,500 – $3,000",
  "$3,000+",
];

const bedroomOptions = ["Studio", "1 Bedroom", "2 Bedrooms", "3+ Bedrooms"];

const bathroomOptions = ["Any", "1+", "1.5+", "2+", "3+"];

const moveInOptions = [
  "ASAP",
  "Within 30 days",
  "1–2 months",
  "3+ months",
  "Just browsing",
];

const areaOptions = [
  "Downtown / Midtown",
  "Montrose / Museum District",
  "The Heights",
  "Galleria / Uptown",
  "Medical Center / NRG",
  "Katy / West Houston",
  "Sugar Land / Fort Bend",
  "The Woodlands / Spring",
  "Clear Lake / Pearland",
  "Other / Not Sure",
];

const petOptions = ["No pets", "Dog(s)", "Cat(s)", "Other / Multiple"];

export function QualificationPrompt({ open, onOpenChange, onQualify, onSkip, initialData }: QualificationPromptProps) {
  const [formData, setFormData] = useState({
    preferredAreas: [] as string[],
    moveTimeline: '',
    bedrooms: '',
    bathrooms: 'Any',
    budget: '',
    pets: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form when dialog opens with new (or existing) initial data — supports "Edit" flow
  useEffect(() => {
    if (open) {
      setFormData({
        preferredAreas: initialData?.preferredAreas ?? [],
        moveTimeline: initialData?.moveTimeline ?? '',
        bedrooms: initialData?.bedrooms ?? '',
        bathrooms: initialData?.bathrooms ?? 'Any',
        budget: initialData?.budget ?? '',
        pets: initialData?.pets ?? '',
        notes: initialData?.notes ?? '',
      });
      setErrors({});
    }
  }, [open, initialData]);

  const toggleArea = (area: string) => {
    setFormData(prev => {
      const current = prev.preferredAreas;
      const next = current.includes(area)
        ? current.filter(a => a !== area)
        : [...current, area];
      return { ...prev, preferredAreas: next };
    });
    if (errors.preferredAreas) {
      setErrors(prev => ({ ...prev, preferredAreas: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.preferredAreas.length === 0) {
      newErrors.preferredAreas = 'Please select at least one area';
    }
    if (!formData.moveTimeline) {
      newErrors.moveTimeline = 'Please select your timeline';
    }
    if (!formData.bedrooms) {
      newErrors.bedrooms = 'Please select bedrooms';
    }
    if (!formData.budget) {
      newErrors.budget = 'Please select your budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const qualification: QualificationData = {
      preferredAreas: formData.preferredAreas,
      moveTimeline: formData.moveTimeline,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      budget: formData.budget,
      pets: formData.pets || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onQualify(qualification);
    onOpenChange(false);

    // Reset for next time
    setFormData({
      preferredAreas: [],
      moveTimeline: '',
      bedrooms: '',
      bathrooms: 'Any',
      budget: '',
      pets: '',
      notes: '',
    });
    setErrors({});
  };

  const handleSkip = () => {
    onOpenChange(false);
    if (onSkip) onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Help me show you the right apartments
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Tell me a bit about what you need. I'll instantly narrow the map to the strongest current matches for you.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[65vh] overflow-auto">
            {/* Trust note */}
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
              This helps me show you apartments that actually fit your budget, timeline, and preferred areas. 
              No spam, ever. You can refine or clear anytime.
            </div>

            {/* Areas - multi-select chips */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Preferred areas (select all that work)
              </label>
              <div className="flex flex-wrap gap-2">
                {areaOptions.map(area => {
                  const selected = formData.preferredAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`text-sm px-4 py-2 rounded-full border transition-all ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
              {errors.preferredAreas && (
                <p className="text-xs text-red-500 mt-1.5">{errors.preferredAreas}</p>
              )}
            </div>

            {/* Timeline + Bedrooms row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> When are you looking to move?
                </label>
                <Select
                  value={formData.moveTimeline}
                  onValueChange={(v) => {
                    setFormData(p => ({ ...p, moveTimeline: v }));
                    if (errors.moveTimeline) setErrors(e => ({ ...e, moveTimeline: '' }));
                  }}
                >
                  <SelectTrigger className={errors.moveTimeline ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {moveInOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.moveTimeline && <p className="text-xs text-red-500 mt-1">{errors.moveTimeline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Home className="w-4 h-4" /> Bedrooms
                </label>
                <Select
                  value={formData.bedrooms}
                  onValueChange={(v) => {
                    setFormData(p => ({ ...p, bedrooms: v }));
                    if (errors.bedrooms) setErrors(e => ({ ...e, bedrooms: '' }));
                  }}
                >
                  <SelectTrigger className={errors.bedrooms ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {bedroomOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bedrooms && <p className="text-xs text-red-500 mt-1">{errors.bedrooms}</p>}
              </div>
            </div>

            {/* Bathrooms + Budget row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Home className="w-4 h-4" /> Bathrooms
                </label>
                <Select
                  value={formData.bathrooms}
                  onValueChange={(v) => setFormData(p => ({ ...p, bathrooms: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bathroomOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Monthly budget
                </label>
                <Select
                  value={formData.budget}
                  onValueChange={(v) => {
                    setFormData(p => ({ ...p, budget: v }));
                    if (errors.budget) setErrors(e => ({ ...e, budget: '' }));
                  }}
                >
                  <SelectTrigger className={errors.budget ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
              </div>
            </div>

            {/* Pets + Notes (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <PawPrint className="w-4 h-4" /> Pets (optional)
                </label>
                <Select value={formData.pets} onValueChange={(v) => setFormData(p => ({ ...p, pets: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No preference / Not sure</SelectItem>
                    {petOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Anything else? (optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. need ground floor, near light rail..."
                  className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t bg-slate-50 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              Skip for now — just show me everything
            </button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Show my best matches on the map
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
