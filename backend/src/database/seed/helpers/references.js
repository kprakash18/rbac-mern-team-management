class ReferenceRegistry {
  constructor() {
    this.reset();
  }

  reset() {
    this.permissions = new Map();
    this.roles = new Map();
    this.users = new Map();
    this.teams = new Map();
    this.memberships = new Map();
    this.tasks = new Map();
    this.accessRequests = new Map();
    this.accessGrants = new Map();
    this.invitations = new Map();
    this.rawInvitationTokens = new Map();
  }
}

export const seedContext = new ReferenceRegistry();
