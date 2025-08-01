'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Translation } from '@/types';
import { LANGUAGES } from '@/lib/languages';

interface HistoryPanelProps {
  children: React.ReactNode;
  history: Translation[];
  onHistoryItemClick: (item: Translation) => void;
}

export function HistoryPanel({ children, history, onHistoryItemClick }: HistoryPanelProps) {
  
  const getLanguageName = (code: string) => {
    if (code === 'auto') return 'Auto-detect';
    return LANGUAGES.find(l => l.code === code)?.name || code;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Translation History</SheetTitle>
          <SheetDescription>
            Here are your most recent translations. Click one to load it.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <ScrollArea className="h-[calc(100%-8rem)]">
          <div className="flex flex-col gap-4 pr-4">
            {history.length > 0 ? (
              history.map((item) => (
                <SheetTrigger asChild key={item.id}>
                  <Button
                    variant="ghost"
                    className="h-auto w-full p-3 text-left flex flex-col items-start gap-2 border"
                    onClick={() => onHistoryItemClick(item)}
                  >
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                        <span>{getLanguageName(item.sourceLang)}</span>
                        <ArrowRight className="h-4 w-4 mx-2" />
                        <span>{getLanguageName(item.targetLang)}</span>
                    </div>
                    <p className="font-semibold truncate w-full">{item.sourceText}</p>
                    <p className="text-muted-foreground truncate w-full">{item.translatedText}</p>
                  </Button>
                </SheetTrigger>
              ))
            ) : (
              <div className="text-center text-muted-foreground mt-8">
                <p>Your translation history is empty.</p>
                <p className="text-sm">Start translating to see your history here.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
