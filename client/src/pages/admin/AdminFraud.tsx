import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  ShieldAlert, 
  AlertTriangle, 
  UserX, 
  Search,
  Monitor,
  Globe,
  Fingerprint
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';

export const AdminFraud = () => {
  const alerts = [
    { id: '1', user: 'أحمد علي', email: 'ahmed@example.com', riskScore: 85, reason: 'أجهزة مكررة (Multi-account)', status: 'high' },
    { id: '2', user: 'سارة محمد', email: 'sara@example.com', riskScore: 65, reason: 'تغيير IP متكرر (VPN)', status: 'medium' },
    { id: '3', user: 'خالد حسن', email: 'khaled@example.com', riskScore: 40, reason: 'سلوك غير طبيعي في المهام', status: 'low' },
  ];

  return (
    <AdminLayout title="مركز الاحتيال">
      <div className="space-y-6">
        {/* Fraud Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-red-600 font-medium">تنبيهات حرجة</p>
                  <h3 className="text-3xl font-bold text-red-700">12</h3>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600">
                  <ShieldAlert size={28} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">معدل الاحتيال العام</p>
                  <h3 className="text-3xl font-bold">2.4%</h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                  <AlertTriangle size={28} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">حسابات محظورة اليوم</p>
                  <h3 className="text-3xl font-bold">5</h3>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-gray-600">
                  <UserX size={28} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Table */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">قائمة المشتبه بهم</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">درجة المخاطرة</TableHead>
                  <TableHead className="text-right">السبب الرئيسي</TableHead>
                  <TableHead className="text-right">المؤشرات</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alert.user}</p>
                        <p className="text-xs text-muted-foreground">{alert.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${alert.riskScore > 70 ? 'bg-red-500' : alert.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${alert.riskScore}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold">{alert.riskScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{alert.reason}</TableCell>
                    <TableCell>
                      <div className="flex gap-2" title="أجهزة مكررة / IP مشبوه / بصمة متصفح">
                        <Monitor size={14} className="text-muted-foreground" />
                        <Globe size={14} className="text-muted-foreground" />
                        <Fingerprint size={14} className="text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">تجميد</Button>
                        <Button variant="destructive" size="sm">حظر</Button>
                      </div>
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
