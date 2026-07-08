import { db } from "../database";

export type SubscriptionRecord = {
  id?: string;
  user_id?: string;
  recruiter_id?: string;
  candidate_id?: string;
  plan_id?: string;
  plan_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export async function upsertSubscription(
  payload: Record<string, unknown> | Record<string, unknown>[],
  conflictColumns?: string
) {
  return db.upsert<SubscriptionRecord>("subscriptions", payload, conflictColumns);
}
