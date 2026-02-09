import React, { useState } from 'react';
import { CalendarIcon, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface HoraDateTimePickerProps {
  timeOffset: number;
  onTimeOffsetChange: (offset: number) => void;
}

export const HoraDateTimePicker: React.FC<HoraDateTimePickerProps> = ({
  timeOffset,
  onTimeOffsetChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const isLive = timeOffset === 0 && !selectedDate;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleApply = () => {
    if (!selectedDate) return;
    const target = new Date(selectedDate);
    target.setHours(selectedHour, selectedMinute, 0, 0);
    const now = Date.now();
    const offsetMs = target.getTime() - now;
    const offsetMin = Math.round(offsetMs / 60000);
    onTimeOffsetChange(offsetMin);
    setOpen(false);
  };

  const handleReset = () => {
    setSelectedDate(undefined);
    setSelectedHour(12);
    setSelectedMinute(0);
    onTimeOffsetChange(0);
    setOpen(false);
  };

  const displayLabel = isLive
    ? 'Live Now'
    : selectedDate
    ? format(selectedDate, 'MMM d, yyyy') + ` ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
    : `${timeOffset > 0 ? '+' : ''}${Math.round(timeOffset / 60)}h ${Math.abs(timeOffset % 60)}m`;

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 text-xs rounded-xl border-border/50 ${
              !isLive ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : ''
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Check Hora for any date & time
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="text-sm font-bold">:</span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApply} disabled={!selectedDate} className="flex-1">
                Check Hora
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Live
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {!isLive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs text-amber-400 hover:text-amber-300 gap-1 px-2"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      )}
    </div>
  );
};
