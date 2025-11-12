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

// 재사용된 비밀번호 조회 (그룹화됨)
void onGetReusedPasswords(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    // DB에서 모든 엔트리 로드
    vector<PasswordEntry> entries = db->getAllData();

    // 비밀번호별로 엔트리 그룹화 및 사용 횟수 카운트
    unordered_map<string, vector<json>> groupedPasswords;  // 키: 비밀번호, 값: 해당 비밀번호를 사용하는 엔트리들의 JSON 배열
    unordered_map<string, int> passwordCounts;             // 키: 비밀번호, 값: 해당 비밀번호의 사용 횟수

    for (auto& e : entries) {
        // 특정 태그와 비밀번호가 비어있는 엔트리는 검사에서 제외
        if (!shouldConsiderPasswordForReused(e)) {
            continue;
        }

        // 해당 비밀번호의 사용 횟수 증가
        passwordCounts[e.pwd]++;
        // 해당 비밀번호 그룹에 현재 엔트리 추가
        groupedPasswords[e.pwd].push_back(entryToJson(e, false));
    }

    // 사용 횟수 > 1인 비밀번호 그룹(엔트리 배열)만 최종 결과에 추가
    vector<json> rst; 
    for (auto const& [pwd_value, entry_list] : groupedPasswords) {
        // 비밀번호가 1번 초과하여 사용된 경우 (재사용된 경우)
        if (passwordCounts[pwd_value] > 1) {
            rst.push_back(entry_list); // 해당 비밀번호를 사용하는 엔트리들의 배열 자체를 추가
        }
    }

    json data;
    data["data"] = move(rst);
    respondSuccess(data);
}

// 재사용된 비밀번호 개수 조회
void onGetReusedCount(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    vector<PasswordEntry> entries = db->getAllData();
    unordered_map<string, int> countMap; 

    for (auto& e : entries) {
        if (!shouldConsiderPasswordForReused(e)) {
            continue;
        }
        if (!e.pwd.empty()) {
            ++countMap[e.pwd];
        }
    }

    size_t totalReusedEntriesCount = 0;
    for (auto& e : entries) {
        if (!shouldConsiderPasswordForReused(e)) {
            continue;
        }
        if (!e.pwd.empty() && countMap[e.pwd] > 1) {
            ++totalReusedEntriesCount;
        }
    }

    json data;
    data["total"] = totalReusedEntriesCount; 
    respondSuccess(data);
}