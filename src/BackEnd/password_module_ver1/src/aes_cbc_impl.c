#include "AES_256_CBC.h"
#include <string.h>
#include <stdint.h>

#define AES_BLOCK_SIZE 16

void AES_CBC_Encrypt(AES_CTX *ctx, const uint8_t *in, uint8_t *out, size_t len) {
    uint8_t block[AES_BLOCK_SIZE];
    uint8_t iv[AES_BLOCK_SIZE];
    memcpy(iv, ctx->iv, AES_BLOCK_SIZE);

    for (size_t i = 0; i < len; i += AES_BLOCK_SIZE) {
        for (int j = 0; j < AES_BLOCK_SIZE; j++) {
            block[j] = in[i + j] ^ iv[j];
        }
        AES_Encrypt(ctx, block, out + i);  // 헤더 내 구현 호출
        memcpy(iv, out + i, AES_BLOCK_SIZE);
    }
}

void AES_CBC_Decrypt(AES_CTX *ctx, const uint8_t *in, uint8_t *out, size_t len) {
    uint8_t block[AES_BLOCK_SIZE];
    uint8_t iv[AES_BLOCK_SIZE];
    memcpy(iv, ctx->iv, AES_BLOCK_SIZE);

    for (size_t i = 0; i < len; i += AES_BLOCK_SIZE) {
        memcpy(block, in + i, AES_BLOCK_SIZE);
        AES_Decrypt(ctx, in + i, out + i);  // 헤더 내 구현 호출
        for (int j = 0; j < AES_BLOCK_SIZE; j++) {
            out[i + j] ^= iv[j];
        }
        memcpy(iv, block, AES_BLOCK_SIZE);
    }
}
