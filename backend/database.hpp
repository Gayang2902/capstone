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
    /**
     * @param file_path       : �����͸� ������(�Ǵ� �ҷ���) ���� ���
     * @param user_key        : ����ڰ� �Է��� ������ ��й�ȣ (Argon2�� AES Ű�� ����)
     */
    Database(const string& file_path,
        const string& user_key);
    ~Database();

    /// 1) ������ �о AES-256-CBC ��ȣȭ �� JSON���� �Ľ��Ͽ� inMemoryData�� ����
    ///    ������ ������ �� JSON ��ü�� �ʱ�ȭ
    /// @return ���� �� true, �б�/��ȣȭ/�Ľ� ���� �� false
    bool loadFromFile();

    /// 2) inMemoryData�� JSON ���ڿ��� ����ȭ �� AES-256-CBC ��ȣȭ �� ���Ͽ� �����
    /// @return ���� �� true, ��ȣȭ/���� ���� �� false
    bool saveToFile();

    /// 3) �޸𸮿� �ε�� ��ü JSON �����͸� const ������ ��ȯ
    vector<PasswordEntry> getAllData() const;

    /// 4a) ��й�ȣ �׸� �߰� (createPasswordEntry)
    ///     new_entry�� �ּ��� {"uid": "...", "cipher": "...", ...} ���¿��� ��
    /// @return ���� �߰� �� true (is_modified=true), �ƴϸ� false
    bool addEntry(const PasswordEntry& new_entry);

    /// 4b) ��й�ȣ �׸� ���� (updatePasswordEntry)
    ///     uid�� �ش��ϴ� �׸��� ã�� updateFields Ű/������ ���
    /// @return ���� ���� �� true, uid�� ������ false
    bool updateEntry(const std::string& uid, const std::unordered_map<std::string, std::string>& args);

    /// 4c) ��й�ȣ �׸� ���� (deletePasswordEntry)
    /// @return uid�� ã�� �� �����ߴٸ� true, ������ false
    bool deleteEntry(const std::string& uid);

    /// 4d) uid�� �ش��ϴ� ���� �׸� ��ȸ (getPasswordEntry)
    /// @return uid�� �ִٸ� �ش� PasswordEntry ��ü, ������ �� PasswordEntry ��ü({})
    PasswordEntry getEntry(const std::string& uid) const;

    /// 5) �±�(tag)�� �������� ��й�ȣ ��� ���͸� (getPasswordsByTag)
    ///     - inMemoryData["passwords"] �迭�� ��ȸ�ϸ�,
    ///       entry["tags"](�迭)�� tag�� ������ ��� ���Ϳ� �߰�
    std::vector<PasswordEntry> searchByTag(const std::string& tag) const;

    /// 6) ��ü ��й�ȣ ���� ��ȸ (getPasswordCount)
    size_t getPasswordCount() const;

    /// 7) ������Ű(Argon2 ��� AES Ű) �缳�� �� inMemoryData ��ü�� �� Ű�� ���ȣȭ�Ͽ� ���Ͽ� �����
    /// @param new_user_password : ���ο� ������ ��й�ȣ
    /// @return ���� �� true (Ű ��ü �� ���� �Ϸ�), ���� �� false (���� Ű ����)
    bool updateMasterKey(const std::string& new_user_password);

private:
    std::string file_path;    ///< ������ ���� ���
    std::string master_key;   ///< Argon2�� ������ 32����Ʈ AES Ű (���̳ʸ� ���ڿ�)
    vector<PasswordEntry> entries;      ///< ��ȣȭ�� �� �����͸� �޸�(��й�ȣ ��� ��)�� ����
    bool is_modified;         ///< �޸� ���� ���� (true�� saveToFile �� �����)

    /// @return ���� ��ü�� ���̳ʸ� ���� �о� std::string ��ȯ
    std::string readAllBytes() const;

    /// @param bytes : ��ȣ��(���̳ʸ� Ȥ�� hex) �� ���Ͽ� �����
    /// @return ���� �� true, ���� ���� �� false
    bool writeAllBytes(const std::string& bytes);

    /// ���� ����: Argon2id�� ����Ͽ� user_password + ���� ���(salt)�� 32����Ʈ Ű ����
    bool deriveKey(const std::string& user_password);

    /// ���� ����: AES-256-CBC ��ȣȭ (Ű�� master_key, IV�� 16����Ʈ 0)
    /// @param plaintext      : �� ���ڿ�
    /// @param out_ciphertext : ��ȣ���� ���̳ʸ� ���·� ä��
    /// @return ���� �� true, ���� �� false
    bool encryptAES256WithIV(const std::string& plaintext,
        const std::string& iv_bytes,
        std::string& out_ciphertext) const;

    /// ���� ����: AES-256-CBC ��ȣȭ (Ű�� master_key, IV�� 16����Ʈ 0)
    /// @param ciphertext     : ���̳ʸ� ��ȣ��
    /// @param out_plaintext  : ��ȣȭ�� �� ���ڿ�
    /// @return ���� �� true, ���� �� false
    bool decryptAES256WithIV(const std::string& ciphertext,
        const std::string& iv_bytes,
        std::string& out_plaintext) const;
};

