#pragma once

#include <iostream>
#include <string>
#include "json_c.hpp" 

using json = nlohmann::json;

// Success.
inline void respondSuccess(const json& data = {}) {
    json j;
    j["status"] = true;
    j["data"] = data;    
    std::cout << j.dump() << "\n" << flush; 
}

// Error.
inline void respondError(const std::string& message) {
    json j;
    j["status"] = false;
    j["error_message"] = message;
    std::cout << j.dump() << "\n" << flush;
}
