"use client";

import React, { useMemo } from 'react';
import {
    Plate,
    PlateContent,
    usePlateEditor,
} from '@udecode/plate-common/react';
import { BaseBasicMarksPlugin } from '@udecode/plate-basic-marks';
import { BaseHeadingPlugin } from '@udecode/plate-heading';
import { BaseBlockquotePlugin } from '@udecode/plate-block-quote';
import { BaseListPlugin } from '@udecode/plate-list';
import { BaseLinkPlugin } from '@udecode/plate-link';
import {
    Bold, Italic, Underline, Strikethrough,
    Heading1, Heading2, Quote, List, ListOrdered, Link as LinkIcon
} from 'lucide-react';

const ToolbarButton = ({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
    <button
        type="button"
        onMouseDown={(e) => {
            e.preventDefault();
            onClick();
        }}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${active ? 'bg-gray-100 text-primary' : 'text-gray-600'}`}
    >
        {children}
    </button>
);

const Toolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const toggleMark = (mark: string) => {
        // Basic toggle - simplified for demo as full API requires helpers
        // valid in many slate/plate versions
        if (editor.marks?.[mark]) {
            editor.removeMark(mark);
        } else {
            editor.addMark(mark, true);
        }
    };

    const toggleBlock = (type: string) => {
        // simplified
    };

    return (
        <div className="flex items-center gap-1 border-b border-gray-200 p-2 bg-gray-50/50">
            <ToolbarButton onClick={() => toggleMark('bold')} active={false}><Bold size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleMark('italic')} active={false}><Italic size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleMark('underline')} active={false}><Underline size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleMark('strikethrough')} active={false}><Strikethrough size={18} /></ToolbarButton>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            <ToolbarButton onClick={() => toggleBlock('h1')} active={false}><Heading1 size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleBlock('h2')} active={false}><Heading2 size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleBlock('blockquote')} active={false}><Quote size={18} /></ToolbarButton>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            <ToolbarButton onClick={() => toggleBlock('ul')} active={false}><List size={18} /></ToolbarButton>
            <ToolbarButton onClick={() => toggleBlock('ol')} active={false}><ListOrdered size={18} /></ToolbarButton>
        </div>
    );
};

export default function PlateEditor() {
    const plugins = useMemo(() => [
        BaseBasicMarksPlugin,
        BaseHeadingPlugin,
        BaseBlockquotePlugin,
        BaseListPlugin,
        BaseLinkPlugin,
    ], []);

    const initialValue = [
        {
            type: 'p',
            children: [{ text: '' }],
        },
    ];

    const editor = usePlateEditor({
        plugins,
        value: initialValue
    });

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
            <Toolbar editor={editor} />
            <div className="p-6 min-h-[400px]">
                <Plate editor={editor}>
                    <PlateContent
                        className="outline-none"
                        placeholder="자유롭게 글을 작성해보세요..."
                    />
                </Plate>
            </div>
        </div>
    );
}
