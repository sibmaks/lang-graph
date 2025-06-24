import React, { useState } from 'react';
import { getLang, Language, setLang } from '../i18n';

const FLAGS: Record<Language, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
};

type Props = {
  onChange: (lang: Language) => void;
};

const LanguageSwitcher: React.FC<Props> = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Language>(getLang());

  const handleChange = (lang: Language) => {
    setCurrent(lang);
    setLang(lang);
    onChange(lang);
    setOpen(false);
  };

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      <button onClick={() => setOpen(!open)} style={{ fontSize: '24px' }}>
        {FLAGS[current]}
      </button>
      {open && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            marginTop: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {Object.entries(FLAGS).map(([lang, flag]) => (
            <button
              key={lang}
              onClick={() => handleChange(lang as Language)}
              style={{ fontSize: '20px', width: '100%', padding: '4px 8px' }}
            >
              {flag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
