#pragma once

#include <string>

#include "database.hpp"

using namespace std;

// 전역 인스턴스
inline Database* db = nullptr;
inline string pending_path;
