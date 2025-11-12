// server.js
// CommonJS module
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');
const jwt = require('jsonwebtoken');
const mariadb = require('mariadb');

const app = express();
const port = process.env.PORT || 50000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ========== 설정 (환경변수 권장) ==========
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'zkp_server_user';
const DB_PASS = process.env.DB_PASS || '1111';
const DB_NAME = process.env.DB_NAME || 'zkp_vault';
const VERIF_KEY_PATH = path.join(__dirname, 'config', 'verification_key.json');
// ========================================

// load verification key
let vKey = null;
try {
  vKey = JSON.parse(fs.readFileSync(VERIF_KEY_PATH, 'utf8'));
  console.log('Verification Key loaded.');
} catch (err) {
  console.error('Failed to load verification key:', err.message);
  // continue but login will fail until vKey present
}

// mariadb pool
const pool = mariadb.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  connectionLimit: 5
});
console.log('MariaDB pool ready.');

// ---------- helper: auth middleware ----------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('No token');
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send('No token');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
}

// ---------- endpoints ----------

// GET /api/salt?username=...
app.get('/api/salt', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).send('username required');
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT HEX(salt) as saltHex FROM users WHERE username = ?', [username]);
    if (!rows || rows.length === 0) return res.status(404).send('User not found');
    res.json({ salt: rows[0].saltHex });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/signup
// expects { username, salt, publicVerifier }
app.post('/api/signup', async (req, res) => {
  const { username, salt, publicVerifier } = req.body;
  if (!username || !salt || !publicVerifier) return res.status(400).send('Missing fields');

  let conn;
  try {
    conn = await pool.getConnection();
    // store salt as VARBINARY (UNHEX from hex string)
    const sql = 'INSERT INTO users (username, salt, publicVerifier) VALUES (?, UNHEX(?), ?)';
    await conn.query(sql, [username, salt, publicVerifier]);
    res.status(201).send('OK');
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(400).send('User already exists');
    console.error(err);
    res.status(500).send('Error creating user');
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/login
// expects { username, proof, publicSignals }
app.post('/api/login', async (req, res) => {
  const { username, proof, publicSignals } = req.body;
  if (!username || !proof || !publicSignals) return res.status(400).send('Missing fields');

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT publicVerifier FROM users WHERE username = ?', [username]);
    if (!rows || rows.length === 0) return res.status(404).send('User not found');
    const storedVerifier = rows[0].publicVerifier;
    // first quick check: publicSignals[0] must equal storedVerifier
    if (storedVerifier !== publicSignals[0]) return res.status(401).send('Invalid public signals');

    // verify ZKP
    if (!vKey) return res.status(500).send('Verification key not loaded');
    const ok = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    if (!ok) return res.status(401).send('Invalid proof');

    // issue JWT
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during login');
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/upload (auth required)
// expects { encryptedFileBase64, iv }
app.post('/api/upload', authMiddleware, async (req, res) => {
  const username = req.username;
  const { encryptedFileBase64, iv } = req.body;
  if (!encryptedFileBase64 || !iv) return res.status(400).send('Missing fields');

  const encryptedDataBuffer = Buffer.from(encryptedFileBase64, 'base64');

  let conn;
  try {
    conn = await pool.getConnection();
    // REPLACE INTO to overwrite per-user single-file model
    const sql = `REPLACE INTO files (ownerUsername, iv, encryptedData, uploadedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
    await conn.query(sql, [username, iv, encryptedDataBuffer]);
    res.status(201).json({ message: 'File saved' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading file');
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/download (auth required)
// returns { encryptedFileBase64, iv }
app.get('/api/download', authMiddleware, async (req, res) => {
  const username = req.username;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT iv, encryptedData FROM files WHERE ownerUsername = ?', [username]);
    if (!rows || rows.length === 0) return res.status(404).send('No file uploaded for this user');
    const file = rows[0];
    res.json({
      encryptedFileBase64: file.encryptedData.toString('base64'),
      iv: file.iv
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error downloading file');
  } finally {
    if (conn) conn.release();
  }
});

// start
app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
