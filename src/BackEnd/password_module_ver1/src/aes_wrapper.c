#include "aes_wrapper.h"
#include "AES_256_CBC.h"

void aes_cbc_encrypt(const uint8_t *plain, size_t len, const uint8_t *key, const uint8_t *iv, uint8_t *out) {
    AES_CTX ctx;
    AES_EncryptInit(&ctx, key, iv);
    AES_CBC_Encrypt(&ctx, plain, out, len);
    AES_CTX_Free(&ctx);
}

void aes_cbc_decrypt(const uint8_t *cipher, size_t len, const uint8_t *key, const uint8_t *iv, uint8_t *out) {
    AES_CTX ctx;
    AES_DecryptInit(&ctx, key, iv);
    AES_CBC_Decrypt(&ctx, cipher, out, len);
    AES_CTX_Free(&ctx);
}
