import React from 'react';
import { PromptLibrary as PromptLibraryComponent } from '@/components/ai/PromptLibrary';

const PromptLibrary = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <PromptLibraryComponent />
      </div>
    </div>
  );
};

export default PromptLibrary;
