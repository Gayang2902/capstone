#include "decrypt_module.h"
#include "argon2_kdf.h"
#include "aes_wrapper.h"       // ✅ AES 함수는 wrapper 통해 호출
#include "xml_handler.h"
#include <string.h>
#include <stdio.h>
#include <stdint.h>

void decrypt_and_show(const char *filename, const char *master) {
    uint8_t salt[16], iv[16], cipher[512], key[32], output[512];
    size_t len;

    load_from_xml(filename, salt, iv, cipher, &len);
    derive_key_argon2(master, salt, key);
    aes_cbc_decrypt(cipher, len, key, iv, output);

    output[len] = '\0'; // null termination
    printf("\n[decrypt]\n%s\n", output);
}
