import React from 'react';
import { useTranslatedText } from '@/hooks/useTranslateContent';

interface TranslatedTextProps {
  children: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const TranslatedText = ({ children, className, as: Component = 'span' }: TranslatedTextProps) => {
  const { text, isLoading } = useTranslatedText(children);
  
  return React.createElement(Component as any, { className }, isLoading ? children : text);
};
