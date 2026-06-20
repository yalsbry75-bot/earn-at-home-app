/**
 * Settings Page
 * Application settings management
 */

import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const { settings, setLanguage, setTheme, toggleNotifications, toggleOfflineMode } = useSettings();
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            {t('common.logout')}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t('settings.title')}</h2>

          {/* General Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('settings.general')}</CardTitle>
              <CardDescription>
                الإعدادات العامة للتطبيق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="language">{t('settings.language')}</Label>
                <Select value={settings.language} onValueChange={(value: any) => setLanguage(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">{t('settings.theme')}</Label>
                <Select value={settings.theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('settings.lightMode')}</SelectItem>
                    <SelectItem value="dark">{t('settings.darkMode')}</SelectItem>
                    <SelectItem value="system">{t('settings.systemMode')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('settings.notifications')}</CardTitle>
              <CardDescription>
                إدارة الإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">
                  {t('settings.enableNotifications')}
                </Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={toggleNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Offline Mode Settings */}
          <Card>
            <CardHeader>
              <CardTitle>الوضع غير المتصل</CardTitle>
              <CardDescription>
                تفعيل الوضع غير المتصل للعمل بدون إنترنت
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="offline">
                  {t('settings.offlineMode')}
                </Label>
                <Switch
                  id="offline"
                  checked={settings.offlineMode}
                  onCheckedChange={toggleOfflineMode}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
