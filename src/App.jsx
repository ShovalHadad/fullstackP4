import { useState } from 'react';
import Keyboard from './components/Keyboard';
import './App.css';

function App() {
  // --- חלק ד: ניהול משתמשים ---
  const [currentUser, setCurrentUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');

  // --- חלק ג: ניהול מספר טקסטים במקביל ---
  const [documents, setDocuments] = useState([
    { id: Date.now(), textItems: [], cursorIndex: 0, fileName: '' }
  ]);
  const [activeDocId, setActiveDocId] = useState(documents[0].id);
  const activeDoc = documents.find(doc => doc.id === activeDocId) || documents[0];

  const [history, setHistory] = useState([]);
  const [currentStyle, setCurrentStyle] = useState({ color: '#000000', fontSize: '24px' });
  const [savedFiles, setSavedFiles] = useState([]);
  const [focusField, setFocusField] = useState('main');
  const [searchChar, setSearchChar] = useState('');
  const [replaceChar, setReplaceChar] = useState('');

  // --- פונקציות עזר וניהול משתמש ---
  const refreshFileList = (user) => {
    const prefix = `${user}_`;
    const userFiles = Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));
    setSavedFiles(userFiles);
  };

  const handleLogin = () => {
    if (!usernameInput.trim()) return;
    setCurrentUser(usernameInput.trim());
    refreshFileList(usernameInput.trim());
    setDocuments([{ id: Date.now(), textItems: [], cursorIndex: 0, fileName: '' }]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsernameInput('');
  };

  const updateActiveDoc = (newData) => {
    setDocuments(prevDocs => prevDocs.map(doc => 
      doc.id === activeDocId ? { ...doc, ...newData } : doc
    ));
  };

  const saveHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(documents))]);
  };

  // --- לוגיקת חיפוש והחלפה ---
  const findChar = () => {
    if (!searchChar) return;
    const chars = activeDoc.textItems.map(item => item.char);
    let index = chars.indexOf(searchChar, activeDoc.cursorIndex);
    if (index === -1) index = chars.indexOf(searchChar);

    if (index !== -1) {
      updateActiveDoc({ cursorIndex: index });
      setFocusField('main');
    } else {
      alert('התו לא נמצא');
    }
  };

  const replaceCharOnce = () => {
    if (!searchChar || !replaceChar) return;
    const index = activeDoc.textItems.map(item => item.char).indexOf(searchChar, activeDoc.cursorIndex);
    if (index === -1) { alert('לא נמצא לביצוע החלפה'); return; }
    saveHistory();
    const updated = [...activeDoc.textItems];
    updated[index] = { ...updated[index], char: replaceChar, ...currentStyle };
    updateActiveDoc({ textItems: updated, cursorIndex: index + 1 });
    setFocusField('main');
  };

  const replaceAllChars = () => {
    if (!searchChar || !replaceChar) return;
    saveHistory();
    const updated = activeDoc.textItems.map(item =>
      item.char === searchChar ? { ...item, char: replaceChar, ...currentStyle } : item
    );
    updateActiveDoc({ textItems: updated });
    setFocusField('main');
  };

  // --- פונקציות עיצוב ---
  const applyStyleToAll = () => {
    saveHistory();
    const updated = activeDoc.textItems.map(item => ({
      ...item,
      color: currentStyle.color,
      fontSize: currentStyle.fontSize
    }));
    updateActiveDoc({ textItems: updated });
  };

  const applyStyleFromCursor = () => {
    saveHistory();
    const updated = activeDoc.textItems.map((item, index) =>
      index >= activeDoc.cursorIndex 
        ? { ...item, color: currentStyle.color, fontSize: currentStyle.fontSize }
        : item
    );
    updateActiveDoc({ textItems: updated });
  };

  // --- לוגיקת מקלדת ועריכה ---
  const handleKeyClick = (char) => {
    if (focusField === 'search') { setSearchChar(char); return; }
    if (focusField === 'replace') { setReplaceChar(char); return; }
    saveHistory();
    const updated = [...activeDoc.textItems];
    updated.splice(activeDoc.cursorIndex, 0, { char, ...currentStyle });
    updateActiveDoc({ textItems: updated, cursorIndex: activeDoc.cursorIndex + 1 });
  };

  const deleteChar = () => {
    if (focusField === 'search') { setSearchChar(''); return; }
    if (focusField === 'replace') { setReplaceChar(''); return; }
    if (activeDoc.cursorIndex === 0) return;
    saveHistory();
    const updated = [...activeDoc.textItems];
    updated.splice(activeDoc.cursorIndex - 1, 1);
    updateActiveDoc({ textItems: updated, cursorIndex: activeDoc.cursorIndex - 1 });
  };

  const deleteWord = () => {
    if (activeDoc.cursorIndex === 0) return;
    saveHistory();
    const updated = [...activeDoc.textItems];
    let end = activeDoc.cursorIndex;
    while (end > 0 && updated[end - 1]?.char === ' ') end--;
    let start = end;
    while (start > 0 && updated[start - 1]?.char !== ' ') start--;
    updated.splice(start, activeDoc.cursorIndex - start);
    updateActiveDoc({ textItems: updated, cursorIndex: start });
  };

  const undo = () => {
    if (!history.length) return;
    setDocuments(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
  };

  // --- קבצים וחלונות ---
  const saveFile = (saveAs = false) => {
    if (!currentUser) return;
    let name = activeDoc.fileName;
    if (!name || saveAs) name = prompt('שם קובץ:', activeDoc.fileName || 'מסמך חדש');
    if (!name) return;
    localStorage.setItem(`${currentUser}_${name}`, JSON.stringify(activeDoc.textItems));
    updateActiveDoc({ fileName: name });
    refreshFileList(currentUser);
  };

  const openFile = (name) => {
    const data = localStorage.getItem(`${currentUser}_${name}`);
    if (!data) return;
    saveHistory();
    const parsed = JSON.parse(data);
    updateActiveDoc({ textItems: parsed, cursorIndex: parsed.length, fileName: name });
    setFocusField('main');
  };

  const closeDoc = (id) => {
    const docToClose = documents.find(d => d.id === id);
    if (docToClose && docToClose.textItems.length > 0) {
      if (confirm(`האם ברצונך לשמור לפני הסגירה?`)) {
        saveFile();
      }
    }
    if (documents.length === 1) {
      updateActiveDoc({ textItems: [], cursorIndex: 0, fileName: '' });
    } else {
      const remaining = documents.filter(d => d.id !== id);
      setDocuments(remaining);
      if (id === activeDocId) setActiveDocId(remaining[0].id);
    }
  };

  const renderText = (doc) => {
    const output = [];
    for (let i = 0; i <= doc.textItems.length; i++) {
      if (i === doc.cursorIndex && doc.id === activeDocId) output.push(<span key={`cursor-${doc.id}`} className="cursor" />);
      if (i < doc.textItems.length) {
        const item = doc.textItems[i];
        output.push(<span key={i} style={{ color: item.color, fontSize: item.fontSize }}>{item.char}</span>);
      }
    }
    return output;
  };

  if (!currentUser) {
    return (
      <div className="login-screen">
        <h2>כניסה למערכת</h2>
        <input type="text" placeholder="שם משתמש" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} />
        <button onClick={handleLogin}>התחבר</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="user-tag">👤 {currentUser} | <button onClick={handleLogout}>יציאה</button></div>
        <h1>Visual Text Editor</h1>
        <button onClick={() => setDocuments([...documents, { id: Date.now(), textItems: [], cursorIndex: 0, fileName: '' }])} className="new-win-btn">+ חלון חדש</button>
      </header>

      <section className="files-bar">
        <select value="" onChange={(e) => openFile(e.target.value)}>
          <option value="" disabled>הקבצים של {currentUser}...</option>
          {savedFiles.map(name => (<option key={name} value={name}>{name}</option>))}
        </select>
        <button onClick={() => saveFile(false)} className="active-btn">Save</button>
        <button onClick={() => saveFile(true)}>Save As</button>
        <button onClick={() => updateActiveDoc({textItems: [], cursorIndex: 0, fileName: ''})}>נקה חלון</button>
      </section>

      <div className="multi-display-container">
        {documents.map(doc => (
          <section key={doc.id} className={`display-area ${doc.id === activeDocId ? 'active-win' : ''}`} onClick={() => { setActiveDocId(doc.id); setFocusField('main'); }}>
            <div className="win-header">
               <span>{doc.fileName || 'מסמך חדש'}</span>
               <button onClick={(e) => { e.stopPropagation(); closeDoc(doc.id); }}>×</button>
            </div>
            <div className="text-render-zone">{renderText(doc)}</div>
          </section>
        ))}
      </div>

      <section className="bottom-editor">
        <div className="side-panel left-panel">
          <div className="panel-grid">
            <button onClick={deleteChar}>מחק תו</button>
            <button onClick={undo}>Undo</button>
            <button onClick={() => updateActiveDoc({textItems: [], cursorIndex: 0})}>נקה הכל</button>
            <button onClick={deleteWord}>מחק מילה</button>
          </div>
          <div className="panel-grid search-grid">
            <input readOnly placeholder="ג" value={searchChar} onClick={() => setFocusField('search')} className={focusField === 'search' ? 'active-input' : ''} />
            <input readOnly placeholder="ט" value={replaceChar} onClick={() => setFocusField('replace')} className={focusField === 'replace' ? 'active-input' : ''} />
            <button onClick={findChar}>מצא</button>
            <button onClick={replaceCharOnce}>החלף</button>
            <button onClick={replaceAllChars} className="full-width-btn">החלף הכל</button>
          </div>
        </div>

        <div className="keyboard-center">
          <Keyboard onKeyClick={handleKeyClick} />
        </div>

        {/* פאנל ימני מעודכן לפי התמונה */}
        <div className="side-panel right-panel">
          <div className="panel-group diagonal-group">
            <div className="style-row">
              <input type="color" value={currentStyle.color} onChange={(e) => setCurrentStyle({ ...currentStyle, color: e.target.value })} />
              <label>:צבע</label>
            </div>
            
            <div className="style-row">
              <select value={currentStyle.fontSize} onChange={(e) => setCurrentStyle({ ...currentStyle, fontSize: e.target.value })}>
                <option value="16px">קטן</option>
                <option value="24px">בינוני</option>
                <option value="40px">גדול</option>
              </select>
              <label>:גודל</label>
            </div>

            <div className="action-btns-row">
               <button onClick={applyStyleFromCursor}>עצב מכאן</button>
               <button onClick={applyStyleToAll} style={{ fontWeight: 'bold', border: '2px solid black' }}>עצב הכל</button>
            </div>

            <div className="cursor-controls">
              <button onClick={() => updateActiveDoc({cursorIndex: Math.max(0, activeDoc.cursorIndex - 1)})}>→</button>
              <button onClick={() => updateActiveDoc({cursorIndex: Math.min(activeDoc.textItems.length, activeDoc.cursorIndex + 1)})}>←</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;