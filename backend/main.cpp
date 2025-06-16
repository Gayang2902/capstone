#include <iostream>
#include <string>
#include <unordered_map>
#include <curl/curl.h>

#include "json_c.hpp"
#include "handler.hpp"
#include "response.hpp"

using namespace std;
using json = nlohmann::json;

int main(void) {
    // libcurl ���� �ʱ�ȭ
    if (curl_global_init(CURL_GLOBAL_DEFAULT) < 0) {
        respondError("[ERROR] curl_global_init failed");
    }
    // �ڵ鷯 �ʱ�ȭ
    initHandlers();

    while (true) {
        string raw;
        if (!getline(cin, raw)) {
            break;
        }

        // �� ���̸� ����.
        if (raw.empty()) {
            continue;
        }

        json data = json::parse(raw);
        string oper = data.at("oper").get<string>();

        // ���� ���ڿ��� ��ųʸ� �Ľ�
        unordered_map<string, string> args;
        for (auto it = data.at("data").begin(); it != data.at("data").end(); ++it) {
            args[it.key()] = it.value().get<string>();
        }

        handleOperation(oper, args);
    }

    curl_global_cleanup();

    return 0;
}
