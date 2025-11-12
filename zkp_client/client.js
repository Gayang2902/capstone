// client.js
// ESM CLI using zkp.js
import fs from 'fs';
import path from 'path';
import { signup, login, deriveAuthSecretFromSaltHex, SCRYPT_PARAMS } from './zkp.js';

const TOKEN_FILE = path.join(process.cwd(), '.token');
const SERVER_URL = process.env.ZKP_SERVER_URL || 'http://125.140.176.134:50000/api';

async function saveToken(token) {
  fs.writeFileSync(TOKEN_FILE, token, { encoding: 'utf8', mode: 0o600 });
}

function readToken() {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
}

async function uploadFile(filePath) {
  const token = readToken();
  if (!token) throw new Error('먼저 login 하세요.');

  if (!fs.existsSync(filePath)) throw new Error('파일이 존재하지 않습니다.');
  // 실제 제품에서는 filePath의 내용은 이미 로컬에서 암호화된 데이터여야 함.
  const contentBase64 = fs.readFileSync(filePath).toString('base64');

  const res = await fetch(`${SERVER_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ encryptedFileBase64: contentBase64, iv: 'iv-not-used-in-poc' })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed: ${txt}`);
  }
  const j = await res.json();
  console.log('업로드 성공:', j.message || j.fileID || 'OK');
}

async function downloadFile(savePath) {
  const token = readToken();
  if (!token) throw new Error('먼저 login 하세요.');

  const res = await fetch(`${SERVER_URL}/download`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Download failed: ${txt}`);
  }
  const j = await res.json();
  const buf = Buffer.from(j.encryptedFileBase64, 'base64');
  fs.writeFileSync(savePath, buf, { mode: 0o600 });
  console.log('다운로드 성공:', savePath);
}

async function main() {
  const [,, cmd, ...args] = process.argv;
  try {
    switch (cmd) {
      case 'signup': {
        const [username, password] = args;
        if (!username || !password) throw new Error('사용법: signup <username> <password>');
        const res = await signup(username, password);
        console.log('회원가입 성공:', res);
        break;
      }
      case 'login': {
        const [username, password] = args;
        if (!username || !password) throw new Error('사용법: login <username> <password>');
        const token = await login(username, password);
        await saveToken(token);
        console.log('로그인 성공. 토큰 저장됨 (.token)');
        break;
      }
      case 'upload': {
        const [filePath] = args;
        if (!filePath) throw new Error('사용법: upload <file_path>');
        await uploadFile(filePath);
        break;
      }
      case 'download': {
        const [savePath] = args;
        if (!savePath) throw new Error('사용법: download <save_path>');
        await downloadFile(savePath);
        break;
      }
      default:
        console.log(`사용법:
  node client.js signup <username> <password>
  node client.js login <username> <password>
  node client.js upload <file_path>
  node client.js download <save_path>`);
    }
  } catch (err) {
    console.error('❌ 오류:', err.message);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.cwd()}/client.js` || process.argv[1].endsWith('client.js')) {
  main();
}
