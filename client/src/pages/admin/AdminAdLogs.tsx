import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { ExternalLink, ShieldCheck, ShieldAlert, PlayCircle } from 'lucide-react';

export const AdminAdLogs = () => {
  const adLogs = [
    { id: '1', user: 'ahmed@test.com', network: 'AdMob', type: 'Rewarded', reward: '50 pts', status: 'verified', time: 'منذ 3 دقائق' },
    { id: '2', user: 'sara@test.com', network: 'Unity', type: 'Interstitial', reward: '-', status: 'verified', time: 'منذ 10 دقائق' },
    { id: '3', user: 'bot_user', network: 'AppLovin', type: 'Rewarded', reward: '500 pts', status: 'rejected', time: 'منذ 15 دقيقة' },
    { id: '4', user: 'khaled@test.com', network: 'Meta', type: 'Banner', reward: '-', status: 'verified', time: 'منذ ساعة' },
  ];

  return (
    <AdminLayout title="سجل الإعلانات والمكافآت">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">إجمالي المشاهدات اليوم</p>
              <h3 className="text-2xl font-bold mt-1">4,820</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">المكافآت الموزعة</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">125,400 نقطة</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">محاولات احتيال محجوبة</p>
              <h3 className="text-2xl font-bold mt-1 text-red-500">142</h3>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الشبكة</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المكافأة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.network}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PlayCircle size={14} className="text-muted-foreground" />
                        {log.type}
                      </div>
                    </TableCell>
                    <TableCell>{log.reward}</TableCell>
                    <TableCell>
                      {log.status === 'verified' ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                          <ShieldCheck size={14} />
                          موثق
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                          <ShieldAlert size={14} />
                          مرفوض
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                    <TableCell>
                      <ExternalLink size={16} className="text-muted-foreground cursor-pointer hover:text-primary" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
