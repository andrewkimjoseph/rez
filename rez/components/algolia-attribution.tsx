import Image from "next/image";
import Link from "next/link";

/**
 * Algolia attribution for live projects (required when using Algolia on a live project
 * unless you're on the Algolia Grow plan). Display next to search results.
 * Matches the "Powered by Algolia" pill style: white background, dark blue border,
 * rounded right, gray-blue text and logo.
 */
export function AlgoliaAttribution() {
  return (
    <Link
      href="https://www.algolia.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 h-9 rounded-r-full border border-[#2A3B5C] bg-white text-[#5D6D8B] text-sm font-medium hover:text-[#2A3B5C] transition-colors shrink-0"
      aria-label="Powered by Algolia"
    >
      <span>Powered by</span>
      <Image
        src="/algolia-logo-blue.svg"
        alt=""
        width={56}
        height={14}
        className="h-3.5 w-auto"
        aria-hidden
      />
      <span>Algolia</span>
    </Link>
  );
}
