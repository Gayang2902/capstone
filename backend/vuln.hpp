#pragma once

#include <string>

#include "database.hpp" 

void onGetVulnerablePasswords(const unordered_map<string, string>& args);

void onGetVulnCount(const unordered_map<string, string>& args);