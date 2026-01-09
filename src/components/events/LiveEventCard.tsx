import React from 'react';
import { Calendar, Clock, Users, ExternalLink, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_link: string | null;
  external_link: string | null;
  is_premium: boolean;
  max_participants: number | null;
  rsvp_count?: number;
  user_rsvp?: 'going' | 'maybe' | 'not_going' | null;
}

interface LiveEventCardProps {
  event: LiveEvent;
  onRSVP?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
}

export const LiveEventCard: React.FC<LiveEventCardProps> = ({
  event,
  onRSVP,
}) => {
  const eventDate = new Date(event.scheduled_at);
  const isUpcoming = eventDate > new Date();
  const isPast = eventDate < new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'healing_circle':
        return 'Healing Circle';
      case 'meditation':
        return 'Meditation';
      case 'workshop':
        return 'Workshop';
      case 'qna':
        return 'Q&A';
      default:
        return 'Event';
    }
  };

  return (
    <Card className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-800">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {event.title}
              </h3>
              {event.is_premium && (
                <Badge variant="default" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
                {isPast ? 'Past' : isUpcoming ? 'Upcoming' : 'Live Now'}
              </Badge>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {event.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(eventDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{event.duration_minutes} minutes</span>
          </div>
          {event.rsvp_count !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{event.rsvp_count} attending</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {event.user_rsvp === 'going' ? (
            <>
              {event.zoom_link && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => window.open(event.zoom_link || '', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Event
                </Button>
              )}
              {event.external_link && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(event.external_link || '', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Link
                </Button>
              )}
            </>
          ) : (
            <Button
              className="flex-1"
              onClick={() => onRSVP?.(event.id, 'going')}
              disabled={isPast || event.is_premium}
            >
              {isPast ? 'Event Ended' : event.is_premium ? 'Premium Required' : 'RSVP'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

