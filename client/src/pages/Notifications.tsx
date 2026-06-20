import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types/phase8';
import { Card, CardContent } from '../components/ui/card';
import { 
  Bell, 
  CheckCircle2, 
  Wallet, 
  ShieldAlert, 
  Users, 
  Info,
  Clock
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useLocation } from 'wouter';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToNotifications((data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle2 className="text-emerald-500" />;
      case 'earning': return <Badge className="bg-emerald-100 text-emerald-700">+$</Badge>;
      case 'withdrawal': return <Wallet className="text-blue-500" />;
      case 'referral': return <Users className="text-purple-500" />;
      case 'security': return <ShieldAlert className="text-red-500" />;
      default: return <Info className="text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read && notif.id) {
      await notificationService.markAsRead(notif.id);
    }
    if (notif.deepLink) {
      setLocation(notif.deepLink);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="text-primary" />
          الإشعارات
        </h1>
        <Badge variant="secondary">{notifications.filter(n => !n.read).length} جديدة</Badge>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>لا توجد إشعارات حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`cursor-pointer transition-all hover:border-primary/50 ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm">{notif.title}</h3>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {notif.createdAt instanceof Date ? notif.createdAt.toLocaleTimeString('ar-EG') : 'الآن'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.body}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Button variant="ghost" className="w-full text-xs text-muted-foreground">
        تحميل المزيد
      </Button>
    </div>
  );
};
