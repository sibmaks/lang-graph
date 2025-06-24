export type Language = 'en' | 'ru';

export const messages: Record<Language, Record<string, string>> = {
    en: {
        root: 'Root',
        expand: 'Expand',
        collapse: 'Collapse',
    },
    ru: {
        root: 'Корень',
        expand: 'Развернуть',
        collapse: 'Свернуть',
    },
};

export const getLang = (): Language => {
    return (localStorage.getItem('lang') as Language) || 'en';
};

export const setLang = (lang: Language) => {
    localStorage.setItem('lang', lang);
};
