
import { UserPlan } from './types';

export const APP_NAME = "CraftedDocs";

export const LIMITS = {
  [UserPlan.FREE]: 50,
  [UserPlan.PAID_15]: 2000,
  [UserPlan.PAID_MONTHLY]: 5000,
};

export const PRICING_PLANS = [
  {
    name: "Free",
    price: "₹0",
    limit: 50,
    features: ["50 daily documents", "Standard Delivery", "1 Active Flow"],
    plan: UserPlan.FREE,
    cta: "Start Free"
  },
  {
    name: "15 Days Pro",
    price: "₹400",
    limit: 2000,
    features: ["2,000 daily documents", "Custom SMTP Relay", "Unlimited Flows"],
    plan: UserPlan.PAID_15,
    cta: "Upgrade Now"
  },
  {
    name: "Monthly Pro",
    price: "₹650",
    limit: 5000,
    features: ["5,000 daily documents", "Enterprise Relay", "Priority Support"],
    plan: UserPlan.PAID_MONTHLY,
    cta: "Select Plan"
  }
];
