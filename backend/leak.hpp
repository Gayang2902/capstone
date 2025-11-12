#pragma once

#include <string>

#include "database.hpp" 

void onGetLeakedPasswords(const unordered_map<string, string>& args);

void onGetLeakedCount(const unordered_map<string, string>& args);