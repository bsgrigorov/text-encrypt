import base64
import hashlib
import os, binascii
from backports.pbkdf2 import pbkdf2_hmac

# salt = binascii.unhexlify('aaef2d3f4d77ac66e9c5a6c3d8f921d1')
# passwd = "p@$Sw0rD~1".encode("utf8")


#inputs
openssloutputb64=''

#convert inputs to bytes
openssloutputbytes=base64.b64decode(openssloutputb64)
passwordbytes=password.encode('utf-8')
salt=openssloutputbytes[8:16]   #salt is bytes 8-15 of the ciphertext

#key derivation
# D1=hashlib.md5(passwordbytes + salt).digest()
# D2=hashlib.md5(D1 + passwordbytes + salt).digest()
# D3=hashlib.md5(D2 + passwordbytes + salt).digest()
# key=D1+D2
# iv=D3


key = pbkdf2_hmac("sha256", passwordbytes, salt, 50000, 32)

# print('password:', password)
# print('salt:', salt.hex())
# print ('key:', key.hex())
# print ('iv:', iv.hex())


print("Derived key:", binascii.hexlify(key))