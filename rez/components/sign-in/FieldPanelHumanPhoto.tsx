import Image from 'next/image';

export const SIGN_IN_HUMAN_PHOTO_SRC =
  '/human-photo-card/siviwe-kapteyn-tCvDVszXdHE-unsplash.jpg';

export const ONBOARDING_HUMAN_PHOTO_SRC =
  '/human-photo-card/stephen-tettey-atsu-YozVLdi-9Pw-unsplash.jpg';

type FieldPanelHumanPhotoProps = {
  countriesCovered?: number;
  variant?: 'desktop' | 'compact';
  src?: string;
};

export function FieldPanelHumanPhoto({
  countriesCovered = 0,
  variant = 'desktop',
  src = SIGN_IN_HUMAN_PHOTO_SRC,
}: FieldPanelHumanPhotoProps) {
  return (
    <figure
      className={`sign-in-human-photo sign-in-human-photo--${variant} sign-in-human-photo-enter`}
    >
      <Image
        src={src}
        alt="People using smartphones in an everyday setting"
        fill
        sizes={variant === 'desktop' ? '(min-width: 901px) 40vw, 100vw' : '100vw'}
        className="sign-in-human-photo-image"
      />
      <div className="sign-in-human-photo-overlay" aria-hidden />
      <figcaption className="sign-in-human-photo-caption">
        <span className="sign-in-human-photo-caption-title">Real responses from real people</span>
        {countriesCovered > 0 && (
          <span className="sign-in-human-photo-caption-meta">
            Across <span className="sign-in-human-photo-caption-accent">{countriesCovered.toLocaleString()}</span> countries
          </span>
        )}
      </figcaption>
    </figure>
  );
}
