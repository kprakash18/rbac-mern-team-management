import { useState } from 'react';
import { MOCK_USER_WORKSPACES } from '@/constants';
import WorkspaceListItem from '../components/WorkspaceList';

export default function WorkspacesPage({ onWorkspaceSelected }) {
  const [workspaces] = useState(MOCK_USER_WORKSPACES);
  const [rememberChoice, setRememberChoice] = useState(false);

  const handleSelect = (workspace) => {
    console.log('Selected workspace:', workspace, { rememberChoice });
    if (onWorkspaceSelected) {
      onWorkspaceSelected(workspace);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20">
        <div className="h-16 max-w-7xl mx-auto px-container-margin flex items-center justify-between">
          <div className="flex items-center gap-stack-sm">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/b2b_saas_logo.png"
            />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Enterprise SaaS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-gutter">
            <a
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#overview"
            >
              Overview
            </a>
            <a
              className="font-label-md text-label-md text-primary font-bold underline underline-offset-4"
              href="#workspaces"
            >
              Workspaces
            </a>
            <a
              className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#help"
            >
              Support
            </a>
          </nav>

          <div className="flex items-center gap-stack-md">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="w-full pt-16 bg-surface flex-1 flex flex-col justify-center items-center py-section-gap">
        <div className="w-full max-w-lg px-container-margin md:px-0">
          <div className="mb-stack-lg text-center">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">
              Choose your workspace
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Select a team to start working
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-md p-stack-md flex flex-col gap-unit border border-outline-variant/20">
            {workspaces.map((workspace, index) => (
              <div key={workspace.id} className="flex flex-col">
                <WorkspaceListItem
                  workspace={workspace}
                  onSelect={handleSelect}
                />
                {index < workspaces.length - 1 && (
                  <div className="h-px bg-surface-container-high mx-stack-md my-1" />
                )}
              </div>
            ))}
          </div>

          {/* Remember Choice Checkbox */}
          <div className="mt-stack-lg text-center">
            <label className="flex items-center justify-center gap-stack-sm cursor-pointer group select-none">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="peer h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer"
                />
              </div>
              <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                Remember my choice
              </span>
            </label>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-stack-lg border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-container-margin flex flex-col md:flex-row justify-between items-center gap-stack-lg">
          <div className="flex items-center gap-stack-sm">
            <img
              alt="Logo"
              className="h-6 w-auto grayscale opacity-50"
              src="/b2b_saas_logo.png"
            />
            <span className="font-label-md text-label-md text-on-surface-variant">
              © 2024 Enterprise SaaS Inc.
            </span>
          </div>
          <div className="flex gap-gutter">
            <a
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface"
              href="#privacy"
            >
              Privacy
            </a>
            <a
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface"
              href="#terms"
            >
              Terms
            </a>
            <a
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface"
              href="#support"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
