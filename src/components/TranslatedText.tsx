import { useTranslatedText } from '@/hooks/useTranslateContent';

interface TranslatedTextProps {
  children: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const TranslatedText = ({ children, className, as: Component = 'span' }: TranslatedTextProps) => {
  const { text, isLoading } = useTranslatedText(children);
  
  return (
    <Component className={className}>
      {isLoading ? children : text}
    </Component>
  );
};
