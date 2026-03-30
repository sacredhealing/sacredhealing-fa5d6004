import { useTranslatedText } from '@/hooks/useTranslateContent';

interface TranslatedContentProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Component for translating dynamic database content
export const TranslatedContent = ({ text, className, as: Component = 'span' }: TranslatedContentProps) => {
  const { text: translatedText, isLoading } = useTranslatedText(text);
  
  return React.createElement(Component as any, { className, style: { opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.2s' } }, translatedText);
};