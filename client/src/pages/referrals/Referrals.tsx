import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { referralService } from '../../services/referralService';
import { antifraudService } from '../../services/antifraudService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Share2, TrendingUp, Users } from 'lucide-react';
import type { Referral, ReferralStats, RiskScore } from '../../types/referrals';
import { useTranslation } from 'react-i18next';

export default function Referrals() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get referral code
        const result = await referralService.createReferralLink();
        setReferralCode(result.referralCode);
        setReferralLink(result.referralLink);

        // Get referral stats
        const referralStats = await referralService.getReferralStats();
        setStats(referralStats);

        // Get referrals
        const userReferrals = await referralService.getReferrals();
        setReferrals(userReferrals);

        // Get risk score
        const risk = await antifraudService.calculateRiskScore(user.id);
        setRiskScore(risk);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load referral data';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success(t('common.copied'));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success(t('common.copied'));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('referrals.shareTitle'),
          text: t('referrals.shareText'),
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 w-full">
            {t('common.retry')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('referrals.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400">{t('referrals.subtitle')}</p>
        </div>

        {/* Risk Status Alert */}
        {riskScore && riskScore.level !== 'low' && (
          <Card className="mb-6 p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  {t('referrals.riskAlert')}
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  {t(`referrals.riskLevel.${riskScore.level}`)}: {riskScore.score}/100
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Referral Code Section */}
        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-bold mb-4">{t('referrals.yourCode')}</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Code Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('referrals.code')}</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {referralCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Link Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('referrals.link')}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-mono truncate text-green-600 dark:text-green-400">
                  {referralLink}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Share Button */}
          <Button onClick={handleShare} className="w-full gap-2" size="lg">
            <Share2 className="w-5 h-5" />
            {t('referrals.share')}
          </Button>
        </Card>

        {/* Stats Section */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('referrals.totalReferrals')}
                  </p>
                  <p className="text-3xl font-bold">{stats.totalReferrals}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('referrals.qualifiedReferrals')}
                  </p>
                  <p className="text-3xl font-bold">{stats.qualifiedReferrals}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('referrals.pendingReferrals')}
                  </p>
                  <p className="text-3xl font-bold">{stats.pendingReferrals}</p>
                </div>
                <div className="w-8 h-8 text-yellow-500 opacity-50">⏳</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('referrals.totalEarnings')}
                  </p>
                  <p className="text-3xl font-bold">{stats.totalEarnings}</p>
                </div>
                <div className="w-8 h-8 text-purple-500 opacity-50">💰</div>
              </div>
            </Card>
          </div>
        )}

        {/* Referrals List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t('referrals.referralsList')}</h2>

          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">{t('referrals.noReferrals')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t('referrals.user')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('referrals.status')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('referrals.date')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('referrals.reward')}</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-4">{referral.referredId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            referral.status === 'qualified'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : referral.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {t(`referrals.status.${referral.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {referral.status === 'qualified' ? (
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            +{referral.referrerReward}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
