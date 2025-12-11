"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, ListOrdered, Quote } from 'lucide-react';

const ToolbarButton = ({ onClick, isActive, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
        type="button"
    >
        {children}
    </button>
);

export default function TiptapSimple() {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: '내용을 입력하세요...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-gra-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="flex items-center gap-1 border-b border-gray-100 p-2 bg-gray-50/50">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
                    <UnderlineIcon size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
                    <Strikethrough size={18} />
                </ToolbarButton>
                <div className="w-[1px] h-5 bg-gray-200 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
                    <ListOrdered size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
                    <Quote size={18} />
                </ToolbarButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
