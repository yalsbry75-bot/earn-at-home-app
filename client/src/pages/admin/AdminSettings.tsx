import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { 
  Save, 
  Globe, 
  Coins, 
  ShieldCheck, 
  Lock,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    pointValue: 1000, // 1000 points = 1$
    minWithdrawal: 5,
    maxDailyTasks: 20,
    kycRequired: true,
    maintenanceMode: false,
    referralBonus: 100,
    allowedCountries: ['EG', 'SA', 'AE', 'JO', 'MA'],
  });

  const handleSave = () => {
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <AdminLayout title="إعدادات النظام">
      <div className="max-w-4xl space-y-6">
        {/* Financial Settings */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <Coins className="text-primary" size={20} />
            <CardTitle className="text-lg">الإعدادات المالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">قيمة النقاط (لكل 1 دولار)</label>
                <Input 
                  type="number" 
                  value={settings.pointValue} 
                  onChange={(e) => setSettings({...settings, pointValue: parseInt(e.target.value)})}
                />
                <p className="text-xs text-muted-foreground">حالياً: {settings.pointValue} نقطة = $1.00</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحد الأدنى للسحب ($)</label>
                <Input 
                  type="number" 
                  value={settings.minWithdrawal}
                  onChange={(e) => setSettings({...settings, minWithdrawal: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & KYC */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldCheck className="text-primary" size={20} />
            <CardTitle className="text-lg">الأمان وKYC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">فرض توثيق الهوية (KYC)</p>
                <p className="text-xs text-muted-foreground">منع السحب للمستخدمين غير الموثقين</p>
              </div>
              <Switch 
                checked={settings.kycRequired}
                onCheckedChange={(checked) => setSettings({...settings, kycRequired: checked})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">مكافأة الإحالة (نقاط)</label>
              <Input 
                type="number" 
                value={settings.referralBonus}
                onChange={(e) => setSettings({...settings, referralBonus: parseInt(e.target.value)})}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <Lock className="text-red-500" size={20} />
            <CardTitle className="text-lg">حالة النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border border-red-100 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-red-600">وضع الصيانة</p>
                <p className="text-xs text-red-500">عند التفعيل، سيتم إغلاق التطبيق أمام جميع المستخدمين</p>
              </div>
              <Switch 
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2 px-8">
            <Save size={18} />
            حفظ كافة التغييرات
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};
