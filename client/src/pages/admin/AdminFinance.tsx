import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownCircle, 
  CreditCard,
  PieChart as PieChartIcon,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export const AdminFinance = () => {
  const financialData = {
    totalRevenue: 15420.50,
    netProfit: 4230.20,
    liabilities: 2150.00, // Pending withdrawals
    totalPaid: 9040.30,
    reserve: 5000.00
  };

  return (
    <AdminLayout title="الإدارة المالية">
      <div className="space-y-8">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign size={24} />
                </div>
                <Badge className="bg-white/20 text-white border-none">صافي الربح</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">${financialData.netProfit.toLocaleString()}</h3>
                <p className="text-sm opacity-80 mt-1">الأرباح بعد خصم المدفوعات والرسوم</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <TrendingUp size={24} />
                </div>
                <Badge variant="outline" className="text-blue-500 border-blue-500">الإيرادات</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">${financialData.totalRevenue.toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground mt-1">إجمالي الدخل من الإعلانات والشركاء</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <ArrowDownCircle size={24} />
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500">الالتزامات</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-bold">${financialData.liabilities.toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground mt-1">طلبات السحب المعلقة التي لم تُدفع بعد</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">توزيع المدفوعات</CardTitle>
              <PieChartIcon className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>PayPal</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[45%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>USDT (Crypto)</span>
                  <span className="font-medium">35%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[35%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>تحويل بنكي</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[20%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Download */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">التقارير المالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between group">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-muted-foreground group-hover:text-primary" />
                  <span>تقرير الأرباح الشهري (يونيو 2026)</span>
                </div>
                <span className="text-xs text-muted-foreground">PDF</span>
              </Button>
              <Button variant="outline" className="w-full justify-between group">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-muted-foreground group-hover:text-primary" />
                  <span>سجل المدفوعات الكامل</span>
                </div>
                <span className="text-xs text-muted-foreground">CSV</span>
              </Button>
              <Button variant="outline" className="w-full justify-between group">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-muted-foreground group-hover:text-primary" />
                  <span>تحليل الضرائب والرسوم</span>
                </div>
                <span className="text-xs text-muted-foreground">XLSX</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

// Simple Badge component if not available
const Badge = ({ children, className, variant = 'default' }: any) => {
  const variants: any = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-input bg-background',
    secondary: 'bg-secondary text-secondary-foreground',
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)}>
      {children}
    </span>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
