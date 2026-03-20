import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import {
    Bold, Italic, Strikethrough, Code,
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Quote, Image as ImageIcon, Youtube as YoutubeIcon, Minus
} from 'lucide-react';
import MenuList from './MenuList'

const Command = Extension.create({
    name: 'slash-command',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})

const getSuggestionItems = ({ query }: any) => {
    return [
        {
            title: 'Heading 1',
            icon: <Heading1 size={18} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
            },
        },
        {
            title: 'Heading 2',
            icon: <Heading2 size={18} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
            },
        },
        {
            title: 'Bullet List',
            icon: <List size={18} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
            },
        },
        {
            title: 'Ordered List',
            icon: <ListOrdered size={18} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
            },
        },
        {
            title: 'Check List',
            icon: <CheckSquare size={18} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run()
            },
        },
        {
            title: 'Image',
            icon: <ImageIcon size={18} />,
            command: ({ editor, range }: any) => {
                const url = window.prompt('Image URL')
                if (url) {
                    editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
                }
            },
        },
        {
            title: 'Youtube',
            icon: <YoutubeIcon size={18} />,
            command: ({ editor, range }: any) => {
                const url = window.prompt('Youtube URL')
                if (url) {
                    editor.commands.setYoutubeVideo({ src: url })
                }
            },
        },
        {
            title: 'Divider',
            icon: <Minus size={18} />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run()
            },
        }
    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
}

const renderItems = () => {
    let component: any
    let popup: any

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(MenuList, {
                props,
                editor: props.editor,
            })

            if (!props.clientRect) {
                return
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            })
        },

        onUpdate: (props: any) => {
            component.updateProps(props)

            if (!props.clientRect) {
                return
            }

            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            })
        },

        onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
                popup[0].hide()

                return true
            }

            return component.ref?.onKeyDown(props)
        },

        onExit: () => {
            popup[0].destroy()
            component.destroy()
        },
    }
}

export { Command, getSuggestionItems, renderItems }
