"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Crown, Info, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { HireVifyLogo } from "./HireVifyLogo";
import {
  subscriptionsService,
  type Subscription,
} from "../services/subscriptionsService";

type SubscriptionManagerProps = {
  onBack: () => void;
  userType?: "recruiter" | "candidate" | null;
};

export function SubscriptionManager({ onBack, userType }: SubscriptionManagerProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) {
        if (active) setLoading(false);
        return;
      }
      const result = await subscriptionsService.getUserSubscription(user.id);
      if (active) {
        setSubscription(result.data);
        setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const isPro = Boolean(subscription?.isActive);

  return (
    <div className="premium-page">
      <header className="premium-header">
        <div className="premium-header-inner">
          <Button variant="ghost" onClick={onBack} aria-label="Go back">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <HireVifyLogo size="md" />
            <div>
              <h1 className="text-xl font-bold text-slate-950">Plan and access</h1>
              <p className="text-sm text-slate-500">
                {userType === "recruiter" ? "Recruiter" : "Candidate"} workspace
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="premium-content">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            <span className="sr-only">Loading plan</span>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Current access</p>
                  <CardTitle className="mt-2 flex items-center gap-2 text-3xl">
                    {isPro && <Crown className="h-7 w-7 text-amber-500" />}
                    {isPro ? "HireVify Pro" : "HireVify Free"}
                  </CardTitle>
                </div>
                <Badge className={isPro ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                  {isPro ? "Active" : "Free"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                {isPro ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-700" />
                      <div>
                        <p className="font-semibold">Pro tools are enabled.</p>
                        <p className="mt-1 text-sm leading-6">
                          Your access was activated by a HireVify administrator while online payments are pending.
                        </p>
                        {subscription?.expires_at && (
                          <p className="mt-2 text-sm font-medium">
                            Access through {new Date(subscription.expires_at).toLocaleDateString()}.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-900">You are using the Free plan.</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Ask the HireVify admin to activate temporary Pro access for your registered account.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="flex gap-4 p-6 text-amber-950">
                <Info className="mt-0.5 h-5 w-5 flex-none" />
                <div>
                  <h2 className="font-semibold">Razorpay checkout is pending</h2>
                  <p className="mt-1 text-sm leading-6">
                    No payment details are collected here. Billing, cancellation, pausing, and automatic renewal will be enabled only after the payment integration is ready.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Plan changes are controlled through the secured HireVify admin panel.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
