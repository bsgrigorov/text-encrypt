
document.getElementById('Encrypt').addEventListener('click', () => {
  var text = document.getElementById("Text").value;
  var password = document.getElementById("Password").value;
  document.getElementById('Ciphertext').value = encrypt(text, password);
});

document.getElementById('Decrypt').addEventListener('click', () => {
  var ciphertext = document.getElementById("Ciphertext").value;
  var password = document.getElementById("Password").value;
  document.getElementById('Text').value = decrypt(ciphertext, password);
});
  
  

// AES 256, CBC, with salt, PBKDF2
function decrypt(ciphertext, password) {
  // 1. Separate ciphertext and salt
  // var encrypted = "U2FsdGVkX18BI0VniavN78vlhR6fryIan0VvUrdIr+YeLkDYhO2xyA+/oVXJj/c35swVVkCqHPh9VdRbNQG6NQ=="
  // var encrypted = "U2FsdGVkX1+Kz6cxWgtyStTfNbPsv8kQOm0Z2ZYNuY8="
  var ciphertextWA = CryptoJS.enc.Base64.parse(ciphertext);
  var prefixWA = CryptoJS.lib.WordArray.create(ciphertextWA.words.slice(0, 8/4));                             // Salted__ prefix
  var saltWA = CryptoJS.lib.WordArray.create(ciphertextWA.words.slice(8/4, 16/4));                            // 8 bytes salt: 0x0123456789ABCDEF
  var ciphertextWA = CryptoJS.lib.WordArray.create(ciphertextWA.words.slice(16/4, ciphertextWA.words.length)); // ciphertext        

  console.log()
  console.log(prefixWA.toString())
  console.log(saltWA.toString())
  console.log(ciphertextWA.toString())

  // 2. Determine key and IV using PBKDF2
  var keyIvWA = CryptoJS.PBKDF2(
    password, 
    saltWA, 
    {
        keySize: (32+16)/4,          // key 8 bytes and IV 4 bytes 
        iterations: 10000,
        hasher: CryptoJS.algo.SHA256
    }
  );
  var keyWA = CryptoJS.lib.WordArray.create(keyIvWA.words.slice(0, 32/4));
  var ivWA = CryptoJS.lib.WordArray.create(keyIvWA.words.slice(32/4, (32+16)/4));

  // 3. Decrypt
  var decryptedWA = CryptoJS.AES.decrypt(
    {ciphertext: ciphertextWA}, 
    keyWA, 
    {iv: ivWA}
  );
  var decrypted = decryptedWA.toString(CryptoJS.enc.Utf8)
  return decrypted

}

function encrypt(text, password) {
  // var prefixWA = CryptoJS.enc.Hex.parse("53616c7465645f5f") // Hex for "Salted__"
  var prefixWA = CryptoJS.enc.Utf8.parse("Salted__") // Hex is "53616c7465645f5f"
  var saltWA = CryptoJS.lib.WordArray.random(64 / 8);


  var key = CryptoJS.PBKDF2(
    password, 
    saltWA,
    {
        keySize: (32+16)/4,          // key and IV
        iterations: 10000,
        hasher: CryptoJS.algo.SHA256
    }
  );
  var keyWA = CryptoJS.lib.WordArray.create(key.words.slice(0, 32/4));
  var ivWA = CryptoJS.lib.WordArray.create(key.words.slice(32/4, (32+16)/4));

  // Encrypt
  var ciphertext = CryptoJS.AES.encrypt(text, keyWA, {
    iv: ivWA,
    padding: CryptoJS.pad.Pkcs7
  });

  var cipherWA = CryptoJS.lib.WordArray.create(ciphertext.ciphertext.words);
  var opensslCiphertextWA = prefixWA.concat(saltWA).concat(cipherWA)

  return opensslCiphertextWA.toString(CryptoJS.enc.Base64)
} 
  