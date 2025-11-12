#include <unordered_map>
#include <unordered_set>
#include <string>
#include <functional>
#include <chrono>
#include <iomanip>
#include <random>
#include <sstream>
#include <cctype>

#include "global.hpp"
#include "handler.hpp"
#include "response.hpp"
#include "database.hpp"
#include "utils.hpp"
#include "json_c.hpp"

#include "vuln.hpp"
#include "old.hpp"
#include "reuse.hpp"
#include "leak.hpp"

using namespace std;
using json = nlohmann::json;

// API를 함수 포인터로 관리
using HandlerFunc = function<void(const unordered_map<string, string>&)>;
// 정적 매핑 사용
static unordered_map<string, HandlerFunc> handlerMap;

void onOpenFile(const unordered_map<string, string>& args) {
	string missing;
	if (!checkRequiredArgs(args, { "file_path" }, missing)) {
		respondError("Missing parameter: " + missing);
		return;
	}

	if (db) {
		delete db;
		db = nullptr;
	}

	pending_path = args.at("file_path");

	json data;
	data["file_path"] = pending_path;
	respondSuccess(data);
}

void onPostMasterKey(const unordered_map<string, string>& args) {
	string missing;
	if (!checkRequiredArgs(args, { "master_key" }, missing)) {
		respondError("Missing parameter: " + missing);
		return;
	}

	if (pending_path.empty()) {
		respondError("File path not set. Call API `openFile` first.");
		return;
	}

	if (db) {
		delete db;
		db = nullptr;
	}

	string master_key = args.at("master_key");
	db = new Database(pending_path, master_key);

	if (!db->loadFromFile()) {
		respondError("Invalid master key.");
		delete db;
		db = nullptr;
		return;
	}

	respondSuccess();
}

void onCreatePasswordEntry(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "label", "comments", "favorite", "type" }, missing)) {
		respondError("Unable to create entry. Missing required field: " + missing);
		return;
	}

	PasswordEntry entry;
	entry.UID = generateUID();
	entry.UID = generateUID();
	entry.label = args.at("label");
	string today = getCurrentDateString();
	entry.created_at = today;
	entry.modified_at = today;
	entry.comments = args.at("comments");
	entry.favorite = (args.at("favorite") == "true");
	entry.type = args.at("type");

	//> details.
	entry.name = args.count("name") ? args.at("name") : "";
	entry.pwd = args.count("pwd") ? args.at("pwd") : "";
	entry.id = args.count("id") ? args.at("id") : "";
	entry.host = args.count("host") ? args.at("host") : "";
	entry.port = args.count("port") ? args.at("port") : "";
	entry.num = args.count("num") ? args.at("num") : "";
	entry.master = args.count("master") ? args.at("master") : "";
	entry.citizen = args.count("citizen") ? args.at("citizen") : "";
	entry.eng_name = args.count("eng_name") ? args.at("eng_name") : "";
	entry.address = args.count("address") ? args.at("address") : "";
	entry.birth_date = args.count("birth_date") ? args.at("birth_date") : "";
	entry.content = args.count("content") ? args.at("content") : "";
	entry.url = args.count("url") ? args.at("url") : "";
	entry.email = args.count("email") ? args.at("email") : "";
	entry.card_number = args.count("card_number") ? args.at("card_number") : "";
	entry.cvc = args.count("cvc") ? args.at("cvc") : "";
	entry.last_day = args.count("last_day") ? args.at("last_day") : "";
	entry.bank_name = args.count("bank_name") ? args.at("bank_name") : "";

	if (!db->addEntry(entry)) {
		respondError("Unable to create entry.");
		return;
	}
	if (!db->saveToFile()) {
		respondError("Unable to save database to file.");
		return;
	}

	json data;
	data["uid"] = entry.UID;
	respondSuccess(data);
}

void onUpdatePasswordEntry(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "UID" }, missing)) {
		respondError("Missing parameter: UID");
		return;
	}
	string uid = args.at("UID");

	if (!db->updateEntry(uid, args)) {
		respondError("UID not found or update failed.");
		return;
	}
	if (!db->saveToFile()) {
		respondError("Failed to save database after update.");
		return;
	}
	respondSuccess();
}

void onDeletePasswordEntry(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "UID" }, missing)) {
		respondError("Missing parameter: UID");
		return;
	}
	string uid = args.at("UID");

	if (!db->deleteEntry(uid)) {
		respondError("UID not found or delete failed.");
		return;
	}
	if (!db->saveToFile()) {
		respondError("Failed to save database after deletion.");
		return;
	}
	respondSuccess();
}

// 검색 (query 필드로 label에서 부분 검색)
void onSearchPasswordEntry(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "query" }, missing)) {
		respondError("Missing parameter: query");
		return;
	}
	string query = args.at("query");

	vector<PasswordEntry> entries = db->getAllData();
	vector<json> rst;
	for (auto& e : entries) {
		if (e.label.find(query) != string::npos) {
			rst.push_back(entryToJson(e, false));
		}
	}
	json data;
	data["data"] = move(rst);
	respondSuccess(data);
}

void onGetPasswordDetail(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "UID" }, missing)) {
		respondError("Missing parameter: UID");
		return;
	}
	string uid = args.at("UID");

	PasswordEntry e = db->getEntry(uid);
	if (e.UID.empty() || e.UID != uid) {
		respondError("UID not found.");
		return;
	}
	// 비밀번호만 반환
	json data;
	data["pwd"] = e.pwd;
	respondSuccess(data);
}

void onGetPasswordsByTag(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "tag" }, missing)) {
		respondError("Missing parameter: tag");
		return;
	}
	string tag = args.at("tag");

	vector<PasswordEntry> filtered = db->searchByTag(tag);
	vector<json> rst;
	for (auto& e : filtered) {
		rst.push_back(entryToJson(e, false));
	}
	json data;
	data["data"] = move(rst);
	respondSuccess(data);
}

void onGetPasswordCount(const unordered_map<string, string>&) {
	if (!ensureDbInitialized()) return;

	size_t count = db->getPasswordCount();
	json data;
	data["total"] = count;
	respondSuccess(data);
}

void onUpdateMasterKey(const unordered_map<string, string>& args) {
	if (!ensureDbInitialized()) return;

	string missing;
	if (!checkRequiredArgs(args, { "old_master_key", "new_master_key" }, missing)) {
		respondError("Missing parameter: " + missing);
		return;
	}
	string old_key = args.at("old_master_key");
	string new_key = args.at("new_master_key");

	// 기존 키 검증
	Database tempDb(pending_path, old_key);
	if (!tempDb.loadFromFile()) {
		respondError("Old master key is incorrect.");
		return;
	}

	if (!db->updateMasterKey(new_key)) {
		respondError("Failed to update master key or re-save file.");
		return;
	}
	respondSuccess();
}

// 모든 비밀번호 엔트리 출력
void onGetAllPasswords(const std::unordered_map<string, string>&) {
	if (!ensureDbInitialized()) return;

	vector<PasswordEntry> entries = db->getAllData();
	vector<json> rst;
	rst.reserve(entries.size());

	for (auto& e : entries) {
		rst.push_back(entryToJson(e, false));
	}

	json data;
	data["data"] = move(rst);
	respondSuccess(data);
}

void initHandlers() {
	// START.
	handlerMap["openFile"] = onOpenFile;
	handlerMap["postMasterKey"] = onPostMasterKey;
	// CRUD.
	handlerMap["getAllPasswords"] = onGetAllPasswords;
	handlerMap["createPasswordEntry"] = onCreatePasswordEntry;
	handlerMap["updatePasswordEntry"] = onUpdatePasswordEntry;
	handlerMap["deletePasswordEntry"] = onDeletePasswordEntry;
	handlerMap["searchPasswordEntry"] = onSearchPasswordEntry;
	// 
	handlerMap["getPasswordsByTag"] = onGetPasswordsByTag;

	handlerMap["getPasswordDetail"] = onGetPasswordDetail;
	handlerMap["getPasswordCount"] = onGetPasswordCount;
	// REUSED.
	handlerMap["getReusedPasswords"] = onGetReusedPasswords;
	handlerMap["getReusedCount"] = onGetReusedCount;
	// OUTDATED.
	handlerMap["getOldPasswords"] = onGetOldPasswords;
	handlerMap["getOldCount"] = onGetOldCount;
	// VULN.
	handlerMap["getVulnerablePasswords"] = onGetVulnerablePasswords;
	handlerMap["getVulnerablePasswordCount"] = onGetVulnCount;
	// LEAKED.
	handlerMap["getLeakedPasswords"] = onGetLeakedPasswords;
	handlerMap["getLeakedCount"] = onGetLeakedCount;
	// SETTINGS.
	handlerMap["updateMasterKey"] = onUpdateMasterKey;
}

void handleOperation(const string& oper,
	const unordered_map<string, string>& args) {

	auto handler = handlerMap.find(oper);
	// 핸들러 탐색
	if (handler != handlerMap.end()) {
		// 호출
		handler->second(args);
	}
	else {
		respondError("Unknown operation: " + oper);
	}
}