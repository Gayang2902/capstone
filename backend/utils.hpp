#pragma once

#include <string>
#include <chrono>
#include <iomanip>
#include <random>
#include <sstream>

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