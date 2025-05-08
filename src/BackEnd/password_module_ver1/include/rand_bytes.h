#ifndef RAND_BYTES_H
#define RAND_BYTES_H

#include <stdint.h>
#include <stddef.h>

// OS-레벨 보안 난수 생성
void rand_bytes(uint8_t *buf, size_t len);

#endif
