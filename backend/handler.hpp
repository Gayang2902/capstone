#include <string>
#include <unordered_map>

#include "json_c.hpp"

using namespace std;
using json = nlohmann::json;

void initHandlers();

void handleOperation(
    const string& oper,
    const unordered_map<string, string>& args
);