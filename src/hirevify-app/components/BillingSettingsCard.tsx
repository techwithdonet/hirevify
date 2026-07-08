import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CreditCard, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { subscriptionsService, type Subscription } from '@/src/hirevify-app/services/subscriptionsService';

type BillingSettingsCardProps = {
  userId: string | null;
  userEmail?: string;
};

function formatDate(value?: string | null) {
  if (!value) return 'No expiry';
  return new Date(value).toLocaleDateString();
}

function daysRemaining(value?: string | null) {
  if (!value) return null;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function BillingSettingsCard({ userId, userEmail }: BillingSettingsCardProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'freeze' | 'unfreeze' | 'cancel' | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await subscriptionsService.getUserSubscription(userId);
    setSubscription(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const remainingDays = useMemo(() => {
    if (!subscription) return null;
    if (subscription.status === 'frozen') return Number(subscription.frozen_remaining_days || 0);
    return daysRemaining(subscription.expires_at);
  }, [subscription]);

  const canFreeze = Boolean(
    subscription &&
      subscription.tier !== 'free' &&
      !subscription.freeze_used &&
      subscription.status !== 'frozen' &&
      subscription.status !== 'canceled' &&
      subscription.status !== 'expired',
  );
  const canUnfreeze = subscription?.status === 'frozen';
  const canCancel = Boolean(subscription && subscription.tier !== 'free' && subscription.status !== 'canceled' && subscription.status !== 'expired');

  const runAction = async (nextAction: 'freeze' | 'unfreeze' | 'cancel') => {
    if (!userId) {
      toast.error('Subscription profile is still loading.');
      return;
    }

    setAction(nextAction);
    try {
      const result =
        nextAction === 'freeze'
          ? await subscriptionsService.freezeSubscription(userId)
          : nextAction === 'unfreeze'
            ? await subscriptionsService.unfreezeSubscription(userId)
            : await subscriptionsService.cancelSubscription(userId);

      if (result.error) {
        throw result.error;
      }

      toast.success(
        nextAction === 'freeze'
          ? 'Subscription frozen. Pro access is paused.'
          : nextAction === 'unfreeze'
            ? 'Subscription unfrozen. Remaining days restarted.'
            : 'Subscription canceled. Access continues until expiry.',
      );
      await loadSubscription();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Billing action failed.');
    } finally {
      setAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-emerald-600" />
          Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-slate-500">Plan</Label>
            <div className="mt-2">
              <Badge className="bg-emerald-50 text-emerald-700">
                {loading ? 'Loading' : `${subscription?.tier || 'free'} / ${subscription?.status || 'active'}`}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-slate-500">Expires</Label>
            <p className="mt-2 font-medium text-slate-950">{formatDate(subscription?.expires_at)}</p>
          </div>
          <div>
            <Label className="text-slate-500">Days left</Label>
            <p className="mt-2 font-medium text-slate-950">{remainingDays === null ? 'Not applicable' : `${remainingDays} days`}</p>
          </div>
        </div>

        <Separator />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Yearly plans can be frozen once. While frozen, Pro features become Free. Remaining days stop counting and restart when the plan is unfrozen.
          Canceled subscriptions cannot be frozen, but paid access continues until the current expiry date.
        </div>

        <div className="flex flex-wrap gap-3">
          {canFreeze && (
            <Button variant="outline" onClick={() => void runAction('freeze')} disabled={Boolean(action)}>
              <PauseCircle className="mr-2 h-4 w-4" />
              {action === 'freeze' ? 'Freezing...' : 'Freeze subscription'}
            </Button>
          )}
          {canUnfreeze && (
            <Button variant="outline" onClick={() => void runAction('unfreeze')} disabled={Boolean(action)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              {action === 'unfreeze' ? 'Unfreezing...' : 'Unfreeze subscription'}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => void runAction('cancel')} disabled={Boolean(action)}>
              <Ban className="mr-2 h-4 w-4" />
              {action === 'cancel' ? 'Canceling...' : 'Cancel subscription'}
            </Button>
          )}
        </div>

        {subscription?.freeze_used && subscription.status !== 'frozen' && (
          <p className="text-sm font-medium text-slate-500">Freeze has already been used for this subscription.</p>
        )}
        <p className="text-xs text-slate-400">Billing account: {userEmail || 'Not available'}</p>
      </CardContent>
    </Card>
  );
}
