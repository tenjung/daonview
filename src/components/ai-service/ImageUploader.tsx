"use client";

import { useState, useRef } from "react";
import { X, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  label?: string;
  showCount?: boolean;
  showHelpText?: boolean;
}

function SortableImage({
  file,
  index,
  onRemove
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group cursor-grab active:cursor-grabbing"
    >
      <img
        src={URL.createObjectURL(file)}
        alt={`upload-${index}`}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
      />
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={14} />
      </button>
      <div className="absolute bottom-1 left-1 bg-black/40 text-[10px] text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm font-bold z-10">
        {index + 1}
      </div>
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <GripVertical size={20} className="text-white drop-shadow-md" />
      </div>
    </div>
  );
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  label = "이미지 업로드",
  showCount = true,
  showHelpText = true
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > maxImages) {
      toast.error(`최대 ${maxImages}장까지만 업로드 가능합니다.`);
      return;
    }
    onImagesChange([...images, ...files]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label} {showCount && `(${images.length}/${maxImages})`}
        </label>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <SortableContext
            items={images.map((_, i) => i.toString())}
            strategy={rectSortingStrategy}
          >
            {images.map((file, index) => (
              <SortableImage
                key={`${index}-${file.name}`}
                file={file}
                index={index}
                onRemove={removeImage}
              />
            ))}
          </SortableContext>

          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group"
            >
              <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-bold mt-2">추가하기</span>
            </button>
          )}
        </div>
      </DndContext>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {showHelpText && (
        <p className="text-[11px] text-gray-400">
          * 드래그하여 순서를 변경하거나, 클릭하여 삭제할 수 있습니다.
        </p>
      )}
    </div>
  );
}
