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
* 1. 비밀번호 해시 계산 (SHA-1, 20bytes, CryptoPP 사용)
* 2. 16진수 대문자 형식의 40글자 문자열로 인코딩
* 3. K-익명성(range) API 호출 ("Have I Been Pwned"의 range API를 사용)
* - 전체 해시값을 서버에 보내는 것이 아닌, 해시 앞 5글자만 URL 경로에 포함시켜 요청 전달
* - 받은 응답에서 해시 뒷부분(suffix)과 일치하는 항목이 있는지 검사하여 유출 여부를 판단
* 사용자가 저장한 실제 비밀번호나 전체 해시 노출없이 유출 비밀번호 데이터베이스와 대조 비교
*/

using namespace std;
using json = nlohmann::json;

// callback 함수
static size_t curlWriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    string* s = static_cast<string*>(userp);
    size_t total = size * nmemb;
    s->append(static_cast<char*>(contents), total);
    return total;
}

static string sha1hex(const string& input) {
    // Crypto++ SHA1 해시
    CryptoPP::SHA1 hash;
    string digest;
    digest.resize(hash.DigestSize());
    hash.Update(reinterpret_cast<const unsigned char*>(input.data()), input.size());
    hash.Final(reinterpret_cast<unsigned char*>(&digest[0]));

    // 16진수 대문자 인코딩
    string output;
    CryptoPP::HexEncoder encoder(new CryptoPP::StringSink(output), true); // 대문자
    encoder.Put(reinterpret_cast<const unsigned char*>(digest.data()), digest.size());
    encoder.MessageEnd();
    return output;
}

// 유출 여부 확인
static bool isLeakedOnline(const string& hash40) {
    if (hash40.size() != 40) return false;
    string prefix = hash40.substr(0, 5);
    string suffix = hash40.substr(5);

    //cerr << "[DEBUG] Checking leak for hash: " << hash40 << " (prefix=" << prefix << ", suffix=" << suffix << ")\n";

    // libcurl 전역 초기화가 필요
    string url = string("https://api.pwnedpasswords.com/range/") + prefix;
    CURL* curl = curl_easy_init();
    if (!curl) {
        cerr << "[DEBUG] curl init failed\n";
        return false;
    }

    string response;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curlWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    //// 디버깅용 SSL 옵션
    //curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
    //curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);
    //curl_easy_setopt(curl, CURLOPT_USERAGENT, "LeakChecker/Debug");

    CURLcode res = curl_easy_perform(curl);
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    curl_easy_cleanup(curl);

    //cerr << "[DEBUG] curl result=" << res << ", http_code=" << http_code
    //    << ", response_len=" << response.size() << "\n";
    //if (res != CURLE_OK || http_code != 200) return false;

    //// 응답 샘플
    //cerr << "[DEBUG] response sample: " << response.substr(0, min<size_t>(200, response.size())) << "...\n";

    istringstream iss(response);
    string line;
    while (getline(iss, line)) {
        auto pos = line.find(':');
        if (pos != string::npos && line.substr(0, pos) == suffix) {
            //cerr << "[DEBUG] Leak found: " << line << "\n";
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
        // 유출 여부 체크 대상 필터
        if (!shouldConsiderPasswordForReused(e) || e.pwd.empty()) continue;
        // SHA-1 해시 및 온라인/오프라인 검사
        string h = sha1hex(e.pwd);
        if (isLeakedOnline(h)) {
            ++totalLeakedEntries;
        }
    }

    json data;
    data["total"] = totalLeakedEntries;
    respondSuccess(data);
}