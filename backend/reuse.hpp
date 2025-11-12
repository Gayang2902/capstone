#pragma once

#include <string>

#include "database.hpp" 

using namespace std;

void onGetReusedPasswords(const unordered_map<string, string>&);

void onGetReusedCount(const unordered_map<string, string>&);