export const USE_MOCK_DATA = true;

export const MOCK_USERS = [
  {
    email: 'admin@platform.internal',
    password: 'password123',
    name: 'Alex Vance',
    role: 'Platform Super Admin',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'superadmin@company.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'Platform Super Admin',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    role: 'Platform Super Admin',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
  },
  {
    email: 'invited@example.com',
    password: 'temp123Password!',
    name: 'Invited User',
    role: 'Team Member',
    accountStatus: 'INVITED',
    mustChangePassword: true,
  },
  {
    email: 'suspended@example.com',
    password: 'password123',
    name: 'Suspended User',
    role: 'Team Member',
    accountStatus: 'SUSPENDED',
    mustChangePassword: false,
  },
];
