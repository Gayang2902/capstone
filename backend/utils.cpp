#include "global.hpp"
#include "utils.hpp"
#include "database.hpp"
#include "response.hpp"

using namespace std;
using json = nlohmann::json;

// 현재 날짜를 문자열로
string getCurrentDateString() {
	auto now = chrono::system_clock::now();
	time_t t_c = chrono::system_clock::to_time_t(now);
	tm tm{};
#if defined(_WIN32) || defined(_WIN64)
	localtime_s(&tm, &t_c);
#else
	localtime_r(&t_c, &tm);
#endif
	std::ostringstream oss;
	oss << put_time(&tm, "%Y-%m-%d");
	return oss.str();
}

// 고유 UID 생성 (타임스탬프 + 랜덤한 6자리를 사용함)
string generateUID() {
	auto now = chrono::system_clock::now();
	auto micros = chrono::duration_cast<chrono::microseconds>(
		now.time_since_epoch())
		.count();

	mt19937_64 rng(static_cast<uint64_t>(micros));
	uniform_int_distribution<uint32_t> dist(0, 999999);

	ostringstream oss;
	oss << micros << setw(6) << setfill('0') << dist(rng);
	return oss.str();
}

// PasswordEntry to JSON 
json entryToJson(const PasswordEntry& entry, bool include_pwd) {
	json data;
	data["UID"] = entry.UID;
	data["UID"] = entry.UID;
	data["label"] = entry.label;
	data["created_at"] = entry.created_at;
	data["modified_at"] = entry.modified_at;
	data["comments"] = entry.comments;
	data["favorite"] = entry.favorite;
	data["type"] = entry.type;

	if (!entry.name.empty())
		data["name"] = entry.name;
	if (include_pwd && !entry.pwd.empty())
		data["pwd"] = entry.pwd;
	if (!entry.id.empty())
		data["id"] = entry.id;
	if (!entry.host.empty())
		data["host"] = entry.host;
	if (!entry.port.empty())
		data["port"] = entry.port;
	if (!entry.num.empty())
		data["num"] = entry.num;
	if (!entry.master.empty())
		data["master"] = entry.master;
	if (!entry.citizen.empty())
		data["citizen"] = entry.citizen;
	if (!entry.eng_name.empty())
		data["eng_name"] = entry.eng_name;
	if (!entry.address.empty())
		data["address"] = entry.address;
	if (!entry.birth_date.empty())
		data["birth_date"] = entry.birth_date;
	if (!entry.content.empty())
		data["content"] = entry.content;
	if (!entry.url.empty())
		data["url"] = entry.url;
	if (!entry.email.empty())
		data["email"] = entry.email;
	if (!entry.card_number.empty())
		data["card_number"] = entry.card_number;
	if (!entry.cvc.empty())
		data["cvc"] = entry.cvc;
	if (!entry.last_day.empty())
		data["last_day"] = entry.last_day;
	if (!entry.bank_name.empty())
		data["bank_name"] = entry.bank_name;

	return data;
}

// DB 초기화 여부 확인
bool ensureDbInitialized() {
	if (!db) {
		respondError("Database not initialized.");
		return false;
	}
	return true;
}

// 필수 파라미터 검증
bool checkRequiredArgs(const unordered_map<string, string>& args,
	const vector<string>& required_keys,
	string& missing_key) {

	for (auto& key : required_keys) {
		if (!args.count(key)) {
			missing_key = key;
			return false;
		}
	}

	return true;
}

// 공통 필터링 로직 (검사해야하는 엔트리인지...)
bool shouldConsiderPasswordForReused(const PasswordEntry& entry) {
	// 비밀번호 필드가 비어있는지 확인
	if (entry.pwd.empty()) {
		return false;
	}

	const vector<string> except_tags = { "bankbook", "card", "wifi" };
	if (find(except_tags.begin(), except_tags.end(), entry.type) != except_tags.end()) {
		return false;
	}
	return true;
}