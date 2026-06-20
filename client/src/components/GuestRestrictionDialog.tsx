/**
 * Guest Mode Restriction Dialog
 * Displays professional messages when guest users try to access restricted features
 */
import { useEffect, useState } from 'react';
import { useGuest } from '../contexts/GuestContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLocation } from 'wouter';
import { AlertCircle } from 'lucide-react';

export function GuestRestrictionDialog() {
  const { restrictionMessage, clearRestrictionMessage, isGuestMode } = useGuest();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (restrictionMessage) {
      setIsOpen(true);
    }
  }, [restrictionMessage]);

  const handleCreateAccount = () => {
    setIsOpen(false);
    clearRestrictionMessage();
    setLocation('/register');
  };

  const handleLogin = () => {
    setIsOpen(false);
    clearRestrictionMessage();
    setLocation('/login');
  };

  const handleClose = () => {
    setIsOpen(false);
    clearRestrictionMessage();
  };

  if (!isGuestMode) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="glass-card-premium border-white/20 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#d4af37]/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-[#d4af37]" />
            </div>
            <AlertDialogTitle className="text-white">وضع الضيف</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-300 mt-4">
            {restrictionMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
          <p className="text-sm text-gray-400 mb-3">
            للاستفادة من جميع المميزات والبدء في الكسب الحقيقي، يرجى:
          </p>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>✓ إنشاء حساب مجاني</li>
            <li>✓ التحقق من بريدك الإلكتروني</li>
            <li>✓ إكمال بيانات ملفك الشخصي</li>
            <li>✓ البدء في إكمال المهام والكسب</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <AlertDialogCancel
            onClick={handleClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            العودة
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCreateAccount}
            className="btn-gold"
          >
            إنشاء حساب مجاني
          </AlertDialogAction>
        </div>

        <button
          onClick={handleLogin}
          className="w-full mt-2 text-[#d4af37] hover:text-[#f4d03f] text-sm font-semibold transition"
        >
          هل لديك حساب بالفعل؟ تسجيل الدخول
        </button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
