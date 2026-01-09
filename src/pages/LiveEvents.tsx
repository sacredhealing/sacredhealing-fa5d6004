import React from 'react';
import { Radio, Calendar } from 'lucide-react';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { LiveEventCard } from '@/components/events/LiveEventCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LiveEvents: React.FC = () => {
  const { events, isLoading, rsvpToEvent } = useLiveEvents();

  const upcomingEvents = events.filter(e => new Date(e.scheduled_at) > new Date());
  const pastEvents = events.filter(e => new Date(e.scheduled_at) <= new Date());

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Live Events</h1>
              <p className="text-sm text-muted-foreground">Join healing circles, meditations, and workshops</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4">
                    <CardContent className="p-0">
                      <div className="animate-pulse space-y-3">
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-10 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No upcoming events scheduled.</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back soon for new live sessions!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <LiveEventCard
                    key={event.id}
                    event={event}
                    onRSVP={rsvpToEvent}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No past events.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastEvents.map(event => (
                  <LiveEventCard
                    key={event.id}
                    event={event}
                    onRSVP={rsvpToEvent}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveEvents;

