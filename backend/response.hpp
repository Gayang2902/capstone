#pragma once

#include <iostream>
#include <string>
#include "json_c.hpp" 

using json = nlohmann::json;

// 성공 응답
inline void respondSuccess(const json& data = {}) {
    json j;
    j["status"] = true;
    j["data"] = data;    
    std::cout << j.dump() << "\n" << flush; 
}

// 에러 응답
inline void respondError(const std::string& message) {
    json j;
    j["status"] = false;
    j["error_message"] = message;
    std::cout << j.dump() << "\n" << flush;
}
