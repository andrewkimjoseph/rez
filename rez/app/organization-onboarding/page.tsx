import { OrganizationOnboardingClient } from '@/components/onboarding/OrganizationOnboardingClient';
import { SignInFieldPanel } from '@/components/sign-in/SignInFieldPanel';
import { getCachedSignInFieldPanelData } from '@/services/fetchSignInFieldPanelData';

export default async function OrganizationOnboardingPage() {
  const data = await getCachedSignInFieldPanelData();

  return (
    <div className="sign-in-wrap min-h-screen">
      <OrganizationOnboardingClient />
      <SignInFieldPanel data={data} showSetupCue />
    </div>
  );
}
