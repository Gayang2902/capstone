#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <chrono>

#include "global.hpp"
#include "database.hpp"
#include "utils.hpp"
#include "response.hpp"
#include "old.hpp"

using namespace std;
using json = nlohmann::json;
using namespace std::chrono;

// 30일 이상 경과한(오래된) 비밀번호 조회
void onGetOldPasswords(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    vector<PasswordEntry> entries = db->getAllData();

    vector<json> rst;
    rst.reserve(entries.size());

    // 기준 시각 계산: 현재 − 30일
    auto now = system_clock::now();
    auto cutoffTp = now - hours(24 * 30);
    time_t cutoff = system_clock::to_time_t(cutoffTp);

    // 문자열 to time_t 변환 함수
    auto parseDate = [&](const string& s) -> time_t {
        tm tm{};
        istringstream iss(s);
        iss >> get_time(&tm, "%Y-%m-%d");
        tm.tm_isdst = -1;
        return mktime(&tm);
        };

    // modified_at이 cutoff 이전이면 “오래된” 항목으로 간주
    for (const auto& e : entries) {
        time_t t_mod = parseDate(e.modified_at);
        if (t_mod != -1 && t_mod < cutoff) {
            // 오래된 항목에는 비밀번호까지 포함해서 JSON으로 변환
            rst.push_back(entryToJson(e, true));
        }
    }

    json data;
    data["data"] = move(rst);
    respondSuccess(data);
}

// 30일 이상 경과한(오래된) 비밀번호 개수 조회
void onGetOldCount(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    vector<PasswordEntry> entries = db->getAllData();

    // 기준 시각 계산: 현재 − 30일
    using namespace std::chrono;
    auto now = system_clock::now();
    auto cutoffTp = now - hours(24 * 30);
    time_t cutoff = system_clock::to_time_t(cutoffTp);

    // 문자열 to time_t 변환 함수
    auto parseDate = [&](const string& s) -> time_t {
        tm tm{};
        istringstream iss(s);
        iss >> get_time(&tm, "%Y-%m-%d");
        tm.tm_isdst = -1;
        return mktime(&tm);
        };

    // 오래된 항목 카운트
    size_t cnt = 0;
    for (const auto& e : entries) {
        time_t t_mod = parseDate(e.modified_at);
        if (t_mod != -1 && t_mod < cutoff) {
            ++cnt;
        }
    }

    // 5) 응답
    json data;
    data["total"] = cnt;
    respondSuccess(data);
}
