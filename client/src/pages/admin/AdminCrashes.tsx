import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Bug, 
  AlertCircle, 
  Terminal, 
  Clock, 
  Monitor,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export const AdminCrashes = () => {
  const crashes = [
    { id: '1', error: 'FirebaseError: Permission denied', component: 'WithdrawForm', device: 'Android / Chrome', time: 'منذ 5 دقائق', severity: 'high' },
    { id: '2', error: 'TypeError: Cannot read property "points" of null', component: 'PointsCard', device: 'iOS / Safari', time: 'منذ 12 دقيقة', severity: 'medium' },
    { id: '3', error: 'NetworkError: Failed to fetch ads', component: 'AdManager', device: 'Windows / Edge', time: 'منذ ساعة', severity: 'low' },
  ];

  return (
    <AdminLayout title="مراقبة الأخطاء والأداء">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-red-600 font-medium">أخطاء حرجة</p>
              <h3 className="text-xl font-bold text-red-700">3</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-medium">وقت الاستجابة (avg)</p>
              <h3 className="text-xl font-bold">320ms</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-medium">حجم الحزمة (Gzip)</p>
              <h3 className="text-xl font-bold">142KB</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-medium">معدل نجاح API</p>
              <h3 className="text-xl font-bold text-emerald-600">99.8%</h3>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bug className="text-red-500" />
            أحدث التقارير
          </h3>
          
          {crashes.map((crash) => (
            <Card key={crash.id} className="border-none shadow-sm hover:border-red-200 transition-all border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg h-fit">
                      <AlertCircle className="text-red-600" size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-mono text-sm font-bold text-red-600">{crash.error}</h4>
                      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Terminal size={10} /> {crash.component}</span>
                        <span className="flex items-center gap-1"><Monitor size={10} /> {crash.device}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {crash.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <Badge variant="outline" className={crash.severity === 'high' ? 'text-red-600 border-red-200' : 'text-amber-600 border-amber-200'}>
                      {crash.severity}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-1">
                      التفاصيل
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal size={16} />
              Sentry / Crashlytics Live Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-[10px] opacity-80 space-y-1">
            <p>[2026-06-14 10:22:01] INFO: Performance mark 'app_start' recorded</p>
            <p>[2026-06-14 10:22:05] WARN: AdMob failed to load interstitial (No fill)</p>
            <p>[2026-06-14 10:22:12] ERROR: User_442 failed KYC Level 2 document upload</p>
            <p className="animate-pulse text-emerald-400">_</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
