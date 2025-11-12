const DEFAULT_ENDPOINT = 'http://iina.cc:40000/api/chat';

const resolveEndpoint = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CHATBOT_API) {
    return import.meta.env.VITE_CHATBOT_API;
  }
  return DEFAULT_ENDPOINT;
};

/**
 * @param {string} userMessage 사용자가 입력한 메시지
 * @returns {Promise<string>} LLM 응답 텍스트
 */
export async function getLLMResponse(userMessage) {
  const API_ENDPOINT = resolveEndpoint();

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: userMessage }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류 상세 (상태 코드:', response.status, '):', errorText);
      throw new Error(`LLM 서버 통신 오류! 상태: ${response.status}`);
    }

    const data = await response.json();
    if (data == null) {
      return '응답이 비어 있습니다.';
    }

    const candidates = [
      data.answer,
      data.response_text,
      data.generated_text,
      data.text,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    if (Array.isArray(data.references) && data.references.length > 0) {
      return data.references.map((ref) => `• ${ref}`).join('\n');
    }

    if (typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error.trim();
      }
      if (typeof data.question === 'string' && data.question.trim()) {
        return `질문 "${data.question.trim()}"에 대한 명확한 답변을 찾지 못했습니다.`;
      }
    }

    return '응답을 이해하지 못했어요.';
  } catch (error) {
    console.error('LLM API 호출 중 오류 발생:', error);
    return '죄송합니다. 서버 연결 또는 응답 처리 과정에 문제가 발생했습니다. (인증/CORS 확인)';
  }
}
