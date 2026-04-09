import { useState } from 'react';

const layouts = {
  Hebrew: "1234567890/-'קראטוןםפשדגכעיחלךףזסבהנמצתץ.".split(""),
  English: "1234567890qwertyuiopasdfghjklzxcvbnm".split(""),
  Emoji: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉"]
};

function Keyboard({ onKeyClick }) {
  const [language, setLanguage] = useState('Hebrew');

  return (
    <div className="keyboard-container">
      <div className="lang-switcher">
        {Object.keys(layouts).map(lang => (
          <button key={lang} onClick={() => setLanguage(lang)} 
                  style={{ fontWeight: language === lang ? 'bold' : 'normal' }}>
            {lang}
          </button>
        ))}
      </div>
      <div className="keyboard">
        {layouts[language].map((char, index) => (
          <button key={index} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}
        <button className="space-bar" onClick={() => onKeyClick(" ")}>Space</button>
      </div>
    </div>
  );
}

export default Keyboard;