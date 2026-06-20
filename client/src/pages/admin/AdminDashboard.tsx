import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Users, 
  Wallet, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { adminService } from '../../services/admin/adminService';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'إجمالي المستخدمين', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      trend: '+12%',
      trendType: 'up'
    },
    { 
      title: 'سحوبات معلقة', 
      value: stats?.pendingWithdrawals || 0, 
      icon: Wallet, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      trend: '5 طلبات',
      trendType: 'neutral'
    },
    { 
      title: 'الإيرادات الكلية', 
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`, 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: '+8.4%',
      trendType: 'up'
    },
    { 
      title: 'تنبيهات الاحتيال', 
      value: stats?.fraudAlerts || 0, 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10',
      trend: '-2',
      trendType: 'down'
    },
  ];

  return (
    <AdminLayout title="نظرة عامة على النظام">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  {stat.trendType !== 'neutral' && (
                    <div className={cn(
                      "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                      stat.trendType === 'up' ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                    )}>
                      {stat.trendType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {stat.trend}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loading ? '...' : stat.value}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity / Chart Placeholder */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">نشاط النظام (آخر 7 أيام)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-gray-50/50 dark:bg-zinc-900/50 rounded-b-xl border-t">
              سيتم عرض الرسم البياني للإيرادات والمهام هنا (Chart.js / Recharts)
            </CardContent>
          </Card>

          {/* Quick Actions / Status */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">حالة النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                <span className="text-sm">قاعدة البيانات</span>
                <span className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  متصل
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                <span className="text-sm">نظام المهام</span>
                <span className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  يعمل
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                <span className="text-sm">بوابة السحب</span>
                <span className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  مفتوحة
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

// Helper function for class merging (assuming it exists in utils)
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
