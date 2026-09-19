import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

const getDefaultDateTime = (daysAhead = 0, hoursAhead = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(date.getHours() + hoursAhead);
  date.setMinutes(0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const getInitialFormData = () => ({
  title: '',
  message: '',
  type: 'OUTAGE',
  severity: 'P0 Critical Outage',
  scope: 'GLOBAL',
  targetWorkspaces: ['All Workspaces'],
  targetRoles: ['All Roles'],
  ackMode: 'READ_RECEIPT',
  ctaLabel: '',
  ctaUrl: '',
  startTiming: 'NOW',
  scheduledDate: getDefaultDateTime(0, 1),
  endTiming: 'DISMISSED',
  expireDate: getDefaultDateTime(7, 0),
});

function getEditFormData(broadcast) {
  return {
    title: broadcast.title || '',
    message: broadcast.message || broadcast.body || '',
    type: broadcast.type || 'OUTAGE',
    severity: broadcast.severity || 'P0 Critical Outage',
    scope: broadcast.scope || 'GLOBAL',
    targetWorkspaces: broadcast.targetWorkspaces?.length ? broadcast.targetWorkspaces : ['All Workspaces'],
    targetRoles: broadcast.targetRoles?.length ? broadcast.targetRoles : ['All Roles'],
    ackMode: broadcast.ackMode || 'READ_RECEIPT',
    ctaLabel: broadcast.cta?.label || '',
    ctaUrl: broadcast.cta?.url || '',
    startTiming: broadcast.status === 'SCHEDULED' ? 'SCHEDULED' : 'NOW',
    scheduledDate: broadcast.startsAt ? new Date(broadcast.startsAt).toISOString().slice(0, 16) : getDefaultDateTime(0, 1),
    endTiming: broadcast.expiresAt ? 'DATE' : 'DISMISSED',
    expireDate: broadcast.expiresAt ? new Date(broadcast.expiresAt).toISOString().slice(0, 16) : getDefaultDateTime(7, 0),
  };
}

function buildBroadcastPayload({ availableWorkspaces, broadcastToEdit, formData }) {
  const dynamicBreakdown = availableWorkspaces.map((workspace) => ({
    workspace: workspace.name,
    targeted: workspace.membersCount || 1,
    viewed: 0,
    acknowledged: 0,
  }));
  const totalTargeted = availableWorkspaces.reduce((acc, workspace) => acc + (workspace.membersCount || 1), 0);

  return {
    id: broadcastToEdit?.id || `bc-${Date.now()}`,
    title: formData.title,
    message: formData.message,
    type: formData.type,
    status: formData.startTiming === 'SCHEDULED' ? 'SCHEDULED' : 'ACTIVE',
    severity: formData.severity,
    scope: formData.scope,
    targetWorkspaces:
      formData.scope === 'GLOBAL'
        ? ['All Workspaces']
        : formData.targetWorkspaces.filter((workspace) => typeof workspace === 'string' && !workspace.includes('All Workspaces')),
    targetRoles:
      formData.scope === 'ROLE_SCOPED'
        ? formData.targetRoles.filter((role) => typeof role === 'string' && !role.includes('All Roles'))
        : ['All Roles'],
    ackMode: formData.ackMode,
    cta: formData.ctaLabel ? { label: formData.ctaLabel, url: formData.ctaUrl } : null,
    metrics: broadcastToEdit?.metrics || {
      targetedUsers: formData.scope === 'GLOBAL' ? totalTargeted : Math.max(1, Math.round(totalTargeted / 3)),
      viewedCount: 0,
      acknowledgedCount: 0,
    },
    workspaceBreakdown: broadcastToEdit?.workspaceBreakdown || dynamicBreakdown,
    roleBreakdown: broadcastToEdit?.roleBreakdown || [],
    recentAcks: [],
    startAt: formData.startTiming === 'SCHEDULED' ? formData.scheduledDate : new Date().toISOString(),
    endAt: formData.endTiming === 'DATE' ? formData.expireDate : null,
    createdAt: 'Just now',
    createdBy: 'Super Admin',
    timeLabel: formData.startTiming === 'SCHEDULED' ? `Scheduled for ${formData.scheduledDate.replace('T', ' ')}` : 'Live • Just published',
    stickyNotice: formData.ackMode === 'MANDATORY_ACK' ? 'Requires mandatory electronic acknowledgment' : 'Active banner',
  };
}

export function useBroadcastForm({ broadcastToEdit, isOpen, onClose, onSubmit }) {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData);
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    setActiveStep(1);
    Promise.allSettled([
      api.get('/api/teams?status=ACTIVE'),
      api.get('/api/roles?status=all'),
    ]).then(([teamsRes, rolesRes]) => {
      if (teamsRes.status === 'fulfilled') {
        const rawTeams = teamsRes.value.data?.data?.teams || teamsRes.value.data?.data || [];
        setAvailableWorkspaces(rawTeams.map((team) => ({
          id: team._id || team.id,
          name: team.name,
          membersCount: team.membersCount || 1,
        })));
      }
      if (rolesRes.status === 'fulfilled') {
        const rawRoles = rolesRes.value.data?.data || [];
        setAvailableRoles(rawRoles.map((role) => ({ id: role._id || role.id, name: role.name })));
      }
    });

    setFormData(broadcastToEdit ? getEditFormData(broadcastToEdit) : getInitialFormData());
  }, [isOpen, broadcastToEdit]);

  const workspaceNames = useMemo(() => availableWorkspaces.map((workspace) => workspace.name), [availableWorkspaces]);
  const roleNames = useMemo(() => availableRoles.map((role) => role.name), [availableRoles]);

  const updateForm = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;

    onSubmit(buildBroadcastPayload({ availableWorkspaces, broadcastToEdit, formData }));
    onClose();
  };

  return {
    activeStep,
    formData,
    roleNames,
    setActiveStep,
    setFormData,
    updateForm,
    workspaceNames,
    handleSubmit,
  };
}
