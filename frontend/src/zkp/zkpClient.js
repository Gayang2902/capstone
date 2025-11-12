const snarkjs = require('snarkjs');
const circomlibjs = require('circomlibjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_SERVER_URL = process.env.ZKP_SERVER_URL || 'http://125.140.176.134:50000/api';
const ASSET_DIR = process.env.ZKP_ASSET_DIR || path.join(__dirname, '..', '..', 'zkp_assets');
const WASM_PATH = process.env.ZKP_WASM_PATH || path.join(ASSET_DIR, 'auth.wasm');
const ZKEY_PATH = process.env.ZKP_ZKEY_PATH || path.join(ASSET_DIR, 'circuit_final.zkey');

const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, dkLen: 32 };

let poseidonInstance = null;
let poseidonReadyPromise = null;
let fetchImpl = typeof fetch === 'function' ? fetch : null;
let blakeFallback = null;
let blakeAvailable = true;

try {
  crypto.createHash('blake2b512');
} catch (error) {
  blakeAvailable = false;
}

const state = {
  token: null,
  serverUrl: DEFAULT_SERVER_URL
};

function setToken(token) {
  state.token = token;
}

function getToken() {
  return state.token;
}

function setServerUrl(url) {
  if (url) {
    state.serverUrl = url;
  }
}

function getServerUrl() {
  return state.serverUrl;
}

async function getPoseidon() {
  if (poseidonInstance) return poseidonInstance;
  if (!poseidonReadyPromise) {
    poseidonReadyPromise = circomlibjs.buildPoseidon().then((poseidon) => {
      poseidonInstance = poseidon;
      return poseidonInstance;
    });
  }
  return poseidonReadyPromise;
}

async function ensureFetch() {
  if (fetchImpl) return fetchImpl;
  const mod = await import('node-fetch');
  fetchImpl = mod.default || mod;
  return fetchImpl;
}

function deriveScryptSync(password, salt, params = {}) {
  const {
    N = SCRYPT_PARAMS.N,
    r = SCRYPT_PARAMS.r,
    p = SCRYPT_PARAMS.p,
    dkLen = SCRYPT_PARAMS.dkLen,
    maxmem = 256 * 1024 * 1024
  } = params;

  return crypto.scryptSync(password, salt, dkLen, { N, r, p, maxmem });
}

function ensureBlakeFallback() {
  if (!blakeFallback) {
    // eslint-disable-next-line global-require
    const { blake2b } = require('blakejs');
    blakeFallback = (data) => Buffer.from(blake2b(data, undefined, 64));
  }
  return blakeFallback;
}

function blake2b256(keyMaterial, domain = 'ZKP-AUTH') {
  const payload = Buffer.concat([
    Buffer.isBuffer(keyMaterial) ? keyMaterial : Buffer.from(keyMaterial),
    Buffer.from(domain, 'utf8')
  ]);

  if (blakeAvailable) {
    try {
      const hash = crypto.createHash('blake2b512');
      hash.update(payload);
      return hash.digest().slice(0, 32);
    } catch (error) {
      blakeAvailable = false;
    }
  }

  const fallback = ensureBlakeFallback();
  const out = fallback(payload);
  return out.slice(0, 32);
}

function leBufToBigInt(buffer) {
  let value = 0n;
  for (let i = 0; i < buffer.length; i++) {
    value += BigInt(buffer[i]) << (8n * BigInt(i));
  }
  return value;
}

function hexLeToBigInt(hexStr) {
  return leBufToBigInt(Buffer.from(hexStr, 'hex'));
}

async function poseidonHashTwo(saltBigInt, authSecretBigInt) {
  const poseidon = await getPoseidon();
  const res = poseidon([saltBigInt, authSecretBigInt]);
  const out = poseidon.F.toObject(res);
  return BigInt(out.toString());
}

function deriveAuthSecretFromSaltHex(password, saltHex, scryptParams = {}) {
  const salt = Buffer.from(saltHex, 'hex');
  const k = deriveScryptSync(password, salt, scryptParams);
  const authKey = blake2b256(k, 'ZKP-AUTH');
  const authSecretBigInt = leBufToBigInt(authKey);
  const authSecretHexLE = authKey.toString('hex');
  k.fill(0);
  return { authKey, authSecretBigInt, authSecretHexLE };
}

async function httpFetchJson(url, opts) {
  const fetchFn = await ensureFetch();
  return fetchFn(url, opts);
}

async function signup(username, password, options = {}) {
  const { saltBytes = 16, scryptParams = SCRYPT_PARAMS } = options;
  if (!username || !password) {
    throw new Error('username and password required');
  }

  const saltBuf = crypto.randomBytes(saltBytes);
  const saltHex = saltBuf.toString('hex');

  const { authSecretBigInt } = deriveAuthSecretFromSaltHex(password, saltHex, scryptParams);
  const saltBigInt = leBufToBigInt(saltBuf);
  const publicVerifierBigInt = await poseidonHashTwo(saltBigInt, authSecretBigInt);
  const publicVerifier = publicVerifierBigInt.toString();

  const res = await httpFetchJson(`${state.serverUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, salt: saltHex, publicVerifier })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Signup failed: ${txt}`);
  }
  return res.text();
}

async function getSaltForUser(username) {
  const res = await httpFetchJson(`${state.serverUrl}/salt?username=${encodeURIComponent(username)}`, {
    method: 'GET'
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to get salt: ${txt}`);
  }
  const payload = await res.json();
  if (!payload.salt) {
    throw new Error('Server did not return salt');
  }
  console.log(`[ZKP] salt for ${username}: ${payload.salt}`);
  // console.log(publicVerifierBigInt.toString());
  return payload.salt;
}

async function login(username, password, options = {}) {
  const { scryptParams = SCRYPT_PARAMS } = options;
  if (!username || !password) {
    throw new Error('username and password required');
  }

  const saltHex = await getSaltForUser(username);
  const { authSecretBigInt } = deriveAuthSecretFromSaltHex(password, saltHex, scryptParams);

  const saltBuf = Buffer.from(saltHex, 'hex');
  const saltBigInt = leBufToBigInt(saltBuf);

  const inputs = {
    authSecret: authSecretBigInt.toString(),
    salt: saltBigInt.toString()
  };

  if (!fs.existsSync(WASM_PATH) || !fs.existsSync(ZKEY_PATH)) {
    throw new Error('WASM or ZKEY file not found; ensure assets are available');
  }

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, WASM_PATH, ZKEY_PATH);

  const res = await httpFetchJson(`${state.serverUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, proof, publicSignals })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login failed: ${txt}`);
  }
  const payload = await res.json();
  if (!payload.token) {
    throw new Error('Server did not return token');
  }
  setToken(payload.token);
  return payload.token;
}

async function uploadFile(filePath) {
  if (!state.token) {
    throw new Error('먼저 로그인하세요.');
  }
  if (!filePath) {
    throw new Error('파일 경로가 필요합니다.');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error('파일이 존재하지 않습니다.');
  }

  const contentBase64 = fs.readFileSync(filePath).toString('base64');
  const res = await httpFetchJson(`${state.serverUrl}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`
    },
    body: JSON.stringify({ encryptedFileBase64: contentBase64, iv: 'iv-not-used-in-poc' })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed: ${txt}`);
  }
  return res.json();
}

async function downloadFile(savePath) {
  if (!state.token) {
    throw new Error('먼저 로그인하세요.');
  }
  if (!savePath) {
    throw new Error('저장 경로가 필요합니다.');
  }

  const res = await httpFetchJson(`${state.serverUrl}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Download failed: ${txt}`);
  }
  const payload = await res.json();
  if (!payload.encryptedFileBase64) {
    throw new Error('다운로드 데이터가 비어 있습니다.');
  }
  const buffer = Buffer.from(payload.encryptedFileBase64, 'base64');
  fs.writeFileSync(savePath, buffer, { mode: 0o600 });
  return { path: savePath };
}

module.exports = {
  signup,
  login,
  uploadFile,
  downloadFile,
  getToken,
  setToken,
  setServerUrl,
  getServerUrl,
  deriveAuthSecretFromSaltHex
};
