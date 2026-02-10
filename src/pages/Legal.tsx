import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';

export default function LegalPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-24 max-w-3xl mx-auto">
      <div className="pt-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border bg-muted/50 px-3 py-2 text-sm text-foreground/80 hover:bg-muted transition"
          aria-label={t('common.back')}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('legal.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('legal.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <h2 className="font-semibold text-foreground">{t('legal.entertainment.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('legal.entertainment.body')}</p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <h2 className="font-semibold text-foreground">{t('legal.no_medical.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('legal.no_medical.body')}</p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <h2 className="font-semibold text-foreground">{t('legal.not_substitute.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('legal.not_substitute.body')}</p>
        </div>
      </div>
    </div>
  );
}
