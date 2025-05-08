#include "xml_handler.h"
#include <stdio.h>
#include <string.h>

void hex_encode(const uint8_t *in, size_t len, char *out) {
    for (size_t i = 0; i < len; i++) sprintf(out + i * 2, "%02x", in[i]);
    out[len * 2] = '\0';
}

void hex_decode(const char *in, uint8_t *out, size_t len) {
    for (size_t i = 0; i < len; i++) sscanf(in + 2 * i, "%2hhx", &out[i]);
}

void save_to_xml(const char *filename, const uint8_t *salt, const uint8_t *iv, const uint8_t *data, size_t len) {
    FILE *fp = fopen(filename, "w");
    char salt_hex[33], iv_hex[33], data_hex[len * 2 + 1];
    hex_encode(salt, 16, salt_hex);
    hex_encode(iv, 16, iv_hex);
    hex_encode(data, len, data_hex);
    fprintf(fp, "<dph>\n  <salt>%s</salt>\n  <iv>%s</iv>\n  <data>%s</data>\n</dph>\n", salt_hex, iv_hex, data_hex);
    fclose(fp);
}

void load_from_xml(const char *filename, uint8_t *salt, uint8_t *iv, uint8_t *data, size_t *len) {
    FILE *fp = fopen(filename, "r");
    char line[1024], salt_hex[33], iv_hex[33], data_hex[2049];
    while (fgets(line, sizeof(line), fp)) {
        if (strstr(line, "<salt>")) sscanf(line, " <salt>%32s</salt>", salt_hex);
        else if (strstr(line, "<iv>")) sscanf(line, " <iv>%32s</iv>", iv_hex);
        else if (strstr(line, "<data>")) sscanf(line, " <data>%2048s</data>", data_hex);
    }
    hex_decode(salt_hex, salt, 16);
    hex_decode(iv_hex, iv, 16);
    *len = strlen(data_hex) / 2;
    hex_decode(data_hex, data, *len);
    fclose(fp);
}
