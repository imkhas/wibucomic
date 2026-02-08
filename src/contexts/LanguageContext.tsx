import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'ja' | 'id' | 'zh' | 'es' | 'pt-br' | 'fr' | 'ko';

export interface Language {
    code: LanguageCode;
    name: string;
    flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'pt-br', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
];

interface LanguageContextType {
    selectedLanguage: LanguageCode;
    setSelectedLanguage: (lang: LanguageCode) => void;
    availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => {
        const saved = localStorage.getItem('preferred_language');
        return (saved as LanguageCode) || 'en';
    });

    useEffect(() => {
        localStorage.setItem('preferred_language', selectedLanguage);
    }, [selectedLanguage]);

    return (
        <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage, availableLanguages: SUPPORTED_LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
