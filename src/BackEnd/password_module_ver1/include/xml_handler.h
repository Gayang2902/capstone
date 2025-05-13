#pragma once
#include <stdint.h>
#include <stddef.h>
void save_to_xml(const char *filename, const uint8_t *salt, const uint8_t *iv, const uint8_t *data, size_t len);
void load_from_xml(const char *filename, uint8_t *salt, uint8_t *iv, uint8_t *data, size_t *len);