import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { updatePreferredLanguage } = useProfile();

  const handleLanguageChange = async (value: string) => {
    i18n.changeLanguage(value);
    if (user) {
      await updatePreferredLanguage(value);
    }
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-full bg-card/50 border-border/50">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-muted-foreground" />
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.name}</span>
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
