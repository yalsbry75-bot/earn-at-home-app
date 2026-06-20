/**
 * Profile Page
 * User profile management
 */

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
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
          <h2 className="text-3xl font-bold mb-8">{t('profile.title')}</h2>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>
                معلومات ملفك الشخصي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('profile.displayName')}
                </label>
                <p className="text-lg mt-1">{user?.displayName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('profile.email')}
                </label>
                <p className="text-lg mt-1">{user?.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('profile.createdAt')}
                </label>
                <p className="text-lg mt-1">
                  {user?.createdAt?.toLocaleDateString()}
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="mr-2">
                  {t('profile.editProfile')}
                </Button>
                <Button variant="outline" className="mr-2">
                  {t('profile.changePassword')}
                </Button>
                <Button variant="destructive">
                  {t('profile.deleteAccount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
