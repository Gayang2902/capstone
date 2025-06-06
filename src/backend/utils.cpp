#include "utils.hpp"

using namespace std;

// ���� ��¥�� ���ڿ���
string getCurrentDateString() {
	auto now = chrono::system_clock::now();
	time_t t_c = chrono::system_clock::to_time_t(now);
	tm tm{};
#if defined(_WIN32) || defined(_WIN64)
	localtime_s(&tm, &t_c);
#else
	localtime_r(&t_c, &tm);
#endif
	std::ostringstream oss;
	oss << std::put_time(&tm, "%Y-%m-%d");
	return oss.str();
}

// ���� UID ���� (Ÿ�ӽ����� + ������ 6�ڸ��� �����)
string generateUID() {
	auto now = chrono::system_clock::now();
	auto micros = chrono::duration_cast<chrono::microseconds>(
		now.time_since_epoch())
		.count();

	mt19937_64 rng(static_cast<uint64_t>(micros));
	uniform_int_distribution<uint32_t> dist(0, 999999);

	ostringstream oss;
	oss << micros << setw(6) << setfill('0') << dist(rng);
	return oss.str();
}