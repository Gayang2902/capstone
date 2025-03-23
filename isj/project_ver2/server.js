const express = require('express');
const bodyParser = require('body-parser');
const { execFile } = require('child_process');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = 3000;

// 고정된 KEY, IV (실제 서비스에서는 사용자별로 관리 필요)
const KEY = '2b7e151628aed2a6abf719889cf4ab12';
const IV  = '0f470e7f759c470f42c6d39cbc8e2325';

app.use(bodyParser.json());
app.use(express.static('public'));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1111',
  database: 'encryption_db'
};

app.post('/encrypt', async (req, res) => {
  const { id, pw, url } = req.body;
  if (!id || !pw || !url) return res.status(400).json({ message: '필수 입력값 누락' });

  const args = [id, pw, url, KEY, IV];

  execFile('encrypt.exe', args, async (err, stdout) => {
    if (err) {
      console.error('암호화 실패:', err);
      return res.status(500).json({ message: '암호화 실패' });
    }

    const encryptedHex = stdout.trim();

    console.log("암호화 결과:", encryptedHex); 

    try {
      const conn = await mysql.createConnection(dbConfig);
      await conn.execute(
        'INSERT INTO encrypted_data (id_plain, encrypted) VALUES (?, ?)',
        [id, encryptedHex]
      );
      await conn.end();
      res.json({ message: '암호화 후 저장 성공!' });
    } catch (dbErr) {
      console.error('DB 오류:', dbErr);
      res.status(500).json({ message: 'DB 저장 실패' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
