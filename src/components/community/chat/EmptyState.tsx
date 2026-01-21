import { MessageCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState = ({ 
  title = 'Select a conversation',
  description = 'Choose a contact from the list to start chatting'
}: EmptyStateProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 shadow-lg">
        <MessageCircle className="h-10 w-10 text-primary opacity-50" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
};

export default EmptyState;
