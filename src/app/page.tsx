
'use client';

import type { FC } from 'react';
import React, { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const ApiDocs: FC = () => {
    const [origin, setOrigin] = React.useState('');
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const curlExample = `curl -X POST -H "Content-Type: application/json" \\
  -d '{"text": "<h1>Hello World</h1>", "targetLanguage": "es"}' \\
  '${origin}/api/translate'`;

    const fetchExample = `fetch('${origin}/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: '<h1>Hello World</h1><p>This is a paragraph.</p>',
    targetLanguage: 'es'
  })
})
.then(res => res.json())
.then(console.log);`;

    return (
        <Card className="shadow-2xl rounded-2xl overflow-hidden mt-8">
            <CardHeader>
                <CardTitle>For Developers: Use the API</CardTitle>
                <CardDescription>
                    Integrate our translation power into your own projects with a simple API call.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                <div>
                    <h3 className="font-semibold text-base mb-2">Endpoint</h3>
                    <div className="p-3 bg-secondary/50 rounded-md">
                        <code className="font-mono text-primary font-bold">POST {origin}/api/translate</code>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-2">Request Body (JSON)</h3>
                    <div className="p-3 bg-secondary/50 rounded-md">
                        <pre className="whitespace-pre-wrap font-mono">
                            {`{\n  "text": "<p>Your HTML or plain text here...</p>",\n  "targetLanguage": "es" // See language codes above\n}`}
                        </pre>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-2">Example: cURL</h3>
                     <div className="relative p-3 bg-secondary/50 rounded-md">
                        <pre className="whitespace-pre-wrap font-mono">{curlExample}</pre>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => navigator.clipboard.writeText(curlExample)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-2">Example: JavaScript Fetch</h3>
                     <div className="relative p-3 bg-secondary/50 rounded-md">
                        <pre className="whitespace-pre-wrap font-mono">{fetchExample}</pre>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => navigator.clipboard.writeText(fetchExample)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


const Translator: FC = () => {
  const [inputText, setInputText] = React.useState('');
  const [translatedText, setTranslatedText] = React.useState('');
  const [sourceLang, setSourceLang] = React.useState<Language>(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = React.useState<Language>(DEFAULT_TARGET_LANG);
  const [detectedLang, setDetectedLang] = React.useState<string | null>(null);
  const [isTranslating, startTranslation] = React.useTransition();
  const { toast } = useToast();
  const [history, setHistory] = useLocalStorage<Translation[]>('translationHistory', []);
  const [offlineCache, setOfflineCache] = useLocalStorage<Record<string, string>>('offlineCache', {});
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "You are back online!",
        description: "Connected to translation service.",
      });
    }
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "You are currently offline",
        description: "Only cached translations will be available.",
      });
    }
    
    setIsOffline(!window.navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
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
          title: "Offline",
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
        
        setHistory(prevHistory => {
          const newTranslation: Translation = {
            id: new Date().toISOString(),
            sourceLang: sourceLang.code,
            targetLang: targetLang.code,
            sourceText: inputText,
            translatedText: translation,
          };
          return [newTranslation, ...prevHistory.slice(0, 49)];
        });
  
        setOfflineCache(prevCache => {
          const cacheKey = `${sourceLang.code}-${targetLang.code}:${inputText}`;
          return {...prevCache, [cacheKey]: translation};
        });
      }
    });
  }, [inputText, targetLang.code, sourceLang.code, isOffline, offlineCache, toast, setHistory, setOfflineCache, startTranslation]);

  const handleSwapLanguages = useCallback(() => {
    if (sourceLang.code === 'auto') {
        toast({ title: "Cannot swap with 'Auto-detect'", description: "Please select a specific source language to swap."});
        return;
    }
    const currentSource = sourceLang;
    const currentTarget = targetLang;
    setSourceLang(currentTarget);
    setTargetLang(currentSource);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setDetectedLang(null);
  }, [inputText, translatedText, sourceLang, targetLang, toast]);

  const handleCopy = useCallback((text: string, type: 'source' | 'translated') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `Copied ${type} text to clipboard` });
    }).catch(err => {
      toast({ title: 'Copy failed', description: err.message, variant: 'destructive' });
    });
  }, [toast]);
  
  const loadFromHistory = useCallback((item: Translation) => {
    const source = LANGUAGES.find(l => l.code === item.sourceLang) || DEFAULT_SOURCE_LANG;
    const target = LANGUAGES.find(l => l.code === item.targetLang) || DEFAULT_TARGET_LANG;
    setSourceLang(source);
    setTargetLang(target);
    setInputText(item.sourceText);
    setTranslatedText(item.translatedText);
    setDetectedLang(null);
  }, []);
  
  const speak = useCallback((text: string, lang: string) => {
    if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        if(lang !== 'auto') {
            utterance.lang = lang;
        }
        window.speechSynthesis.speak(utterance);
    } else {
        toast({ title: 'Text-to-speech not supported or no text to speak.' });
    }
  }, [toast]);

  const onSourceLangChange = useCallback((lang: Language) => {
    setSourceLang(lang);
  }, []);

  const onTargetLangChange = useCallback((lang: Language) => {
    setTargetLang(lang);
  }, []);


  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-6 bg-background">
      <Header 
        history={history} 
        onHistoryItemClick={loadFromHistory}
        isOffline={isOffline}
      />
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center">
        <Card className="shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
              {/* Source Text Area */}
              <div className="flex flex-col gap-4">
                <LanguageSelector
                  selectedLang={sourceLang}
                  onLangChange={onSourceLangChange}
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
                  onLangChange={onTargetLangChange}
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
        
        <ApiDocs />

        <footer className="text-center mt-6 text-sm text-muted-foreground">
            <p>Powered by AI. Built for the modern web.</p>
        </footer>
      </main>
    </div>
  );
};

export default Translator;
