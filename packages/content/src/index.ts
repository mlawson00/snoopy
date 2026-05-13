export type MarketingContent = {
  headline: string;
  subheadline: string;
  proofPoints: string[];
};

export function getFallbackMarketingContent(): MarketingContent {
  return {
    headline: "Snoopy",
    subheadline: "First-person website teardowns with persistent agents, comparison context, and before/after fixes.",
    proofPoints: [
      "Enter a URL and watch a persistent agent cast react to the page.",
      "Catch boring design, unreadable text, weak offers, and vague proof.",
      "Turn agent conversation into prioritized before/after fixes.",
    ],
  };
}
