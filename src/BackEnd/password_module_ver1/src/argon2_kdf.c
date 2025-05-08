#include "argon2_kdf.h"
#include "argon2.h"
#include <string.h>
#include <stdlib.h>
#include <stdio.h>

void derive_key_argon2(const char *password, const uint8_t *salt, uint8_t *key_out) {
    int res = argon2id_hash_raw(3, 1 << 16, 1, password, strlen(password), salt, 16, key_out, 32);
    if (res != ARGON2_OK) {
        fprintf(stderr, "Argon2 키 유도 실패: %s\n", argon2_error_message(res));
        exit(1);
    }
}
