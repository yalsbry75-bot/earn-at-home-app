import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  Pause,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';

export const AdminTasks = () => {
  // Mock data for tasks
  const [tasks, setTasks] = useState([
    { id: '1', title: 'مشاهدة إعلان فيديو', reward: 50, type: 'video', limit: 10, status: 'active', completions: 1250 },
    { id: '2', title: 'تثبيت تطبيق "سلة"', reward: 500, type: 'install', limit: 1, status: 'active', completions: 450 },
    { id: '3', title: 'مشاركة على فيسبوك', reward: 100, type: 'social', limit: 3, status: 'paused', completions: 890 },
  ]);

  return (
    <AdminLayout title="إدارة المهام">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">المهام الحالية</h3>
          <Button className="gap-2">
            <Plus size={18} />
            إضافة مهمة جديدة
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المهمة</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المكافأة (نقطة)</TableHead>
                  <TableHead className="text-right">الحد اليومي</TableHead>
                  <TableHead className="text-right">الإنجازات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.type}</Badge>
                    </TableCell>
                    <TableCell>{task.reward}</TableCell>
                    <TableCell>{task.limit}</TableCell>
                    <TableCell>{task.completions}</TableCell>
                    <TableCell>
                      {task.status === 'active' ? (
                        <Badge className="bg-emerald-500">نشطة</Badge>
                      ) : (
                        <Badge variant="secondary">متوقفة</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 size={16} />
                        </Button>
                        {task.status === 'active' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500">
                            <Pause size={16} />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500">
                            <Play size={16} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Task Creation Form Preview (Static for now) */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">إضافة / تعديل مهمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان المهمة</label>
                <Input placeholder="مثال: متابعة حساب انستقرام" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع المهمة</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option>فيديو</option>
                  <option>تثبيت تطبيق</option>
                  <option>تواصل اجتماعي</option>
                  <option>استبيان</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">المكافأة (نقاط)</label>
                <Input type="number" placeholder="100" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحد اليومي للمستخدم</label>
                <Input type="number" placeholder="5" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">رابط المهمة</label>
                <Input placeholder="https://..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline">إلغاء</Button>
              <Button>حفظ المهمة</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
