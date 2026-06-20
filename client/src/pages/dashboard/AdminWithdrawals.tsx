import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { withdrawalService } from '../../services/withdrawalService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase/config';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { Check, X, CreditCard, ExternalLink, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { Withdrawal } from '../../types/withdrawals';

export default function AdminWithdrawals() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const q = query(collection(firestore, 'withdrawals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Withdrawal));
      setWithdrawals(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'mark_paid') => {
    try {
      await withdrawalService.processWithdrawal(id, action, user!.id);
      toast.success(t(`admin.withdrawal.${action}Success`));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case 'paid': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (user?.role !== 'admin') return <div className="p-8 text-center text-red-500">Access Denied</div>;

  return (
    <AdminLayout title={t('admin.withdrawals.title') || 'Withdrawals'}>
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.withdrawals.title')}</h1>
          <p className="text-muted-foreground">{t('admin.withdrawals.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Search className="w-4 h-4 mr-2" /> Filter</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs">{w.userId.slice(0, 8)}...</TableCell>
                <TableCell className="font-bold">${w.amount.toFixed(2)}</TableCell>
                <TableCell className="capitalize">{(w as any).paymentMethod?.replace('_', ' ') || (w as any).method?.replace('_', ' ') || 'Unknown'}</TableCell>
                <TableCell className="text-xs">
                  {Object.entries((w as any).bankDetails || (w as any).paymentDetails || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </TableCell>
                <TableCell>{getStatusBadge(w.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {w.createdAt.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {w.status === 'pending' && (
                      <>
                        <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleAction(w.id, 'approve')}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleAction(w.id, 'reject')}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {w.status === 'approved' && (
                      <Button size="sm" className="gap-2" onClick={() => handleAction(w.id, 'mark_paid')}>
                        <CreditCard className="w-4 h-4" /> Mark Paid
                      </Button>
                    )}
                    <Button size="icon" variant="ghost">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {withdrawals.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No withdrawal requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
    </AdminLayout>
  );
}
