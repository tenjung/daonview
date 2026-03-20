'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Lock } from "lucide-react";
import Link from "next/link";

interface AuthGuardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthGuardDialog({ isOpen, onClose }: AuthGuardDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-lg border-primary/20 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
        
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center animate-bounce-slow">
            <Lock className="text-primary" size={40} />
          </div>
          <DialogTitle className="text-2xl font-black text-text-main tracking-tight">
            로그인이 필요한 서비스입니다
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-base leading-relaxed">
            AI 부가서비스는 다온뷰 회원님들을 위한 <br />
            특별한 혜택입니다. 지금 바로 시작해보세요!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-6">
          <Link href="/login" className="w-full">
            <Button className="w-full h-14 text-lg font-bold rounded-2xl gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <LogIn size={20} />
              로그인하기
            </Button>
          </Link>
          <Link href="/signup" className="w-full">
            <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl gap-2 border-2 hover:bg-primary/5 hover:scale-[1.02] active:scale-95 transition-all">
              <UserPlus size={20} />
              회원가입하고 무료 체험하기
            </Button>
          </Link>
        </div>

        <DialogFooter className="sm:justify-center pt-4">
          <Button variant="ghost" onClick={onClose} className="text-text-muted hover:bg-transparent">
            나중에 살펴보기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
