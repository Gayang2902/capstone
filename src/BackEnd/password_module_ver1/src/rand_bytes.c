#include <stdio.h>
#include <stdlib.h>
#include "rand_bytes.h"
#include <windows.h>
#include <bcrypt.h>

#pragma comment(lib, "bcrypt.lib")  // 링커 bcrypt.lib

void rand_bytes(uint8_t *buf, size_t len) {
    if (BCryptGenRandom(NULL, buf, (ULONG)len, BCRYPT_USE_SYSTEM_PREFERRED_RNG) != 0) {
        fprintf(stderr, "BCryptGenRandom failed\n");
        exit(1);
    }
}
