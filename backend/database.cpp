#pragma once
#include <fstream>
#include <iostream>
#include <vector>
#include <algorithm>
#include <cstring>
#include <string>
#include <random>

#include "database.hpp"
#include "utils.hpp"

#include <sodium.h>
#include "json_c.hpp"
#include <cryptopp/aes.h>
#include <cryptopp/modes.h>
#include <cryptopp/filters.h>
#include <cryptopp/secblock.h>

using namespace CryptoPP;
using namespace std;
using json = nlohmann::json;

static void printError(const string& error_message) {
    cerr << "[Database Error] " << error_message << "\n";
}

Database::Database(const string& file_path_, const string& master_key)
    : file_path(file_path_),
    master_key(),
    entries(),
    is_modified(false)
{
    if (!deriveKey(master_key)) {
        printError("Failed argon2 key derive!!!");
    }
}

Database::~Database() {
    fill(master_key.begin(), master_key.end(), '\0');

    if (is_modified) {
        printError("Changes not saved!!!");
    }
}

bool Database::deriveKey(const string& user_key) {
    const size_t key_len = 32; // 출력 키 길이
    vector<uint8_t> out_key(key_len);

    if (sodium_init() == -1) {
        printError("[Database] init sodium failed");
        return false;
    }

    // 16bytes salt
    string salt = file_path;
    if (salt.size() < crypto_pwhash_SALTBYTES) {
        salt.append(crypto_pwhash_SALTBYTES - salt.size(), '#');
    }
    else if (salt.size() > crypto_pwhash_SALTBYTES) {
        salt = salt.substr(0, crypto_pwhash_SALTBYTES);
    }

    int ret = crypto_pwhash(
        out_key.data(), key_len,
        user_key.c_str(), user_key.size(),
        reinterpret_cast<const unsigned char*>(salt.data()),
        crypto_pwhash_OPSLIMIT_MODERATE,
        crypto_pwhash_MEMLIMIT_MODERATE,
        crypto_pwhash_ALG_ARGON2ID13
    );

    if (ret != 0) {
        return false; // 키 파생 실패 (메모리 부족 등)
    }

    master_key.assign(reinterpret_cast<const char*>(out_key.data()), key_len);
    return true;
}

// 파일을 바이너리 모드로 읽어 string으로 반환
string Database::readAllBytes() const {
    ifstream ifs(file_path, ios::binary);
    if (!ifs.is_open()) {
        return "";
    }
    ifs.seekg(0, ios::end);
    streamsize sz = ifs.tellg();
    ifs.seekg(0, ios::beg);

    if (sz <= 0)
        return "";

    string buffer;
    buffer.resize(static_cast<size_t>(sz));
    ifs.read(&buffer[0], sz);
    return buffer;
}

// string을 파일에 바이너리 모드로 쓰기
bool Database::writeAllBytes(const string& bytes) {
    ofstream ofs(file_path, ios::binary | ios::trunc);
    if (!ofs.is_open()) {
        return false;
    }
    ofs.write(bytes.data(), bytes.size());
    return true;
}

// AES256-CBC 암호화
bool Database::encryptAES256WithIV(const string& plaintext,
    const string& iv_bytes,
    string& out_ciphertext) const
{
    if (master_key.size() != 32 || iv_bytes.size() != AES::BLOCKSIZE) {
        printError("Key or IV length is invalid.");
        return false;
    }

    try {
        CBC_Mode<AES>::Encryption encryptor;
        SecByteBlock keyBytes(reinterpret_cast<const CryptoPP::byte*>(master_key.data()), master_key.size());
        SecByteBlock iv(reinterpret_cast<const CryptoPP::byte*>(iv_bytes.data()), iv_bytes.size());
        encryptor.SetKeyWithIV(keyBytes, keyBytes.size(), iv, iv.size());

        StringSource ss(
            plaintext,
            true,
            new StreamTransformationFilter(
                encryptor,
                new StringSink(out_ciphertext),
                BlockPaddingSchemeDef::PKCS_PADDING
            )
        );
    }
    catch (const CryptoPP::Exception& e) {
        printError(string("encryptAES256WithIV exception: ") + e.what());
        return false;
    }
    return true;
}

// AES256-CBC 복호화
bool Database::decryptAES256WithIV(const string& ciphertext,
    const string& iv_bytes,
    string& out_plaintext) const
{
    if (master_key.size() != 32 || iv_bytes.size() != AES::BLOCKSIZE) {
        printError("키 또는 IV 길이가 올바르지 않음");
        return false;
    }

    try {
        CBC_Mode<AES>::Decryption decryptor;
        SecByteBlock keyBytes(reinterpret_cast<const CryptoPP::byte*>(master_key.data()), master_key.size());
        SecByteBlock iv(reinterpret_cast<const CryptoPP::byte*>(iv_bytes.data()), iv_bytes.size());
        decryptor.SetKeyWithIV(keyBytes, keyBytes.size(), iv, iv.size());

        StringSource ss(
            ciphertext,
            true,
            new StreamTransformationFilter(
                decryptor,
                new StringSink(out_plaintext),
                BlockPaddingSchemeDef::PKCS_PADDING
            )
        );
    }
    catch (const CryptoPP::Exception& e) {
        printError(string("decryptAES256WithIV exception: ") + e.what());
        return false;
    }
    return true;
}

// --------------------------------------------------------
// getAllData: 메모리 상의 전체 엔트리들을 복사해서 반환
// --------------------------------------------------------
vector<PasswordEntry> Database::getAllData() const {
    return entries;
}

// --------------------------------------------------------
// addEntry: 새 PasswordEntry를 entries에 추가
// --------------------------------------------------------
bool Database::addEntry(const PasswordEntry& new_entry) {
    entries.push_back(new_entry);
    is_modified = true;
    return true;
}

// --------------------------------------------------------
// updateEntry: uid에 해당하는 항목을 찾아 필드 업데이트
// --------------------------------------------------------
bool Database::updateEntry(const string& uid, const unordered_map<string, string>& args)
{
    for (auto& e : entries) {
        if (e.UID == uid) {
            for (const auto& kv : args) {
                const string& key = kv.first;
                const string& value = kv.second;

                if (key == "label")          e.label = value;
                else if (key == "comments")  e.comments = value;
                else if (key == "favorite")  e.favorite = (value == "true");
                else if (key == "type")      e.type = value;
                else if (key == "name")      e.name = value;
                else if (key == "pwd")       e.pwd = value;
                else if (key == "id")        e.id = value;
                else if (key == "host")      e.host = value;
                else if (key == "port")      e.port = value;
                else if (key == "num")       e.num = value;
                else if (key == "master")    e.master = value;
                else if (key == "citizen")   e.citizen = value;
                else if (key == "eng_name")  e.eng_name = value;
                else if (key == "address")   e.address = value;
                else if (key == "birth_date")e.birth_date = value;
                else if (key == "content")   e.content = value;
                else if (key == "url")       e.url = value;
                else if (key == "email")     e.email = value;
                else if (key == "card_number") e.card_number = value;
                else if (key == "cvc")         e.cvc = value;
                else if (key == "last_day")    e.last_day = value;
                else if (key == "bank_name")   e.bank_name = value;
                // “created_at”, “modified_at” 같은 필드는 건너뜀
            }
            e.modified_at = getCurrentDateString();
            is_modified = true;
            return true;
        }
    }
    return false;
}

// --------------------------------------------------------
// deleteEntry: uid에 해당하는 항목 삭제
// --------------------------------------------------------
bool Database::deleteEntry(const string& uid) {
    auto it = remove_if(entries.begin(), entries.end(),
        [&](const PasswordEntry& e) { return e.UID == uid; });
    if (it == entries.end()) return false;
    entries.erase(it, entries.end());
    is_modified = true;
    return true;
}

// --------------------------------------------------------
// getEntry: uid에 해당하는 단일 항목 조회
// --------------------------------------------------------
PasswordEntry Database::getEntry(const string& uid) const {
    for (const auto& e : entries) {
        if (e.UID == uid) {
            return e;
        }
    }
    return PasswordEntry{};
}

// --------------------------------------------------------
// searchByTag: “type” 필드가 tag와 일치하는 모든 항목 반환
// --------------------------------------------------------
vector<PasswordEntry> Database::searchByTag(const string& tag) const {
    vector<PasswordEntry> rst;
    for (const auto& e : entries) {
        if (e.type == tag) {
            rst.push_back(e);
        }
    }
    return rst;
}

// 단순히 벡터 길이 반환
size_t Database::getPasswordCount() const {
    return entries.size();
}

// --------------------------------------------------------
// updateMasterKey: 새 비밀번호로 Argon2 키 유도 → 전체 파일 재암호화
// --------------------------------------------------------
bool Database::updateMasterKey(const string& new_user_password) {
    // 기존 키 메모리 덮어쓰기
    fill(master_key.begin(), master_key.end(), '\0');

    // 새로운 키 유도
    if (!deriveKey(new_user_password)) {
        printError("새로운 키 유도 실패");
        return false;
    }

    // in_memory_data 전체를 새 키로 암호화하여 파일 저장
    if (!saveToFile()) {
        printError("키 교체 후 파일 저장 실패");
        return false;
    }
    return true;
}

// --------------------------------------------------------
// loadFromFile: 파일 읽기 → 복호화 → JSON 파싱 → 메모리에 로드
// --------------------------------------------------------
bool Database::loadFromFile() {
    // 파일을 읽어 암호화된 바이너리 데이터를 가져옴
    string encrypted = readAllBytes();
    if (encrypted.empty()) {
        entries.clear();
        is_modified = false;
        return true;
    }

    // IV 분리 및 나머지를 암호문으로 처리
    if (encrypted.size() <= AES::BLOCKSIZE) {
        printError("Encrypted data too short to contain IV");
        return false;
    }
    string iv_bytes = encrypted.substr(0, AES::BLOCKSIZE);
    string cipher_bytes = encrypted.substr(AES::BLOCKSIZE);

    // IV를 사용해 복호화
    string plaintext;
    if (!decryptAES256WithIV(cipher_bytes, iv_bytes, plaintext)) {
        printError("파일 복호화 실패");
        return false;
    }

    // JSON 파싱 → entries 벡터로 변환
    try {
        json root = json::parse(plaintext);
        entries.clear();
        if (root.is_array()) {
            for (const auto& data : root) {
                PasswordEntry e;
                e.UID = data.value("UID", "");
                e.label = data.value("label", "");
                e.created_at = data.value("created_at", "");
                e.modified_at = data.value("modified_at", "");
                e.comments = data.value("comments", "");
                e.favorite = data.value("favorite", false);
                e.type = data.value("type", "");

                // 새 구조: JSON에서 개별 필드들을 바로 읽어들임
                e.name = data.value("name", "");
                e.pwd = data.value("pwd", "");
                e.id = data.value("id", "");
                e.host = data.value("host", "");
                e.port = data.value("port", "");
                e.num = data.value("num", "");
                e.master = data.value("master", "");
                e.citizen = data.value("citizen", "");
                e.eng_name = data.value("eng_name", "");
                e.address = data.value("address", "");
                e.birth_date = data.value("birth_date", "");
                e.content = data.value("content", "");
                e.url = data.value("url", "");
                e.email = data.value("email", "");
                e.card_number = data.value("card_number", "");
                e.cvc = data.value("cvc", "");
                e.last_day = data.value("last_day", "");
                e.bank_name = data.value("bank_name", "");

                entries.push_back(move(e));
            }
        }
    }
    catch (const exception& err) {
        printError(string("JSON 파싱 실패: ") + err.what());
        return false;
    }

    is_modified = false;
    return true;
}

// --------------------------------------------------------
// saveToFile: entries → JSON dump → 암호화 → 파일 쓰기
// --------------------------------------------------------
bool Database::saveToFile() {
    // entries 벡터를 JSON 배열로 직렬화
    json root = json::array();
    for (const auto& e : entries) {
        json data;
        data["UID"] = e.UID;
        data["label"] = e.label;
        data["created_at"] = e.created_at;
        data["modified_at"] = e.modified_at;
        data["comments"] = e.comments;
        data["favorite"] = e.favorite;
        data["type"] = e.type;

        // 새 구조: JSON에 개별 필드들 모두 추가
        data["name"] = e.name;
        data["pwd"] = e.pwd;
        data["id"] = e.id;
        data["host"] = e.host;
        data["port"] = e.port;
        data["num"] = e.num;
        data["master"] = e.master;
        data["citizen"] = e.citizen;
        data["eng_name"] = e.eng_name;
        data["address"] = e.address;
        data["birth_date"] = e.birth_date;
        data["content"] = e.content;
        data["url"] = e.url;
        data["email"] = e.email;
        data["card_number"] = e.card_number;
        data["cvc"] = e.cvc;
        data["last_day"] = e.last_day;
        data["bank_name"] = e.bank_name;

        root.push_back(data);
    }
    string plain = root.dump(); // 직렬화

    // 2) 랜덤 IV 생성 → IV || ciphertext
    string iv_bytes(AES::BLOCKSIZE, '\0');
    random_device rd;
    uniform_int_distribution<int> dist(0, 255);
    for (size_t i = 0; i < iv_bytes.size(); ++i) {
        iv_bytes[i] = static_cast<char>(dist(rd));
    }

    string cipher;
    if (!encryptAES256WithIV(plain, iv_bytes, cipher)) {
        printError("암호화 실패");
        return false;
    }

    // 3) IV + ciphertext 결합하여 파일에 쓰기
    string combined = iv_bytes + cipher;
    if (!writeAllBytes(combined)) {
        printError("파일 쓰기 실패");
        return false;
    }

    is_modified = false;
    return true;
}
