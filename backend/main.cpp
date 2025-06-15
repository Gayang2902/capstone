#include <iostream>
#include <string>
#include <unordered_map>

#include "json_c.hpp"
#include "handler.hpp"

using namespace std;
using json = nlohmann::json;

int main(void) {
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

    return 0;
}
