// Toggle password visibility
document.getElementById('togglePw').addEventListener('click', () => {
  const input = document.getElementById('Password');
  const eyeOpen = document.querySelector('.eye-open');
  const eyeClosed = document.querySelector('.eye-closed');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  eyeOpen.style.display = isHidden ? 'none' : '';
  eyeClosed.style.display = isHidden ? '' : 'none';
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

document.getElementById('Encrypt').addEventListener('click', async () => {
  const text = document.getElementById('Text').value;
  const password = document.getElementById('Password').value;
  document.getElementById('Ciphertext').value = await encrypt(text, password);
});

document.getElementById('Decrypt').addEventListener('click', async () => {
  const ciphertext = document.getElementById('Ciphertext').value;
  const password = document.getElementById('Password').value;
  try {
    document.getElementById('Text').value = await decrypt(ciphertext, password);
  } catch {
    document.getElementById('Text').value = '[Decryption failed — wrong passphrase or corrupted ciphertext]';
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

  return btoa(String.fromCharCode(...out));
}

async function decrypt(b64, password) {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
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
