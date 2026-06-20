/**
 * Transactions Page
 * Display transaction history and points ledger
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { pointsService } from '../../services/walletService';
import type { PointsLedger } from '../../types';

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [transactions, setTransactions] = useState<PointsLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    const loadTransactions = async () => {
      try {
        const ledger = await pointsService.getPointsLedger(undefined, 100);
        setTransactions(ledger);
        setIsLoading(false);
      } catch (error: any) {
        toast.error(error.message || t('errors.serverError'));
        setIsLoading(false);
      }
    };

    loadTransactions();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('transactions.title')}</h1>
          <p className="text-gray-400">{t('transactions.description')}</p>
        </div>

        {/* Transactions List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>{t('transactions.history')}</CardTitle>
            <CardDescription>
              {t('transactions.total', { count: transactions.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={transaction.type === 'earn' ? 'default' : 'destructive'}
                          className={
                            transaction.type === 'earn'
                              ? 'bg-green-600'
                              : 'bg-red-600'
                          }
                        >
                          {transaction.type === 'earn'
                            ? t('transactions.earned')
                            : t('transactions.spent')}
                        </Badge>
                        <div>
                          <p className="font-semibold text-white">
                            {transaction.reason}
                          </p>
                          <p className="text-sm text-gray-400">
                            {transaction.source}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === 'earn'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {transaction.type === 'earn' ? '+' : '-'}
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.createdAt instanceof Date
                          ? transaction.createdAt.toLocaleDateString()
                          : new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  {t('transactions.noTransactions')}
                </p>
                <Button
                  onClick={() => setLocation('/tasks')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  {t('transactions.startEarning')}
                </Button>
              </div>
            )}
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
            onClick={() => setLocation('/wallet')}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-slate-900"
          >
            {t('transactions.viewWallet')}
          </Button>
        </div>
      </div>
    </div>
  );
}
