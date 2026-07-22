import type { SignInFieldPanelData } from '@/services/fetchSignInFieldPanelData';
import {
  FieldPanelHumanPhoto,
  ONBOARDING_HUMAN_PHOTO_SRC,
} from '@/components/sign-in/FieldPanelHumanPhoto';
import {
  FieldPanelFeed,
  FieldPanelFooter,
  FieldPanelHeader,
  FieldPanelSetupCue,
  FieldPanelStats,
} from '@/components/sign-in/sign-in-field-panel-parts';

type SignInFieldPanelProps = {
  data: SignInFieldPanelData;
  showSetupCue?: boolean;
};

export function SignInFieldPanel({ data, showSetupCue = false }: SignInFieldPanelProps) {
  const photoSrc = showSetupCue ? ONBOARDING_HUMAN_PHOTO_SRC : undefined;

  return (
    <>
      <aside className="sign-in-board sign-in-board--desktop-only">
        <FieldPanelHeader />
        {showSetupCue ? <FieldPanelSetupCue /> : null}
        <FieldPanelStats data={data} />
        {!showSetupCue ? <FieldPanelFeed data={data} /> : null}
        <div className={showSetupCue ? 'mb-auto' : undefined}>
          <FieldPanelHumanPhoto
            countriesCovered={data.countriesCovered}
            variant="desktop"
            src={photoSrc}
          />
        </div>
        <FieldPanelFooter data={data} />
      </aside>

      <aside className="sign-in-board-compact">
        <FieldPanelHeader />
        {showSetupCue ? <FieldPanelSetupCue compact /> : null}
        <FieldPanelStats data={data} />
        {!showSetupCue ? <FieldPanelFeed data={data} compact /> : null}
        <div className={showSetupCue ? 'mb-auto' : undefined}>
          <FieldPanelHumanPhoto
            countriesCovered={data.countriesCovered}
            variant="compact"
            src={photoSrc}
          />
        </div>
        <FieldPanelFooter data={data} />
      </aside>
    </>
  );
}
