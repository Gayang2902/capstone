#pragma once
#include <string>
#include <vector>
#include <unordered_map>

#include "json_c.hpp"

// ====== 데이터 모델 ======
struct PasswordEntry {
    std::string UID;
    std::string label;
    std::string created_at;
    std::string modified_at;
    std::string comments;
    bool        favorite = false;   // 초기화 누락 경고 방지
    std::string type;

    // 상세 필드
    std::string name;
    std::string pwd;
    std::string id;
    std::string host;
    std::string port;
    std::string num;
    std::string master;
    std::string citizen;
    std::string eng_name;
    std::string address;
    std::string birth_date;
    std::string content;
    std::string url;
    std::string email;
    std::string card_number;
    std::string cvc;
    std::string last_day;
    std::string bank_name;
};

// ====== 데이터베이스 ======
class Database {
public:
    Database(const std::string& file_path_, const std::string& user_password_);
    ~Database();

    // CRUD in-memory
    std::vector<PasswordEntry> getAllData() const;
    bool addEntry(const PasswordEntry& new_entry);
    bool updateEntry(const std::string& uid, const std::unordered_map<std::string, std::string>& args);
    bool deleteEntry(const std::string& uid);
    PasswordEntry getEntry(const std::string& uid) const;
    std::vector<PasswordEntry> searchByTag(const std::string& tag) const;
    size_t getPasswordCount() const;

    // 파일 I/O
    bool loadFromFile();   // [salt|iv|cipher] 읽어서 복호화
    bool saveToFile();     // [salt|iv|cipher]로 저장

    // 마스터 키(사용자 비밀번호) 교체
    bool updateMasterKey(const std::string& new_user_password);

private:
    // 파일 경로
    std::string file_path;

    // KDF 결과(대칭키). 저장 시마다 새 salt로 다시 도출됨
    std::string master_key;

    // 사용자 입력 비밀번호(파일 저장/로드 시 KDF에 사용)
    std::string user_password;

    // 인메모리 엔트리
    std::vector<PasswordEntry> entries;

    // 변경 여부
    bool is_modified;

private:
    // --- 내부 유틸 ---
    bool deriveKey(const std::string& user_key, const unsigned char* salt); // salt 필요(헤더에서 읽음/새로 생성)
    std::string readAllBytes() const;
    bool writeAllBytes(const std::string& bytes);

    bool encryptAES256WithIV(const std::string& plaintext,
        const std::string& iv_bytes,
        std::string& out_ciphertext) const;

    bool decryptAES256WithIV(const std::string& ciphertext,
        const std::string& iv_bytes,
        std::string& out_plaintext) const;

    // JSON 직렬화/역직렬화
    static PasswordEntry jsonToEntry(const nlohmann::json& data);
    static nlohmann::json entryToJson(const PasswordEntry& e);
};
