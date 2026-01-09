import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

export const useLiveEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active events (upcoming and recent)
      const { data: eventsData, error } = await supabase
        .from('live_events')
        .select('*')
        .eq('is_active', true)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      if (!user || !eventsData) {
        setEvents(eventsData || []);
        setIsLoading(false);
        return;
      }

      // Fetch user's RSVPs
      const { data: rsvps } = await supabase
        .from('live_event_rsvps')
        .select('event_id, rsvp_status')
        .eq('user_id', user.id);

      // Fetch RSVP counts
      const eventIds = eventsData.map(e => e.id);
      const { data: rsvpCounts } = await supabase
        .from('live_event_rsvps')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('rsvp_status', 'going');

      const countsMap = new Map<string, number>();
      rsvpCounts?.forEach(r => {
        countsMap.set(r.event_id, (countsMap.get(r.event_id) || 0) + 1);
      });

      // Combine data
      const eventsWithRSVP = eventsData.map(event => {
        const rsvp = rsvps?.find(r => r.event_id === event.id);
        return {
          ...event,
          rsvp_count: countsMap.get(event.id) || 0,
          user_rsvp: rsvp?.rsvp_status as 'going' | 'maybe' | 'not_going' | null || null,
        };
      });

      setEvents(eventsWithRSVP);
    } catch (error) {
      console.error('Error fetching live events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const rsvpToEvent = useCallback(async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to RSVP',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('live_event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          rsvp_status: status,
        }, {
          onConflict: 'event_id,user_id',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: status === 'going' ? 'You\'re going!' : 'RSVP updated',
      });

      fetchEvents();
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      toast({
        title: 'Error',
        description: 'Failed to RSVP',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    rsvpToEvent,
    refetch: fetchEvents,
  };
};

