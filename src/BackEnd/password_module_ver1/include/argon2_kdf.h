#include <stdint.h>
void derive_key_argon2(const char *password, const uint8_t *salt, uint8_t *key_out);