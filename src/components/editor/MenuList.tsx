"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import {
    Bold, Italic, Strikethrough, Code,
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Quote, Image, Youtube, Minus
} from 'lucide-react';

export default forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]

        if (item) {
            props.command(item)
        }
    }

    useEffect(() => {
        setSelectedIndex(0)
    }, [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    return (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[200px] p-1 flex flex-col gap-0.5">
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`flex items-center gap-2 text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100 ${index === selectedIndex ? 'bg-indigo-50 text-indigo-700' : ''}`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        {item.icon}
                        {item.title}
                    </button>
                ))
            ) : (
                <div className="item">No result</div>
            )}
        </div>
    )
})
