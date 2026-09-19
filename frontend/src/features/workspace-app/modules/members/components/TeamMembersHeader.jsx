import { Button } from '@/shared/components';

function TeamMembersHeader({ canInvite, totalMembers, onInvite }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
      <div>
        <h1 className="font-display-title text-[24px] font-semibold text-on-surface tracking-tight">
          Team &amp; Members
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {totalMembers.toLocaleString()} active team members in workspace
        </p>
      </div>

      {canInvite ? (
        <Button icon="person_add" onClick={onInvite}>
          Invite Member
        </Button>
      ) : (
        <Button icon="lock" disabled title="Restricted">
          Invite Member
        </Button>
      )}
    </div>
  );
}

export default TeamMembersHeader;
