'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReviewManagementClient from './ReviewManagementClient';
import ReviewUpdateClient from './ReviewUpdateClient';
import DuplicateCleanupClient from './DuplicateCleanupClient';
import BulkReviewClient from './BulkReviewClient';
import { ClipboardCheck, RefreshCw, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedAdminReviewsProps {
    initialReviews: any[];
    user: any;
}

export default function UnifiedAdminReviews({ initialReviews, user }: UnifiedAdminReviewsProps) {
    const [activeTab, setActiveTab] = React.useState('manage');

    return (
        <div className="max-w-[1600px] mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 italic">
                        <ClipboardCheck className="w-8 h-8 text-primary" />
                        Review Management
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        리뷰 검수 및 데이터 동기화, 중복 정리를 한 곳에서 관리하세요.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="manage" className="space-y-6" onValueChange={setActiveTab}>
                <TabsList className="bg-white border p-1 h-auto rounded-2xl shadow-sm flex-wrap">
                    <TabsTrigger
                        value="manage"
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                        )}
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        리뷰 검수
                    </TabsTrigger>
                    <TabsTrigger
                        value="update"
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                        )}
                    >
                        <RefreshCw className="w-4 h-4" />
                        리뷰 업데이트
                    </TabsTrigger>
                    <TabsTrigger
                        value="cleanup"
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                        )}
                    >
                        <Trash2 className="w-4 h-4" />
                        중복 정리
                    </TabsTrigger>
                    <TabsTrigger
                        value="new"
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                            "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                        )}
                    >
                        <PlusCircle className="w-4 h-4" />
                        리뷰 등록
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="manage" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-0 overflow-hidden focus-visible:outline-none">
                    <ReviewManagementClient initialReviews={initialReviews} />
                </TabsContent>

                <TabsContent value="update" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 focus-visible:outline-none">
                    <ReviewUpdateClient />
                </TabsContent>

                <TabsContent value="cleanup" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 focus-visible:outline-none">
                    <DuplicateCleanupClient />
                </TabsContent>

                <TabsContent value="new" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 focus-visible:outline-none">
                    <BulkReviewClient user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
