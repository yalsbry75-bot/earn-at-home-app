import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export const AdminAnalytics = () => {
  const metrics = [
    { title: 'DAU (نشط يومياً)', value: '1,250', trend: '+5.2%', up: true },
    { title: 'MAU (نشط شهرياً)', value: '15,400', trend: '+12.8%', up: true },
    { title: 'معدل الاستبقاء (D7)', value: '42%', trend: '-1.5%', up: false },
    { title: 'متوسط الربح لكل مستخدم', value: '$0.85', trend: '+2.1%', up: true },
  ];

  return (
    <AdminLayout title="تحليلات المنصة المتقدمة">
      <div className="space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{m.title}</p>
                <div className="flex items-end justify-between mt-2">
                  <h3 className="text-2xl font-bold">{m.value}</h3>
                  <Badge className={m.up ? 'bg-emerald-500/10 text-emerald-600 border-none' : 'bg-red-500/10 text-red-600 border-none'}>
                    {m.up ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {m.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conversion Funnel */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">قمع التحويل (Conversion Funnel)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>فتح التطبيق</span>
                  <span className="font-medium">100%</span>
                </div>
                <div className="w-full h-8 bg-primary/10 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-primary w-full opacity-20" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">10,000 مستخدم</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>مشاهدة إعلان</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="w-full h-8 bg-primary/10 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-primary w-[75%] opacity-40" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">7,500 مستخدم</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>إكمال مهمة</span>
                  <span className="font-medium">40%</span>
                </div>
                <div className="w-full h-8 bg-primary/10 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-primary w-[40%] opacity-60" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">4,000 مستخدم</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>طلب سحب</span>
                  <span className="font-medium">5%</span>
                </div>
                <div className="w-full h-8 bg-primary/10 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-primary w-[5%] opacity-80" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">500 مستخدم</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Events Feed */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity size={20} className="text-primary animate-pulse" />
                الأحداث المباشرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: 'ad_watched', user: 'User_882', time: 'الآن', color: 'text-emerald-500' },
                  { event: 'task_completed', user: 'User_102', time: 'منذ دقيقتين', color: 'text-blue-500' },
                  { event: 'user_signup', user: 'New_User', time: 'منذ 5 دقائق', color: 'text-purple-500' },
                  { event: 'withdrawal_requested', user: 'User_441', time: 'منذ 12 دقيقة', color: 'text-amber-500' },
                  { event: 'fraud_detected', user: 'Bot_Check', time: 'منذ 15 دقيقة', color: 'text-red-500' },
                ].map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${ev.color.replace('text', 'bg')}`} />
                      <div>
                        <p className="text-sm font-medium">{ev.event}</p>
                        <p className="text-[10px] text-muted-foreground">{ev.user}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{ev.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
