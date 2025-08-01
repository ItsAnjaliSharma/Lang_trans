'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Language } from '@/types';
import { LANGUAGES } from '@/lib/languages';

interface LanguageSelectorProps {
  selectedLang: Language;
  onLangChange: (lang: Language) => void;
  showAutoDetect?: boolean;
}

export function LanguageSelector({ selectedLang, onLangChange, showAutoDetect = false }: LanguageSelectorProps) {
  const handleValueChange = (code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    if (lang) {
      onLangChange(lang);
    }
  };

  return (
    <Select value={selectedLang.code} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent>
        {showAutoDetect && <SelectItem value="auto">Auto-detect</SelectItem>}
        {LANGUAGES
          .filter(lang => lang.code !== 'auto')
          .map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
