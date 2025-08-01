'use client';

import type { FC } from 'react';
import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ArrowRightLeft, Copy, Languages, LoaderCircle, Volume2 } from 'lucide-react';
import type { Language, Translation } from '@/types';
import { LANGUAGES } from '@/lib/languages';
import { getTranslation } from './actions';

const DEFAULT_SOURCE_LANG: Language = { code: 'auto', name: 'Auto-detect' };
const DEFAULT_TARGET_LANG: Language = { code: 'es', name: 'Spanish' };

const Translator: FC = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState<Language>(DEFAULT_TARGET_LANG);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [isTranslating, startTranslation] = useTransition();
  const { toast } = useToast();
  const [history, setHistory] = useLocalStorage<Translation[]>('translationHistory', []);
  const [offlineCache, setOfflineCache] = useLocalStorage<Record<string, string>>('offlineCache', {});
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
    }
  }, []);

  const handleTranslate = useCallback(() => {
    if (!inputText.trim()) return;

    if (isOffline) {
      const cacheKey = `${sourceLang.code}-${targetLang.code}:${inputText}`;
      const cachedTranslation = offlineCache[cacheKey];
      if (cachedTranslation) {
        setTranslatedText(cachedTranslation);
        toast({ title: "Translated from offline cache." });
      } else {
        toast({
          title: "Offline Mode",
          description: "This translation is not available in your offline cache.",
          variant: "destructive"
        });
      }
      return;
    }

    startTranslation(async () => {
      setDetectedLang(null);
      const result = await getTranslation(inputText, targetLang.code, sourceLang.code);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        setTranslatedText('');
      } else if (result.translation) {
        const { translation, detectedLanguage, confidence } = result;
        setTranslatedText(translation);
        if (sourceLang.code === 'auto' && detectedLanguage) {
            const detectedLangName = LANGUAGES.find(l => l.code.toLowerCase() === detectedLanguage.toLowerCase())?.name || detectedLanguage;
            setDetectedLang(`Detected: ${detectedLangName} (Confidence: ${Math.round(confidence * 100)}%)`);
        }
        
        const newTranslation: Translation = {
          id: new Date().toISOString(),
          sourceLang: sourceLang.code,
          targetLang: targetLang.code,
          sourceText: inputText,
          translatedText: translation,
        };
        setHistory([newTranslation, ...history.slice(0, 49)]);

        const cacheKey = `${sourceLang.code}-${targetLang.code}:${inputText}`;
        setOfflineCache({...offlineCache, [cacheKey]: translation});
      }
    });
  }, [inputText, targetLang, sourceLang, isOffline, offlineCache, setOfflineCache, history, setHistory, toast]);

  const handleSwapLanguages = () => {
    if (sourceLang.code === 'auto') {
        toast({ title: "Cannot swap with 'Auto-detect'", description: "Please select a specific source language to swap."});
        return;
    }
    setInputText(translatedText);
    setTranslatedText(inputText);
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setDetectedLang(null);
  };

  const handleCopy = (text: string, type: 'source' | 'translated') => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `Copied ${type} text to clipboard` });
    }).catch(err => {
      toast({ title: 'Copy failed', description: err.message, variant: 'destructive' });
    });
  };
  
  const loadFromHistory = (item: Translation) => {
    const source = LANGUAGES.find(l => l.code === item.sourceLang) || DEFAULT_SOURCE_LANG;
    const target = LANGUAGES.find(l => l.code === item.targetLang) || DEFAULT_TARGET_LANG;
    setSourceLang(source);
    setTargetLang(target);
    setInputText(item.sourceText);
    setTranslatedText(item.translatedText);
    setDetectedLang(null);
  };
  
  const speak = (text: string, lang: string) => {
    if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        if(lang !== 'auto') {
            utterance.lang = lang;
        }
        window.speechSynthesis.speak(utterance);
    } else {
        toast({ title: 'Text-to-speech not supported or no text to speak.' });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-background">
      <Header 
        history={history} 
        onHistoryItemClick={loadFromHistory}
        isOffline={isOffline}
        onOfflineToggle={setIsOffline} 
      />
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center">
        <Card className="shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
              {/* Source Text Area */}
              <div className="flex flex-col gap-4">
                <LanguageSelector
                  selectedLang={sourceLang}
                  onLangChange={setSourceLang}
                  languages={LANGUAGES}
                  showAutoDetect
                />
                <div className="relative flex-1">
                  <Textarea
                    placeholder="Enter text to translate..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="h-48 md:h-64 resize-none text-base p-4 rounded-xl"
                  />
                  <div className='absolute bottom-3 right-3 flex items-center gap-2'>
                    <Button variant="ghost" size="icon" onClick={() => speak(inputText, sourceLang.code)} disabled={!inputText}>
                      <Volume2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(inputText, 'source')} disabled={!inputText}>
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                 {detectedLang && <p className="text-sm text-muted-foreground mt-1 text-center">{detectedLang}</p>}
              </div>

              {/* Swap Button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 my-4 md:my-0">
                  <Button variant="ghost" size="icon" onClick={handleSwapLanguages} className="bg-background hover:bg-secondary rounded-full border">
                      <ArrowRightLeft className="h-5 w-5 text-primary" />
                  </Button>
              </div>

              {/* Translated Text Area */}
              <div className="flex flex-col gap-4">
                <LanguageSelector
                  selectedLang={targetLang}
                  onLangChange={setTargetLang}
                  languages={LANGUAGES}
                />
                 <div className="relative flex-1">
                  <Textarea
                    placeholder="Translation"
                    value={translatedText}
                    readOnly
                    className="h-48 md:h-64 resize-none text-base p-4 rounded-xl bg-secondary/50"
                  />
                  <div className='absolute bottom-3 right-3 flex items-center gap-2'>
                    <Button variant="ghost" size="icon" onClick={() => speak(translatedText, targetLang.code)} disabled={!translatedText}>
                        <Volume2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(translatedText, 'translated')} disabled={!translatedText}>
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button onClick={handleTranslate} disabled={isTranslating || !inputText.trim()} size="lg" className="gap-2 rounded-full px-8 py-6 text-lg font-bold">
                {isTranslating ? (
                  <>
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Languages className="h-6 w-6" />
                    <span>Translate</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <footer className="text-center mt-6 text-sm text-muted-foreground">
            <p>Powered by AI. Built for the modern web.</p>
        </footer>
      </main>
    </div>
  );
};

export default Translator;
