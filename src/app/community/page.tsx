import { redirect } from "next/navigation";

export default function CommunityPage() {
    // 기본적으로 자유게시판으로 리다이렉트
    redirect("/community/free");
}
