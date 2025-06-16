#pragma once

#include <string>
#include <vector>
#include <string>

#include "json_c.hpp"

using json = nlohmann::json;
using namespace std;

// ��й�ȣ ��Ʈ�� ����ü
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

    // ������ �о AES-256-CBC ��ȣȭ �� JSON���� �Ľ��Ͽ� inMemoryData�� ����
    // ������ ������ �� JSON ��ü�� �ʱ�ȭ
    bool loadFromFile();

    // inMemoryData�� JSON ���ڿ��� ����ȭ �� AES-256-CBC ��ȣȭ �� ���Ͽ� �����
    // return ���� �� true, ��ȣȭ/���� ���� �� false
    bool saveToFile();

    // �޸𸮿� �ε�� ��ü JSON �����͸� const ������ ��ȯ
    vector<PasswordEntry> getAllData() const;

    // ��й�ȣ �׸� �߰� (createPasswordEntry)
    // new_entry�� �ּ��� {"uid": "...", "master_key": "...", ...} ����
    bool addEntry(const PasswordEntry& new_entry);

    // ��й�ȣ �׸� ���� (updatePasswordEntry)
    // uid�� �ش��ϴ� �׸��� ã�� updateFields Ű/������ ���
    bool updateEntry(const string& uid, const unordered_map<string, string>& args);

    // ��й�ȣ �׸� ���� (deletePasswordEntry)
    // uid�� ã�� �� �����ߴٸ� true, ������ false
    bool deleteEntry(const string& uid);

    // uid�� �ش��ϴ� ���� �׸� ��ȸ (getPasswordEntry)
    // uid�� �ִٸ� �ش� PasswordEntry ��ü, ������ �� PasswordEntry ��ü({})
    PasswordEntry getEntry(const string& uid) const;

    // �±�(tag)�� �������� ��й�ȣ ��� ���͸� (getPasswordsByTag)
    // - inMemoryData["passwords"] �迭�� ��ȸ�ϸ�,
    // entry["tags"](�迭)�� tag�� ������ ��� ���Ϳ� �߰�
    vector<PasswordEntry> searchByTag(const string& tag) const;

    // ��ü ��й�ȣ ���� ��ȸ (getPasswordCount)
    size_t getPasswordCount() const;

    // ������Ű(Argon2 ��� AES Ű) �缳�� �� inMemoryData ��ü�� �� Ű�� ���ȣȭ�Ͽ� ���Ͽ� �����
    // ���� �� true (Ű ��ü �� ���� �Ϸ�), ���� �� false (���� Ű ����)
    bool updateMasterKey(const string& new_user_password);

private:
    string file_path;               //< ������ ���� ���
    string master_key;              //< Argon2�� ������ 32����Ʈ AES Ű (���̳ʸ� ���ڿ�)
    vector<PasswordEntry> entries;  //< ��ȣȭ�� �� �����͸� �޸�(��й�ȣ ��� ��)�� ����
    bool is_modified;               //< �޸� ���� ���� (true�� saveToFile �� �����)

    // ���� ��ü�� ���̳ʸ� ���� �о� std::string ��ȯ
    string readAllBytes() const;

    // ��ȣ��(���̳ʸ� Ȥ�� hex) �� ���Ͽ� �����
    bool writeAllBytes(const string& bytes);

    // Argon2id�� ����Ͽ� user_password + ���� ���(salt)�� 32����Ʈ Ű ����
    bool deriveKey(const string& user_password);

    // AES-256-CBC ��ȣȭ 
    bool encryptAES256WithIV(const string& plaintext,
        const string& iv_bytes,
        string& out_ciphertext) const;

    // AES-256-CBC ��ȣȭ
    bool decryptAES256WithIV(const string& ciphertext,
        const string& iv_bytes,
        string& out_plaintext) const;
};

