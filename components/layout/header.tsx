import * as React from "react"

import { cn } from "@/lib/utils"

type HeaderProps = React.ComponentProps<"header">

function Header({ className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-neutral-200 bg-neutral-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="text-base font-semibold tracking-tight text-neutral-900">
          PostSmith
        </div>
        <div className="text-sm text-neutral-600">Clean carousel generation</div>
      </div>
    </header>
  )
}

export { Header }
