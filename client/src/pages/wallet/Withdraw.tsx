import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { withdrawalService } from '../../services/withdrawalService';
import { walletService } from '../../services/walletService';
import RewardsInfoCard from '../../components/rewards/RewardsInfoCard';
import { POINTS_PER_USD } from '../../services/rewardsService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Wallet, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PaymentMethodType, KYCData } from '../../types/withdrawals';
import type { Wallet as WalletType } from '../../types';

export default function Withdraw() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethodType>('paypal');
  const [paymentEmail, setPaymentEmail] = useState<string>('');
  const [kyc, setKyc] = useState<KYCData | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      withdrawalService.getKYCData(user.id).then(setKyc);
      walletService.getWallet().then(setWallet).catch((error) => {
        console.warn('Wallet could not be loaded:', error);
      });
    }
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error(t('withdraw.invalidAmount'));
      return;
    }

    try {
      setIsLoading(true);
      await withdrawalService.createWithdrawalRequest(
        user.id,
        withdrawAmount,
        method,
        { email: paymentEmail }
      );
      toast.success(t('withdraw.success'));
      setAmount('');
      setPaymentEmail('');
    } catch (err: any) {
      toast.error(err.message || t('withdraw.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const isKycRequired = true; // KYC is required for all withdrawals in production
  const canWithdraw = Boolean(kyc && kyc.status === 'verified' && kyc.level >= 2);
  const availableUsd = wallet ? wallet.availableBalance / POINTS_PER_USD : user?.balance || 0;
  const availablePoints = wallet?.availableBalance || Math.round((user?.balance || 0) * POINTS_PER_USD);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-full">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('withdraw.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('withdraw.subtitle')}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6 flex justify-between items-center">
          <span className="text-sm font-medium">{t('withdraw.availableBalance')}</span>
          <span className="text-2xl font-bold text-primary">${availableUsd.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{availablePoints.toLocaleString()} Points</span>
        </div>

        <div className="mb-6">
          <RewardsInfoCard compact />
        </div>

        {!canWithdraw && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-yellow-900 dark:text-yellow-200">{t('withdraw.kycRequired')}</p>
              <p className="text-yellow-800 dark:text-yellow-300">{t('withdraw.kycNote')}</p>
              <Button variant="link" className="p-0 h-auto text-primary mt-1" onClick={() => window.location.href='/kyc'}>
                {t('withdraw.goToKyc')} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('withdraw.amount')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                min="10"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('withdraw.minAmount')}: $10.00</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('withdraw.method')}</label>
            <Select value={method} onValueChange={(v: PaymentMethodType) => setMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="usdt_trc20">USDT (TRC20)</SelectItem>
                <SelectItem value="bank_transfer">{t('withdraw.bankTransfer')}</SelectItem>
                <SelectItem value="local_payment">{t('withdraw.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {method === 'paypal' ? t('withdraw.paypalEmail') : t('withdraw.accountDetails')}
            </label>
            <Input
              type="text"
              placeholder={method === 'paypal' ? 'email@example.com' : t('withdraw.detailsPlaceholder')}
              value={paymentEmail}
              onChange={(e) => setPaymentEmail(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-lg gap-2" 
              disabled={isLoading || !canWithdraw || (isKycRequired && (!kyc || kyc.level < 2))}
            >
              {isLoading ? t('common.processing') : t('withdraw.submit')}
              <ShieldCheck className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">{t('withdraw.securityTipsTitle')}</h2>
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs shrink-0">
                {i}
              </span>
              {t(`withdraw.securityTip${i}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
