import { useState } from 'react';

const languageLayouts = {
  Hebrew: 'קראטוןםפשדגכעיחלךףזסבהנמצתץ'.split(''),
  English: 'qwertyuiopasdfghjklzxcvbnm'.split(''),
  Emoji: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉','🙂', '😍']
};

const numbersLayout = '1234567890'.split('');

const symbolsLayout = ['.', ',', '?', '!', ':', '-', '/','_', '(', ')', '[', ']', '{', '}', '@', '#', '%', '*', '+', '='];

function Keyboard({ onKeyClick }) {
  const [language, setLanguage] = useState('Hebrew');

  return (
    <div className="keyboard-container">
      <div className="lang-switcher">
        {Object.keys(languageLayouts).map(lang => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={language === lang ? 'active-btn' : ''}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="keyboard language-keyboard">
                {numbersLayout.map((char, index) => (
          <button key={`num-${index}`} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}

        {symbolsLayout.map((char, index) => (
          <button key={`sym-${index}`} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}
        {languageLayouts[language].map((char, index) => (
          <button key={`${language}-${index}`} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}
        <button className="space-bar" onClick={() => onKeyClick(' ')}>
          Space
        </button>
      </div>
    </div>
  );
}

export default Keyboard;