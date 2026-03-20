import CommunitySidebar from "@/components/community/CommunitySidebar";

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="max-w-[1240px] mx-auto w-full md:w-[90%] py-4 md:py-12 px-0 md:px-6">
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                <CommunitySidebar />
                <main className="flex-1 min-w-0 px-4 md:px-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
