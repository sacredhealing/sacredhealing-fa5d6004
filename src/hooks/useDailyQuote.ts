import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const quotes = [
  "You are what you think! You can create or you can destroy. It's upon you to control it.",
  "When the thought is negative — don't feed it. Say to yourself: 'This is not me,' and let it go.",
  "The whole world is one family, because we all come from one place — that's Narayana. And each one is Narayana.",
  "Service to humanity is service to the Lord. Whoever serves the needy is serving Me.",
  "If the mind is pure, if the mind dwells on the Lord, everything becomes so simple — no complication, no suffering.",
  "Spirituality without Grace is meaningless.",
  "When you have the Grace of the Master in your life, then He brings the moon to your door — He makes the impossible possible.",
  "Whatever is in this mind is an illusion; deep inside you — only God resides.",
  "If you recite your Guru‑mantra continuously and meditate intensely, soon chanting becomes automatic — even when you sleep.",
  "You are born to attain something; you are born to do something — nature will arrange itself so you move toward what you have to do.",
  "Even a crisis can become a turning point towards spirituality.",
  "Everything is governed by the will of the Lord — whatever He brings you is right.",
  "If all we seek is spiritual hobbies — we don't need Grace. But for real transformation, Grace is essential.",
  "When you look for trouble, trouble manifests. But when you look for the Lord, the Lord reveals Himself.",
  "True love is universal love — to see God in everyone, to love without boundaries.",
  "My dear child, recite for 24 hours nonstop your Guru mantra and meditate intensely … and you will conquer the mind.",
  "Your spiritual practice is like a shield … wear it and be disciplined about it, self‑disciplined.",
  "If the mind is pure and dwells on the Lord — there is no complication in anything, until you complicate it yourself.",
  "When you look for the Lord, the Lord reveals Himself.",
  "Outside is here, but when you look inside yourself — you should see the imprint also. This is the imprint of Love which we share.",
  "I love you much more than you love me — and I wish that you can also love like that.",
  "God dwells in His creation. One has to choose not to be blind — one has to choose to see.",
  "Open up the mind, so you can see that God dwells in everything.",
  "Grace and love are not distant — they are always ready to embrace you if your heart is open.",
  "Love without boundaries, love everyone as your own self.",
  "Don't feed negative thoughts — your mind becomes what you nourish it with.",
  "Let your life be a reflection of Divine Love.",
  "Serve others selflessly — that is true devotion.",
  "Keep your heart pure — purity brings clarity, peace, God.",
  "When the senses are controlled, the mind becomes calm.",
  "Vegetarianism helps calm the mind, respects life, brings peace.",
  "What you consume affects your mind — choose sattvic food.",
  "Compassion for animals is also compassion for God.",
  "Transform negativity by transforming your inner vibrations through love and faith.",
  "True transformation requires surrender — to God, to the Guru, to Love.",
  "Chanting God's name constantly burns the ego and awakens the soul.",
  "Don't cling to outward rituals alone — let love be the essence behind every act.",
  "When you open your heart — you start seeing God everywhere.",
  "Faith, devotion, service — these are the pillars of spiritual life.",
  "Let love guide you, not fear or doubt.",
  "Everything external is temporary — only God within is eternal.",
  "Live simply, love deeply, serve humanity — that is spiritual living.",
  "When you surrender your ego — God's grace flows freely.",
  "Union with God is not far — it is in the love you give, the love you receive.",
  "Seek God in every being — then no one is a stranger.",
  "Your life becomes meaningful when you live for others.",
  "Silence the mind through love and worship — then you hear God's voice.",
  "Divine Love transcends religion, culture, race — it connects hearts.",
  "Keep your heart soft — hardness separates, softness unites.",
  "Let every breath be an offering of love — that is the path to God."
];

function getQuoteIndexForSwedenTime(): number {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  // Sweden is UTC+1 (CET) or UTC+2 (CEST), use +1 as base
  const swedenOffset = 60 * 60 * 1000; // +1 hour
  const swedenTime = new Date(utc.getTime() + swedenOffset);

  // Check if current time is before 07:00, if yes, show previous day's quote
  let dateForQuote = new Date(swedenTime);
  if (swedenTime.getHours() < 7) {
    dateForQuote.setDate(swedenTime.getDate() - 1);
  }

  // Compute index based on date
  const dayCount = Math.floor(dateForQuote.getTime() / (1000 * 60 * 60 * 24));
  return dayCount % quotes.length;
}

export function useDailyQuote() {
  const [quote, setQuote] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateQuote = () => {
      const index = getQuoteIndexForSwedenTime();
      setIsVisible(false);
      setTimeout(() => {
        setQuote(quotes[index]);
        setIsVisible(true);
      }, 300);
    };

    updateQuote();

    // Check every 30 minutes to catch 07:00 change
    const interval = setInterval(updateQuote, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { quote, isVisible };
}
