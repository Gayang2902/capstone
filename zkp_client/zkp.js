// zkp.js
// ESM module for Node/Electron (main process)
// Exports: signup(username,password), login(username,password), deriveAuthSecretFromSaltHex
import * as snarkjs from 'snarkjs';
import * as circomlibjs from 'circomlibjs';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ============ 설정 (필요 시 경로/URL 수정) ============
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const WASM_PATH = path.join(__dirname, 'zkp_assets', 'auth.wasm');
export const ZKEY_PATH = path.join(__dirname, 'zkp_assets', 'circuit_final.zkey');
export const SERVER_URL = process.env.ZKP_SERVER_URL || 'http://125.140.176.134:50000/api';

// scrypt 기본 파라미터 (필요 시 조정)
export const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, dkLen: 32 };
// =====================================================

// Poseidon 초기화
let __poseidon = null;
let __poseidonReady = (async () => {
  __poseidon = await circomlibjs.buildPoseidon();
})();

async function getPoseidon() {
  if (!__poseidon) await __poseidonReady;
  return __poseidon;
}

// ----------------- KDF / 해시 헬퍼 -----------------
export function deriveScryptSync(password, salt, params = {}) {
  const { N = SCRYPT_PARAMS.N, r = SCRYPT_PARAMS.r, p = SCRYPT_PARAMS.p, dkLen = SCRYPT_PARAMS.dkLen } = params;
  // Node의 scryptSync 사용 (옵션 객체로 N,r,p 전달)
  return crypto.scryptSync(password, salt, dkLen, { N, r, p });
}

export function blake2b256(k, domain = 'ZKP-AUTH') {
  const h = crypto.createHash('blake2b512');
  h.update(k);
  h.update(Buffer.from(domain, 'utf8'));
  return h.digest().slice(0, 32);
}

export function leBufToBigInt(buf) {
  let v = 0n;
  for (let i = 0; i < buf.length; i++) v += BigInt(buf[i]) << (8n * BigInt(i));
  return v;
}

export function hexLeToBigInt(hexStr) {
  return leBufToBigInt(Buffer.from(hexStr, 'hex'));
}

// ----------------- Poseidon 헬퍼 -----------------
export async function poseidonHashTwo(saltBigInt, authSecretBigInt) {
  const poseidon = await getPoseidon();
  const res = poseidon([saltBigInt, authSecretBigInt]);
  const out = poseidon.F.toObject(res);
  return BigInt(out.toString());
}

// ----------------- high-level pipeline -----------------
export function deriveAuthSecretFromSaltHex(password, saltHex, scryptParams = {}) {
  const salt = Buffer.from(saltHex, 'hex');
  const k = deriveScryptSync(password, salt, scryptParams);
  const authKey = blake2b256(k, 'ZKP-AUTH'); // Buffer(32)
  const authSecretBigInt = leBufToBigInt(authKey);
  const authSecretHexLE = authKey.toString('hex'); // little-endian hex
  k.fill(0);
  return { authKey, authSecretBigInt, authSecretHexLE };
}

// ----------------- 서버 상호작용 -----------------
async function httpFetchJson(url, opts) {
  const res = await fetch(url, opts);
  return res;
}

/**
 * signup: client generates salt and publicVerifier and sends to server
 * server should accept { username, salt, publicVerifier }
 */
export async function signup(username, password, options = {}) {
  const { saltBytes = 16, scryptParams = SCRYPT_PARAMS } = options;
  if (!username || !password) throw new Error('username and password required');

  const saltBuf = crypto.randomBytes(saltBytes);
  const saltHex = saltBuf.toString('hex');

  const { authSecretBigInt } = deriveAuthSecretFromSaltHex(password, saltHex, scryptParams);
  const saltBigInt = leBufToBigInt(saltBuf);
  const publicVerifierBigInt = await poseidonHashTwo(saltBigInt, authSecretBigInt);
  const publicVerifier = publicVerifierBigInt.toString();

  const res = await httpFetchJson(`${SERVER_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, salt: saltHex, publicVerifier })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Signup failed: ${txt}`);
  }
  return await res.text();
}

/** get salt for username (hex) */
export async function getSaltForUser(username) {
  const res = await httpFetchJson(`${SERVER_URL}/salt?username=${encodeURIComponent(username)}`, { method: 'GET' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to get salt: ${txt}`);
  }
  const j = await res.json();
  if (!j.salt) throw new Error('Server did not return salt');
  return j.salt;
}

/**
 * login: fullProve -> send proof + publicSignals -> receive token
 */
export async function login(username, password, options = {}) {
  const { scryptParams = SCRYPT_PARAMS } = options;
  if (!username || !password) throw new Error('username and password required');

  const saltHex = await getSaltForUser(username);
  const { authSecretBigInt } = deriveAuthSecretFromSaltHex(password, saltHex, scryptParams);

  const saltBuf = Buffer.from(saltHex, 'hex');
  const saltBigInt = leBufToBigInt(saltBuf);

  const inputs = {
    authSecret: authSecretBigInt.toString(),
    salt: saltBigInt.toString()
  };

  if (!fs.existsSync(WASM_PATH) || !fs.existsSync(ZKEY_PATH)) {
    throw new Error('WASM or ZKEY file not found; ensure WASM_PATH and ZKEY_PATH are correct');
  }

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, WASM_PATH, ZKEY_PATH);

  const res = await httpFetchJson(`${SERVER_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, proof, publicSignals })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login failed: ${txt}`);
  }
  const j = await res.json();
  if (!j.token) throw new Error('Server did not return token');
  return j.token;
}
