#pragma once
#include <stdint.h>
#include <stddef.h>

void aes_cbc_encrypt(const uint8_t *plain, size_t len, const uint8_t *key, const uint8_t *iv, uint8_t *out);
void aes_cbc_decrypt(const uint8_t *cipher, size_t len, const uint8_t *key, const uint8_t *iv, uint8_t *out);
