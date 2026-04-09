import { useEffect, useState } from 'react';
import Keyboard from './components/Keyboard';
import './App.css';

function App() {
  const [textItems, setTextItems] = useState([]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [history, setHistory] = useState([]);

  const [currentStyle, setCurrentStyle] = useState({
    color: '#000000',
    fontSize: '24px'
  });

  const [fileName, setFileName] = useState('');
  const [savedFiles, setSavedFiles] = useState([]);

  const [focusField, setFocusField] = useState('main');
  const [searchChar, setSearchChar] = useState('');
  const [replaceChar, setReplaceChar] = useState('');

  useEffect(() => {
    setSavedFiles(Object.keys(localStorage));
  }, [fileName]);

  const saveHistory = () => {
    setHistory(prev => [...prev, { textItems, cursorIndex }]);
  };

  const insertAtCursor = (item) => {
    const updated = [...textItems];
    updated.splice(cursorIndex, 0, item);
    setTextItems(updated);
    setCursorIndex(cursorIndex + 1);
  };

  const removeAtCursor = () => {
    if (cursorIndex === 0) return;
    const updated = [...textItems];
    updated.splice(cursorIndex - 1, 1);
    setTextItems(updated);
    setCursorIndex(cursorIndex - 1);
  };

  const handleKeyClick = (char) => {
    if (focusField === 'search') {
      setSearchChar(char);
      return;
    }

    if (focusField === 'replace') {
      setReplaceChar(char);
      return;
    }

    saveHistory();
    insertAtCursor({ char, ...currentStyle });
  };

  const moveCursorLeft = () => {
    setCursorIndex(prev => Math.min(textItems.length, prev + 1));
  };

  const moveCursorRight = () => {
    setCursorIndex(prev => Math.max(0, prev - 1));
  };

  const deleteChar = () => {
    if (focusField === 'search') {
      setSearchChar('');
      return;
    }

    if (focusField === 'replace') {
      setReplaceChar('');
      return;
    }

    if (cursorIndex === 0) return;
    saveHistory();
    removeAtCursor();
  };

  const deleteWord = () => {
    if (cursorIndex === 0) return;

    saveHistory();

    const updated = [...textItems];
    let end = cursorIndex;

    while (end > 0 && updated[end - 1]?.char === ' ') end--;
    let start = end;
    while (start > 0 && updated[start - 1]?.char !== ' ') start--;

    updated.splice(start, cursorIndex - start);
    setTextItems(updated);
    setCursorIndex(start);
  };

  const clearAll = () => {
    saveHistory();
    setTextItems([]);
    setCursorIndex(0);
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setTextItems(last.textItems);
    setCursorIndex(last.cursorIndex);
    setHistory(prev => prev.slice(0, -1));
  };

  const applyStyleToAll = () => {
    saveHistory();
    setTextItems(items =>
      items.map(item => ({
        ...item,
        color: currentStyle.color,
        fontSize: currentStyle.fontSize
      }))
    );
  };

  const applyStyleFromCursor = () => {
    saveHistory();
    setTextItems(items =>
      items.map((item, index) =>
        index >= cursorIndex
          ? {
              ...item,
              color: currentStyle.color,
              fontSize: currentStyle.fontSize
            }
          : item
      )
    );
  };

  const findChar = () => {
    if (!searchChar) return;

    const chars = textItems.map(item => item.char);
    const index = chars.indexOf(searchChar, cursorIndex);

    if (index !== -1) {
      setCursorIndex(index);
      setFocusField('main');
      return;
    }

    const firstIndex = chars.indexOf(searchChar);
    if (firstIndex !== -1) {
      setCursorIndex(firstIndex);
      setFocusField('main');
    } else {
      alert('התו לא נמצא');
    }
  };

  const replaceCharOnce = () => {
    if (!searchChar || !replaceChar) return;

    const chars = textItems.map(item => item.char);
    const index = chars.indexOf(searchChar, cursorIndex);

    if (index === -1) {
      alert('התו לא נמצא');
      return;
    }

    saveHistory();

    const updated = [...textItems];
    updated[index] = {
      char: replaceChar,
      ...currentStyle
    };

    setTextItems(updated);
    setCursorIndex(index + 1);
    setFocusField('main');
  };

  const replaceAllChars = () => {
    if (!searchChar || !replaceChar) return;

    saveHistory();

    setTextItems(items =>
      items.map(item =>
        item.char === searchChar
          ? { char: replaceChar, ...currentStyle }
          : item
      )
    );

    setFocusField('main');
  };

  const saveFile = (saveAs = false) => {
    let name = fileName;

    if (!name || saveAs) {
      name = prompt('הכנס שם קובץ', fileName || 'מסמך חדש');
    }

    if (!name) return;

    localStorage.setItem(name, JSON.stringify(textItems));
    setFileName(name);
    setSavedFiles(Object.keys(localStorage));
  };

  const openFile = (name) => {
    const data = localStorage.getItem(name);
    if (!data) return;

    const parsed = JSON.parse(data);
    setTextItems(parsed);
    setCursorIndex(parsed.length);
    setFileName(name);
    setFocusField('main');
  };

  const deleteFile = () => {
    if (!fileName) return;
    localStorage.removeItem(fileName);
    setFileName('');
    setSavedFiles(Object.keys(localStorage));
  };

  const renderText = () => {
    const output = [];

    for (let i = 0; i <= textItems.length; i++) {
      if (i === cursorIndex) {
        output.push(<span key={`cursor-${i}`} className="cursor" />);
      }

      if (i < textItems.length) {
        const item = textItems[i];
        output.push(
          <span
            key={i}
            style={{ color: item.color, fontSize: item.fontSize }}
          >
            {item.char}
          </span>
        );
      }
    }

    return output;
  };

  return (
    <div className="app-container">
      <h1>Visual Text Editor</h1>
      <div className="file-info">📄 {fileName ? `קובץ פעיל: ${fileName}` : 'קובץ חדש'}</div>

      {/* אזור קבצים - מתחת לכותרת ולפני הטקסט */}
      <section className="files-bar">
        <select defaultValue="" onChange={(e) => openFile(e.target.value)}>
          <option value="" disabled>פתח קובץ שמור...</option>
          {savedFiles.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button onClick={() => saveFile(false)} className="active-btn">Save</button>
        <button onClick={() => saveFile(true)}>Save As</button>
        <button onClick={deleteFile}>Delete File</button>
        <button onClick={() => {
          setFileName('');
          setTextItems([]);
          setCursorIndex(0);
          setHistory([]);
          setSearchChar('');
          setReplaceChar('');
          setFocusField('main');
        }}>
          New
        </button>
      </section>

      {/* אזור הטקסט */}
      <section className="display-area" onClick={() => setFocusField('main')}>
        {renderText()}
      </section>

      {/* אזור תחתון */}
      <section className="bottom-editor">
        {/* צד שמאל - מחיקה/undo/חיפוש/החלפה */}
      <div className="side-panel left-panel">
        <div className="panel-grid">
          <button onClick={undo}>Undo</button>
          <button onClick={deleteChar}>מחק תו</button>
          <button onClick={deleteWord}>מחק מילה</button>
          <button onClick={clearAll}>נקה הכל</button>
        </div>
        <div className="panel-grid search-grid">
          <input
            readOnly
            placeholder="חפש תו"
            value={searchChar}
            onClick={() => setFocusField('search')}
            className={focusField === 'search' ? 'active-input' : ''}
          />

          <input
            readOnly
            placeholder="החלף תו"
            value={replaceChar}
            onClick={() => setFocusField('replace')}
            className={focusField === 'replace' ? 'active-input' : ''}
          />

          <button onClick={findChar}>מצא</button>
          <button onClick={replaceCharOnce}>החלף</button>
          <button onClick={replaceAllChars} className="full-width-btn">
            החלף הכל
          </button>
        </div>
      </div>
        {/* אמצע - מקלדת */}
        <div className="keyboard-center">
          <Keyboard onKeyClick={handleKeyClick} />
        </div>

        {/* צד ימין - עיצוב + חיצים */}
        <div className="side-panel right-panel">
          <div className="panel-group diagonal-group">
            <label>צבע:</label>
            <input 
              type="color"
              value={currentStyle.color}
              onChange={(e) =>
                setCurrentStyle({ ...currentStyle, color: e.target.value })
              }
            />

            <label>גודל:</label>
            <select
              value={currentStyle.fontSize}
              onChange={(e) =>
                setCurrentStyle({ ...currentStyle, fontSize: e.target.value })
              }
            >
              <option value="16px">קטן</option>
              <option value="24px">בינוני</option>
              <option value="40px">גדול</option>
            </select>

            <button onClick={applyStyleFromCursor}>עצב מכאן</button>
            <button onClick={applyStyleToAll}>עצב הכל</button>
            <button onClick={moveCursorLeft}>→</button>
            <button onClick={moveCursorRight}>←</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;