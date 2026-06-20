/**
 * About Page
 * Information about Earn at Home application
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, Users, Zap, Shield } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Award,
      title: 'Earn Rewards',
      description: 'Complete tasks and watch ads to earn points that can be withdrawn',
    },
    {
      icon: Users,
      title: 'Referral Program',
      description: 'Invite friends and earn bonuses when they complete their first task',
    },
    {
      icon: Zap,
      title: 'Fast Payouts',
      description: 'Quick and reliable withdrawal process with multiple payment methods',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security measures',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-4">About Earn at Home</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A legitimate platform where you can earn real money by completing tasks and watching ads
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 mb-16 border border-slate-700"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            We believe everyone should have the opportunity to earn extra income from home. Our platform connects
            users with legitimate earning opportunities through task completion and advertising partnerships. We're
            committed to providing a transparent, secure, and rewarding experience for all our users.
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition-colors"
              >
                <Icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700"
        >
          <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Transparency</h3>
              <p className="text-gray-300">
                We're transparent about how our platform works, how much you can earn, and how payments are processed.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Security</h3>
              <p className="text-gray-300">
                Your personal and financial information is protected with industry-leading security standards.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Reliability</h3>
              <p className="text-gray-300">
                We guarantee timely payouts and consistent opportunities to earn on our platform.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Fairness</h3>
              <p className="text-gray-300">
                All users are treated equally with fair compensation for their time and effort.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
