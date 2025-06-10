#include <string>
#include <unordered_map>
#include <vector>

#include "global.hpp"
#include "database.hpp"
#include "utils.hpp"
#include "response.hpp"
#include "reuse.hpp"

using namespace std;
using json = nlohmann::json;

// ——————————————————————————————————————————
// 재사용된 비밀번호 조회
// ——————————————————————————————————————————
void onGetReusedPasswords(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    // 1) DB에서 모든 엔트리 로드
    vector<PasswordEntry> entries = db->getAllData();

    // 2) 각 비밀번호별 사용 횟수 카운트
    unordered_map<string, int> countMap;
    for (auto& e : entries) {
        if (!e.pwd.empty()) {
            ++countMap[e.pwd];
        }
    }

    // 3) 사용 횟수 >1인 엔트리만 JSON으로 변환
    vector<json> rst;
    rst.reserve(entries.size());
    for (auto& e : entries) {
        if (!e.pwd.empty() && countMap[e.pwd] > 1) {
            rst.push_back(entryToJson(e, false));
        }
    }

    // 4) 응답
    json data;
    data["data"] = move(rst);
    respondSuccess(data);
}

// ——————————————————————————————————————————
// 재사용된 비밀번호 개수 조회
// ——————————————————————————————————————————
void onGetReusedCount(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    vector<PasswordEntry> entries = db->getAllData();
    unordered_map<string, int> countMap;
    for (auto& e : entries) {
        if (!e.pwd.empty()) {
            ++countMap[e.pwd];
        }
    }

    // 재사용된(사용 횟수 >1) 엔트리 개수 집계
    size_t cnt = 0;
    for (auto& e : entries) {
        if (!e.pwd.empty() && countMap[e.pwd] > 1) {
            ++cnt;
        }
    }

    json data;
    data["count"] = cnt;
    respondSuccess(data);
}