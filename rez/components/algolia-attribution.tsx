import Image from "next/image";
import Link from "next/link";

/**
 * Algolia attribution for live projects (required when using Algolia on a live project
 * unless you're on the Algolia Grow plan). Display next to search results.
 */
export function AlgoliaAttribution() {
  return (
    <p className="flex items-center justify-end gap-1.5 text-muted-foreground text-xs mt-3">
      <span>Search by</span>
      <Link
        href="https://www.algolia.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Algolia"
      >
        <Image
          src="/algolia-logo-blue.svg"
          alt="Algolia"
          width={56}
          height={14}
          className="h-3.5 w-auto"
        />
      </Link>
    </p>
  );
}
