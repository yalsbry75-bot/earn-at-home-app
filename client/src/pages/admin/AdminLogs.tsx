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
import { History, User, Settings, Wallet, CheckSquare, ShieldAlert } from 'lucide-react';

export const AdminLogs = () => {
  const logs = [
    { id: '1', admin: 'admin@earn.com', action: 'Update user status', target: 'user_123', type: 'user', time: 'منذ 5 دقائق' },
    { id: '2', admin: 'admin@earn.com', action: 'Update system settings', target: 'general', type: 'settings', time: 'منذ 15 دقيقة' },
    { id: '3', admin: 'manager@earn.com', action: 'Approve withdrawal', target: 'wd_998', type: 'withdrawal', time: 'منذ ساعة' },
    { id: '4', admin: 'admin@earn.com', action: 'Create new task', target: 'task_55', type: 'task', time: 'منذ ساعتين' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User size={16} className="text-blue-500" />;
      case 'settings': return <Settings size={16} className="text-gray-500" />;
      case 'withdrawal': return <Wallet size={16} className="text-emerald-500" />;
      case 'task': return <CheckSquare size={16} className="text-amber-500" />;
      default: return <History size={16} />;
    }
  };

  return (
    <AdminLayout title="سجلات النظام (Audit Logs)">
      <div className="space-y-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المسؤول</TableHead>
                  <TableHead className="text-right">العملية</TableHead>
                  <TableHead className="text-right">الهدف</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.admin}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{log.target}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIcon(log.type)}
                        <span className="text-sm capitalize">{log.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
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
