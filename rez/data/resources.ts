/**
 * Resource types for the resource library (HubSpot-style).
 * Add numberOfPages manually for each resource.
 */
export type ResourceType = 'Guide' | 'Report' | 'Ebook' | 'Template' | 'Kit' | 'Tool';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  tags: string[];
  /** Number of pages - add manually for each resource */
  numberOfPages: number;
  imageUrl: string;
  /** Maps to /api/download/[slug] - e.g. 'guide', 'playbook' */
  downloadSlug: string;
  downloadFilename: string;
  ctaText?: string;
}

export const RESOURCE_TYPES: ResourceType[] = ['Guide', 'Report', 'Ebook', 'Template', 'Kit', 'Tool'];

export const resources: Resource[] = [
  {
    id: 'playbook',
    title: 'African Digital Finance Insights',
    description: 'Perspectives on mobile money, blockchain, and financial inclusion across Kenya and Nigeria.',
    type: 'Report',
    tags: ['Research', 'Financial Inclusion', 'Africa'],
    numberOfPages: 59, // Add manually
    imageUrl: '/covers/playbook.png',
    downloadSlug: 'playbook',
    downloadFilename: 'african-digital-finance-insights-2025.pdf',
    ctaText: 'Free Download',
  },
  {
    id: 'guide',
    title: 'How to Design Surveys for Quality Responses',
    description: 'A 6-section practical guide for researchers using The Mom Test methodology.',
    type: 'Guide',
    tags: ['Research', 'Surveys', 'Methodology'],
    numberOfPages: 24, // Add manually
    imageUrl: '/covers/guide.png',
    downloadSlug: 'guide',
    downloadFilename: 'how-to-design-surveys-for-quality-responses-2026.pdf',
    ctaText: 'Free Download',
  },
];
