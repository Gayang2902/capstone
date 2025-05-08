TARGET = dph_tool.exe
CC = gcc
CFLAGS = -Wall -O2 -Iinclude -Iargon2/include
SRC = src/main.c src/argon2_kdf.c src/encrypt_module.c src/decrypt_module.c src/xml_handler.c src/aes_wrapper.c src/aes_cbc_impl.c src/rand_bytes.c argon2/src/argon2.c argon2/src/core.c argon2/src/encoding.c argon2/src/thread.c argon2/src/ref.c argon2/src/blake2/blake2b.c src/password_policy.c

OBJ = $(SRC:.c=.o)

all:
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC) -lbcrypt

clean:
	del /Q *.exe
	del /Q src\*.o
