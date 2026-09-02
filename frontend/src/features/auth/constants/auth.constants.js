export const USE_MOCK_DATA = true;

export const MOCK_USERS = [
  {
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'invited@example.com',
    password: 'temp123Password!',
    name: 'Invited User',
    accountStatus: 'INVITED',
    mustChangePassword: true,
  },
  {
    email: 'suspended@example.com',
    password: 'password123',
    name: 'Suspended User',
    accountStatus: 'SUSPENDED',
    mustChangePassword: false,
  },
];
