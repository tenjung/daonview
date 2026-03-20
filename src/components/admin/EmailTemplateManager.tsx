"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Send, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getEmailTemplate, EmailType } from '@/lib/email';
import { toast } from 'sonner';

interface EmailTemplate {
    type: EmailType;
    title: string;
    description: string;
    icon: string;
    sampleParams: {
        nickname?: string;
        campaignTitle?: string;
        providedItems?: string;
        trackingCompany?: string;
        trackingNumber?: string;
        deadlineDate?: string;
        email?: string;
    };
}

export default function EmailTemplateManager() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [previewMode, setPreviewMode] = useState<'preview' | 'edit'>('preview');
    const [editedSubject, setEditedSubject] = useState('');
    const [editedContent, setEditedContent] = useState('');

    // DB에서 템플릿 로드
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/email-templates');
            if (response.ok) {
                const data = await response.json();
                // DB 데이터를 EmailTemplate 형식으로 변환
                const formattedTemplates: EmailTemplate[] = data.map((t: any) => ({
                    type: t.type as EmailType,
                    title: t.title,
                    description: t.description || '',
                    icon: getIconForType(t.type),
                    sampleParams: getSampleParamsForType(t.type)
                }));
                setTemplates(formattedTemplates);
            } else {
                toast.error('템플릿을 불러오는데 실패했습니다');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('템플릿을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const getIconForType = (type: string): string => {
        const icons: Record<string, string> = {
            'WELCOME': '✨',
            'CAMPAIGN_SELECTED': '🎉',
            'PRODUCT_SHIPPED': '📦',
            'DEADLINE_WARNING': '⏰'
        };
        return icons[type] || '📧';
    };

    const getSampleParamsForType = (type: string) => {
        const samples: Record<string, any> = {
            'WELCOME': {
                nickname: '홍길동',
                email: 'user@example.com'
            },
            'CAMPAIGN_SELECTED': {
                nickname: '김인플',
                campaignTitle: '[대구/수성구] 신매영 프리미엄 미용실 펌/매직/염색/클리닉',
                providedItems: '염색 또는 클리닉 1회 + 시술 전후 사진 촬영',
                deadlineDate: '2026.03.12',
                email: 'influencer@example.com'
            },
            'PRODUCT_SHIPPED': {
                nickname: '이체험',
                campaignTitle: '프리미엄 스킨케어 세트 체험단',
                trackingCompany: 'CJ대한통운',
                trackingNumber: '123456789012',
                email: 'user@example.com'
            },
            'DEADLINE_WARNING': {
                nickname: '박리뷰',
                campaignTitle: '신상 화장품 체험단 모집',
                deadlineDate: '2026년 2월 15일',
                email: 'user@example.com'
            }
        };
        return samples[type] || {};
    };

    const handlePreview = async (template: EmailTemplate) => {
        try {
            // DB에서 실제 템플릿 가져오기
            const response = await fetch(`/api/email-templates?type=${template.type}`);
            if (response.ok) {
                const [dbTemplate] = await response.json();
                if (dbTemplate) {
                    setSelectedTemplate(template);
                    setEditedSubject(dbTemplate.subject);
                    setEditedContent(dbTemplate.html_content);
                    setPreviewMode('preview');
                    return;
                }
            }
            // Fallback
            const { subject, html } = getEmailTemplate(template.type, template.sampleParams);
            setSelectedTemplate(template);
            setEditedSubject(subject);
            setEditedContent(html);
            setPreviewMode('preview');
        } catch (error) {
            console.error('Error loading template:', error);
            toast.error('템플릿을 불러오는데 실패했습니다');
        }
    };

    const handleEdit = () => {
        setPreviewMode('edit');
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;

        try {
            const response = await fetch('/api/email-templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedTemplate.type,
                    subject: editedSubject,
                    html_content: editedContent
                })
            });

            if (response.ok) {
                toast.success('템플릿이 저장되었습니다', {
                    description: '변경사항이 성공적으로 적용되었습니다.'
                });
                setPreviewMode('preview');
                fetchTemplates(); // 목록 새로고침
            } else {
                throw new Error('Failed to save template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('템플릿 저장에 실패했습니다', {
                description: '잠시 후 다시 시도해주세요.'
            });
        }
    };

    const handleSendTest = async () => {
        toast.info('테스트 메일 발송 중...', {
            description: '잠시만 기다려주세요.'
        });

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'doriclan@naver.com',
                    type: selectedTemplate?.type,
                    params: selectedTemplate?.sampleParams
                })
            });

            if (response.ok) {
                toast.success('테스트 메일이 발송되었습니다!', {
                    description: 'doriclan@naver.com으로 전송되었습니다.'
                });
            } else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            toast.error('메일 발송에 실패했습니다', {
                description: '잠시 후 다시 시도해주세요.'
            });
        }
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* 템플릿 카드 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {templates.map((template) => (
                    <Card key={template.type} className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="text-5xl">{template.icon}</div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{template.title}</h3>
                                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                                
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handlePreview(template)}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Eye size={16} />
                                        미리보기
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handlePreview(template);
                                            setTimeout(() => handleEdit(), 100);
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Edit size={16} />
                                        수정
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 샘플 파라미터 표시 */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 mb-2">샘플 데이터</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(template.sampleParams).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <span className="text-gray-500">{key}:</span>
                                        <span className="text-gray-900 font-medium truncate">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* 미리보기/수정 다이얼로그 */}
            <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <span className="text-3xl">{selectedTemplate?.icon}</span>
                            <div>
                                <div className="text-xl font-bold">{selectedTemplate?.title}</div>
                                <div className="text-sm text-gray-500 font-normal mt-1">
                                    {previewMode === 'preview' ? '미리보기 모드' : '수정 모드'}
                                </div>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTemplate?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* 제목 */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">이메일 제목</label>
                            {previewMode === 'preview' ? (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    {editedSubject}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={editedSubject}
                                    onChange={(e) => setEditedSubject(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            )}
                        </div>

                        {/* 본문 */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">이메일 본문</label>
                            {previewMode === 'preview' ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <iframe
                                        srcDoc={editedContent}
                                        className="w-full h-[500px] bg-white"
                                        title="Email Preview"
                                    />
                                </div>
                            ) : (
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full h-[500px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs"
                                />
                            )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button
                                onClick={handleSendTest}
                                variant="outline"
                                className="gap-2"
                            >
                                <Send size={16} />
                                테스트 메일 발송
                            </Button>

                            <div className="flex gap-2">
                                {previewMode === 'preview' ? (
                                    <Button onClick={handleEdit} className="gap-2">
                                        <Edit size={16} />
                                        수정하기
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={() => setPreviewMode('preview')}
                                            variant="outline"
                                        >
                                            취소
                                        </Button>
                                        <Button onClick={handleSave} className="gap-2">
                                            <CheckCircle2 size={16} />
                                            저장하기
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
                </>
            )}
        </div>
    );
}
