import { useState, useEffect } from 'react';
import Keyboard from './components/Keyboard';
import './App.css';

function App() {
  const [textItems, setTextItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentStyle, setCurrentStyle] = useState({
    color: '#000000',
    fontSize: '24px'
  });

  // --- חלק ב: ניהול קבצים ב-LocalStorage ---
  const [fileName, setFileName] = useState(""); 
  const [savedFiles, setSavedFiles] = useState([]);

  // טעינת רשימת הקבצים הקיימים בזיכרון בזמן טעינת האפליקציה
  useEffect(() => {
    refreshFileList();
  }, []);

  const refreshFileList = () => {
    setSavedFiles(Object.keys(localStorage));
  };

  // שמירה / שמירה בשם
  const handleSave = (isSaveAs = false) => {
    let name = fileName;
    if (isSaveAs || !fileName) {
      name = prompt("הכנס שם לקובץ לשמירה ב-LocalStorage:", fileName || "מסמך_חדש");
    }

    if (name) {
      localStorage.setItem(name, JSON.stringify(textItems));
      setFileName(name);
      refreshFileList();
      alert(`הקובץ "${name}" נשמר בהצלחה!`);
    }
  };

  // פתיחת קובץ קיים
  const handleOpen = (name) => {
    if (!name) return;
    const savedData = localStorage.getItem(name);
    if (savedData) {
      saveToHistory();
      setTextItems(JSON.parse(savedData));
      setFileName(name);
    }
  };

  // מחיקת קובץ מה-LocalStorage
  const deleteFile = () => {
    if (!fileName) {
      alert("אין קובץ פעיל למחיקה");
      return;
    }
    if (confirm(`האם אתה בטוח שברצונך למחוק את הקובץ "${fileName}" לצמיתות?`)) {
      localStorage.removeItem(fileName);
      setFileName("");
      setTextItems([]);
      refreshFileList();
      alert("הקובץ נמחק בהצלחה");
    }
  };
  // ---------------------------------------

  const [focusField, setFocusField] = useState('main'); 
  const [searchVal, setSearchVal] = useState("");
  const [replaceVal, setReplaceVal] = useState("");

  const saveToHistory = () => {
    setHistory([...history, [...textItems]]);
  };

  const addChar = (char) => {
    if (focusField === 'main') {
      saveToHistory();
      const newItem = { char, ...currentStyle };
      setTextItems([...textItems, newItem]);
    } else if (focusField === 'search') {
      setSearchVal(prev => prev + char);
    } else if (focusField === 'replace') {
      setReplaceVal(prev => prev + char);
    }
  };

  const deleteLast = () => {
    if (focusField === 'main') {
      if (textItems.length === 0) return;
      saveToHistory();
      setTextItems(textItems.slice(0, -1));
    } else if (focusField === 'search') {
      setSearchVal(searchVal.slice(0, -1));
    } else if (focusField === 'replace') {
      setReplaceVal(replaceVal.slice(0, -1));
    }
  };

  const clearAll = () => {
    if(confirm("האם אתה בטוח שברצונך לנקות הכל?")) {
      saveToHistory();
      setTextItems([]);
      setFileName("");
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setTextItems(previousState);
      setHistory(history.slice(0, -1));
    }
  };

  const applyStyleToAll = () => {
    if (textItems.length === 0) return;
    saveToHistory();
    const updated = textItems.map(item => ({
      ...item,
      color: currentStyle.color,
      fontSize: currentStyle.fontSize
    }));
    setTextItems(updated);
  };

  const searchAndReplace = () => {
    if (!searchVal) return;
    saveToHistory();
    const updated = textItems.map(item => 
      item.char === searchVal ? { ...item, char: replaceVal } : item
    );
    setTextItems(updated);
    setSearchVal("");
    setReplaceVal("");
    setFocusField('main');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Visual Text Editor</h1>
        <div className="file-info">
          📄 {fileName ? `קובץ פעיל: ${fileName}` : "קובץ חדש"}
        </div>
      </header>

      <section className="display-area" onClick={() => setFocusField('main')}>
        {textItems.length === 0 && focusField === 'main' && (
          <span className="placeholder">השתמש במקלדת למטה כדי להתחיל...</span>
        )}
        {textItems.map((item, index) => (
          <span key={index} style={{ color: item.color, fontSize: item.fontSize }}>
            {item.char}
          </span>
        ))}
        {focusField === 'main' && <span className="cursor" />}
      </section>

      <section className="editor-area">
        
        {/* ניהול קבצים (חלק ב מעודכן) */}
        <div className="file-bar">
          <div className="style-group">
            <select onChange={(e) => handleOpen(e.target.value)} value="">
              <option value="" disabled>פתח קובץ שמור...</option>
              {savedFiles.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button onClick={() => handleSave(false)} className="active-btn">Save</button>
            <button onClick={() => handleSave(true)}>Save As</button>
            <button onClick={deleteFile} style={{color: '#e74c3c'}}>Delete File</button>
            <button onClick={() => { setFileName(""); setTextItems([]); }}>New</button>
          </div>
        </div>

        <div className="toolbar">
          <div className="style-group">
            <label>צבע:</label>
            <input type="color" value={currentStyle.color} 
                   onChange={(e) => setCurrentStyle({...currentStyle, color: e.target.value})} />
            
            <label>גודל:</label>
            <select value={currentStyle.fontSize} onChange={(e) => setCurrentStyle({...currentStyle, fontSize: e.target.value})}>
              <option value="16px">קטן</option>
              <option value="24px">בינוני</option>
              <option value="40px">גדול</option>
            </select>
          </div>

          <div className="action-group">
            <button onClick={applyStyleToAll}>עצב הכל</button>
            <button onClick={handleUndo} disabled={history.length === 0}>Undo</button>
            <button onClick={deleteLast}>מחק תו</button>
            <button onClick={clearAll} style={{color: 'red'}}>נקה הכל</button>
          </div>
        </div>

        <div className="advanced-actions">
          <input 
            placeholder="חפש תו" 
            value={searchVal}
            onFocus={() => setFocusField('search')}
            readOnly 
            className={focusField === 'search' ? 'active-input' : ''}
          />
          <span style={{padding: '0 5px'}}>➜</span>
          <input 
            placeholder="החלף" 
            value={replaceVal}
            onFocus={() => setFocusField('replace')}
            readOnly
            className={focusField === 'replace' ? 'active-input' : ''}
          />
          <button onClick={searchAndReplace}>החלף הכל</button>
          <button onClick={() => setFocusField('main')} className={focusField === 'main' ? 'active-btn' : ''}>
            מקלדת ראשית
          </button>
        </div>

        <Keyboard onKeyClick={addChar} />
      </section>
    </div>
  );
}

export default App;