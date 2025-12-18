"use client";

import * as React from "react"
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';

// Radix UI
import * as Toolbar from '@radix-ui/react-toolbar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';

// Utilities
import { cn } from "@/lib/utils";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
    List, ListOrdered, CheckSquare, Quote, Image as ImageIcon, Link as LinkIcon,
    Heading1, Heading2, Heading3,
    AlignLeft, AlignCenter, AlignRight,
    Undo, Redo, Minus, Youtube as YoutubeIcon, Type,
    ChevronDown, Palette, Check, Trash2
} from 'lucide-react';

// --- Preset Colors (Official Style) ---
const THEME_COLORS = [
    { name: 'Default', color: '#000000' },
    { name: 'Gray', color: '#6B7280' },
    { name: 'Red', color: '#EF4444' },
    { name: 'Orange', color: '#F97316' },
    { name: 'Amber', color: '#F59E0B' },
    { name: 'Yellow', color: '#EAB308' },
    { name: 'Lime', color: '#84CC16' },
    { name: 'Green', color: '#22C55E' },
    { name: 'Emerald', color: '#10B981' },
    { name: 'Teal', color: '#14B8A6' },
    { name: 'Cyan', color: '#06B6D4' },
    { name: 'Sky', color: '#0EA5E9' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Indigo', color: '#6366F1' },
    { name: 'Violet', color: '#8B5CF6' },
    { name: 'Purple', color: '#A855F7' },
    { name: 'Fuchsia', color: '#D946EF' },
    { name: 'Pink', color: '#EC4899' },
    { name: 'Rose', color: '#F43F5E' },
];

const HIGHLIGHT_COLORS = [
    { name: 'Default', color: 'transparent' },
    { name: 'Yellow', color: '#fef08a' },
    { name: 'Green', color: '#bbf7d0' },
    { name: 'Blue', color: '#bfdbfe' },
    { name: 'Purple', color: '#e9d5ff' },
    { name: 'Pink', color: '#fbcfe8' },
    { name: 'Red', color: '#fecaca' },
    { name: 'Orange', color: '#fed7aa' },
];

const ToolbarButton = ({ onClick, isActive, disabled, children, className, title, type = "button" }: any) => (
    <Toolbar.Button
        className={cn(
            "p-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center disabled:opacity-30 outline-none flex-shrink-0 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
            isActive
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
            className
        )}
        onClick={onClick}
        disabled={disabled}
        title={title}
        type={type}
    >
        {children}
    </Toolbar.Button>
);

const ToolbarSeparator = () => (
    <Toolbar.Separator className="w-[1px] bg-gray-200 mx-1 flex-shrink-0 h-5 self-center" />
);

export default function TiptapEditor({ initialContent = '', onChange }: { initialContent?: string, onChange?: (content: string) => void }) {
    const [color, setColor] = React.useState('#000000');

    // Editor Setup
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            Underline,
            Image.configure({ HTMLAttributes: { class: 'rounded-lg border border-gray-200 shadow-sm' } }),
            Link.configure({ openOnClick: false }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Youtube.configure({ controls: true }),
            HorizontalRule,
            Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-8 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6 prose-li:my-1',
            },
        },
        onUpdate: ({ editor }) => {
            setColor(editor.getAttributes('textStyle').color || '#000000');
            if (onChange) {
                onChange(editor.getHTML());
            }
        }
    });

    if (!editor) {
        return <div className="min-h-[500px] bg-white rounded-xl border border-gray-200 animate-pulse" />;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Image URL');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    const addYoutube = () => {
        const url = window.prompt('Youtube URL');
        if (url) editor.commands.setYoutubeVideo({ src: url });
    };

    return (
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col overflow-hidden w-full">
            {/* --- Toolbar --- */}
            <Toolbar.Root
                className="flex items-center p-2 border-b border-gray-200 bg-white sticky top-0 z-10 gap-0.5 overflow-x-auto scrollbar-hide w-full flex-nowrap"
                aria-label="Formatting options"
            >
                {/* 1. History */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="실행 취소">
                    <Undo size={18} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시 실행">
                    <Redo size={18} />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* 2. Style Dropdown */}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 text-sm font-medium text-gray-700 outline-none flex-shrink-0 min-w-[80px] justify-between focus:ring-2 focus:ring-indigo-500 rounded-md transition-colors">
                            <span className="truncate">
                                {editor.isActive('heading', { level: 1 }) ? '제목 1' :
                                    editor.isActive('heading', { level: 2 }) ? '제목 2' :
                                        editor.isActive('heading', { level: 3 }) ? '제목 3' : '본문'}
                            </span>
                            <ChevronDown size={14} className="opacity-50 flex-shrink-0 ml-1" />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[120px] z-50 animate-in fade-in zoom-in-95 duration-100">
                        <DropdownMenu.Item onSelect={() => editor.chain().focus().setParagraph().run()} className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none"><Type size={14} className="mr-2" /> 본문</DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none font-bold"><Heading1 size={14} className="mr-2" /> 제목 1</DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none font-semibold"><Heading2 size={14} className="mr-2" /> 제목 2</DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none font-medium"><Heading3 size={14} className="mr-2" /> 제목 3</DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <ToolbarSeparator />

                {/* 3. Text Formatting */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={18} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={18} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={18} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={18} /></ToolbarButton>


                <ToolbarSeparator />

                {/* 4. Color & Highlight (Official Popover Style) */}
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button
                            className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 rounded-md transition-colors flex-shrink-0 group"
                            title="색상 및 형광펜"
                        >
                            <Palette
                                size={18}
                                className="group-hover:text-gray-900 text-gray-500 transition-colors"
                                style={{ color: editor.getAttributes('textStyle').color }}
                            />
                            <ChevronDown size={12} className="ml-1 opacity-50" />
                        </button>
                    </Popover.Trigger>
                    <Popover.Content className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-64 z-50 animate-in fade-in zoom-in-95 duration-100" sideOffset={5} align="start">

                        {/* Text Color Section */}
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Text Color</div>
                        <div className="flex flex-wrap gap-1 mb-4">
                            {THEME_COLORS.map((themeColor) => (
                                <button
                                    key={themeColor.name}
                                    onClick={() => editor.chain().focus().setColor(themeColor.color).run()}
                                    className={`w-6 h-6 rounded border border-gray-100 hover:scale-110 transition-transform ${editor.isActive('textStyle', { color: themeColor.color }) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                                    style={{ backgroundColor: themeColor.color }}
                                    title={themeColor.name}
                                />
                            ))}
                            <button
                                onClick={() => editor.chain().focus().unsetColor().run()}
                                className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                                title="색상 제거"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Highlight Color Section */}
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider border-t border-gray-100 pt-2">Highlight</div>
                        <div className="flex flex-wrap gap-1">
                            {HIGHLIGHT_COLORS.map((highlightColor) => (
                                <button
                                    key={highlightColor.name}
                                    onClick={() => highlightColor.color === 'transparent' ? editor.chain().focus().unsetHighlight().run() : editor.chain().focus().toggleHighlight({ color: highlightColor.color }).run()}
                                    className={`w-6 h-6 rounded border border-gray-100 hover:scale-110 transition-transform ${editor.isActive('highlight', { color: highlightColor.color }) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                                    style={{ backgroundColor: highlightColor.color === 'transparent' ? '#ffffff' : highlightColor.color }}
                                    title={highlightColor.name}
                                >
                                    {highlightColor.color === 'transparent' && <div className="w-full h-[1px] bg-red-400 rotate-45 transform scale-x-125" />}
                                </button>
                            ))}
                        </div>

                    </Popover.Content>
                </Popover.Root>

                <ToolbarSeparator />

                {/* 5. Alignments */}
                <div className="flex gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}><AlignLeft size={18} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}><AlignCenter size={18} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}><AlignRight size={18} /></ToolbarButton>
                </div>

                <ToolbarSeparator />

                {/* 6. Lists */}
                <div className="flex gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={18} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><ListOrdered size={18} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')}><CheckSquare size={18} /></ToolbarButton>
                </div>

                <ToolbarSeparator />

                {/* 7. Inserts */}
                <div className="flex gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={18} /></ToolbarButton>
                    <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={18} /></ToolbarButton>
                    <ToolbarButton onClick={addImage}><ImageIcon size={18} /></ToolbarButton>
                    <ToolbarButton onClick={addYoutube}><YoutubeIcon size={18} /></ToolbarButton>
                </div>

            </Toolbar.Root>

            <EditorContent editor={editor} />
        </div>
    );
}
