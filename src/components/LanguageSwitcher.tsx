import React, { useState } from 'react';
import { getLang, Language, setLang } from '../i18n';
import { Dropdown } from 'react-bootstrap';
import { CircleFlagsRu, CircleFlagsUsUm } from '../icons';

interface Flag {
  icon: React.ReactNode;
  label: string;
}

const FLAGS: Record<Language, Flag> = {
  en: {
    icon: <CircleFlagsUsUm />,
    label: 'English'
  },
  ru: {
    icon: <CircleFlagsRu />,
    label: 'Русский'
  },
};

type Props = {
  onChange: (lang: Language) => void;
};

const LanguageSwitcher: React.FC<Props> = ({ onChange }) => {
  const [current, setCurrent] = useState<Language>(getLang());

  const handleChange = (lang: Language) => {
    setCurrent(lang);
    setLang(lang);
    onChange(lang);
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="light" size="sm">
        {FLAGS[current].icon}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {Object.entries(FLAGS).map(([lang, flag]) => (
          <Dropdown.Item key={lang} onClick={() => handleChange(lang as Language)}>
            {flag.icon} {flag.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
