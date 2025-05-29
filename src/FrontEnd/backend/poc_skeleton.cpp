// poc_skeleton.cpp
// Proof-of-Concept C++ binary skeleton for Electron IPC via stdin/stdout
// Compile: g++ poc_skeleton.cpp -o poc_skeleton

#include <iostream>
#include <string>

int main() {
    std::string line;
    // Read one line (JSON message) at a time
    while (std::getline(std::cin, line)) {
        // Detect command in incoming JSON (simple string search)
        if (line.find("\"cmd\":\"openFile\"") != std::string::npos) {
            // Respond with dummy recent files list
            std::cout << "{"
                         "\"status\":0,"
                         "\"cmd\":\"openFile\","
                         "\"result\":{\"recentFiles\":[\"file1.csv\",\"file2.csv\"]},"
                         "\"error\":null"
                         "}\n";
        }
        else if (line.find("\"cmd\":\"verifyMasterPwd\"") != std::string::npos) {
            // Dummy verification: always succeed
            std::cout << "{"
                         "\"status\":0,"
                         "\"cmd\":\"verifyMasterPwd\","
                         "\"result\":null,"
                         "\"error\":null"
                         "}\n";
        }
        else {
            // Unknown command
            std::cout << "{"
                         "\"status\":1,"
                         "\"cmd\":null,"
                         "\"result\":null,"
                         "\"error\":\"Unknown command\""
                         "}\n";
        }
        // Flush to ensure Electron receives the response immediately
        std::cout.flush();
    }
    return 0;
}