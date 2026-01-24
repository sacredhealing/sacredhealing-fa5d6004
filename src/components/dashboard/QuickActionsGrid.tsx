import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Youtube, BookOpen, DollarSign, Wallet, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  href: string;
  iconColor: string;
  iconBg: string;
}

export const QuickActionsGrid: React.FC = () => {
  const { t } = useTranslation();

  const actions: QuickAction[] = [
    {
      icon: Play,
      label: t('quickActions.meditate', 'Meditera'),
      href: '/healing',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
    },
    {
      icon: Youtube,
      label: t('quickActions.videos', 'Videor'),
      href: '/videos',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/20',
    },
    {
      icon: BookOpen,
      label: t('quickActions.courses', 'Kurser'),
      href: '/courses',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/20',
    },
    {
      icon: DollarSign,
      label: t('quickActions.earn', 'Tjäna'),
      href: '/earn',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
    },
    {
      icon: Wallet,
      label: t('quickActions.wallet', 'Plånbok'),
      href: '/wallet',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/20',
    },
    {
      icon: Sparkles,
      label: t('quickActions.creativeSoul', 'Creative Soul'),
      href: '/creative-soul/store',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold text-foreground">
        {t('dashboard.quickActions', 'Snabbåtgärder')}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Card className="p-4 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-3 h-full min-h-[100px]">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.iconBg}`}>
                <action.icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-foreground text-center">
                {action.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
