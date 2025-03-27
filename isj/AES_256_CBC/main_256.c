#include <stdio.h>
#include <time.h> 
#include "AES_256_CBC.h"

// Function to print the title and hexadecimal representation of data
void output(const char *title, const unsigned char *data, unsigned int size) {
    printf("%s", title);
    for (unsigned int index = 0; index < size; index++) {
        printf("%02X", data[index]);
    }
    printf("\n");
}

int main(int argc, const char *argv[]) {
    // AES-256 key (32 bytes)
    unsigned char key[AES_KEY_SIZE] = {
        0x49, 0x2F, 0xA8, 0x1E, 0xD7, 0x82, 0x4C, 0x93,
        0x36, 0x7B, 0xC1, 0xF8, 0xA0, 0xE5, 0x1A, 0x5D,
        0x98, 0xA1, 0x01, 0x11, 0x32, 0xE3, 0xC6, 0xC1,
        0xF3, 0x5C, 0x3A, 0xD6, 0x1E, 0x64, 0x12, 0xD6
    };
    
    // AES-256 iv (16 bytes)
    unsigned char iv[AES_BLOCK_SIZE] = {
        0x3A, 0x04, 0x2F, 0x3D, 0x37, 0x61, 0x34, 0x3D,
        0x49, 0x60, 0x33, 0x63, 0x4A, 0x3D, 0x36, 0x63
    };

    // Data block to be encrypted (16 bytes)
    unsigned char data[AES_BLOCK_SIZE] = {
        0x54, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20,
        0x61, 0x6E, 0x20, 0x64, 0x61, 0x74, 0x61, 0x21
    };

    // Start time measurement
    clock_t start_time, end_time;
    double cpu_time_used;

    // Print original data
    output("original: 0x", data, 16);

    // Initialize AES context
    AES_CTX ctx;

    // Measure encryption time
    start_time = clock();  // Record the start time

    // Initialize encryption with the provided key and iv
    AES_EncryptInit(&ctx, key, iv);

    // Perform encryption
    AES_Encrypt(&ctx, data, data);
    end_time = clock(); // encrypt end time

    // Print encrypted data
    output("encryption: 0x", data, 16);

     // Measure the end time after encryption
     cpu_time_used = ((double)(end_time - start_time)) / CLOCKS_PER_SEC;
     printf("Encryption time: %f seconds\n", cpu_time_used);

    // Measure decryption time
    start_time = clock();  // Record the start time for decryption

    // Initialize decryption with the same key and iv
    AES_DecryptInit(&ctx, key, iv);

    // Perform decryption
    AES_Decrypt(&ctx, data, data);
    end_time = clock(); //Decrypt end time

    // Print decrypted data
    output("decryption: 0x", data, 16);

    // Measure the end time after decryption
    cpu_time_used = ((double)(end_time - start_time)) / CLOCKS_PER_SEC;
    printf("Decryption time: %f seconds\n", cpu_time_used);

    // Clean up: zero out the round key array for security purposes
    AES_CTX_Free(&ctx);

    return 0;
}
