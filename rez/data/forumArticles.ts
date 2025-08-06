export interface ForumArticle {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  postUrl: string;
  category: string;
}

export const forumArticles: ForumArticle[] = [
  {
    id: "rzs_10_2",
    title: "How Africa's Digital Payment Landscape Is Evolving",
    description:
      "The digital payment revolution in Africa is unfolding at different paces and in different ways across the continent. A recent study comparing payment behaviors in Nigeria and Kenya reveals fascinating insights into how these two influential markets are embracing digital transformation while maintaining their unique characteristics.",
    date: "2025-03-05",
    imageUrl: "/forumArticles/rzs_10_2.png",
    postUrl:
      "https://forum.celo.org/t/how-africas-digital-payment-landscape-is-evolving-lessons-from-nigeria-and-kenya/10473",
    category: "Payments",
  },
  {
    id: "rzs_11_2",
    title: "Cultural and Regional Perspectives from Nigeria and Kenya",
    description:
      "The blockchain revolution in Africa is unfolding at different paces and with varying levels of understanding across the continent. A recent study comparing blockchain knowledge among MiniPay users in Nigeria and Kenya reveals fascinating insights into how these two influential markets are approaching this transformative technology while maintaining their unique regional characteristics.",
    date: "2025-03-20",
    imageUrl: "/forumArticles/rzs_11_2.png",
    postUrl:
      "https://forum.celo.org/t/report-blockchain-knowledge-assessment-cultural-and-regional-perspectives-from-nigeria-and-kenya/10579",
    category: "Culture",
  },
  {
    id: "rzs_6_1",
    title: "MiniPay in Africa: Financial Inclusion Across Kenya, Nigeria, and South Africa",
    description:
      "The digital financial landscape across Africa is evolving at different paces and with varying patterns, driven by unique regional needs and existing infrastructure. A recent survey examining MiniPay usage across Kenya, Nigeria, and South Africa reveals fascinating insights into how these markets approach digital financial services while maintaining their distinct regional characteristics.",
    date: "2025-03-24",
    imageUrl: "/forumArticles/rzs_6_1.png",
    postUrl:
      "https://forum.celo.org/t/minipay-in-africa-financial-inclusion-across-kenya-nigeria-and-south-africa/10675/1",
    category: "Financial Inclusion",
  },
  {
    id: "rzs_15_2",
    title: "Banking and Mobile Money Adoption: Cultural and Regional Perspectives from Nigeria and Kenya",
    description:
      "The banking and mobile money landscape in Africa is unfolding at different paces and with varying adoption patterns across the continent. A recent study comparing financial behaviors among users in Nigeria and Kenya reveals fascinating insights into how these two influential markets are approaching financial services while maintaining their unique regional characteristics.",
    date: "2025-04-01",
    imageUrl: "/forumArticles/rzs_15_2.png",
    postUrl:
      "https://forum.celo.org/t/banking-and-mobile-money-adoption-cultural-and-regional-perspectives-from-nigeria-and-kenya/10756",
    category: "Banking",
  },
  {
    id: "rzs_16_2",
    title: "Stablecoin and Cryptocurrency Adoption: Comparing Kenya and Nigeria",
    description:
      "The cryptocurrency landscape across Africa is developing at different rates and with distinct characteristics, shaped by regional needs, existing financial infrastructure, and regulatory environments. Our recent survey examining cryptocurrency and stablecoin usage across Nigeria and Kenya reveals fascinating insights into how these markets approach digital assets while maintaining their unique regional characteristics.",
    date: "2025-04-07",
    imageUrl: "/forumArticles/rzs_16_2.png",
    postUrl:
      "https://forum.celo.org/t/stablecoin-and-cryptocurrency-adoption-comparing-kenya-and-nigeria/10819",
    category: "Stablecoins",
  },

  {
    id: "rt1_1_2",
    title: "Could Digital Rewards Revolutionise Recycling in Africa?",
    description: "As climate change accelerates and plastic pollution threatens ecosystems across Africa, understanding how to motivate sustainable behaviours becomes increasingly critical.",
    imageUrl: "/forumArticles/rt1_1_2.png",
    date: "2025-07-31", 
    postUrl:
      "https://forum.celo.org/t/could-digital-rewards-revolutionise-recycling-in-africa-new-survey-results-featuring-wayst-recycling/12038",
    category: "Recycling",
  },
]; 