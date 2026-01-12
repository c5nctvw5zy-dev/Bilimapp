// backend/server.js
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL дерекқор қосылымы
const pool = new Pool({
  user:'postgres',
  host:'localhost',
  database:'bilimapp',
  password:'password',
  port:5432
});

// Пайдаланушы тіркеу
app.post('/register', async (req,res)=>{
  const {role, name, login, password} = req.body;
  const hash = await bcrypt.hash(password,10);
  const result = await pool.query(
    'INSERT INTO users(role,name,login,password) VALUES($1,$2,$3,$4) RETURNING *',
    [role,name,login,hash]
  );
  res.json(result.rows[0]);
});

// Логин
app.post('/login', async(req,res)=>{
  const {login,password} = req.body;
  const user = await pool.query('SELECT * FROM users WHERE login=$1',[login]);
  if(user.rows.length===0) return res.status(400).json({message:'Пайдаланушы табылмады'});
  const valid = await bcrypt.compare(password, user.rows[0].password);
  if(!valid) return res.status(400).json({message:'Қате пароль'});
  res.json({user:user.rows[0]});
});

// Excel арқылы оқушылар импорттау
app.post('/import-students', async(req,res)=>{
  const {students} = req.body;
  for(let s of students){
    await pool.query(
      'INSERT INTO students(jsn,name,class_letter) VALUES($1,$2,$3)',
      [s.jsn,s.name,s.class_letter]
    );
  }
  res.json({message:'Оқушылар импортталды'});
});

// Бағаларды қосу
app.post('/add-grade', async(req,res)=>{
  const {student_id,type,date,score,max_score} = req.body;
  await pool.query(
    'INSERT INTO grades(student_id,type,date,score,max_score) VALUES($1,$2,$3,$4,$5)',
    [student_id,type,date,score,max_score]
  );
  res.json({message:'Баға қосылды'});
});

// Қортынды бағаларды шығару
app.get('/grade-summary/:student_id', async(req,res)=>{
  const {student_id} = req.params;
  const grades = await pool.query('SELECT * FROM grades WHERE student_id=$1',[student_id]);
  let total=0, maxTotal=0;
  grades.rows.forEach(g=>{total+=g.score; maxTotal+=g.max_score});
  const percent = (total/maxTotal)*100;
  let final=2;
  if(percent>=85) final=5;
  else if(percent>=65) final=4;
  else if(percent>=40) final=3;
  else final=2;
  res.json({percent,final});
});

// Серверді бастау
app.listen(5000,()=>console.log('Server started on port 5000'));


///////////////////////////////////////////////////////////
// frontend/src/i18n.js
const translations = {
  kz:{login:'Кіру', password:'Құпия сөз', logout:'Шығу'},
  ru:{login:'Вход', password:'Пароль', logout:'Выйти'},
  en:{login:'Login', password:'Password', logout:'Logout'}
};
export default translations;

///////////////////////////////////////////////////////////
// frontend/src/App.js
import React, { useState } from 'react';
import Login from './components/Login';
import DirectorPanel from './components/DirectorPanel';
import TeacherPanel from './components/TeacherPanel';
import ParentPanel from './components/ParentPanel';
import StudentPanel from './components/StudentPanel';
import i18n from './i18n';

function App() {
  const [user,setUser] = useState(null);
  const [lang,setLang] = useState('kz');

  return (
    <div>
      <header style={{background:'#fff',padding:'10px'}}>
        <button onClick={()=>setLang('kz')}>ҚАЗ</button>
        <button onClick={()=>setLang('ru')}>РУС</button>
        <button onClick={()=>setLang('en')}>ENG</button>
      </header>
      {!user ? (
        <Login setUser={setUser} lang={lang}/>
      ) : (
        <>
        {user.role==='director' && <DirectorPanel user={user} lang={lang} />}
        {user.role==='teacher' && <TeacherPanel user={user} lang={lang} />}
        {user.role==='parent' && <ParentPanel user={user} lang={lang} />}
        {user.role==='student' && <StudentPanel user={user} lang={lang} />}
        </>
      )}
    </div>
  );
}
export default App;

///////////////////////////////////////////////////////////
// frontend/src/components/Login.js
import React, { useState } from 'react';
import translations from '../i18n';
import axios from 'axios';

function Login({setUser,lang}) {
  const [login,setLogin] = useState('');
  const [password,setPassword] = useState('');
  const handleSubmit = async(e)=>{
    e.preventDefault();
    try{
      const res = await axios.post('http://localhost:5000/login',{login,password});
      setUser(res.data.user);
    }catch(err){alert(err.response.data.message);}
  };
  return(
    <div style={{display:'flex',height:'100vh'}}>
      <div style={{background:'#90ee90',flex:1,padding:'20px'}}>
        <h1>BilimApp</h1>
        <p>Мектепті басқару платформасы</p>
      </div>
      <div style={{flex:1,padding:'20px'}}>
        <form onSubmit={handleSubmit}>
          <input placeholder={translations[lang].login} value={login} onChange={e=>setLogin(e.target.value)} /><br/>
          <input type="password" placeholder={translations[lang].password} value={password} onChange={e=>setPassword(e.target.value)} /><br/>
          <button type="submit">{translations[lang].login}</button>
        </form>
      </div>
    </div>
  )
}
export default Login;

///////////////////////////////////////////////////////////
// frontend/src/components/DirectorPanel.js
import React from 'react';
import translations from '../i18n';
function DirectorPanel({user,lang}) {
  return(
    <div>
      <h2>{user.name} - Директор панелі</h2>
      <button>{translations[lang].logout}</button>
      <ul>
        <li>Профиль</li>
        <li>Сыныптар</li>
        <li>Мектепті басқару</li>
        <li>Журнал</li>
        <li>Кесте</li>
        <li>Мектептік сапа</li>
      </ul>
    </div>
  );
}
export default DirectorPanel;

///////////////////////////////////////////////////////////
// frontend/src/components/TeacherPanel.js
import React from 'react';
import translations from '../i18n';
function TeacherPanel({user,lang}) {
  return(
    <div>
      <h2>{user.name} - Мұғалім панелі</h2>
      <button>{translations[lang].logout}</button>
      <ul>
        <li>Профиль</li>
        <li>Менің кестем</li>
        <li>Менің сыныбым</li>
        <li>Журнал (БЖБ/ТЖБ)</li>
        <li>КТЖ / ҚМЖ</li>
        <li>TEMP_ZAVUCH</li>
      </ul>
    </div>
  )
}
export default TeacherPanel;

///////////////////////////////////////////////////////////
// frontend/src/components/ParentPanel.js
import React from 'react';
import translations from '../i18n';
function ParentPanel({user,lang}) {
  return(
    <div>
      <h2>{user.name} - Ата-ана панелі</h2>
      <button>{translations[lang].logout}</button>
      <ul>
        <li>Профиль</li>
        <li>Балаларды басқару</li>
        <li>Шағымдар</li>
        <li>Байланыстар</li>
        <li>Балалардың бағасы</li>
      </ul>
    </div>
  );
}
export default ParentPanel;

///////////////////////////////////////////////////////////
// frontend/src/components/StudentPanel.js
import React from 'react';
import translations from '../i18n';
function StudentPanel({user,lang}) {
  return(
    <div>
      <h2>{user.name} - Оқушы панелі</h2>
      <button>{translations[lang].logout}</button>
      <ul>
        <li>Профиль</li>
        <li>Менің кестем</li>
        <li>Байланыстар</li>
        <li>Менің бағаларым</li>
      </ul>
    </div>
  );
}
export default StudentPanel;
