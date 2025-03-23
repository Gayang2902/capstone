#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include "AES_128_CBC.h"

int main(int argc, char* argv[]) {
    if (argc != 6) {
        fprintf(stderr, "사용법: %s <id> <pw> <url> <key_hex> <iv_hex>\n", argv[0]);
        return 1;
    }

    // 파라미터
    const char* id = argv[1];
    const char* pw = argv[2];
    const char* url = argv[3];
    const char* key_hex = argv[4];
    const char* iv_hex  = argv[5];

    // 문자열 병합
    char plain[256];
    snprintf(plain, sizeof(plain), "%s|%s|%s", id, pw, url);

    // key, iv 파싱
    uint8_t key[16], iv[16];
    for (int i = 0; i < 16; i++) {
        sscanf(key_hex + 2*i, "%2hhx", &key[i]);
        sscanf(iv_hex  + 2*i, "%2hhx", &iv[i]);
    }

    // AES 암호화
    uint8_t data[256] = {0};
    strcpy((char*)data, plain);

    AES_CTX ctx;
    AES_EncryptInit(&ctx, key, iv);
    AES_Encrypt(&ctx, data, data);  // CBC 모드로 자기 자신에 덮어쓰기

    // 암호화된 결과 출력 (hex 형태)
    for (int i = 0; i < 16; i++) {
        printf("%02x", data[i]);
    }

    return 0;
}
