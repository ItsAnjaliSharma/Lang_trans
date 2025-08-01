
'use client';

import React from 'react';
import { History, Languages, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HistoryPanel } from './HistoryPanel';
import type { Translation } from '@/types';

interface HeaderProps {
  history: Translation[];
  onHistoryItemClick: (item: Translation) => void;
  isOffline: boolean;
}

export function Header({ history, onHistoryItemClick, isOffline }: HeaderProps) {
  return (
    <header className="w-full max-w-4xl p-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Languages className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline">
            LinguaNext
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2" title={isOffline ? 'Offline' : 'Online'}>
            {isOffline ? <WifiOff className="h-5 w-5 text-destructive"/> : <Wifi className="h-5 w-5 text-accent"/>}
          </div>
          <HistoryPanel history={history} onHistoryItemClick={onHistoryItemClick}>
            <Button variant="outline" size="icon">
              <History className="h-5 w-5" />
            </Button>
          </HistoryPanel>
        </div>
      </div>
    </header>
  );
}
