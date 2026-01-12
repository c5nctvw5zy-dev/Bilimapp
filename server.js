const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL дерекқорына қосылу
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'bilimapp',
    password: 'password',
    port: 5432,
});

// Пайдаланушы тіркеу
app.post('/register', async (req, res) => {
    const { role, name, login, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users(role, name, login, password) VALUES($1,$2,$3,$4) RETURNING *',
        [role, name, login, hash,]
    );
    res.json(result.rows[0]);
});

// Логин
app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE login=$1', [login]);
    if(user.rows.length === 0) return res.status(400).json({message:'Пайдаланушы табылмады'});
    const valid = await bcrypt.compare(password, user.rows[0].password);
    if(!valid) return res.status(400).json({message:'Қате пароль'});
    res.json({user: user.rows[0]});
});

// Excel арқылы оқушыларды импорттау (Post)
app.post('/import-students', async (req, res) => {
    const { students } = req.body; // JSON форматында: [{jshn,name,class_letter},...]
    for(let s of students){
        await pool.query('INSERT INTO students(jsn, name, class_letter) VALUES($1,$2,$3)', [s.jsn, s.name, s.class_letter]);
    }
    res.json({message:'Оқушылар импортталды'});
});

// Мұғалімнің бағаларды қосуы
app.post('/add-grade', async (req,res)=>{
    const {student_id, type, date, score, max_score} = req.body;
    await pool.query(
        'INSERT INTO grades(student_id, type, date, score, max_score) VALUES($1,$2,$3,$4,$5)',
        [student_id,type,date,score,max_score]
    );
    res.json({message:'Баға қосылды'});
});

// Жүйе автоматты қортынды есептеу
app.get('/grade-summary/:student_id', async (req,res)=>{
    const {student_id} = req.params;
    const grades = await pool.query('SELECT * FROM grades WHERE student_id=$1', [student_id]);
    let total=0, maxTotal=0;
    grades.rows.forEach(g=>{total+=g.score; maxTotal+=g.max_score});
    const percent = (total/maxTotal)*100;
    let final=2;
    if(percent>=85) final=5;
    else if(percent>=65) final=4;
    else if(percent>=40) final=3;
    else final=2;
    res.json({percent, final});
});

// Серверді бастау
app.listen(5000,()=>console.log('Server started on port 5000'));
