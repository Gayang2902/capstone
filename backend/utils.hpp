#include <string>
#include <chrono>
#include <iomanip>
#include <random>
#include <sstream>

using namespace std;

// ���� ��¥�� ���ڿ���
string getCurrentDateString();

// ���� UID ���� (Ÿ�ӽ����� + ������ 6�ڸ��� �����)
string generateUID();