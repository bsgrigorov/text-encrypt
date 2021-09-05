# Encryption site
This is a simple site for encrypting any text data like passwords, credit card info, personal info, crypto keys, etc.

## Encryption specifics

| Specs | |
| - | - |
| Algorithm | AES256-CBC-PBKDF2|
| Standard | AES |
| Type | CBC |
| Size of key | 256 bits |
| Size of salt | 8 bytes |
| KDF (Key derivation function)| PBKDF2 |


Libraries used: CryptoJS


## Running
Open site.html
Note: NodeJS scripts are for testing only.

### Encrypt
Enter `Text` and `Password`, select `Encrypt`

### Decrypt
Enter `Cipher Text` and `Password`, select `Decrypt`

# OpenSSL compatibility
This is compatible encryption with OpenSSL aes-256-cbc -pbkdf2

## Encrypt
```
echo -n "my-text" | openssl aes-256-cbc -a -p -pbkdf2 --pass pass:"my-password" 
```

## Decrypt
Enter cipher text after echo
```
echo "U2FsdGVkX1/ybPS+ooh2sZDbd8mC0toqkvhcXhlpRIw=" | openssl aes-256-cbc -a -p -pbkdf2 --pass pass:"my-password" 
```

You can remove --pass flag and get a prompt for the password instead.