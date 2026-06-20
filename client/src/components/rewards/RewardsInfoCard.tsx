import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DAILY_LOGIN_BONUS_POINTS,
  REFERRAL_REWARD_POINTS,
  REGISTRATION_BONUS_POINTS,
  rewardsService,
} from '../../services/rewardsService';

type RewardsInfoCardProps = {
  compact?: boolean;
};

export default function RewardsInfoCard({ compact = false }: RewardsInfoCardProps) {
  return (
    <Card className="bg-slate-800/50 border-[#d4af37]/30 shadow-[0_0_25px_rgba(212,175,55,0.12)]">
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className="text-[#d4af37]">Rewards Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-200">
        <div className="rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 p-4 text-center">
          <p className="text-lg font-bold text-[#d4af37]">
            {rewardsService.getWithdrawalInfoLabel()}
          </p>
          <p className="mt-1 text-xs text-gray-300">Withdrawal conversion rate used by the wallet and withdrawal pages.</p>
        </div>

        {!compact && (
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="font-semibold text-white">Registration Bonus</p>
              <p className="text-[#d4af37]">+{REGISTRATION_BONUS_POINTS} points</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="font-semibold text-white">Daily Login Bonus</p>
              <p className="text-[#d4af37]">+{DAILY_LOGIN_BONUS_POINTS} points / 24h</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="font-semibold text-white">Referral Reward</p>
              <p className="text-[#d4af37]">+{REFERRAL_REWARD_POINTS} points</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
