export interface Plan {
  id: string;
  name: string;
  description: string;
  pixMonthlyPrice?: number;
  pixYearlyPrice?: number;
  pixPrice?: number;
  creditMonthlyPrice?: number;
  creditYearlyPrice?: number;
  creditPrice?: number;
  dailyRecordAvailable?: number;
  monthlyRecordAvailable?: number;
  channels?: string[];
}

export type BillingCycle = "MONTHLY" | "YEARLY";
export type PaymentMethod = "card" | "pix";
export type ViewState = "plans" | "checkout" | "success";
