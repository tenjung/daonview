"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    List, CheckSquare, Image as ImageIcon, Link as LinkIcon,
    Heading1, Heading2, Plus
} from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';

const ToolbarButton = ({ onClick, isActive, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) => (
    <button
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
        type="button"
    >
        {children}
    </button>
);

export default function TiptapNotion() {
    const [isMounted, setIsMounted] = useState(false);
    const bubbleMenuRef = useRef<HTMLDivElement>(null);
    const floatingMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] }
            }),
            Underline,
            Image,
            Link.configure({ openOnClick: false }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder: "명령어는 '/'를 입력하세요..." }),
        ],
        content: `
            <h2>자유로운 아이디어를 펼쳐보세요 ✨</h2>
            <p>텍스트를 드래그하면 메뉴가 나타납니다.</p>
            <p></p>
            <p>빈 줄을 클릭하면 왼쪽에 + 버튼이 나타납니다.</p>
        `,
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-12 relative',
            },
        },
        onSelectionUpdate: ({ editor }) => {
            // Bubble Menu Logic (Text Selection)
            if (bubbleMenuRef.current) {
                const { view, state } = editor;
                const { from, to } = state.selection;
                const text = state.doc.textBetween(from, to, '');

                if (text && !state.selection.empty) {
                    const { categories } = state.selection.content() as any; // Simple check
                    const domSelection = view.dom.ownerDocument.getSelection();
                    if (domSelection && domSelection.rangeCount > 0) {
                        const range = domSelection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        const editorRect = view.dom.getBoundingClientRect();

                        bubbleMenuRef.current.style.display = 'flex';
                        bubbleMenuRef.current.style.top = `${rect.top - editorRect.top - 50}px`; // position above
                        bubbleMenuRef.current.style.left = `${rect.left - editorRect.left + (rect.width / 2) - (bubbleMenuRef.current.offsetWidth / 2)}px`; // center
                    }
                } else {
                    bubbleMenuRef.current.style.display = 'none';
                }
            }

            // Floating Menu Logic (Empty Line)
            if (floatingMenuRef.current) {
                const { selection } = editor.state;
                const { $anchor } = selection;
                const isRoot = $anchor.depth === 1;
                const isEmpty = $anchor.parent.content.size === 0;

                if (isRoot && isEmpty) {
                    const view = editor.view;
                    const coords = view.coordsAtPos($anchor.pos);
                    const editorRect = view.dom.getBoundingClientRect();

                    floatingMenuRef.current.style.display = 'flex';
                    floatingMenuRef.current.style.top = `${coords.top - editorRect.top - 5}px`;
                    floatingMenuRef.current.style.left = `-40px`; // Fixed left margin inside editor container
                } else {
                    floatingMenuRef.current.style.display = 'none';
                }
            }
        }
    });

    const addImage = useCallback(() => {
        const url = window.prompt('이미지 URL을 입력하세요:');
        if (url && editor) editor.chain().focus().setImage({ src: url }).run();
    }, [editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL을 입력하세요:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!isMounted || !editor) {
        return <div className="min-h-[500px] bg-white rounded-xl border border-gray-200" />;
    }

    return (
        <div className="border border-gray-200 rounded-xl bg-white shadow-xl focus-within:ring-2 focus-within:ring-indigo-100 transition-all group relative px-12">

            {/* Custom Bubble Menu (Absolute Positioned) */}
            <div
                ref={bubbleMenuRef}
                className="absolute z-50 hidden bg-white shadow-xl border border-gray-200 rounded-lg p-1 gap-1 items-center animate-in fade-in zoom-in-95 duration-100"
                style={{ transition: 'top 0.1s, left 0.1s' }}
            >
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={16} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={16} /></ToolbarButton>
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 size={16} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 size={16} /></ToolbarButton>
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={16} /></ToolbarButton>
            </div>

            {/* Custom Floating Menu (Absolute Positioned) */}
            <div
                ref={floatingMenuRef}
                className="absolute z-40 hidden left-4"
            >
                <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors group relative">
                    <Plus size={20} />
                    {/* Expandable Menu on Hover/Click */}
                    <div className="hidden group-hover:flex absolute top-0 left-8 bg-white shadow-xl border border-gray-200 rounded-lg p-1 gap-1 items-center w-max">
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 size={16} /></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16} /></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}><CheckSquare size={16} /></ToolbarButton>
                        <ToolbarButton onClick={addImage} isActive={false}><ImageIcon size={16} /></ToolbarButton>
                    </div>
                </button>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}
