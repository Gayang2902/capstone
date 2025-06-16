#include <string>
#include <unordered_map>
#include <vector>

#include "global.hpp"
#include "database.hpp"
#include "utils.hpp"
#include "response.hpp"
#include "vuln.hpp"

using namespace std;

// 헬퍼 함수

// 특수문자 포함 여부
static bool hasSpecialChar(const string& pwd) {
	for (unsigned char ch : pwd) {
		if (!isalnum(ch)) {
			return true;
		}
	}
	return false;
}

// 강력: 8자 이상, 특수문자 포함
static bool isStrongPassword(const string& pwd) {
	return pwd.size() >= 8 && hasSpecialChar(pwd);
}

// 보통: 8자 이상, 특수문자 미포함
static bool isNormalPassword(const string& pwd) {
	return pwd.size() >= 8 && !hasSpecialChar(pwd);
}

// 취약: 8자 미만
static bool isWeakPassword(const string& pwd) {
	return pwd.size() < 8;
}

// 소문자 변환
static string toLower(const string& s) {
    string rst = s;
    transform(rst.begin(), rst.end(), rst.begin(), ::tolower);

    return rst;
}

// 태그 필터링
static bool shouldConsiderPassword(const PasswordEntry& entry) {
	if (entry.pwd.empty()) {
		return false;
	}

	const vector<string> except_tags = { "bankbook", "card", "wifi" };
	if (find(except_tags.begin(), except_tags.end(), entry.type) != except_tags.end()) {
		return false;
	}

	return true;
}

// 비밀번호 목록 조회 핸들러 (통합 및 수정)
void onGetVulnerablePasswords(const unordered_map<string, string>& args) {
    if (!ensureDbInitialized()) return;

    string missing;
    if (!checkRequiredArgs(args, { "type" }, missing)) {
        respondError("Missing parameter: type (strong, normal, weak)");
        return;
    }
    string passwordType = args.at("type"); 

    string tag = ""; 
    if (args.count("tag")) {
        tag = args.at("tag");
    }

    vector<PasswordEntry> entries = db->getAllData();
    vector<json> rst;
    rst.reserve(entries.size());

    for (auto& e : entries) {
        if (!tag.empty() && toLower(e.type) != toLower(tag)) {
            continue;
        }

        if (!shouldConsiderPassword(e)) {
            continue;
        }

        if (passwordType == "strong" && isStrongPassword(e.pwd)) {
            rst.push_back(entryToJson(e, false));
        }
        else if (passwordType == "normal" && isNormalPassword(e.pwd)) {
            rst.push_back(entryToJson(e, false));
        }
        else if (passwordType == "weak" && isWeakPassword(e.pwd)) {
            rst.push_back(entryToJson(e, false));
        }
    }

    json data;
    data["data"] = move(rst);
    respondSuccess(data);
}

// 비밀번호 개수 조회 핸들러 (통합 및 수정)
void onGetVulnCount(const unordered_map<string, string>& args) {
    if (!ensureDbInitialized()) return;

    string missing;
    if (!checkRequiredArgs(args, { "type" }, missing)) {
        respondError("Missing parameter: type (strong, normal, weak)");
        return;
    }
    string passwordType = args.at("type"); 

    string tag = ""; 
    if (args.count("tag")) {
        tag = args.at("tag");
    }

    vector<PasswordEntry> entries = db->getAllData();
    size_t cnt = 0;

    for (auto& e : entries) {
        if (!tag.empty() && toLower(e.type) != toLower(tag)) {
            continue;
        }

        if (!shouldConsiderPassword(e)) {
            continue;
        }

        if (passwordType == "strong" && isStrongPassword(e.pwd)) {
            ++cnt;
        }
        else if (passwordType == "normal" && isNormalPassword(e.pwd)) {
            ++cnt;
        }
        else if (passwordType == "weak" && isWeakPassword(e.pwd)) {
            ++cnt;
        }
    }

    json data;
    data["total"] = cnt;
    respondSuccess(data);
}
