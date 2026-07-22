import type { SignInFieldPanelData } from '@/services/fetchSignInFieldPanelData';
import { FieldPanelHumanPhoto } from '@/components/sign-in/FieldPanelHumanPhoto';
import {
  FieldPanelFeed,
  FieldPanelFooter,
  FieldPanelHeader,
  FieldPanelStats,
} from '@/components/sign-in/sign-in-field-panel-parts';

type SignInFieldPanelProps = {
  data: SignInFieldPanelData;
};

export function SignInFieldPanel({ data }: SignInFieldPanelProps) {
  return (
    <>
      <aside className="sign-in-board sign-in-board--desktop-only">
        <FieldPanelHeader />
        <FieldPanelStats data={data} />
        <FieldPanelFeed data={data} maxRows={4} />
        <FieldPanelHumanPhoto countriesCovered={data.countriesCovered} variant="desktop" />
        <FieldPanelFooter data={data} />
      </aside>

      <aside className="sign-in-board-compact">
        <FieldPanelHeader />
        <FieldPanelStats data={data} />
        <FieldPanelFeed data={data} maxRows={2} />
        <FieldPanelHumanPhoto countriesCovered={data.countriesCovered} variant="compact" />
        <FieldPanelFooter data={data} />
      </aside>
    </>
  );
}
