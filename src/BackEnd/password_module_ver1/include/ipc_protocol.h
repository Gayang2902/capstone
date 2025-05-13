#ifndef IPC_PROTOCOL_H
#define IPC_PROTOCOL_H

#include <stdint.h>

typedef struct {
    char cmd[32];
    char source[32];
    char session_id[64];
    char data[512]; // 단순 문자열 처리용
} ipc_request_t;

typedef struct {
    char status[16];
    char message[128];
    char data[512]; // 응답 데이터
} ipc_response_t;

void handle_ipc_request(const char* json_input, char* json_output);

#endif
