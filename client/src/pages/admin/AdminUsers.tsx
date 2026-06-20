import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { 
  Search, 
  UserX, 
  UserCheck, 
  ShieldAlert, 
  MoreVertical,
  Eye
} from 'lucide-react';
import { adminService } from '../../services/admin/adminService';
import { User } from '../../types';
import { Badge } from '../../components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'suspended' | 'deleted') => {
    try {
      await adminService.updateUserStatus(userId, status, 'Admin manual update');
      toast.success('تم تحديث حالة المستخدم بنجاح');
      fetchUsers();
    } catch (error) {
      toast.error('فشل في تحديث الحالة');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500 hover:bg-emerald-600">نشط</Badge>;
      case 'suspended': return <Badge variant="outline" className="text-amber-500 border-amber-500">معلق</Badge>;
      case 'deleted': return <Badge variant="destructive">محظور</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="إدارة المستخدمين">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="بحث عن مستخدم (الاسم أو البريد)..." 
              className="pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <ShieldAlert size={18} />
              المستخدمين عاليي المخاطر
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الرصيد</TableHead>
                  <TableHead className="text-right">النقاط</TableHead>
                  <TableHead className="text-right">المستوى</TableHead>
                  <TableHead className="text-right">تاريخ الانضمام</TableHead>
                  <TableHead className="text-left w-[100px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">جاري التحميل...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">لا يوجد مستخدمين مطابقين للبحث</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.displayName || 'بدون اسم'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>${user.balance.toFixed(2)}</TableCell>
                      <TableCell>{user.points}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.level}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.createdAt instanceof Date ? user.createdAt.toLocaleDateString('ar-EG') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-right">
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Eye size={16} />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            {user.status !== 'active' && (
                              <DropdownMenuItem 
                                className="gap-2 text-emerald-600 cursor-pointer"
                                onClick={() => handleUpdateStatus(user.id, 'active')}
                              >
                                <UserCheck size={16} />
                                تفعيل الحساب
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'suspended' && (
                              <DropdownMenuItem 
                                className="gap-2 text-amber-600 cursor-pointer"
                                onClick={() => handleUpdateStatus(user.id, 'suspended')}
                              >
                                <ShieldAlert size={16} />
                                تعليق الحساب
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'deleted' && (
                              <DropdownMenuItem 
                                className="gap-2 text-red-600 cursor-pointer"
                                onClick={() => handleUpdateStatus(user.id, 'deleted')}
                              >
                                <UserX size={16} />
                                حظر نهائي
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
