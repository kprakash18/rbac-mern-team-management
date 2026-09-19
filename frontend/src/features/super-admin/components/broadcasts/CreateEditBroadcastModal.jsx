import BroadcastAudienceStep from './create-edit/BroadcastAudienceStep';
import BroadcastBasicStep from './create-edit/BroadcastBasicStep';
import BroadcastModalShell from './create-edit/BroadcastModalShell';
import BroadcastPreviewStep from './create-edit/BroadcastPreviewStep';
import BroadcastTimingStep from './create-edit/BroadcastTimingStep';
import BroadcastWizardFooter from './create-edit/BroadcastWizardFooter';
import { useBroadcastForm } from './create-edit/useBroadcastForm';

export default function CreateEditBroadcastModal({
  isOpen,
  broadcastToEdit,
  onClose,
  onSubmit,
}) {
  const {
    activeStep,
    formData,
    roleNames,
    setActiveStep,
    updateForm,
    workspaceNames,
    handleSubmit,
  } = useBroadcastForm({ broadcastToEdit, isOpen, onClose, onSubmit });

  if (!isOpen) return null;

  return (
    <BroadcastModalShell
      activeStep={activeStep}
      broadcastToEdit={broadcastToEdit}
      onClose={onClose}
      onStepChange={setActiveStep}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-lg space-y-md overflow-y-auto flex-1">
          {activeStep === 1 && (
            <BroadcastBasicStep formData={formData} updateForm={updateForm} />
          )}

          {activeStep === 2 && (
            <BroadcastAudienceStep
              formData={formData}
              roleNames={roleNames}
              updateForm={updateForm}
              workspaceNames={workspaceNames}
            />
          )}

          {activeStep === 3 && (
            <BroadcastTimingStep formData={formData} updateForm={updateForm} />
          )}

          {activeStep === 4 && (
            <BroadcastPreviewStep formData={formData} />
          )}
        </div>

        <BroadcastWizardFooter
          activeStep={activeStep}
          broadcastToEdit={broadcastToEdit}
          onBack={() => setActiveStep((prev) => prev - 1)}
          onCancel={onClose}
          onNext={() => setActiveStep((prev) => prev + 1)}
        />
      </form>
    </BroadcastModalShell>
  );
}
