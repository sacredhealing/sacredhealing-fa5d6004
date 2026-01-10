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
      const { data: eventsData, error } = await (supabase as any)
        .from('live_events')
        .select('*')
        .eq('is_active', true)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching live events:', error);
        // If table doesn't exist or permission issue, return empty array
        if (error.code === '42P01' || error.code === '42501') {
          setEvents([]);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      if (!user) {
        setEvents(eventsData.map(event => ({
          ...event,
          rsvp_count: 0,
          user_rsvp: null,
        })));
        setIsLoading(false);
        return;
      }

      // Fetch user's RSVPs
      let rsvps: Array<{ event_id: string; rsvp_status: string }> = [];
      try {
        const { data: rsvpData, error: rsvpError } = await (supabase as any)
          .from('live_event_rsvps')
          .select('event_id, rsvp_status')
          .eq('user_id', user.id);

        if (!rsvpError && rsvpData) {
          rsvps = rsvpData;
        }
      } catch (err) {
        console.warn('Error fetching user RSVPs:', err);
      }

      // Fetch RSVP counts
      let rsvpCounts: Array<{ event_id: string }> = [];
      try {
        const eventIds = eventsData.map(e => e.id);
        if (eventIds.length > 0) {
          const { data: countData, error: countError } = await (supabase as any)
            .from('live_event_rsvps')
            .select('event_id')
            .in('event_id', eventIds)
            .eq('rsvp_status', 'going');

          if (!countError && countData) {
            rsvpCounts = countData;
          }
        }
      } catch (err) {
        console.warn('Error fetching RSVP counts:', err);
      }

      const countsMap = new Map<string, number>();
      rsvpCounts.forEach(r => {
        countsMap.set(r.event_id, (countsMap.get(r.event_id) || 0) + 1);
      });

      // Combine data
      const eventsWithRSVP = eventsData.map(event => {
        const rsvp = rsvps.find(r => r.event_id === event.id);
        return {
          ...event,
          rsvp_count: countsMap.get(event.id) || 0,
          user_rsvp: rsvp?.rsvp_status as 'going' | 'maybe' | 'not_going' | null || null,
        };
      });

      setEvents(eventsWithRSVP);
    } catch (error: any) {
      console.error('Error fetching live events:', error);
      // Set empty array on any error to prevent rendering issues
      setEvents([]);
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
      const { error } = await (supabase as any)
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

