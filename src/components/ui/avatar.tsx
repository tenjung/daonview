"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { isOptimizableImageSrc } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false)
    const canOptimizeImage = isOptimizableImageSrc(src)

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white border border-gray-200 shadow-sm",
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          canOptimizeImage ? (
            <Image
              src={src}
              alt={alt || fallback || "avatar"}
              fill
              sizes="40px"
              className="aspect-square h-full w-full object-cover"
              onError={() => setHasError(true)}
            />
          ) : (
            <img
              src={src}
              alt={alt}
              className="aspect-square h-full w-full object-cover"
              onError={() => setHasError(true)}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-primary uppercase">
            {fallback || "?"}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
