// 폼 템플릿 (카테고리별 입력 폼, “새 비밀번호 추가” 모달에서 사용)
// ───── 여기에 숨겨진 favorite + comments 필드를 모두 추가했습니다 ─────
export const formTemplates = {
  wifi: `
    <form class="details-form space-y-4">
      <div>
        <label for="label-wifi" class="block text-sm font-medium text-gray-700">Label</label>
        <input id="label-wifi" name="label" type="text" placeholder="예: 집 Wi-Fi, 사무실 등"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="wifi-ssid" class="block text-sm font-medium text-gray-700">SSID</label>
        <input id="wifi-ssid" name="ssid" type="text" placeholder="Wi-Fi 이름"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="wifi-pw" class="block text-sm font-medium text-gray-700">Password</label>
        <input id="wifi-pw" name="password" type="password" placeholder="비밀번호"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>

      <!-- 숨겨진 favorite 필드 (기본값 false) -->
      <input type="hidden" name="favorite" value="false" />

      <!-- Comments 필드 (보임) -->
      <div>
        <label for="comments-wifi" class="block text-sm font-medium text-gray-700">Comments</label>
        <textarea id="comments-wifi" name="comments" rows="3" placeholder="추가로 메모할 내용이 있으면 입력하세요"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 resize-none"></textarea>
      </div>

      <button type="submit" class="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        저장
      </button>
    </form>
  `,
  server: `
    <form class="details-form space-y-4">
      <div>
        <label for="label-server" class="block text-sm font-medium text-gray-700">Label</label>
        <input id="label-server" name="label" type="text" placeholder="예: AWS 서버, 테스트 서버 등"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="server-id" class="block text-sm font-medium text-gray-700">ID</label>
        <input id="server-id" name="serverId" type="text" placeholder="서버 계정 ID"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="server-pw" class="block text-sm font-medium text-gray-700">Password</label>
        <input id="server-pw" name="password" type="password" placeholder="비밀번호"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="server-host" class="block text-sm font-medium text-gray-700">Host</label>
        <input id="server-host" name="host" type="text" placeholder="서버 호스트"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="server-port" class="block text-sm font-medium text-gray-700">Port</label>
        <input id="server-port" name="port" type="number" placeholder="포트 번호"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>

      <input type="hidden" name="favorite" value="false" />

      <div>
        <label for="comments-server" class="block text-sm font-medium text-gray-700">Comments</label>
        <textarea id="comments-server" name="comments" rows="3" placeholder="추가로 메모할 내용이 있으면 입력하세요"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 resize-none"></textarea>
      </div>

      <button type="submit" class="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        저장
      </button>
    </form>
  `,
  passbook: `
    <form class="details-form space-y-4">
      <div>
        <label for="label-passbook" class="block text-sm font-medium text-gray-700">Label</label>
        <input id="label-passbook" name="label" type="text" placeholder="예: 주거래 통장, 보조 통장 등"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="passbook-accnum" class="block text-sm font-medium text-gray-700">Account Number</label>
        <input id="passbook-accnum" name="accountNumber" type="text" placeholder="계좌 번호"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="passbook-accpw" class="block text-sm font-medium text-gray-700">Account Password</label>
        <input id="passbook-accpw" name="accountPassword" type="password" placeholder="계좌 비밀번호"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="passbook-bankname" class="block text-sm font-medium text-gray-700">Bank Name</label>
        <input id="passbook-bankname" name="bankName" type="text" placeholder="은행 이름"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>

      <input type="hidden" name="favorite" value="false" />

      <div>
        <label for="comments-passbook" class="block text-sm font-medium text-gray-700">Comments</label>
        <textarea id="comments-passbook" name="comments" rows="3" placeholder="추가로 메모할 내용이 있으면 입력하세요"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 resize-none"></textarea>
      </div>

      <button type="submit" class="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        저장
      </button>
    </form>
  `,
  identity: `
    <form class="details-form space-y-4">
      <div>
        <label for="label-identity" class="block text-sm font-medium text-gray-700">Label</label>
        <input id="label-identity" name="label" type="text" placeholder="예: 주민등록증, 여권 등"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="identity-name" class="block text-sm font-medium text-gray-700">Name</label>
        <input id="identity-name" name="name" type="text" placeholder="이름"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="identity-citizen" class="block text-sm font-medium text-gray-700">Citizen ID</label>
        <input id="identity-citizen" name="citizenId" type="text" placeholder="주민등록번호"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>
      <div>
        <label for="identity-address" class="block text-sm font-medium text-gray-700">Address</label>
        <input id="identity-address" name="address" type="text" placeholder="주소"
               class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
      </div>

      <input type="hidden" name="favorite" value="false" />

      <div>
        <label for="comments-identity" class="block text-sm font-medium text-gray-700">Comments</label>
        <textarea id="comments-identity" name="comments" rows="3" placeholder="추가로 메모할 내용이 있으면 입력하세요"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 resize-none"></textarea>
      </div>

      <button type="submit" class="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        저장
      ```  
}