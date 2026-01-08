'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import CampaignCard from '@/components/CampaignCard';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
    const { items, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container max-w-6xl px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/campaigns" className="text-gray-400 hover:text-rose-500 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <span className="text-sm font-bold text-rose-500">MY WISHLIST</span>
                        </div>
                        <h1 className="text-3xl font-black text-text-main tracking-tight flex items-center gap-3">
                            관심 캠페인
                            <span className="text-lg font-bold bg-rose-100 text-rose-600 px-3 py-1 rounded-full">
                                {items.length}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium">나중에 신청하고 싶은 캠페인들을 한눈에 확인하세요.</p>
                    </div>

                    {items.length > 0 && (
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                if(confirm('모든 관심 캠페인을 비우시겠습니까?')) {
                                    clearCart();
                                }
                            }}
                            className="text-gray-400 hover:text-red-500 hover:border-red-200 transition-all rounded-xl"
                        >
                            전체 비우기
                        </Button>
                    )}
                </div>

                {/* Content Section */}
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <CampaignCard 
                                key={item.id}
                                id={item.id}
                                title={item.title}
                                platform={item.platform}
                                type={item.type}
                                applicants={item.applicants}
                                total={item.total}
                                dday={item.dday}
                                imageUrl={item.imageUrl}
                                provision={item.provision}
                                region={item.region}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] p-12 md:p-20 text-center shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-10 h-10 text-rose-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">아직 담은 캠페인이 없어요</h2>
                        <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">
                            마음에 드는 캠페인을 발견하면 하트를 눌러보세요.<br/>
                            언제든지 이곳에서 다시 확인할 수 있습니다.
                        </p>
                        <Link href="/campaigns">
                            <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/20">
                                캠페인 구경하러 가기
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
