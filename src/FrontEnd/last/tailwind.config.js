/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/index.html"], // Tailwind가 클래스 사용 여부를 스캔할 파일 경로
  theme: {
    extend: {},                  // 기본 테마 확장 설정 공간
  },
  plugins: [],                   // 추가 Tailwind 플러그인 등록 공간
};
