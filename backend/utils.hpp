#pragma once

#include <string>
#include <chrono>
#include <iomanip>
#include <random>
#include <sstream>
#include <vector>

#include "database.hpp"
#include "json_c.hpp"

using namespace std;
using json = nlohmann::json;

// 현재 날짜를 문자열로
string getCurrentDateString();

// 고유 UID 생성 (타임스탬프 + 랜덤한 6자리를 사용함)
string generateUID();

// PasswordEntry to JSON 
json entryToJson(const PasswordEntry& entry, bool include_pwd);

// DB 초기화 여부 확인
bool ensureDbInitialized();

// 필수 파라미터 확인
bool checkRequiredArgs(const unordered_map<string, string>& args,
	const vector<string>& required_keys,
	string& missing_key);

// 공통 필터링 로직 (재사용 비밀번호)
bool shouldConsiderPasswordForReused(const PasswordEntry& entry);