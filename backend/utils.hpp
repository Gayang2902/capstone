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

// ���� ��¥�� ���ڿ���
string getCurrentDateString();

// ���� UID ���� (Ÿ�ӽ����� + ������ 6�ڸ��� �����)
string generateUID();

// PasswordEntry to JSON 
json entryToJson(const PasswordEntry& entry, bool include_pwd);

// DB �ʱ�ȭ ���� Ȯ��
bool ensureDbInitialized();