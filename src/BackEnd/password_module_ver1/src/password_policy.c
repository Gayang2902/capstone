#include "password_policy.h"
#include <string.h>
#include <ctype.h>

int is_password_strong(const char *password) {
    int len = strlen(password);
    if (len < 10) return 0;

    int has_upper = 0, has_lower = 0, has_digit = 0, has_special = 0;

    for (int i = 0; i < len; i++) {
        if (isupper((unsigned char)password[i])) has_upper = 1;
        else if (islower((unsigned char)password[i])) has_lower = 1;
        else if (isdigit((unsigned char)password[i])) has_digit = 1;
        else has_special = 1;
    }

    if (has_upper && has_lower && has_digit && has_special)
        return 1;  // strong
    else
        return 0;  // weak
}
