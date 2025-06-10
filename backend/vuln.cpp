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

// ——————————————————————————————————————————
// 2) 비밀번호 목록 조회 핸들러
// ——————————————————————————————————————————

// 강력 비밀번호 리스트
void onGetVulnerablePasswordsStrong(const std::unordered_map<string, string>&) {
	if (!ensureDbInitialized()) return;

	vector<PasswordEntry> entries = db->getAllData();
	vector<json> rst;
	rst.reserve(entries.size());

	for (auto& e : entries) {
		if (isStrongPassword(e.pwd)) {
			rst.push_back(entryToJson(e, false));
		}
	}

	json data;
	data["data"] = move(rst);
	respondSuccess(data);
}

// 보통 비밀번호 리스트
void onGetVulnerablePasswordsNormal(const unordered_map<string, string>&) {
	if (!ensureDbInitialized()) return;

	vector<PasswordEntry> entries = db->getAllData();
	vector<json> rst;
	rst.reserve(entries.size());

	for (auto& e : entries) {
		if (isNormalPassword(e.pwd)) {
			rst.push_back(entryToJson(e, false));
		}
	}

	json data;
	data["data"] = move(rst);
	respondSuccess(data);
}

// 약한(취약) 비밀번호 리스트
void onGetVulnerablePasswordsWeak(const unordered_map<string, string>&) {
	if (!ensureDbInitialized()) return;

	vector<PasswordEntry> entries = db->getAllData();
	vector<json> rst;
	rst.reserve(entries.size());

	for (auto& e : entries) {
		if (isWeakPassword(e.pwd)) {
			rst.push_back(entryToJson(e, false));
		}
	}

	json data;
	data["data"] = move(rst);
	respondSuccess(data);
}

// 강력 비밀번호 개수
void onGetStrongCount(const unordered_map<string, string>&) {
	vector<PasswordEntry> entries = db->getAllData();
	size_t cnt = 0;
	for (auto& e : entries) {
		if (isStrongPassword(e.pwd)) {
			++cnt;
		}
	}

	json data;
	data["count"] = cnt;
	respondSuccess(data);
}

// 보통 비밀번호 개수
void onGetNormalCount(const unordered_map<string, string>&) {
	vector<PasswordEntry> entries = db->getAllData();
	size_t cnt = 0;
	for (auto& e : entries) {
		if (isNormalPassword(e.pwd)) {
			++cnt;
		}
	}

	json data;
	data["count"] = cnt;
	respondSuccess(data);
}

// 약한(취약) 비밀번호 개수
void onGetWeakCount(const unordered_map<string, string>&) {
	vector<PasswordEntry> entries = db->getAllData();
	size_t cnt = 0;
	for (auto& e : entries) {
		if (isWeakPassword(e.pwd)) {
			++cnt;
		}
	}

	json data;
	data["count"] = cnt;
	respondSuccess(data);
}