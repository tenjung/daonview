"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ColumnType = "ACADEMY_INFLUENCER" | "ACADEMY_ADVERTISER";

interface GenerateColumnButtonProps {
  type: ColumnType;
  className: string;
}

export default function GenerateColumnButton({ type, className }: GenerateColumnButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/admin/generate-column", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(`칼럼 생성 실패: ${data.details || data.error || "알 수 없는 오류"}`);
        return;
      }

      toast.success(`${data.message} (${data.duration})`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Column generation error:", error);
      toast.error("칼럼 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className}>
        <Sparkles size={18} />
        AI 칼럼 생성
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI 칼럼 생성</DialogTitle>
            <DialogDescription>
              AI 칼럼을 생성하시겠습니까? 생성에는 10~30초가 소요될 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              취소
            </Button>
            <Button onClick={handleGenerate} disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "생성하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
