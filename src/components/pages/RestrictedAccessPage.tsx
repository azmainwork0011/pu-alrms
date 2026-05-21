'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert, Eye, EyeOff, LogOut, ArrowLeft, Lock, Info,
} from 'lucide-react';

interface RestrictedAccessPageProps {
  reason?: string;
}

/**
 * Shown when a demo (guest) user tries to access a restricted area,
 * or when a user without sufficient privileges tries to view a page.
 */
export default function RestrictedAccessPage({ reason }: RestrictedAccessPageProps) {
  const { isDemoUser, setPage, logout } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-md w-full"
      >
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: isDemoUser
              ? 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.05))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
            border: isDemoUser
              ? '1px solid rgba(234,179,8,0.15)'
              : '1px solid rgba(239,68,68,0.15)',
          }}
        >
          {isDemoUser ? (
            <EyeOff className="w-9 h-9 text-amber-400" />
          ) : (
            <ShieldAlert className="w-9 h-9 text-red-400" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isDemoUser ? 'Restricted in Demo Mode' : 'Access Restricted'}
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {reason || (
            isDemoUser
              ? 'This feature is not available for guest users. Admin and teacher areas are protected.'
              : 'You do not have sufficient privileges to access this area.'
          )}
        </p>

        {/* Security notice card */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-6 text-left"
          style={{
            background: isDemoUser
              ? 'rgba(234,179,8,0.04)'
              : 'rgba(239,68,68,0.04)',
            border: isDemoUser
              ? '1px solid rgba(234,179,8,0.1)'
              : '1px solid rgba(239,68,68,0.1)',
          }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: isDemoUser ? '#fbbf24' : '#f87171' }}
          />
          <div className="space-y-2">
            <p className="text-xs leading-relaxed" style={{
              color: isDemoUser ? 'rgba(253,224,71,0.7)' : 'rgba(248,113,113,0.7)',
            }}>
              {isDemoUser ? (
                <>
                  <span className="font-semibold">Demo (Guest) users</span> have read-only access to public content.
                  Admin, Teacher, and sensitive system areas are restricted to prevent unauthorized access.
                  <br /><br />
                  Features like Community Chat, AI Chat, Create Assignment, and Admin Panel are not accessible in demo mode.
                </>
              ) : (
                <>
                  This area requires elevated privileges. Contact your system administrator if you believe
                  this is an error.
                </>
              )}
            </p>
          </div>
        </div>

        {/* What's available in demo mode */}
        {isDemoUser && (
          <div className="mb-6 p-4 rounded-xl text-left" style={{
            background: 'rgba(34,197,94,0.04)',
            border: '1px solid rgba(34,197,94,0.1)',
          }}>
            <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Available in Demo Mode
            </p>
            <ul className="space-y-1">
              {[
                'View dashboard & announcements',
                'Browse assignments & deadlines',
                'View leaderboard & quiz categories',
                'Explore the digital library',
                'View notifications',
              ].map(item => (
                <li key={item} className="text-xs text-emerald-300/60 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setPage('dashboard')}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Button>
          {isDemoUser && (
            <Button
              variant="outline"
              onClick={logout}
              className="gap-2 rounded-xl text-amber-500 hover:text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
            >
              <LogOut className="w-4 h-4" />
              Exit Demo
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
