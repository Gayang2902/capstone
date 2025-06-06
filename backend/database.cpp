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
    const size_t key_len = 32; // ��� Ű ����
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
        return false; // Ű �Ļ� ���� (�޸� ���� ��)
    }

    master_key.assign(reinterpret_cast<const char*>(out_key.data()), key_len);
    return true;
}

// ������ ���̳ʸ� ���� �о� string���� ��ȯ
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

// string�� ���Ͽ� ���̳ʸ� ���� ����
bool Database::writeAllBytes(const string& bytes) {
    ofstream ofs(file_path, ios::binary | ios::trunc);
    if (!ofs.is_open()) {
        return false;
    }
    ofs.write(bytes.data(), bytes.size());
    return true;
}

// AES256-CBC ��ȣȭ
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

// AES256-CBC ��ȣȭ
bool Database::decryptAES256WithIV(const string& ciphertext,
    const string& iv_bytes,
    string& out_plaintext) const
{
    if (master_key.size() != 32 || iv_bytes.size() != AES::BLOCKSIZE) {
        printError("Ű �Ǵ� IV ���̰� �ùٸ��� ����");
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
// getAllData: �޸� ���� ��ü ��Ʈ������ �����ؼ� ��ȯ
// --------------------------------------------------------
vector<PasswordEntry> Database::getAllData() const {
    return entries;
}

// --------------------------------------------------------
// addEntry: �� PasswordEntry�� entries�� �߰�
// --------------------------------------------------------
bool Database::addEntry(const PasswordEntry& new_entry) {
    entries.push_back(new_entry);
    is_modified = true;
    return true;
}

// --------------------------------------------------------
// updateEntry: uid�� �ش��ϴ� �׸��� ã�� �ʵ� ������Ʈ
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
                // ��created_at��, ��modified_at�� ���� �ʵ�� �ǳʶ�
            }
            e.modified_at = getCurrentDateString();
            is_modified = true;
            return true;
        }
    }
    return false;
}

// --------------------------------------------------------
// deleteEntry: uid�� �ش��ϴ� �׸� ����
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
// getEntry: uid�� �ش��ϴ� ���� �׸� ��ȸ
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
// searchByTag: ��type�� �ʵ尡 tag�� ��ġ�ϴ� ��� �׸� ��ȯ
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

// �ܼ��� ���� ���� ��ȯ
size_t Database::getPasswordCount() const {
    return entries.size();
}

// --------------------------------------------------------
// updateMasterKey: �� ��й�ȣ�� Argon2 Ű ���� �� ��ü ���� ���ȣȭ
// --------------------------------------------------------
bool Database::updateMasterKey(const string& new_user_password) {
    // ���� Ű �޸� �����
    fill(master_key.begin(), master_key.end(), '\0');

    // ���ο� Ű ����
    if (!deriveKey(new_user_password)) {
        printError("���ο� Ű ���� ����");
        return false;
    }

    // in_memory_data ��ü�� �� Ű�� ��ȣȭ�Ͽ� ���� ����
    if (!saveToFile()) {
        printError("Ű ��ü �� ���� ���� ����");
        return false;
    }
    return true;
}

// --------------------------------------------------------
// loadFromFile: ���� �б� �� ��ȣȭ �� JSON �Ľ� �� �޸𸮿� �ε�
// --------------------------------------------------------
bool Database::loadFromFile() {
    // ������ �о� ��ȣȭ�� ���̳ʸ� �����͸� ������
    string encrypted = readAllBytes();
    if (encrypted.empty()) {
        entries.clear();
        is_modified = false;
        return true;
    }

    // IV �и� �� �������� ��ȣ������ ó��
    if (encrypted.size() <= AES::BLOCKSIZE) {
        printError("Encrypted data too short to contain IV");
        return false;
    }
    string iv_bytes = encrypted.substr(0, AES::BLOCKSIZE);
    string cipher_bytes = encrypted.substr(AES::BLOCKSIZE);

    // IV�� ����� ��ȣȭ
    string plaintext;
    if (!decryptAES256WithIV(cipher_bytes, iv_bytes, plaintext)) {
        printError("���� ��ȣȭ ����");
        return false;
    }

    // JSON �Ľ� �� entries ���ͷ� ��ȯ
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

                // �� ����: JSON���� ���� �ʵ���� �ٷ� �о����
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
        printError(string("JSON �Ľ� ����: ") + err.what());
        return false;
    }

    is_modified = false;
    return true;
}

// --------------------------------------------------------
// saveToFile: entries �� JSON dump �� ��ȣȭ �� ���� ����
// --------------------------------------------------------
bool Database::saveToFile() {
    // entries ���͸� JSON �迭�� ����ȭ
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

        // �� ����: JSON�� ���� �ʵ�� ��� �߰�
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
    string plain = root.dump(); // ����ȭ

    // 2) ���� IV ���� �� IV || ciphertext
    string iv_bytes(AES::BLOCKSIZE, '\0');
    random_device rd;
    uniform_int_distribution<int> dist(0, 255);
    for (size_t i = 0; i < iv_bytes.size(); ++i) {
        iv_bytes[i] = static_cast<char>(dist(rd));
    }

    string cipher;
    if (!encryptAES256WithIV(plain, iv_bytes, cipher)) {
        printError("��ȣȭ ����");
        return false;
    }

    // 3) IV + ciphertext �����Ͽ� ���Ͽ� ����
    string combined = iv_bytes + cipher;
    if (!writeAllBytes(combined)) {
        printError("���� ���� ����");
        return false;
    }

    is_modified = false;
    return true;
}
