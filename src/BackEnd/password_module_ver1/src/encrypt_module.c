#include "encrypt_module.h"
#include "argon2_kdf.h"
#include "aes_wrapper.h"
#include "xml_handler.h"
#include "rand_bytes.h"
#include <string.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include "password_policy.h"

void encrypt_and_save(const char *id, const char *pw, const char *url, const char *filename, const char *master) {
    uint8_t salt[16], iv[16], key[32];
    uint8_t plain[512], cipher[512];

    snprintf((char *)plain, sizeof(plain), "id=%s\npw=%s\nurl=%s", id, pw, url);
    
    //비밀번호 복잡성
    if (!is_password_strong(pw)) {
        fprintf(stderr, "[ERROR] Password is too weak. Must contain upper, lower, digit, special and be at least 10 chars.\n");
        return;
    }

    // 보안 난수 생성
    rand_bytes(salt, 16);
    rand_bytes(iv, 16);

    // Argon2 기반 키 파생
    derive_key_argon2(master, salt, key);

    size_t plain_len = strlen((char *)plain);
    size_t padded_len = ((plain_len + 15) / 16) * 16;

    aes_cbc_encrypt(plain, plain_len, key, iv, cipher);

    save_to_xml(filename, salt, iv, cipher, padded_len);
}
