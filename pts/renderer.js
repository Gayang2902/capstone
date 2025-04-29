document.getElementById('login-btn').addEventListener('click', async () => {
    const pw = document.getElementById('master-password').value;

    const deriveResponse = await window.api.sendRequest({
        cmd: "derive_key",
        source: "user",
        session_id: "",
        data: { password: pw }
    });

    const aesKey = deriveResponse.data.AES_KEY;

    const decryptResponse = await window.api.sendRequest({
        cmd: "decrypt_db",
        source: "user",
        session_id: "",
        data: { AES_KEY: aesKey }
    });

    // 세션 할당 (임시)
    const session_id = "abc123"; // 실서비스에서는 backend가 발급

    console.log("세션 시작됨:", session_id);
});

document.getElementById('get-password').addEventListener('click', async () => {
    const response = await window.api.sendRequest({
        cmd: "get_password",
        source: "user",
        session_id: "abc123",
        data: {
            group: "site",
            url: "www.google.com",
            id: "binaryk01"
        }
    });

    alert("복호화된 비밀번호: " + response.data.password);
});
