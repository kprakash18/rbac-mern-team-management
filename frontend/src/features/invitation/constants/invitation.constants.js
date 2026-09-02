export const INVITATION_STATES = {
  NEW_USER: 'NEW_USER',
  EXISTING_USER: 'EXISTING_USER',
  INVALID_TOKEN: 'INVALID_TOKEN',
};

export const MOCK_INVITATIONS = {
  newUser: {
    workspaceName: 'Acme Engineering',
    role: 'Developer',
    email: 'you@company.com',
  },
  existingUser: {
    workspaceName: 'Acme Corp',
    role: 'Editor',
    inviterName: 'Sarah Jenkins',
    inviterAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUhm-a08dX5iYhYuk7BxWrYgBpkxX_vqkM6FW476UPQO-E_KML5pYSD2-D1fqoEyZr_Ohktxb8dBqSwz-GQ6_icGd5CTRrqgnrNEENeio4axT7PZrvpKi98zdyRrII5jfboEozWIF0V-1fNzFvFhNzewLX0EJIEcrscgiyQsgfhs2iyVDXUnlJzLKmqRH8aRJ3JHwJYtorc1PnZqGsA5E_lfKkCuvIIXlpr6gvvKjibXyPT3cS3NLI2g',
  },
};
