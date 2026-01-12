"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 10 
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        이미지 업로드 ({images.length}/{maxImages})
      </label>
      
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {images.map((file, index) => (
          <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
            <img 
              src={URL.createObjectURL(file)} 
              alt={`upload-${index}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <button 
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/40 text-[10px] text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm font-bold">
              {index + 1}
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button 
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

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple 
        accept="image/*" 
        className="hidden"
      />

      <p className="text-[11px] text-gray-400">
        * 드래그하여 순서를 변경하거나, 클릭하여 삭제할 수 있습니다. (추후 순서 변경 지원 예정)
      </p>
    </div>
  );
}
