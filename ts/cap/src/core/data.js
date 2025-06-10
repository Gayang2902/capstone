export const categoryData = {
  wifi: [
    { id: 'HomeNetwork', pw: 'MyWifiPass123' },
    { id: 'Office_WiFi', pw: 'Office2023!' },
    { id: 'GuestWiFi', pw: 'GuestAccess!2022' }
  ],
  server: [
    { id: 'root', pw: 'ServerRootPass!' },
    { id: 'deploy', pw: 'D3ploy#2025' }
  ],
  passbook: [
    { id: 'bank_user', pw: 'B@nk1234' }
  ],
  identity: [
    { id: 'kimcjh', pw: 'Secur3Id!' }
  ],
  security: [
    { id: '2FA_backup', pw: 'BackupCode#1' }
  ],
  web: [
    { id: 'github_user', pw: 'G1thubSecure!' }
  ],
  card: [
    { id: 'Visa_1234', pw: 'CardPass$42' }
  ]
};

export const iconMap = {
  wifi: 'fa-solid fa-wifi',
  server: 'fa-solid fa-server',
  passbook: 'fa-solid fa-book-open',
  identity: 'fa-solid fa-id-card',
  security: 'fa-solid fa-shield-alt',
  web: 'fa-solid fa-globe',
  card: 'fa-solid fa-credit-card'
};

export const colorMap = {
  wifi: 'text-blue-500',
  server: 'text-green-500',
  passbook: 'text-yellow-500',
  identity: 'text-teal-500',
  security: 'text-red-500',
  web: 'text-violet-500',
  card: 'text-pink-500'
};
