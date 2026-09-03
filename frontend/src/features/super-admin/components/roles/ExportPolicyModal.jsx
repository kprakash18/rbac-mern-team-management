export default function ExportPolicyModal({
  isOpen,
  exportFormat,
  roles,
  onClose,
  onChangeFormat,
  onDownload,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-md" id="modal-export-policy">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div
        className="relative bg-card-bg rounded-xl w-[460px] max-w-[92vw] shadow-2xl overflow-hidden border border-border-subtle z-[1000] animate-in zoom-in-95 duration-150 mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg bg-surface-container-lowest flex items-center justify-between border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Export RBAC Policies</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Generate machine-readable policy bundles
              </p>
            </div>
          </div>
          <button
            className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md">
          <div>
            <label className="block font-label-bold text-label-sm text-on-surface mb-xs">Export Format</label>
            <div className="grid grid-cols-2 gap-sm">
              <button
                type="button"
                className={`p-md rounded-xl text-left border cursor-pointer transition-all ${
                  exportFormat === 'opa'
                    ? 'border-primary bg-primary-container/20 text-on-surface'
                    : 'border-border-subtle bg-surface-container-low text-on-surface-variant'
                }`}
                onClick={() => onChangeFormat('opa')}
              >
                <div className="font-label-bold text-label-sm text-on-surface flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
                  <span>OPA Rego Bundle</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Open Policy Agent bundle for edge gatekeeper enforcements.
                </p>
              </button>

              <button
                type="button"
                className={`p-md rounded-xl text-left border cursor-pointer transition-all ${
                  exportFormat === 'terraform'
                    ? 'border-primary bg-primary-container/20 text-on-surface'
                    : 'border-border-subtle bg-surface-container-low text-on-surface-variant'
                }`}
                onClick={() => onChangeFormat('terraform')}
              >
                <div className="font-label-bold text-label-sm text-on-surface flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                  <span>Terraform HCL</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  IaC provider definitions for GitOps pipeline provisioning.
                </p>
              </button>
            </div>
          </div>

          <div className="p-sm bg-surface-container-low rounded-lg text-[12px] text-on-surface-variant">
            <span className="font-label-bold text-on-surface block mb-0.5">Summary to Export:</span>
            <span>
              Includes {roles.filter((r) => r.status === 'active').length} active roles, wildcard definitions, and
              custom permission matrices.
            </span>
          </div>
        </div>

        <div className="p-md bg-surface-container-low flex justify-end gap-xs border-t border-border-subtle shrink-0">
          <button
            type="button"
            className="h-9 px-md rounded-lg bg-card-bg text-on-surface hover:bg-surface-container font-label-bold text-label-sm shadow-xs transition-colors cursor-pointer border border-border-subtle"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-9 px-md rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-bold text-label-sm transition-colors cursor-pointer flex items-center gap-1"
            onClick={onDownload}
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Download Policy Bundle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
