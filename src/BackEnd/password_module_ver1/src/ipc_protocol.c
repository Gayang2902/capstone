#include "ipc_protocol.h"
#include <stdio.h>
#include <string.h>

void handle_ipc_request(const char* json_input, char* json_output) {
    // TODO: json 파싱, 암호화 모듈 함수 호출
    // 지금은 mockup response

    snprintf(json_output, 512, "{\"status\":\"ok\",\"message\":\"success\",\"data\":\"example\"}");
}
