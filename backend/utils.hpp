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

// ���� ��¥�� ���ڿ���
string getCurrentDateString();

// ���� UID ���� (Ÿ�ӽ����� + ������ 6�ڸ��� �����)
string generateUID();

// PasswordEntry to JSON 
json entryToJson(const PasswordEntry& entry, bool include_pwd);

// DB �ʱ�ȭ ���� Ȯ��
bool ensureDbInitialized();

// �ʼ� �Ķ���� Ȯ��
bool checkRequiredArgs(const unordered_map<string, string>& args,
	const vector<string>& required_keys,
	string& missing_key);

// ���� ���͸� ���� (���� ��й�ȣ)
bool shouldConsiderPasswordForReused(const PasswordEntry& entry);