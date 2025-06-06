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
    /**
     * @param file_path       : 데이터를 저장할(또는 불러올) 파일 경로
     * @param user_key        : 사용자가 입력한 마스터 비밀번호 (Argon2로 AES 키를 유도)
     */
    Database(const string& file_path,
        const string& user_key);
    ~Database();

    /// 1) 파일을 읽어서 AES-256-CBC 복호화 후 JSON으로 파싱하여 inMemoryData에 저장
    ///    파일이 없으면 빈 JSON 객체로 초기화
    /// @return 성공 시 true, 읽기/복호화/파싱 실패 시 false
    bool loadFromFile();

    /// 2) inMemoryData를 JSON 문자열로 직렬화 → AES-256-CBC 암호화 → 파일에 덮어쓰기
    /// @return 성공 시 true, 암호화/쓰기 실패 시 false
    bool saveToFile();

    /// 3) 메모리에 로드된 전체 JSON 데이터를 const 참조로 반환
    vector<PasswordEntry> getAllData() const;

    /// 4a) 비밀번호 항목 추가 (createPasswordEntry)
    ///     new_entry는 최소한 {"uid": "...", "cipher": "...", ...} 형태여야 함
    /// @return 정상 추가 후 true (is_modified=true), 아니면 false
    bool addEntry(const PasswordEntry& new_entry);

    /// 4b) 비밀번호 항목 수정 (updatePasswordEntry)
    ///     uid에 해당하는 항목을 찾아 updateFields 키/값으로 덮어씀
    /// @return 수정 성공 시 true, uid가 없으면 false
    bool updateEntry(const std::string& uid, const std::unordered_map<std::string, std::string>& args);

    /// 4c) 비밀번호 항목 삭제 (deletePasswordEntry)
    /// @return uid를 찾은 뒤 삭제했다면 true, 없으면 false
    bool deleteEntry(const std::string& uid);

    /// 4d) uid에 해당하는 단일 항목 조회 (getPasswordEntry)
    /// @return uid가 있다면 해당 PasswordEntry 객체, 없으면 빈 PasswordEntry 객체({})
    PasswordEntry getEntry(const std::string& uid) const;

    /// 5) 태그(tag)를 기준으로 비밀번호 목록 필터링 (getPasswordsByTag)
    ///     - inMemoryData["passwords"] 배열을 순회하며,
    ///       entry["tags"](배열)에 tag가 있으면 결과 벡터에 추가
    std::vector<PasswordEntry> searchByTag(const std::string& tag) const;

    /// 6) 전체 비밀번호 개수 조회 (getPasswordCount)
    size_t getPasswordCount() const;

    /// 7) 마스터키(Argon2 기반 AES 키) 재설정 → inMemoryData 전체를 새 키로 재암호화하여 파일에 덮어쓰기
    /// @param new_user_password : 새로운 마스터 비밀번호
    /// @return 성공 시 true (키 교체 및 저장 완료), 실패 시 false (기존 키 유지)
    bool updateMasterKey(const std::string& new_user_password);

private:
    std::string file_path;    ///< 저장할 파일 경로
    std::string master_key;   ///< Argon2로 유도된 32바이트 AES 키 (바이너리 문자열)
    vector<PasswordEntry> entries;      ///< 복호화된 평문 데이터를 메모리(비밀번호 목록 등)로 보관
    bool is_modified;         ///< 메모리 변경 여부 (true면 saveToFile 시 덮어쓰기)

    /// @return 파일 전체를 바이너리 모드로 읽어 std::string 반환
    std::string readAllBytes() const;

    /// @param bytes : 암호문(바이너리 혹은 hex) → 파일에 덮어쓰기
    /// @return 성공 시 true, 쓰기 실패 시 false
    bool writeAllBytes(const std::string& bytes);

    /// 내부 헬퍼: Argon2id를 사용하여 user_password + 파일 경로(salt)로 32바이트 키 유도
    bool deriveKey(const std::string& user_password);

    /// 내부 헬퍼: AES-256-CBC 암호화 (키는 master_key, IV는 16바이트 0)
    /// @param plaintext      : 평문 문자열
    /// @param out_ciphertext : 암호문을 바이너리 형태로 채움
    /// @return 성공 시 true, 실패 시 false
    bool encryptAES256WithIV(const std::string& plaintext,
        const std::string& iv_bytes,
        std::string& out_ciphertext) const;

    /// 내부 헬퍼: AES-256-CBC 복호화 (키는 master_key, IV는 16바이트 0)
    /// @param ciphertext     : 바이너리 암호문
    /// @param out_plaintext  : 복호화된 평문 문자열
    /// @return 성공 시 true, 실패 시 false
    bool decryptAES256WithIV(const std::string& ciphertext,
        const std::string& iv_bytes,
        std::string& out_plaintext) const;
};