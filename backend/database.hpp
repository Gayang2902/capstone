#pragma once

#include <string>
#include <vector>
#include <string>

#include "json_c.hpp"

using json = nlohmann::json;
using namespace std;

// 비밀번호 엔트리 구조체
struct PasswordEntry {
    string UID;
    string label;
    string created_at;
    string modified_at;
    string comments;
    bool favorite;
    string type;

    string name;
    string pwd;
    string id;
    string host;
    string port;
    string num;
    string master;
    string citizen;
    string eng_name;
    string address;
    string birth_date;
    string content;
    string url;
    string email;
    string card_number;
    string cvc;
    string last_day;
    string bank_name;
};

class Database {
public:
    Database(const string& file_path,
        const string& user_key);
    ~Database();

    // 파일을 읽어서 AES-256-CBC 복호화 후 JSON으로 파싱하여 inMemoryData에 저장
    // 파일이 없으면 빈 JSON 객체로 초기화
    bool loadFromFile();

    // inMemoryData를 JSON 문자열로 직렬화 → AES-256-CBC 암호화 → 파일에 덮어쓰기
    // return 성공 시 true, 암호화/쓰기 실패 시 false
    bool saveToFile();

    // 메모리에 로드된 전체 JSON 데이터를 const 참조로 반환
    vector<PasswordEntry> getAllData() const;

    // 비밀번호 항목 추가 (createPasswordEntry)
    // new_entry는 최소한 {"uid": "...", "master_key": "...", ...} 형태
    bool addEntry(const PasswordEntry& new_entry);

    // 비밀번호 항목 수정 (updatePasswordEntry)
    // uid에 해당하는 항목을 찾아 updateFields 키/값으로 덮어씀
    bool updateEntry(const string& uid, const unordered_map<string, string>& args);

    // 비밀번호 항목 삭제 (deletePasswordEntry)
    // uid를 찾은 뒤 삭제했다면 true, 없으면 false
    bool deleteEntry(const string& uid);

    // uid에 해당하는 단일 항목 조회 (getPasswordEntry)
    // uid가 있다면 해당 PasswordEntry 객체, 없으면 빈 PasswordEntry 객체({})
    PasswordEntry getEntry(const string& uid) const;

    // 태그(tag)를 기준으로 비밀번호 목록 필터링 (getPasswordsByTag)
    // - inMemoryData["passwords"] 배열을 순회하며,
    // entry["tags"](배열)에 tag가 있으면 결과 벡터에 추가
    vector<PasswordEntry> searchByTag(const string& tag) const;

    // 전체 비밀번호 개수 조회 (getPasswordCount)
    size_t getPasswordCount() const;

    // 마스터키(Argon2 기반 AES 키) 재설정 → inMemoryData 전체를 새 키로 재암호화하여 파일에 덮어쓰기
    // 성공 시 true (키 교체 및 저장 완료), 실패 시 false (기존 키 유지)
    bool updateMasterKey(const string& new_user_password);

private:
    string file_path;               //< 저장할 파일 경로
    string master_key;              //< Argon2로 유도된 32바이트 AES 키 (바이너리 문자열)
    vector<PasswordEntry> entries;  //< 복호화된 평문 데이터를 메모리(비밀번호 목록 등)로 보관
    bool is_modified;               //< 메모리 변경 여부 (true면 saveToFile 시 덮어쓰기)

    // 파일 전체를 바이너리 모드로 읽어 std::string 반환
    string readAllBytes() const;

    // 암호문(바이너리 혹은 hex) → 파일에 덮어쓰기
    bool writeAllBytes(const string& bytes);

    // Argon2id를 사용하여 user_password + 파일 경로(salt)로 32바이트 키 유도
    bool deriveKey(const string& user_password);

    // AES-256-CBC 암호화 
    bool encryptAES256WithIV(const string& plaintext,
        const string& iv_bytes,
        string& out_ciphertext) const;

    // AES-256-CBC 복호화
    bool decryptAES256WithIV(const string& ciphertext,
        const string& iv_bytes,
        string& out_plaintext) const;
};

