import base64
import hashlib

#inputs
openssloutputb64=''
password=''

#convert inputs to bytes
openssloutputbytes=base64.b64decode(openssloutputb64)
passwordbytes=password.encode('utf-8')
salt=openssloutputbytes[8:16]   #salt is bytes 8-15 of the ciphertext

#key derivation
D1=hashlib.md5(passwordbytes + salt).digest()
D2=hashlib.md5(D1 + passwordbytes + salt).digest()
D3=hashlib.md5(D2 + passwordbytes + salt).digest()
key=D1+D2
iv=D3

print('password:', password)
print('salt:', salt.hex())
print ('key:', key.hex())
print ('iv:', iv.hex())