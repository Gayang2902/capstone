#include <stdio.h>
#include <string.h>
#include "encrypt_module.h"
#include "decrypt_module.h"

int main(int argc, char *argv[]) {
    if (argc != 2) {
        printf("manu: %s [encrypt | decrypt]\n", argv[0]);
        return 1;
    }

    char id[128], pw[128], url[256], master[128], filename[256];

    if (strcmp(argv[1], "encrypt") == 0) {
        printf("ID: "); scanf("%127s", id);
        printf("PW: "); scanf("%127s", pw);
        printf("URL: "); scanf("%255s", url);
        printf("Master Key: "); scanf("%127s", master);
        printf("filename(.dph): "); scanf("%255s", filename);

        encrypt_and_save(id, pw, url, filename, master);
        printf("completed: %s\n", filename);
    }
    else if (strcmp(argv[1], "decrypt") == 0) {
        printf("filename(.dph): "); scanf("%255s", filename);
        printf("Master Key: "); scanf("%127s", master);

        decrypt_and_show(filename, master);
    }
    else {
        printf("fail mode: %s [encrypt | decrypt]\n", argv[0]);
        return 1;
    }

    return 0;
}
