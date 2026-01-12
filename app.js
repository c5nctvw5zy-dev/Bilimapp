import React, { useState } from 'react';
import Login from './components/Login';
import DirectorPanel from './components/DirectorPanel';
import TeacherPanel from './components/TeacherPanel';
import i18n from './i18n';

function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('kz');

  return (
    <div>
      <header style={{background:'#fff', padding:'10px'}}>
        <button onClick={()=>setLang('kz')}>ҚАЗ</button>
        <button onClick={()=>setLang('ru')}>РУС</button>
        <button onClick={()=>setLang('en')}>ENG</button>
      </header>

      {!user ? (
        <Login setUser={setUser} lang={lang}/>
      ) : (
        user.role==='director' ? <DirectorPanel user={user} lang={lang} /> :
        user.role==='teacher' ? <TeacherPanel user={user} lang={lang} /> :
        <div>Панель әзірленуде</div>
      )}
    </div>
  );
}

export default App;
