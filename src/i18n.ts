export type Language = 'en' | 'ru';

export const getLang = (): Language => {
    return (localStorage.getItem('lang') as Language) || 'en';
};

export const setLang = (lang: Language) => {
    localStorage.setItem('lang', lang);
};
