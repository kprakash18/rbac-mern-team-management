import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useApp } from '@/context/useApp';

export default function ManageMemberRoleModal({ isOpen, member, teamId, onClose, onSaveRole }) {
  const { activeWorkspace } = useApp();
  const effectiveTeamId = teamId || activeWorkspace?._id || activeWorkspace?.id;

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [memberStatus, setMemberStatus] = useState('Active');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch backend roles dynamically
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        setErrorMessage('');
        const res = await api.get('/api/roles', {
          params: { teamId: effectiveTeamId },
          headers: effectiveTeamId ? { 'x-team-id': effectiveTeamId } : {},
        });
        const roleList = res.data?.data || [];
        if (isMounted) {
          setRoles(roleList);

          // Find current role from backend list
          const currentRoleName = member?.role || member?.roles?.[0]?.name || 'Developer';
          const matched = roleList.find(
            (r) =>
              r._id === member?.roleId ||
              r._id === member?.roles?.[0]?._id ||
              r.name.toLowerCase() === currentRoleName.toLowerCase()
          );
          if (matched) {
            setSelectedRoleId(matched._id);
          } else if (roleList.length > 0) {
            setSelectedRoleId(roleList[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message ||
              err.response?.data?.error?.message ||
              'Failed to load roles from server.'
          );
        }
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    };

    loadRoles();

    if (member) {
      const isCurrentlySuspended =
        member.status === 'Suspended' ||
        member.status === 'SUSPENDED' ||
        member.status?.toLowerCase() === 'suspended';
      setMemberStatus(isCurrentlySuspended ? 'Suspended' : 'Active');
      setDepartment(member.department || 'Engineering');
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, member, effectiveTeamId]);

  if (!isOpen || !member) return null;

  const currentRole = roles.find((r) => r._id === selectedRoleId) || roles[0];
  const rolePermissions = currentRole?.permissions || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const membershipId = member.membershipId || member.id;
      const targetUserId = member.userId || member.user?._id || member.id;

      if (!effectiveTeamId) {
        throw new Error('Team context is missing. Please re-select workspace.');
      }
      if (!membershipId) {
        throw new Error('Membership identifier is missing.');
      }

      const isCurrentlySuspended =
        member.status === 'Suspended' ||
        member.status === 'SUSPENDED' ||
        member.status?.toLowerCase() === 'suspended';
      const isTargetSuspended = memberStatus === 'Suspended';

      // 1. Handle Status Change if modified
      if (isCurrentlySuspended !== isTargetSuspended) {
        const action = isTargetSuspended ? 'suspend' : 'reactivate';
        await api.patch(`/api/teams/${effectiveTeamId}/members/${membershipId}/${action}`);
      }

      // 2. Handle Role Change if modified
      const currentRoleId = member.roleId || member.roles?.[0]?._id;
      const currentRoleName = member.role || member.roles?.[0]?.name;
      const isRoleDifferent =
        (selectedRoleId && selectedRoleId !== currentRoleId) ||
        (currentRole && currentRole.name !== currentRoleName);

      if (isRoleDifferent && targetUserId && selectedRoleId) {
        await api.post(`/api/teams/${effectiveTeamId}/members/${targetUserId}/roles`, {
          roleId: selectedRoleId,
        });
      }

      const updatedMember = {
        ...member,
        role: currentRole?.name || member.role,
        teamRole: currentRole?.name || member.teamRole,
        roleId: selectedRoleId,
        department,
        status: memberStatus,
        permissions: rolePermissions.map((p) => (typeof p === 'string' ? p : p.key || p.name)),
      };

      onSaveRole(updatedMember);
      onClose();
    } catch (err) {
      console.error('Failed to update member role & status:', err);
      setErrorMessage(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to update member role and status.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-xs p-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-lg pb-md border-b border-border-subtle bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Manage Role &amp; Status
              </h3>
              <p className="text-body-sm text-[12px] text-on-surface-variant">
                Configure team permissions, role assignment, and account status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-lg mt-md p-3 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-center gap-2 text-body-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-lg flex-1 overflow-y-auto flex flex-col gap-lg">
          {/* Member Profile Summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-border-subtle">
            <div className="w-11 h-11 rounded-full bg-primary text-on-primary font-label-bold flex items-center justify-center text-label-md shrink-0 shadow-xs">
              {member.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-label-bold text-on-surface truncate text-[14px]">
                  {member.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    member.status === 'Suspended' || member.status === 'SUSPENDED'
                      ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                      : 'bg-success-bg text-success-text'
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <span className="text-body-sm text-[12px] text-on-surface-variant font-mono block truncate">
                {member.email}
              </span>
            </div>
          </div>

          {/* Membership Status Selector */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface-container-low/60 border border-border-subtle">
            <label className="text-label-sm font-label-bold text-on-surface flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">toggle_on</span>
                <span>Member Account Status</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  memberStatus === 'Active'
                    ? 'bg-success-bg text-success-text'
                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                }`}
              >
                {memberStatus}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMemberStatus('Active')}
                className={`py-2 px-3 rounded-lg border text-label-sm font-label-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  memberStatus === 'Active'
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface border-border-subtle hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Active</span>
              </button>

              <button
                type="button"
                onClick={() => setMemberStatus('Suspended')}
                className={`py-2 px-3 rounded-lg border text-label-sm font-label-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  memberStatus === 'Suspended'
                    ? 'bg-zinc-700 text-white border-zinc-700 shadow-xs dark:bg-zinc-600'
                    : 'bg-surface-container-lowest text-on-surface border-border-subtle hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                <span>Suspended</span>
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              {memberStatus === 'Active'
                ? 'Active members have full access to workspace tasks, team communications, and assigned capabilities.'
                : 'Suspended members are temporarily restricted from logging in and accessing workspace resources.'}
            </p>
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-bold text-on-surface flex items-center justify-between">
              <span>Assigned Workspace Role</span>
              {loadingRoles && (
                <span className="text-[11px] text-primary animate-pulse">Loading roles...</span>
              )}
            </label>

            {loadingRoles ? (
              <div className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-low flex items-center text-on-surface-variant text-[12px]">
                Loading backend roles...
              </div>
            ) : (
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-[13px]"
              >
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} {r.isSystemRole ? '(System Role)' : ''}
                  </option>
                ))}
              </select>
            )}

            {currentRole?.description && (
              <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5">
                {currentRole.description}
              </p>
            )}
          </div>

          {/* Department Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm font-label-bold text-on-surface">
              Department / Functional Unit
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border-subtle bg-surface-container-lowest text-on-surface font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px]"
              placeholder="e.g., Core Engineering, Security, Frontend"
            />
          </div>

          {/* Live Backend Permissions Preview */}
          <div className="flex flex-col gap-2">
            <span className="text-label-sm font-label-bold text-on-surface flex items-center justify-between">
              <span>Role Permissions &amp; Capabilities</span>
              <span className="text-[11px] text-on-surface-variant font-normal">
                {rolePermissions.length} granted permission{rolePermissions.length === 1 ? '' : 's'}
              </span>
            </span>

            <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {rolePermissions.length > 0 ? (
                rolePermissions.map((perm, i) => {
                  const permKey = typeof perm === 'string' ? perm : perm.key || perm.name;
                  const permDesc = typeof perm === 'object' ? perm.description : '';
                  return (
                    <span
                      key={i}
                      title={permDesc}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest text-on-surface border border-border-subtle text-[11px] font-medium shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">
                        check
                      </span>
                      <span>{permKey}</span>
                    </span>
                  );
                })
              ) : (
                <span className="text-[12px] text-on-surface-variant italic">
                  No explicit permissions configured for this role.
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-md border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-md py-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container text-label-sm font-label-bold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingRoles}
              className="px-lg py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-sm font-label-bold shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
