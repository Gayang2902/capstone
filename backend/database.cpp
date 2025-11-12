#include "database.hpp"

#include <fstream>
#include <iostream>
#include <algorithm>
#include <cstring>
#include <random>

#include <sodium.h>

#include "utils.hpp"
#include "json_c.hpp"

#include <cryptopp/aes.h>
#include <cryptopp/modes.h>
#include <cryptopp/filters.h>
#include <cryptopp/secblock.h>

using nlohmann::json;
using namespace CryptoPP;
using namespace std;

static void printError(const string& msg) {
    cerr << "[Database Error] " << msg << "\n";
}

// ====== 생성/소멸 ======
Database::Database(const string& file_path_, const string& user_password_)
    : file_path(file_path_),
    master_key(),
    user_password(user_password_),
    entries(),
    is_modified(false)
{
    // 여기는 KDF를 수행하지 않습니다.
    // - loadFromFile(): 파일에서 SALT를 읽고 파생
    // - saveToFile(): 새 SALT를 생성하고 파생
    if (sodium_init() == -1) {
        printError("[Database] sodium_init failed");
    }
}

Database::~Database() {
    // 민감 정보 메모리 덮기
    fill(master_key.begin(), master_key.end(), '\0');

    if (is_modified) {
        printError("Changes not saved!!!");
    }
}

// ====== 내부 유틸 ======
bool Database::deriveKey(const string& user_key, const unsigned char* salt) {
    const size_t key_len = 32; // AES-256
    vector<unsigned char> out_key(key_len);

    int ret = crypto_pwhash(
        out_key.data(), key_len,
        user_key.c_str(), user_key.size(),
        salt,
        crypto_pwhash_OPSLIMIT_MODERATE,
        crypto_pwhash_MEMLIMIT_MODERATE,
        crypto_pwhash_ALG_ARGON2ID13
    );
    if (ret != 0) {
        printError("Key derivation failed");
        return false;
    }

    master_key.assign(reinterpret_cast<const char*>(out_key.data()), key_len);
    return true;
}

string Database::readAllBytes() const {
    ifstream ifs(file_path, ios::binary);
    if (!ifs.is_open()) {
        return "";
    }
    ifs.seekg(0, ios::end);
    streamsize sz = ifs.tellg();
    ifs.seekg(0, ios::beg);
    if (sz <= 0) return "";
    string buffer;
    buffer.resize(static_cast<size_t>(sz));
    ifs.read(&buffer[0], sz);
    return buffer;
}

bool Database::writeAllBytes(const string& bytes) {
    ofstream ofs(file_path, ios::binary | ios::trunc);
    if (!ofs.is_open()) {
        return false;
    }
    ofs.write(bytes.data(), bytes.size());
    return true;
}

bool Database::encryptAES256WithIV(const string& plaintext,
    const string& iv_bytes,
    string& out_ciphertext) const
{
    if (master_key.size() != 32 || iv_bytes.size() != AES::BLOCKSIZE) {
        printError("Key or IV length is invalid.");
        return false;
    }

    try {
        CBC_Mode<AES>::Encryption enc;
        SecByteBlock key(reinterpret_cast<const CryptoPP::byte*>(master_key.data()), master_key.size());
        SecByteBlock iv(reinterpret_cast<const CryptoPP::byte*>(iv_bytes.data()), iv_bytes.size());
        enc.SetKeyWithIV(key, key.size(), iv, iv.size());

        StringSource ss(
            plaintext,
            true,
            new StreamTransformationFilter(
                enc,
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

bool Database::decryptAES256WithIV(const string& ciphertext,
    const string& iv_bytes,
    string& out_plaintext) const
{
    if (master_key.size() != 32 || iv_bytes.size() != AES::BLOCKSIZE) {
        printError("키 또는 IV 길이가 올바르지 않음");
        return false;
    }

    try {
        CBC_Mode<AES>::Decryption dec;
        SecByteBlock key(reinterpret_cast<const CryptoPP::byte*>(master_key.data()), master_key.size());
        SecByteBlock iv(reinterpret_cast<const CryptoPP::byte*>(iv_bytes.data()), iv_bytes.size());
        dec.SetKeyWithIV(key, key.size(), iv, iv.size());

        StringSource ss(
            ciphertext,
            true,
            new StreamTransformationFilter(
                dec,
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

// ====== JSON 변환 헬퍼 ======
PasswordEntry Database::jsonToEntry(const json& data) {
    PasswordEntry e{};
    e.UID = data.value("UID", "");
    e.label = data.value("label", "");
    e.created_at = data.value("created_at", "");
    e.modified_at = data.value("modified_at", "");
    e.comments = data.value("comments", "");
    e.favorite = data.value("favorite", false);
    e.type = data.value("type", "");

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
    return e;
}

json Database::entryToJson(const PasswordEntry& e) {
    json j;
    j["UID"] = e.UID;
    j["label"] = e.label;
    j["created_at"] = e.created_at;
    j["modified_at"] = e.modified_at;
    j["comments"] = e.comments;
    j["favorite"] = e.favorite;
    j["type"] = e.type;

    j["name"] = e.name;
    j["pwd"] = e.pwd;
    j["id"] = e.id;
    j["host"] = e.host;
    j["port"] = e.port;
    j["num"] = e.num;
    j["master"] = e.master;
    j["citizen"] = e.citizen;
    j["eng_name"] = e.eng_name;
    j["address"] = e.address;
    j["birth_date"] = e.birth_date;
    j["content"] = e.content;
    j["url"] = e.url;
    j["email"] = e.email;
    j["card_number"] = e.card_number;
    j["cvc"] = e.cvc;
    j["last_day"] = e.last_day;
    j["bank_name"] = e.bank_name;
    return j;
}

// ====== CRUD in-memory ======
vector<PasswordEntry> Database::getAllData() const {
    return entries;
}

bool Database::addEntry(const PasswordEntry& new_entry) {
    entries.push_back(new_entry);
    is_modified = true;
    return true;
}

bool Database::updateEntry(const string& uid, const unordered_map<string, string>& args) {
    for (auto& e : entries) {
        if (e.UID == uid) {
            for (const auto& kv : args) {
                const string& key = kv.first;
                const string& value = kv.second;

                if (key == "label")        e.label = value;
                else if (key == "comments")     e.comments = value;
                else if (key == "favorite")     e.favorite = (value == "true");
                else if (key == "type")         e.type = value;
                else if (key == "name")         e.name = value;
                else if (key == "pwd")          e.pwd = value;
                else if (key == "id")           e.id = value;
                else if (key == "host")         e.host = value;
                else if (key == "port")         e.port = value;
                else if (key == "num")          e.num = value;
                else if (key == "master")       e.master = value;
                else if (key == "citizen")      e.citizen = value;
                else if (key == "eng_name")     e.eng_name = value;
                else if (key == "address")      e.address = value;
                else if (key == "birth_date")   e.birth_date = value;
                else if (key == "content")      e.content = value;
                else if (key == "url")          e.url = value;
                else if (key == "email")        e.email = value;
                else if (key == "card_number")  e.card_number = value;
                else if (key == "cvc")          e.cvc = value;
                else if (key == "last_day")     e.last_day = value;
                else if (key == "bank_name")    e.bank_name = value;
            }
            e.modified_at = getCurrentDateString();
            is_modified = true;
            return true;
        }
    }
    return false;
}

bool Database::deleteEntry(const string& uid) {
    auto it = remove_if(entries.begin(), entries.end(),
        [&](const PasswordEntry& e) { return e.UID == uid; });
    if (it == entries.end()) return false;
    entries.erase(it, entries.end());
    is_modified = true;
    return true;
}

PasswordEntry Database::getEntry(const string& uid) const {
    for (const auto& e : entries) {
        if (e.UID == uid) return e;
    }
    return PasswordEntry{};
}

vector<PasswordEntry> Database::searchByTag(const string& tag) const {
    vector<PasswordEntry> rst;
    for (const auto& e : entries) {
        if (e.type == tag) rst.push_back(e);
    }
    return rst;
}

size_t Database::getPasswordCount() const {
    return entries.size();
}

// ====== 파일 I/O ======
// 파일 포맷: [SALT (crypto_pwhash_SALTBYTES)] [IV (AES::BLOCKSIZE)] [CIPHERTEXT...]
bool Database::loadFromFile() {
    string fileData = readAllBytes();
    if (fileData.empty()) {
        entries.clear();
        is_modified = false;
        return true; // 신규 파일로 간주
    }

    const size_t SALT_LEN = crypto_pwhash_SALTBYTES;
    const size_t IV_LEN = AES::BLOCKSIZE;

    if (fileData.size() <= (SALT_LEN + IV_LEN)) {
        printError("Encrypted data too short to contain header");
        return false;
    }

    const unsigned char* salt =
        reinterpret_cast<const unsigned char*>(fileData.data());
    string iv_bytes = fileData.substr(SALT_LEN, IV_LEN);
    string cipher = fileData.substr(SALT_LEN + IV_LEN);

    // 파생키 생성
    if (!deriveKey(user_password, salt)) {
        printError("Key derivation failed on load");
        return false;
    }

    // 복호화
    string plaintext;
    if (!decryptAES256WithIV(cipher, iv_bytes, plaintext)) {
        printError("Decryption failed");
        return false;
    }

    try {
        json root = json::parse(plaintext);
        entries.clear();
        if (root.is_array()) {
            for (const auto& item : root) {
                entries.push_back(jsonToEntry(item));
            }
        }
        else {
            printError("Root JSON is not an array");
            return false;
        }
    }
    catch (const exception& e) {
        printError(string("JSON parse error: ") + e.what());
        return false;
    }

    is_modified = false;
    return true;
}

bool Database::saveToFile() {
    // 메모리 → JSON
    json root = json::array();
    for (const auto& e : entries) {
        root.push_back(entryToJson(e));
    }
    string plain = root.dump();

    // 헤더 생성
    const size_t SALT_LEN = crypto_pwhash_SALTBYTES;
    const size_t IV_LEN = AES::BLOCKSIZE;

    // SALT
    vector<unsigned char> salt(SALT_LEN);
    randombytes_buf(salt.data(), SALT_LEN);

    // 새 SALT로 키 파생
    if (!deriveKey(user_password, salt.data())) {
        printError("Key derivation failed during save");
        return false;
    }

    // IV
    string iv_bytes(IV_LEN, '\0');
    {
        random_device rd;
        uniform_int_distribution<int> dist(0, 255);
        for (auto& ch : iv_bytes) ch = static_cast<char>(dist(rd));
    }

    // 암호화
    string cipher;
    if (!encryptAES256WithIV(plain, iv_bytes, cipher)) {
        printError("Encryption failed");
        return false;
    }

    // [salt | iv | cipher]로 결합
    string out;
    out.reserve(SALT_LEN + IV_LEN + cipher.size());
    out.append(reinterpret_cast<const char*>(salt.data()), SALT_LEN);
    out.append(iv_bytes);
    out.append(cipher);

    if (!writeAllBytes(out)) {
        printError("File write failed");
        return false;
    }

    is_modified = false;
    return true;
}

// ====== 마스터 키 교체 ======
bool Database::updateMasterKey(const string& new_user_password) {
    // 기존 대칭키 메모리 덮기
    fill(master_key.begin(), master_key.end(), '\0');

    // 사용자 비밀번호 교체
    user_password = new_user_password;

    // 새 SALT로 재암호화하여 저장
    if (!saveToFile()) {
        printError("키 교체 후 파일 저장 실패");
        return false;
    }
    return true;
}
