import { supabase } from "@/lib/supabaseClient";
import EventBoardClient from "./EventBoardClient";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function EventPage() {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('type', '이벤트')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching events detailed:', JSON.stringify(error, null, 2));
        return (
            <div className="p-10 border border-red-200 rounded-xl bg-red-50 text-red-700">
                <h2 className="font-bold mb-2">이벤트를 불러오는 중 오류가 발생했습니다.</h2>
                <p className="text-sm opacity-80">에러 코드: {error.code}</p>
                <p className="text-sm opacity-80">메시지: {error.message}</p>
            </div>
        );
    }

    return <EventBoardClient initialPosts={data || []} />;
}

