/**
 * In-memory reference registry for sharing created document instances and IDs across seeders.
 */
class ReferenceRegistry {
  constructor() {
    this.reset();
  }

  reset() {
    this.permissions = new Map(); // key -> Permission document
    this.roles = new Map(); // name -> Role document
    this.users = new Map(); // email -> User document
    this.teams = new Map(); // name -> Team document
    this.memberships = new Map(); // `${userEmail}:${teamName}` -> Membership document
    this.tasks = new Map(); // identifier/title -> Task document
    this.accessRequests = new Map();
    this.accessGrants = new Map();
    this.invitations = new Map();
    this.rawInvitationTokens = new Map(); // email -> raw token (for test output summary only)
  }
}

export const seedContext = new ReferenceRegistry();
