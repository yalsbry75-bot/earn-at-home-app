/**
 * Terms of Service Page
 * Comprehensive terms and conditions for Earn at Home
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Terms() {
  const { t } = useTranslation();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the Earn at Home platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      title: '2. Use License',
      content: `Permission is granted to temporarily download one copy of the materials (information or software) on Earn at Home for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display
- Attempt to decompile or reverse engineer any software contained on the platform
- Remove any copyright or other proprietary notations from the materials
- Transfer the materials to another person or "mirror" the materials on any other server`,
    },
    {
      title: '3. Disclaimer',
      content: `The materials on Earn at Home are provided on an 'as is' basis. Earn at Home makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`,
    },
    {
      title: '4. Limitations',
      content: `In no event shall Earn at Home or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Earn at Home, even if Earn at Home or an authorized representative has been notified orally or in writing of the possibility of such damage.`,
    },
    {
      title: '5. Accuracy of Materials',
      content: `The materials appearing on Earn at Home could include technical, typographical, or photographic errors. Earn at Home does not warrant that any of the materials on its website are accurate, complete, or current. Earn at Home may make changes to the materials contained on its website at any time without notice.`,
    },
    {
      title: '6. Materials and Content',
      content: `Earn at Home has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Earn at Home of the site. Use of any such linked website is at the user's own risk.`,
    },
    {
      title: '7. Modifications',
      content: `Earn at Home may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.`,
    },
    {
      title: '8. Governing Law',
      content: `These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Earn at Home is located, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.`,
    },
    {
      title: '9. User Accounts',
      content: `To use certain features of the platform, you must create an account. You are responsible for:
- Maintaining the confidentiality of your account information
- All activities that occur under your account
- Notifying us immediately of any unauthorized use
- Providing accurate and complete information during registration
You agree not to create multiple accounts or engage in fraudulent activities.`,
    },
    {
      title: '10. Prohibited Activities',
      content: `You agree not to:
- Engage in any form of fraud or deception
- Violate any applicable laws or regulations
- Infringe upon intellectual property rights
- Harass or harm other users
- Attempt to gain unauthorized access to the platform
- Use automated tools to artificially inflate earnings
- Share your account with others
- Engage in money laundering or other illegal financial activities`,
    },
    {
      title: '11. Payment Terms',
      content: `- Earnings are credited to your wallet upon successful task completion or ad viewing
- Minimum withdrawal amount is $10 USD
- Maximum withdrawal amount is $10,000 USD per transaction
- Withdrawals are processed within 5-7 business days
- We reserve the right to verify user identity before processing withdrawals
- We are not responsible for delays caused by payment processors`,
    },
    {
      title: '12. Refund Policy',
      content: `- Earnings cannot be refunded once credited to your wallet
- Rejected withdrawals will be credited back to your account
- We reserve the right to reverse fraudulent transactions
- Disputes must be reported within 30 days of the transaction`,
    },
    {
      title: '13. Suspension and Termination',
      content: `We reserve the right to suspend or terminate your account if you:
- Violate these terms of service
- Engage in fraudulent or illegal activities
- Violate any applicable laws
- Abuse our platform or other users
Upon termination, your remaining balance will be forfeited.`,
    },
    {
      title: '14. Limitation of Liability',
      content: `In no event shall Earn at Home be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform, even if advised of the possibility of such damages.`,
    },
    {
      title: '15. Contact Information',
      content: `For questions about these terms, please contact us at:
Email: support@earnathome.com
Response time: We will respond to inquiries within 48 hours.`,
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
          <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
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
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-12 p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg"
        >
          <p className="text-gray-300 text-center">
            By using Earn at Home, you acknowledge that you have read and understood these Terms of Service.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
