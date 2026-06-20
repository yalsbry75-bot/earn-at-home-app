/**
 * Privacy Policy Page
 * Comprehensive privacy policy for Earn at Home
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Privacy() {
  const { t } = useTranslation();

  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as:
- Account registration information (email, name, phone number)
- Payment and banking information for withdrawals
- Device information and IP addresses
- Usage data and analytics
- KYC/AML verification documents`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:
- Provide and maintain our services
- Process payments and withdrawals
- Verify user identity and prevent fraud
- Improve and optimize our platform
- Communicate with you about your account
- Comply with legal and regulatory requirements`,
    },
    {
      title: '3. Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information:
- End-to-end encryption for sensitive data
- Secure authentication mechanisms
- Regular security audits and penetration testing
- Compliance with international data protection standards
- Limited access to personal information by authorized personnel only`,
    },
    {
      title: '4. Third-Party Sharing',
      content: `We do not sell or share your personal information with third parties except:
- Payment processors and financial institutions (for withdrawal processing)
- Ad networks (anonymized data only)
- Legal authorities (when required by law)
- Service providers under strict confidentiality agreements`,
    },
    {
      title: '5. Your Rights',
      content: `You have the right to:
- Access your personal information
- Update or correct your information
- Request deletion of your data
- Opt-out of marketing communications
- Export your data in a portable format
- Lodge a complaint with relevant authorities`,
    },
    {
      title: '6. Cookies and Tracking',
      content: `We use cookies and similar tracking technologies to:
- Remember your preferences
- Understand how you use our platform
- Improve user experience
- Prevent fraud and abuse
You can control cookie settings through your browser preferences.`,
    },
    {
      title: '7. Data Retention',
      content: `We retain your personal information for as long as necessary to:
- Provide our services
- Comply with legal obligations
- Resolve disputes
- Enforce our agreements
After this period, we securely delete your information.`,
    },
    {
      title: '8. Children\'s Privacy',
      content: `Our platform is not intended for users under 18 years old. We do not knowingly collect information from children. If we become aware of such collection, we will delete the information promptly.`,
    },
    {
      title: '9. Changes to This Policy',
      content: `We may update this privacy policy from time to time. We will notify you of significant changes via email or through our platform. Your continued use of the platform constitutes acceptance of the updated policy.`,
    },
    {
      title: '10. Contact Us',
      content: `If you have questions about this privacy policy or our privacy practices, please contact us at:
Email: privacy@earnathome.com
Address: [Your Company Address]
Response time: We will respond to privacy inquiries within 30 days.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        {/* Content */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
            >
              <h2 className="text-2xl font-bold text-blue-400 mb-4">{section.title}</h2>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg"
        >
          <p className="text-gray-300 text-center">
            By using Earn at Home, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
