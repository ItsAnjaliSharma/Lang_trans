export interface Language {
  code: string;
  name: string;
}

export interface Translation {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  translatedText: string;
}
