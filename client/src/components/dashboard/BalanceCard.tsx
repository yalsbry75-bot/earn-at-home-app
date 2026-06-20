/**
 * Balance Card Component
 * Displays wallet balance information
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import type { Wallet } from '../../types';

interface BalanceCardProps {
  wallet: Wallet | null;
  isLoading?: boolean;
}

export default function BalanceCard({ wallet, isLoading }: BalanceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الرصيد المتاح</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الرصيد المتاح</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$0.00</div>
          <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">الرصيد المتاح</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${wallet.availableBalance.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">
          معلق: ${wallet.pendingBalance.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          مجمّد: ${wallet.frozenBalance.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
