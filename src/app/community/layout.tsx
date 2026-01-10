import CommunitySidebar from "@/components/community/CommunitySidebar";

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="max-w-[1200px] mx-auto w-[90%] py-8 md:py-12">
            <div className="flex flex-col md:flex-row gap-8">
                <CommunitySidebar />
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
