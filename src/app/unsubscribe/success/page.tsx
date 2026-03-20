'use client';

import React from 'react';
import Link from 'next/link';
import { MailX, Home, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
              <MailX className="w-10 h-10 text-rose-500" />
            </div>
            <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-1">
              <CheckCircle2 className="w-8 h-8 text-green-500 fill-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          수신 거부가 완료되었습니다
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          다온뷰의 소식을 더 이상 이메일로 보내지 않습니다.<br />
          그동안 이용해 주셔서 감사합니다.
        </p>

        <div className="space-y-3">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </Link>
          
          <p className="text-xs text-slate-400 pt-4">
            실수로 누르셨나요? 나중에 마이페이지 설정에서 다시 소식을 받을 수 있습니다.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
