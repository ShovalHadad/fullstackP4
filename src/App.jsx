import { useEffect, useState } from 'react';
import Keyboard from './components/Keyboard';
import './App.css';

function createDoc(name = '', textItems = []) {
  return {
    id: Date.now() + Math.random(),
    name,
    textItems,
    cursorIndex: textItems.length,
    history: []
  };
}

function App() {
  const [documents, setDocuments] = useState([createDoc()]);
  const [activeDocId, setActiveDocId] = useState(documents[0].id);

  const [currentStyle, setCurrentStyle] = useState({
    color: '#000000',
    fontSize: '24px'
  });

  const [savedFiles, setSavedFiles] = useState([]);
  const [focusField, setFocusField] = useState('main');
  const [searchChar, setSearchChar] = useState('');
  const [replaceChar, setReplaceChar] = useState('');

  const activeDoc = documents.find(doc => doc.id === activeDocId);

  useEffect(() => {
    setSavedFiles(Object.keys(localStorage));
  }, []);

  const updateActiveDoc = (callback) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === activeDocId ? callback(doc) : doc
      )
    );
  };

  const saveHistory = (doc) => ({
    textItems: doc.textItems,
    cursorIndex: doc.cursorIndex
  });

  const handleKeyClick = (char) => {
    if (focusField === 'search') {
      setSearchChar(char);
      return;
    }

    if (focusField === 'replace') {
      setReplaceChar(char);
      return;
    }

    updateActiveDoc(doc => {
      const updated = [...doc.textItems];
      updated.splice(doc.cursorIndex, 0, { char, ...currentStyle });

      return {
        ...doc,
        textItems: updated,
        cursorIndex: doc.cursorIndex + 1,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  const moveCursorLeft = () => {
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: Math.max(0, doc.cursorIndex - 1)
    }));
  };

  const moveCursorRight = () => {
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: Math.min(doc.textItems.length, doc.cursorIndex + 1)
    }));
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

    updateActiveDoc(doc => {
      if (doc.cursorIndex === 0) return doc;

      const updated = [...doc.textItems];
      updated.splice(doc.cursorIndex - 1, 1);

      return {
        ...doc,
        textItems: updated,
        cursorIndex: doc.cursorIndex - 1,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  const deleteWord = () => {
    updateActiveDoc(doc => {
      if (doc.cursorIndex === 0) return doc;

      const updated = [...doc.textItems];
      let end = doc.cursorIndex;

      while (end > 0 && updated[end - 1]?.char === ' ') end--;

      let start = end;
      while (start > 0 && updated[start - 1]?.char !== ' ') start--;

      updated.splice(start, doc.cursorIndex - start);

      return {
        ...doc,
        textItems: updated,
        cursorIndex: start,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  const clearAll = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: [],
      cursorIndex: 0,
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  const undo = () => {
    updateActiveDoc(doc => {
      if (doc.history.length === 0) return doc;

      const last = doc.history[doc.history.length - 1];

      return {
        ...doc,
        textItems: last.textItems,
        cursorIndex: last.cursorIndex,
        history: doc.history.slice(0, -1)
      };
    });
  };

  const applyStyleToAll = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: doc.textItems.map(item => ({
        ...item,
        color: currentStyle.color,
        fontSize: currentStyle.fontSize
      })),
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  const applyStyleFromCursor = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: doc.textItems.map((item, index) =>
        index >= doc.cursorIndex
          ? { ...item, color: currentStyle.color, fontSize: currentStyle.fontSize }
          : item
      ),
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  const findChar = () => {
    if (!searchChar || !activeDoc) return;

    const chars = activeDoc.textItems.map(item => item.char);
    const index = chars.indexOf(searchChar, activeDoc.cursorIndex + 1);
    const finalIndex = index !== -1 ? index : chars.indexOf(searchChar);

    if (finalIndex === -1) {
      alert('התו לא נמצא');
      return;
    }

    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: finalIndex
    }));

    setFocusField('main');
  };

  const replaceCharOnce = () => {
    if (!searchChar || !replaceChar || !activeDoc) return;

    const chars = activeDoc.textItems.map(item => item.char);
    const index = chars.indexOf(searchChar, activeDoc.cursorIndex);

    if (index === -1) {
      alert('התו לא נמצא');
      return;
    }

    updateActiveDoc(doc => {
      const updated = [...doc.textItems];
      updated[index] = { char: replaceChar, ...currentStyle };

      return {
        ...doc,
        textItems: updated,
        cursorIndex: index + 1,
        history: [...doc.history, saveHistory(doc)]
      };
    });

    setFocusField('main');
  };

  const replaceAllChars = () => {
    if (!searchChar || !replaceChar) return;

    updateActiveDoc(doc => ({
      ...doc,
      textItems: doc.textItems.map(item =>
        item.char === searchChar
          ? { char: replaceChar, ...currentStyle }
          : item
      ),
      history: [...doc.history, saveHistory(doc)]
    }));

    setFocusField('main');
  };

  const createNewDocument = () => {
    const newDoc = createDoc();
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };

  const saveFile = (saveAs = false) => {
    if (!activeDoc) return;

    let name = activeDoc.name;

    if (!name || saveAs) {
      name = prompt('הכנס שם קובץ', activeDoc.name || 'מסמך חדש');
    }

    if (!name) return;

    localStorage.setItem(name, JSON.stringify(activeDoc.textItems));

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === activeDocId ? { ...doc, name } : doc
      )
    );

    setSavedFiles(Object.keys(localStorage));
    alert(`הקובץ "${name}" נשמר בהצלחה`);
  };

  const openFile = (name) => {
  const alreadyOpenDoc = documents.find(doc => doc.name === name);

  if (alreadyOpenDoc) {
    setActiveDocId(alreadyOpenDoc.id);
    setFocusField('main');
    return;
  }

  const data = localStorage.getItem(name);
    if (!data) return;

    const parsed = JSON.parse(data);
    const newDoc = createDoc(name, parsed);

    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setFocusField('main');
  };

  const deleteFile = () => {
    if (!activeDoc?.name) return;

    localStorage.removeItem(activeDoc.name);

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === activeDocId ? { ...doc, name: '' } : doc
      )
    );

    setSavedFiles(Object.keys(localStorage));
  };

  const closeDocument = (docId) => {
    const docToClose = documents.find(doc => doc.id === docId);
    if (!docToClose) return;

    const shouldSave = confirm('האם לשמור את הטקסט לפני סגירה?');

    if (shouldSave) {
      const name = docToClose.name || prompt('הכנס שם קובץ', 'מסמך חדש');
      if (name) {
        localStorage.setItem(name, JSON.stringify(docToClose.textItems));
        setSavedFiles(Object.keys(localStorage));
      }
    }

    const remainingDocs = documents.filter(doc => doc.id !== docId);

    if (remainingDocs.length === 0) {
      const newDoc = createDoc();
      setDocuments([newDoc]);
      setActiveDocId(newDoc.id);
      return;
    }

    setDocuments(remainingDocs);

    if (activeDocId === docId) {
      setActiveDocId(remainingDocs[0].id);
    }
  };

  const renderDocumentText = (doc) => {
    const output = [];

    for (let i = 0; i <= doc.textItems.length; i++) {
      if (doc.id === activeDocId && i === doc.cursorIndex) {
        output.push(<span key={`cursor-${doc.id}-${i}`} className="cursor" />);
      }

      if (i < doc.textItems.length) {
        const item = doc.textItems[i];
        output.push(
          <span
            key={`${doc.id}-${i}`}
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

      <div className="file-info">
        {activeDoc?.name ? `קובץ פעיל: ${activeDoc.name}` : 'קובץ חדש'}
      </div>

      <section className="files-bar">
        <button onClick={createNewDocument}>New</button>

        <button onClick={deleteFile}>Delete File</button>

        <button onClick={() => saveFile(true)}>Save As</button>
 
        <button onClick={() => saveFile(false)} className="active-btn">
          Save
        </button>

        <select value="" onChange={(e) => openFile(e.target.value)}>
          <option value="" disabled>פתח קובץ שמור...</option>
          {savedFiles.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </section>

      <section className="multi-display-area">
        {documents.map(doc => (
          <div
            key={doc.id}
            className={`text-box ${doc.id === activeDocId ? 'active-text-box' : ''}`}
            onClick={() => {
              setActiveDocId(doc.id);
              setFocusField('main');
            }}
          >
            <div className="text-box-header">
              <span>{doc.name || 'קובץ חדש'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeDocument(doc.id);
                }}
              >
                ✕
              </button>
            </div>

            <div className="text-box-body">
              {renderDocumentText(doc)}
            </div>
          </div>
        ))}
      </section>

      <section className="bottom-editor">
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

        <div className="keyboard-center">
          <Keyboard onKeyClick={handleKeyClick} />
        </div>

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