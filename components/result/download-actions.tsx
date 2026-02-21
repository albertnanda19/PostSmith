import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DownloadActionsProps = {
  className?: string
}

function DownloadActions({ className }: DownloadActionsProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="w-full" disabled>
          Download Slides
        </Button>
        <Button type="button" className="w-full" variant="outline" disabled>
          Preview Carousel
        </Button>
      </CardContent>
    </Card>
  )
}

export { DownloadActions }
