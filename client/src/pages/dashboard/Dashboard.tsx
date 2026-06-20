/**
 * Dashboard Page
 * Main user dashboard with wallet and points information
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useGuest } from '../../contexts/GuestContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Award, LogOut } from 'lucide-react';
import BalanceCard from '../../components/dashboard/BalanceCard';
import PointsCard from '../../components/dashboard/PointsCard';
import LevelBadge from '../../components/dashboard/LevelBadge';
import EarningsCard from '../../components/dashboard/EarningsCard';
import { walletService, pointsService, levelService } from '../../services/walletService';
import { rewardsService } from '../../services/rewardsService';
import type { Wallet as WalletType, PointsLedger } from '../../types';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { isGuestMode, showRestrictionMessage } = useGuest();
  const [, setLocation] = useLocation();

  // State
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState('Bronze');
  const [recentTransactions, setRecentTransactions] = useState<PointsLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dailyRewardCheckedRef = useRef(false);

  // Load wallet data
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    const loadData = async () => {
      try {
        if (!dailyRewardCheckedRef.current) {
          dailyRewardCheckedRef.current = true;
          try {
            const dailyReward = await rewardsService.claimDailyLoginBonus();
            if (dailyReward.granted) {
              toast.success(`مكافأة تسجيل الدخول اليومي: +${dailyReward.points} نقاط`);
            }
          } catch (rewardError) {
            console.warn('Daily login bonus was not processed:', rewardError);
          }
        }

        // Load wallet
        const walletData = await walletService.getWallet();
        if (walletData) {
          setWallet(walletData);
          const newLevel = levelService.calculateLevel(walletData.totalEarnings);
          setLevel(newLevel);
          setPoints(walletData.availableBalance);
        }

        // Load recent transactions
        const ledger = await pointsService.getPointsLedger(undefined, 5);
        setRecentTransactions(ledger);

        setIsLoading(false);
      } catch (error: any) {
        toast.error(error.message || t('errors.serverError'));
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, t]);

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          <p className="mt-4 text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">{t('auth.notAuthenticated')}</h1>
          <Button onClick={() => setLocation('/login')}>{t('auth.login')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-premium py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-bold text-white gradient-text-gold">{t('dashboard.title')}</h1>
            <p className="text-gray-400 mt-2">{t('dashboard.welcome', { name: user.displayName || user.email })}</p>
            {isGuestMode && (
              <p className="text-[#d4af37] text-sm mt-2 font-semibold">🎭 وضع الضيف - جرب المنصة مجاناً</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/profile')}
              className="text-white border-white/30 hover:bg-white/10 hover:border-[#d4af37]/50"
            >
              {t('common.profile')}
            </Button>
            <Button
              onClick={() => {
                logout();
                setLocation('/');
              }}
              className="btn-gold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </Button>
          </motion.div>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <BalanceCard wallet={wallet} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <PointsCard points={points} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <LevelBadge level={level} points={points} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <EarningsCard wallet={wallet} />
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Button
                  onClick={() => {
                    if (isGuestMode) {
                      showRestrictionMessage('🎭 وضع الضيف: لا يمكنك إكمال المهام الحقيقية. قم بإنشاء حساب للبدء في الكسب');
                    } else {
                      setLocation('/tasks');
                    }
                  }}
                  className="w-full btn-gold py-6 text-lg flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  {t('dashboard.earnMore')}
                </Button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Button
                  onClick={() => {
                    if (isGuestMode) {
                      showRestrictionMessage('🎭 وضع الضيف: لا يمكنك استخدام الإحالات. قم بإنشاء حساب للاستفادة من برنامج الإحالات');
                    } else {
                      setLocation('/referrals');
                    }
                  }}
                  className="w-full btn-gold py-6 text-lg flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  {t('dashboard.referrals')}
                </Button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Button
                  onClick={() => {
                    if (isGuestMode) {
                      showRestrictionMessage('🎭 وضع الضيف: لا يمكنك سحب الأموال. قم بإنشاء حساب وإكمال المهام أولاً');
                    } else {
                      setLocation('/withdraw');
                    }
                  }}
                  className="w-full btn-gold py-6 text-lg flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  {t('dashboard.withdraw')}
                </Button>
              </motion.div>
            </div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card-premium p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4 gradient-text-gold">{t('dashboard.recentTransactions')}</h2>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                      <div>
                        <p className="text-white font-semibold">{transaction.reason}</p>
                        <p className="text-gray-400 text-sm">{transaction.source}</p>
                      </div>
                      <div className={`font-bold ${transaction.type === 'earn' ? 'text-[#d4af37]' : 'text-red-400'}`}>
                        {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">{t('dashboard.noTransactions')}</p>
              )}

              <Button
                onClick={() => setLocation('/transactions')}
                variant="outline"
                className="w-full mt-4 text-white border-white hover:bg-white hover:text-slate-900"
              >
                {t('dashboard.viewAll')}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
