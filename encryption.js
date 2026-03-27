// Toggle password visibility
document.getElementById('togglePw').addEventListener('click', () => {
  const input = document.getElementById('Password');
  const eyeOpen = document.querySelector('.eye-open');
  const eyeClosed = document.querySelector('.eye-closed');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  eyeOpen.style.display = isHidden ? '' : 'none';
  eyeClosed.style.display = isHidden ? 'none' : '';
});

// Copy ciphertext to clipboard
document.getElementById('copyBtn').addEventListener('click', () => {
  const val = document.getElementById('Ciphertext').value;
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.classList.add('copied');
    btn.querySelector('.copy-icon').style.display = 'none';
    btn.querySelector('.check-icon').style.display = '';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('.copy-icon').style.display = '';
      btn.querySelector('.check-icon').style.display = 'none';
    }, 1800);
  });
});

const CHECK_ICON = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const WARN_ICON  = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/></svg>`;

let _toastTimer = null;
let _toastEl = null;

function toast(msg, type = 'success', duration = 3000) {
  clearTimeout(_toastTimer);
  if (_toastEl) { _toastEl.remove(); }

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${type === 'success' ? CHECK_ICON : WARN_ICON}${msg}`;
  document.getElementById('toastContainer').appendChild(el);
  _toastEl = el;

  const dismiss = () => {
    el.classList.add('toast-out');
    el.addEventListener('animationend', () => { if (_toastEl === el) _toastEl = null; el.remove(); }, { once: true });
  };
  _toastTimer = setTimeout(dismiss, duration);
  el.addEventListener('click', () => { clearTimeout(_toastTimer); dismiss(); });
}

document.getElementById('Encrypt').addEventListener('click', async () => {
  const text = document.getElementById('Text').value;
  const password = document.getElementById('Password').value;
  if (!password) { toast('Enter a passphrase before encrypting.', 'error', 4000); return; }
  if (!text) { toast('Enter text to encrypt.', 'error', 4000); return; }
  try {
    document.getElementById('Ciphertext').value = await encrypt(text, password);
    toast('Encrypted');
  } catch {
    toast('Encryption failed — an unexpected error occurred.', 'error', 5000);
  }
});

document.getElementById('Decrypt').addEventListener('click', async () => {
  const ciphertext = document.getElementById('Ciphertext').value;
  const password = document.getElementById('Password').value;
  if (!password) { toast('Enter a passphrase before decrypting.', 'error', 4000); return; }
  if (!ciphertext) { toast('Enter ciphertext to decrypt.', 'error', 4000); return; }
  try {
    document.getElementById('Text').value = await decrypt(ciphertext, password);
    toast('Decrypted');
  } catch {
    toast('Wrong passphrase or corrupted ciphertext.', 'error', 5000);
  }
});


// AES-256-CBC, PBKDF2/SHA-256, 10000 iterations — OpenSSL compatible
// Format: base64("Salted__" + salt[8] + ciphertext)

async function deriveKeyAndIV(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  // Derive 48 bytes: first 32 = AES key, last 16 = IV
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-256' },
    keyMaterial,
    384
  );
  const key = await crypto.subtle.importKey(
    'raw',
    bits.slice(0, 32),
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
  return { key, iv: new Uint8Array(bits.slice(32, 48)) };
}

async function encrypt(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(8));
  const { key, iv } = await deriveKeyAndIV(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    new TextEncoder().encode(text)
  );

  // Assemble: "Salted__" (8 bytes) + salt (8 bytes) + ciphertext
  const out = new Uint8Array(16 + ciphertext.byteLength);
  out.set(new TextEncoder().encode('Salted__'), 0);
  out.set(salt, 8);
  out.set(new Uint8Array(ciphertext), 16);

  // Avoid spread on large typed arrays (stack overflow risk); use a loop instead
  let binary = '';
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  return btoa(binary);
}

async function decrypt(b64, password) {
  const bytes = Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
  // Validate OpenSSL "Salted__" magic header
  const magic = [0x53,0x61,0x6c,0x74,0x65,0x64,0x5f,0x5f];
  if (bytes.length < 16 || !magic.every((b, i) => bytes[i] === b)) {
    throw new Error('Missing Salted__ header');
  }
  const salt = bytes.slice(8, 16);
  const ciphertext = bytes.slice(16);

  const { key, iv } = await deriveKeyAndIV(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
