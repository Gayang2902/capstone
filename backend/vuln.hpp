#pragma once

#include <string>

#include "database.hpp" 

void onGetVulnerablePasswordsStrong(const std::unordered_map<string, string>&);
void onGetVulnerablePasswordsNormal(const std::unordered_map<string, string>&);
void onGetVulnerablePasswordsWeak(const std::unordered_map<string, string>&);

void onGetStrongCount(const unordered_map<string, string>&);
void onGetNormalCount(const unordered_map<string, string>&);
void onGetWeakCount(const unordered_map<string, string>&);