#include <string>
#include <chrono>
#include <iomanip>
#include <random>
#include <sstream>

using namespace std;

// 현재 날짜를 문자열로
string getCurrentDateString();

// 고유 UID 생성 (타임스탬프 + 랜덤한 6자리를 사용함)
string generateUID();