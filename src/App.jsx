import { useState } from 'react';
import Keyboard from './components/Keyboard';
import './App.css';
// Helper function to create a new document object
function createDoc(name = '', textItems = []) {
  return {
    id: Date.now() + Math.random(),
    name,
    textItems,
    cursorIndex: textItems.length,
    history: []
  };
}
// Main App component
function App() {
  const [documents, setDocuments] = useState([createDoc()]);  // Start with one empty document
  const [activeDocId, setActiveDocId] = useState(documents[0].id);  // State for text styling

  // State for user management and file handling
  const [currentStyle, setCurrentStyle] = useState({
    color: '#000000',
    fontSize: '24px',
    fontFamily: 'Arial'
  });

  const [savedFiles, setSavedFiles] = useState([]);  // List of saved files for the active user
  const [focusField, setFocusField] = useState('main');  // 'main', 'search', or 'replace'
  const [searchChar, setSearchChar] = useState('');  // Character to search for
  const [replaceChar, setReplaceChar] = useState('');  // Character to replace with

  // State for user authentication
  const [activeUser, setActiveUser] = useState(localStorage.getItem('activeUser') || '');  // User ID in format "username_password"  
  const [username, setUsername] = useState(localStorage.getItem('displayUser') || '');  // Display name for the user
  const [password, setPassword] = useState('');  // Password input state

  const activeDoc = documents.find(doc => doc.id === activeDocId);  // Get the currently active document

  const getUserId = (name, pass) => `${name}_${pass}`;  // Helper function to generate a user ID based on username and password

  const getFileKey = (name) => `file_${activeUser}_${name}`;  // Helper function to generate a localStorage key for a given file name and active user

  // Function to retrieve the list of files saved by the active user
  const getUserFiles = () => {
    if (!activeUser) return [];

    return Object.keys(localStorage)
      .filter(key => key.startsWith(`file_${activeUser}_`))
      .map(key => key.replace(`file_${activeUser}_`, ''));
  };

  // Function to update the active document with a given callback that modifies the document
  const updateActiveDoc = (callback) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === activeDocId ? callback(doc) : doc
      )
    );
  };

  // Function to save the current state of the document for undo functionality
  const saveHistory = (doc) => ({
    textItems: doc.textItems,
    cursorIndex: doc.cursorIndex
  });

  // Handler for when a key is clicked on the virtual keyboard
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
      updated.splice(doc.cursorIndex, 0, { char, ...currentStyle });  // Insert the new character at the cursor position

      return {
        ...doc,
        textItems: updated,
        cursorIndex: doc.cursorIndex + 1,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  // Functions to move the cursor left and right within the text
  const moveCursorLeft = () => {
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: Math.max(0, doc.cursorIndex - 1)  // Ensure cursor doesn't go below 0
    }));
  };

  // Function to move the cursor right
  const moveCursorRight = () => {
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: Math.min(doc.textItems.length, doc.cursorIndex + 1)  // Ensure cursor doesn't go beyond the text length
    }));
  };

  // Function to delete a single character before the cursor
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
      updated.splice(doc.cursorIndex - 1, 1);  // Remove the character before the cursor

      return {
        ...doc,
        textItems: updated,
        cursorIndex: doc.cursorIndex - 1,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  // Function to delete an entire word before the cursor
  const deleteWord = () => {
    updateActiveDoc(doc => {
      if (doc.cursorIndex === 0) return doc;

      const updated = [...doc.textItems];
      let end = doc.cursorIndex;

      while (end > 0 && updated[end - 1]?.char === ' ') end--;  // Skip any trailing spaces before the word to delete

      let start = end;
      while (start > 0 && updated[start - 1]?.char !== ' ') start--;  // Find the start of the word to delete

      updated.splice(start, doc.cursorIndex - start); // Remove the word from the text and any spaces before it

      return {
        ...doc,
        textItems: updated,
        cursorIndex: start,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  // Function to clear all text from the document
  const clearAll = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: [],
      cursorIndex: 0,
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  // Function to undo the last change made to the document by reverting to the previous state saved in the history
  const undo = () => {
    updateActiveDoc(doc => {
      if (doc.history.length === 0) return doc;

      const last = doc.history[doc.history.length - 1];

      return {
        ...doc,
        textItems: last.textItems,
        cursorIndex: last.cursorIndex,
        history: doc.history.slice(0, -1)  // Remove the last history entry after undoing
      };
    });
  };

  // Function to apply the current text styling to all characters in the document
  const applyStyleToAll = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: doc.textItems.map(item => ({
        ...item,
        color: currentStyle.color,
        fontSize: currentStyle.fontSize,
        fontFamily: currentStyle.fontFamily
      })),
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  // Function to apply the current text styling to all characters from the cursor position onward
  const applyStyleFromCursor = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: doc.textItems.map((item, index) =>
        index >= doc.cursorIndex  // Only apply the style to characters at or after the cursor position
          ? { 
            ...item, 
            color: currentStyle.color, 
            fontSize: currentStyle.fontSize, 
            fontFamily: currentStyle.fontFamily } : item
      ),
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  // Function to find the next occurrence of the search character in the document, starting from the cursor position
  const findChar = () => {
    if (!searchChar) return;

    const chars = activeDoc.textItems.map(item => item.char);
    const index = chars.indexOf(searchChar, activeDoc.cursorIndex + 1);  // Start searching from the position right after the current cursor index
    const finalIndex = index !== -1 ? index : chars.indexOf(searchChar);  // If not found ahead, wrap around and search from the beginning of the text

    if (finalIndex === -1) {
      alert('התו לא נמצא');
      return;
    }

    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: finalIndex  // Move the cursor to the found character
    }));

    setFocusField('main');
  };

  // Function to replace the next occurrence of the search character with the replace character, starting from the cursor position
  const replaceCharOnce = () => {
    if (!searchChar || !replaceChar) return;

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

  // Function to replace all occurrences of the search character with the replace character throughout the entire document
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

  // Function to create a new document and set it as the active document
  const createNewDocument = () => {
    const newDoc = createDoc();
    setDocuments(prev => [...prev, newDoc]); 
    setActiveDocId(newDoc.id);
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };

  // Function to save the current document to localStorage, with an option to prompt for a new name (Save As)
  const saveFile = (saveAs = false) => {

    let name = activeDoc.name;

    if (!name || saveAs) {
      name = prompt('הכנס שם קובץ', activeDoc.name || 'מסמך חדש');
    }

    if (!name) return;

    localStorage.setItem(getFileKey(name), JSON.stringify(activeDoc.textItems))

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === activeDocId ? { ...doc, name } : doc
      )
    );

    setSavedFiles(getUserFiles());
    alert(`הקובץ "${name}" נשמר בהצלחה`);
  };

  // Function to open a saved file from localStorage and set it as the active document
  const openFile = (name) => {
    const alreadyOpenDoc = documents.find(doc => doc.name === name);

    if (alreadyOpenDoc) {
      setActiveDocId(alreadyOpenDoc.id);
      setFocusField('main');
      return;
    }
 
    const data = localStorage.getItem(getFileKey(name));
    if (!data) {
      alert('הקובץ לא נמצא');
      return;
    }

    const parsed = JSON.parse(data);
    const newDoc = createDoc(name, parsed);

    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setFocusField('main');
  };

  // Function to delete the currently active file after confirming with the user
  const deleteFile = () => {
    
    const confirmDelete = confirm(`האם את בטוחה שברצונך למחוק את הקובץ "${activeDoc.name}"?`);
    if (!confirmDelete) return;

    localStorage.removeItem(getFileKey(activeDoc.name));

    const remainingDocs = documents.filter(doc => doc.id !== activeDocId);

    if (remainingDocs.length === 0) {
      const newDoc = createDoc();
      setDocuments([newDoc]);
      setActiveDocId(newDoc.id);
    } else {
      setDocuments(remainingDocs);
      setActiveDocId(remainingDocs[0].id);
    }

    setSavedFiles(getUserFiles());
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };

// Function to close a document, prompting the user to save if there are unsaved changes, and then removing it from the list of open documents
  const closeDocument = (docId) => {
    const docToClose = documents.find(doc => doc.id === docId);
    if (!docToClose) return;

    const shouldSave = confirm('האם לשמור את הטקסט לפני סגירה?');

    if (shouldSave) {
      const name = docToClose.name || prompt('הכנס שם קובץ', 'מסמך חדש');
      if (name) {
        localStorage.setItem(getFileKey(name), JSON.stringify(docToClose.textItems));
        setSavedFiles(getUserFiles());
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
// Function to render the text of a document, including the cursor at the correct position and applying the appropriate styles to each character
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
            style={{color: item.color, fontSize: item.fontSize, fontFamily: item.fontFamily}}          >
            {item.char}
          </span>
        );
      }
    }

    return output;
  };
  
// Function to log out the current user, prompting to save any unsaved documents, and then clearing the user state and returning to the login screen
  const logout = () => {
    const shouldSave = confirm('האם לשמור את כל השינויים לפני התנתקות?');

    if (shouldSave) {
      documents.forEach((doc, index) => {
        if (doc.textItems.length === 0) return;

        const name = doc.name || `מסמך_${index + 1}`;

        localStorage.setItem(
          getFileKey(name),
          JSON.stringify(doc.textItems)
        );
      });

      setSavedFiles(getUserFiles());
      alert('כל הקבצים הלא ריקים נשמרו בהצלחה');
    }

    const newDoc = createDoc();

    localStorage.removeItem('activeUser');
    localStorage.removeItem('displayUser');

    setActiveUser('');
    setUsername('');
    setPassword('');
    setDocuments([newDoc]);
    setActiveDocId(newDoc.id);
    setSavedFiles([]);
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };
// If there is no active user, render the login screen
  if (!activeUser) {
    return (
      <div className="app-container">
        <h1>Visual Text Editor</h1>

        <section className="login-box">
          <h2>כניסת משתמש</h2>

          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={() => {
              const name = username.trim();
              const pass = password.trim();

              if (!name || !pass) {
                alert('יש להזין שם משתמש וסיסמה');
                return;
              }

              const userId = getUserId(name, pass);

              localStorage.setItem('activeUser', userId);
              localStorage.setItem('displayUser', name);
              setActiveUser(userId);
              setUsername(name);
              setSavedFiles(
                Object.keys(localStorage)
                  .filter(key => key.startsWith(`file_${userId}_`))
                  .map(key => key.replace(`file_${userId}_`, ''))
              );
              setPassword('');
            }}
          >
            כניסה / יצירת משתמש
          </button>
        </section>
      </div>
    );
  }
// If there is an active user, render the main text editor interface
  return (
    <div className="app-container">
      <h1>Visual Text Editor</h1>
     <div className="user-info">
        משתמש פעיל: {username}

        <button onClick={logout} >
          התנתקות
        </button>
      </div>
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
            <label>גופן:</label>
            <select
              value={currentStyle.fontFamily}
              onChange={(e) =>
                setCurrentStyle({ ...currentStyle, fontFamily: e.target.value })
              }
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
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