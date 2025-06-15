#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <chrono>
#include <sodium.h>
#include <cryptopp/filters.h>
#include <cryptopp/hex.h>
#include <cryptopp/sha.h>
#include <curl/curl.h>

#include "global.hpp"
#include "database.hpp"
#include "utils.hpp"
#include "response.hpp"
#include "leak.hpp"
#include "json_c.hpp"

/** 
* 1. ��й�ȣ �ؽ� ��� (SHA-1, 20bytes, CryptoPP ���)
* 2. 16���� �빮�� ������ 40���� ���ڿ��� ���ڵ�
* 3. K-�͸�(range) API ȣ�� ("Have I Been Pwned"�� range API�� ���)
* - ��ü �ؽð��� ������ ������ ���� �ƴ�, �ؽ� �� 5���ڸ� URL ��ο� ���Խ��� ��û ����
* - ���� ���信�� �ؽ� �޺κ�(suffix)�� ��ġ�ϴ� �׸��� �ִ��� �˻��Ͽ� ���� ���θ� �Ǵ�
* ����ڰ� ������ ���� ��й�ȣ�� ��ü �ؽ� ������� ���� ��й�ȣ �����ͺ��̽��� ���� ��
*/

using namespace std;
using json = nlohmann::json;

// callback �Լ�
static size_t curlWriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    string* s = static_cast<string*>(userp);
    size_t total = size * nmemb;
    s->append(static_cast<char*>(contents), total);
    return total;
}

static string sha1hex(const string& input) {
    // Crypto++ SHA1 �ؽ�
    CryptoPP::SHA1 hash;
    string digest;
    digest.resize(hash.DigestSize());
    hash.Update(reinterpret_cast<const unsigned char*>(input.data()), input.size());
    hash.Final(reinterpret_cast<unsigned char*>(&digest[0]));

    // 16���� �빮�� ���ڵ�
    string output;
    CryptoPP::HexEncoder encoder(new CryptoPP::StringSink(output), true); // �빮��
    encoder.Put(reinterpret_cast<const unsigned char*>(digest.data()), digest.size());
    encoder.MessageEnd();
    return output;
}

static bool isLeakedOnline(const string& hash40) {
    if (hash40.size() != 40) 
        return false;
    string prefix = hash40.substr(0, 5);
    string suffix = hash40.substr(5);

    string url = "https://api.pwnedpasswords.com/range/" + prefix; // �ؽ� �� �κ��� ��û�� ����
    CURL* curl = curl_easy_init();
    if (!curl) 
        return false;

    string response;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curlWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "MyApp LeakChecker");
    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) 
        return false;

    istringstream iss(response);
    string line;
    while (getline(iss, line)) {
        auto pos = line.find(':');
        if (pos != string::npos && line.substr(0, pos) == suffix) {
            return true;
        }
    }
    return false;
}

void onGetLeakedPasswords(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) {
        return;
    }

    vector<PasswordEntry> entries = db->getAllData();
    vector<json> leakedList;

    for (auto& e : entries) {
        if (!shouldConsiderPasswordForReused(e) || e.pwd.empty()) {
            continue;
        }
        string h = sha1hex(e.pwd);
        if (isLeakedOnline(h)) {
            leakedList.push_back(entryToJson(e, false));
        }
    }

    json data;
    data["data"] = move(leakedList);
    respondSuccess(data);
}

void onGetLeakedCount(const unordered_map<string, string>&) {
    if (!ensureDbInitialized()) return;

    vector<PasswordEntry> entries = db->getAllData();
    size_t totalLeakedEntries = 0;

    for (const auto& e : entries) {
        // ���� ���� üũ ��� ����
        if (!shouldConsiderPasswordForReused(e) || e.pwd.empty()) continue;
        // SHA-1 �ؽ� �� �¶���/�������� �˻�
        string h = sha1hex(e.pwd);
        if (isLeakedOnline(h)) {
            ++totalLeakedEntries;
        }
    }

    json data;
    data["total"] = totalLeakedEntries;
    respondSuccess(data);
}