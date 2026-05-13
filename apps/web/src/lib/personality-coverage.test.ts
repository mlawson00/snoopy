import { describe, expect, it } from "vitest";
import { buildPersonalityCoverage, CORE_CAST_PERSONALITY } from "./personality-coverage";

describe("buildPersonalityCoverage", () => {
  it("keeps the default cast fully covered without action prompts", () => {
    const coverage = buildPersonalityCoverage(CORE_CAST_PERSONALITY);

    expect(coverage.coveredAxisCount).toBe(4);
    expect(coverage.panelRisk).toBe("low");
    expect(coverage.actionSuggestions).toHaveLength(0);
  });

  it("suggests generated specialists when a panel is thin", () => {
    const coverage = buildPersonalityCoverage([{ id: "solo", name: "Solo Reviewer" }]);

    expect(coverage.panelRisk).toBe("high");
    expect(coverage.actionSuggestions[0]).toMatchObject({
      title: "Add an introversion-heavy reviewer",
      source: "generated",
      generatorTone: "skeptical",
    });
    expect(coverage.actionSuggestions[0]?.generatorBrief).toContain("introversion-heavy website reviewer");
  });

  it("prefers saved agents when they repair a weak axis", () => {
    const coverage = buildPersonalityCoverage(
      [{ id: "solo", name: "Solo Reviewer" }],
      [
        {
          id: "deep-reader",
          name: "Deep Reader",
          customerOwned: true,
          personalityFacets: {
            introversion: 0.82,
            extraversion: 0.18,
            sensing: 0.5,
            intuition: 0.5,
            thinking: 0.5,
            feeling: 0.5,
            judging: 0.5,
            perceiving: 0.5,
          },
        },
      ],
    );

    expect(coverage.actionSuggestions[0]).toMatchObject({
      title: "Add Deep Reader",
      source: "saved",
    });
  });
});
