import { MOCK_RECENT_ACTIVITIES } from '../constants/superAdmin.constants';

const RESULT_STYLES = {
  success: 'bg-success-bg text-success-text',
  system: 'bg-surface-container text-on-surface-variant',
  failed: 'bg-error-bg text-error-text',
  pending: 'bg-warning-bg text-warning-text',
};

export default function RecentActivityFeed({ activities = MOCK_RECENT_ACTIVITIES }) {
  return (
    <div className="flex-1 lg:w-[65%] flex flex-col gap-md">
      <div className="flex justify-between items-end">
        <h2 className="font-headline-md text-on-surface">Recent Activity Feed</h2>
        <a className="font-label-bold text-primary hover:text-on-surface-variant transition-colors flex items-center gap-xs" href="#">
          View all in Audit Log
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
      <div className="bg-card-bg shadow-sm rounded-xl overflow-hidden w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container/30 border-b border-border-subtle">
              <th className="py-md px-lg font-label-bold text-on-surface-variant w-[15%]">Time</th>
              <th className="py-md px-lg font-label-bold text-on-surface-variant w-[25%]">Actor</th>
              <th className="py-md px-lg font-label-bold text-on-surface-variant w-[25%]">Action</th>
              <th className="py-md px-lg font-label-bold text-on-surface-variant w-[20%]">Target</th>
              <th className="py-md px-lg font-label-bold text-on-surface-variant w-[15%] text-right">Result</th>
            </tr>
          </thead>
          <tbody className="font-body-sm divide-y divide-border-subtle/50">
            {activities.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container/30 transition-colors group">
                <td className="py-md px-lg text-on-surface-variant whitespace-nowrap">{item.time}</td>
                <td className="py-md px-lg">
                  <div className="flex items-center gap-sm">
                    {item.actor.isSystem ? (
                      <div className="w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">{item.actor.icon || 'smart_toy'}</span>
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full ${item.actor.isError ? 'bg-error-container text-on-error' : 'bg-primary-container text-on-primary'} flex items-center justify-center font-label-bold text-[10px]`}>
                        {item.actor.initials}
                      </div>
                    )}
                    <span className="font-label-bold text-on-surface truncate">{item.actor.name}</span>
                  </div>
                </td>
                <td className="py-md px-lg text-on-surface">{item.action}</td>
                <td className="py-md px-lg font-mono text-[12px] text-on-surface-variant truncate">{item.target}</td>
                <td className="py-md px-lg text-right">
                  <span className={`inline-flex items-center px-sm py-1 rounded-full font-label-sm ${RESULT_STYLES[item.resultType] || RESULT_STYLES.system}`}>
                    {item.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
