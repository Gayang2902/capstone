#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <time.h> 
#include "AES_128_CBC.h"

void output(const char* title, uint8_t *data, uint32_t size) {
    printf("%s", title);
    for (uint8_t index = 0; index < size; index++) {
        printf("%02x", data[index]);
    }
    printf("\n");
}

int main() {
    // Example Key (128 bits / 16 bytes)
    uint8_t key[16] = {0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x97, 0x99, 0x89, 0xcf, 0xab, 0x12};

    // Example IV (128 bits / 16 bytes)
    uint8_t iv[16] = {0x0f, 0x47, 0x0e, 0x7f, 0x75, 0x9c, 0x47, 0x0f, 0x42, 0xc6, 0xd3, 0x9c, 0xbc, 0x8e, 0x23, 0x25};

    // Example Data (16 bytes)
    uint8_t data[16] = {0x54, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20, 0x61, 0x20, 0x73, 0x69, 0x6d, 0x70, 0x6c, 0x65};

    output("original: 0x", data, 16);
    
    AES_CTX ctx;

    // 암호화 시간 측정
    clock_t start_encryption = clock();
    AES_EncryptInit(&ctx, key, iv);
    AES_Encrypt(&ctx, data, data);
    clock_t end_encryption = clock();
    double encryption_time = (double)(end_encryption - start_encryption) / CLOCKS_PER_SEC;
    output("encrypted: 0x", data, 16);
    printf("Encryption Time: %f seconds\n", encryption_time);
    // 복호화 시간 측정
    clock_t start_decryption = clock();
    AES_DecryptInit(&ctx, key, iv);
    AES_Decrypt(&ctx, data, data);
    clock_t end_decryption = clock();
    double decryption_time = (double)(end_decryption - start_decryption) / CLOCKS_PER_SEC;
    output("decrypted: 0x", data, 16);
    printf("Decryption Time: %f seconds\n", decryption_time);

    return 0;
}
