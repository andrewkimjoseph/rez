import { SignInPageClient } from '@/components/sign-in/SignInPageClient';
import { SignInFieldPanel } from '@/components/sign-in/SignInFieldPanel';
import { getCachedSignInFieldPanelData } from '@/services/fetchSignInFieldPanelData';

export default async function SignInPage() {
  const data = await getCachedSignInFieldPanelData();

  return (
    <div className="sign-in-wrap min-h-screen">
      <SignInPageClient />
      <SignInFieldPanel data={data} />
    </div>
  );
}
