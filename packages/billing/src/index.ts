export type BillingPlan = "free" | "team" | "scale";

export type BillingStatus = {
  plan: BillingPlan;
  runLimit: number;
  stripeCustomerId?: string;
};

export function getDefaultBillingStatus(): BillingStatus {
  return {
    plan: "free",
    runLimit: 10,
  };
}
