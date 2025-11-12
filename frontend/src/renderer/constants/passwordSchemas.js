export const typeIconClasses = {
  wifi: 'fa-solid fa-wifi text-indigo-500',
  website: 'fa-solid fa-globe text-blue-600',
  server: 'fa-solid fa-server text-blue-500',
  bankbook: 'fa-solid fa-book text-yellow-500',
  identity: 'fa-solid fa-id-card text-pink-500',
  security: 'fa-solid fa-shield-halved text-green-500',
  card: 'fa-solid fa-credit-card text-teal-500',
};

export const typeAccentColors = {
  wifi: '#6366F1',
  website: '#2563EB',
  server: '#3B82F6',
  bankbook: '#EAB308',
  identity: '#EC4899',
  security: '#10B981',
  card: '#14B8A6',
};

export const fieldConfig = {
  wifi: [
    { key: 'name', labelKey: 'common.fields.name' },
    { key: 'pwd', labelKey: 'common.fields.password' },
  ],
  server: [
    { key: 'id', labelKey: 'common.fields.id' },
    { key: 'pwd', labelKey: 'common.fields.password' },
    { key: 'host', labelKey: 'common.fields.host' },
    { key: 'port', labelKey: 'common.fields.port' },
  ],
  bankbook: [
    { key: 'bank_name', labelKey: 'common.fields.bankName' },
    { key: 'num', labelKey: 'common.fields.accountNumber' },
    { key: 'master', labelKey: 'common.fields.accountHolder' },
    { key: 'pwd', labelKey: 'common.fields.accountPassword' },
  ],
  identity: [
    { key: 'name', labelKey: 'common.fields.name' },
    { key: 'eng_name', labelKey: 'common.fields.englishName' },
    { key: 'address', labelKey: 'common.fields.address' },
    { key: 'birth_date', labelKey: 'common.fields.birthday' },
    { key: 'citizen', labelKey: 'common.fields.nationalId' },
  ],
  security: [{ key: 'content', labelKey: 'common.fields.content' }],
  website: [
    { key: 'url', labelKey: 'common.fields.url' },
    { key: 'id', labelKey: 'common.fields.id' },
    { key: 'pwd', labelKey: 'common.fields.password' },
    { key: 'email', labelKey: 'common.fields.email' },
  ],
  card: [
    { key: 'bank_name', labelKey: 'common.fields.bankName' },
    { key: 'name', labelKey: 'common.fields.accountHolder' },
    { key: 'card_number', labelKey: 'common.fields.cardNumber' },
    { key: 'cvc', labelKey: 'common.fields.cvc' },
    { key: 'last_day', labelKey: 'common.fields.expiry' },
  ],
};
