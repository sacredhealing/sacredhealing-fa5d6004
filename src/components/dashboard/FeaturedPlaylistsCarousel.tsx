import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useCuratedPlaylists } from '@/hooks/useCuratedPlaylists';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedPlaylistsCarouselProps {
  contentType?: 'meditation' | 'music';
  title?: string;
}

export const FeaturedPlaylistsCarousel: React.FC<FeaturedPlaylistsCarouselProps> = ({
  contentType = 'meditation',
  title,
}) => {
  const { t } = useTranslation();
  const { playlists, loading } = useCuratedPlaylists(contentType);

  if (loading) {
    return (
      <div className="mb-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-40 h-40 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlists || playlists.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          {title || t('explore.featuredPlaylists', 'Featured Playlists')}
        </h2>
        <Link 
          to={contentType === 'music' ? '/music' : '/meditations'} 
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {t('common.viewAll', 'View All')} →
        </Link>
      </div>
      
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {playlists.slice(0, 8).map((playlist) => (
            <CarouselItem 
              key={playlist.id} 
              className="pl-2 basis-[45%] sm:basis-[35%] md:basis-[28%] lg:basis-[22%]"
            >
              <Link to={`/${contentType === 'music' ? 'music' : 'meditations'}?playlist=${playlist.id}`}>
                <Card className="relative overflow-hidden group cursor-pointer border-border/30 hover:border-primary/50 transition-all">
                  <div className="aspect-square relative">
                    {playlist.cover_image_url ? (
                      <img
                        src={playlist.cover_image_url}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                        <Music className="w-10 h-10 text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="font-semibold text-foreground text-xs truncate">{playlist.title}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{playlist.track_count} tracks</p>
                  </div>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-1 hidden sm:flex h-8 w-8" />
        <CarouselNext className="right-1 hidden sm:flex h-8 w-8" />
      </Carousel>
    </div>
  );
};
