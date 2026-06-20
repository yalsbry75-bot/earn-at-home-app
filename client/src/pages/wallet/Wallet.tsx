/**
 * Wallet Page
 * Detailed wallet information and balance management
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { walletService } from '../../services/walletService';
import RewardsInfoCard from '../../components/rewards/RewardsInfoCard';
import { POINTS_PER_USD } from '../../services/rewardsService';
import type { Wallet } from '../../types';

export default function WalletPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    const loadWallet = async () => {
      try {
        const walletData = await walletService.getWallet();
        setWallet(walletData);
        setIsLoading(false);
      } catch (error: any) {
        toast.error(error.message || t('errors.serverError'));
        setIsLoading(false);
      }
    };

    loadWallet();
  }, [user, t]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('wallet.notFound')}</h1>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const totalBalance =
    wallet.pendingBalance + wallet.availableBalance + wallet.frozenBalance;
  const conversionRate = POINTS_PER_USD; // 10,000 points = $5

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('wallet.title')}</h1>
          <p className="text-gray-400">{t('wallet.description')}</p>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {t('wallet.availableBalance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                ${(wallet.availableBalance / conversionRate).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {wallet.availableBalance} {t('wallet.points')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {t('wallet.pendingBalance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">
                ${(wallet.pendingBalance / conversionRate).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {wallet.pendingBalance} {t('wallet.points')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {t('wallet.totalEarnings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                ${(wallet.totalEarnings / conversionRate).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {wallet.totalEarnings} {t('wallet.points')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setLocation('/tasks')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
          >
            {t('wallet.earnMore')}
          </Button>
          <Button
            onClick={() => setLocation('/withdraw')}
            className="bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            {t('wallet.withdraw')}
          </Button>
        </div>

        {/* Rewards Information */}
        <div className="mb-8">
          <RewardsInfoCard />
        </div>

        {/* Details */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>{t('wallet.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <span className="text-gray-400">{t('wallet.conversionRate')}</span>
              <span className="text-white font-semibold">10,000 {t('wallet.points')} = $5</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <span className="text-gray-400">{t('wallet.lastUpdated')}</span>
              <span className="text-white font-semibold">
                {wallet.updatedAt instanceof Date
                  ? wallet.updatedAt.toLocaleDateString()
                  : new Date(wallet.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('wallet.accountCreated')}</span>
              <span className="text-white font-semibold">
                {wallet.createdAt instanceof Date
                  ? wallet.createdAt.toLocaleDateString()
                  : new Date(wallet.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-slate-900"
          >
            {t('common.back')}
          </Button>
          <Button
            onClick={() => setLocation('/transactions')}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-slate-900"
          >
            {t('wallet.viewTransactions')}
          </Button>
        </div>
      </div>
    </div>
  );
}
