#include <unordered_map>
#include <unordered_set>
#include <string>
#include <functional>
#include <chrono>
#include <iomanip>
#include <random>
#include <sstream>
#include <cctype>

#include "handler.hpp"
#include "response.hpp"
#include "database.hpp"
#include "utils.hpp"

using namepsace std;

using HandlerFunc = function<void(const unordered_map<string, string>&)>;
