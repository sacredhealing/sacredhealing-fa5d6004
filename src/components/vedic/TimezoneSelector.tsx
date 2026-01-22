import React, { useState, useEffect } from 'react';
import { Globe, Clock, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Common timezones grouped by region
const TIMEZONE_GROUPS = {
  'Europe': [
    { value: 'Europe/Stockholm', label: 'Stockholm (CET)', offset: '+01:00' },
    { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', offset: '+01:00' },
    { value: 'Europe/Oslo', label: 'Oslo (CET)', offset: '+01:00' },
    { value: 'Europe/Copenhagen', label: 'Copenhagen (CET)', offset: '+01:00' },
    { value: 'Europe/Helsinki', label: 'Helsinki (EET)', offset: '+02:00' },
    { value: 'Europe/Madrid', label: 'Madrid (CET)', offset: '+01:00' },
    { value: 'Europe/Rome', label: 'Rome (CET)', offset: '+01:00' },
    { value: 'Europe/Lisbon', label: 'Lisbon (WET)', offset: '+00:00' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
  ],
  'Americas': [
    { value: 'America/New_York', label: 'New York (EST)', offset: '-05:00' },
    { value: 'America/Chicago', label: 'Chicago (CST)', offset: '-06:00' },
    { value: 'America/Denver', label: 'Denver (MST)', offset: '-07:00' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: '-08:00' },
    { value: 'America/Toronto', label: 'Toronto (EST)', offset: '-05:00' },
    { value: 'America/Vancouver', label: 'Vancouver (PST)', offset: '-08:00' },
    { value: 'America/Mexico_City', label: 'Mexico City (CST)', offset: '-06:00' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: '-03:00' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', offset: '-03:00' },
  ],
  'Asia': [
    { value: 'Asia/Kolkata', label: 'India (IST)', offset: '+05:30' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: '+09:00' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
    { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: '+07:00' },
    { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', offset: '+07:00' },
    { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)', offset: '+02:00' },
  ],
  'Pacific': [
    { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: '+10:00' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST)', offset: '+10:00' },
    { value: 'Australia/Perth', label: 'Perth (AWST)', offset: '+08:00' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: '+12:00' },
    { value: 'Pacific/Honolulu', label: 'Honolulu (HST)', offset: '-10:00' },
  ],
  'Africa': [
    { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: '+02:00' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: '+02:00' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: '+01:00' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: '+03:00' },
  ],
};

interface TimezoneSelectorProps {
  currentTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  compact?: boolean;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  currentTimezone,
  onTimezoneChange,
  compact = false,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Update current time display every second
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = now.toLocaleTimeString('en-US', {
          timeZone: currentTimezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        setCurrentTime(formatted);
      } catch {
        setCurrentTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentTimezone]);

  // Get current timezone label
  const getCurrentLabel = () => {
    for (const group of Object.values(TIMEZONE_GROUPS)) {
      const tz = group.find(t => t.value === currentTimezone);
      if (tz) return tz.label;
    }
    return currentTimezone.replace('_', ' ').split('/').pop() || currentTimezone;
  };

  const handleSelect = async (timezone: string) => {
    setSaving(true);
    try {
      if (user) {
        const { error } = await (supabase as any)
          .from('profiles')
          .update({ user_timezone: timezone })
          .eq('user_id', user.id);

        if (error) throw error;
      }
      
      onTimezoneChange(timezone);
      toast.success('Timezone synchronized', {
        description: `Hora Watch now aligned to ${timezone.replace('_', ' ').split('/').pop()}`,
      });
    } catch (error) {
      console.error('Error saving timezone:', error);
      toast.error('Failed to save timezone');
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-[10px] font-bold uppercase tracking-widest border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <Globe className="w-3 h-3" />
            <span className="font-mono">{currentTime}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search timezone..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No timezone found.</CommandEmpty>
              {Object.entries(TIMEZONE_GROUPS).map(([region, timezones]) => (
                <CommandGroup key={region} heading={region}>
                  {timezones.map((tz) => (
                    <CommandItem
                      key={tz.value}
                      value={tz.value}
                      onSelect={() => handleSelect(tz.value)}
                      className="flex items-center justify-between"
                    >
                      <span>{tz.label}</span>
                      {currentTimezone === tz.value && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="bg-background/80 border border-amber-500/30 p-4 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            Hora Timezone
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-mono text-foreground">{currentTime}</span>
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-xs"
            disabled={saving}
          >
            {saving ? 'Syncing...' : getCurrentLabel()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search timezone..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No timezone found.</CommandEmpty>
              {Object.entries(TIMEZONE_GROUPS).map(([region, timezones]) => (
                <CommandGroup key={region} heading={region}>
                  {timezones.map((tz) => (
                    <CommandItem
                      key={tz.value}
                      value={tz.value}
                      onSelect={() => handleSelect(tz.value)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{tz.label}</span>
                        <span className="text-[10px] text-muted-foreground">{tz.value}</span>
                      </div>
                      {currentTimezone === tz.value && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Hook to get and manage user timezone
export const useUserTimezone = () => {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>('Europe/Stockholm');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimezone = async () => {
      if (!user) {
        // Default to browser timezone if not logged in
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTz || 'Europe/Stockholm');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('user_timezone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.user_timezone) {
          setTimezone(data.user_timezone);
        } else {
          // If no timezone set, use browser timezone and save it
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(browserTz || 'Europe/Stockholm');
          
          // Save browser timezone to profile
          await (supabase as any)
            .from('profiles')
            .update({ user_timezone: browserTz || 'Europe/Stockholm' })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTz || 'Europe/Stockholm');
      } finally {
        setLoading(false);
      }
    };

    fetchTimezone();
  }, [user]);

  // Calculate timezone offset in minutes for the edge function
  const getTimezoneOffsetMinutes = (): number => {
    try {
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
    } catch {
      return 0;
    }
  };

  return {
    timezone,
    setTimezone,
    loading,
    getTimezoneOffsetMinutes,
  };
};
