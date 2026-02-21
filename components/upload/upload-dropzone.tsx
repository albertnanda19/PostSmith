"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import type { ApiResponse } from "@/types/api"
import type { StructuredPostOutput, StructuredSlide } from "@/types/post"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type UploadDropzoneProps = {
  className?: string
  onGenerated: (result: StructuredPostOutput) => void
}

async function parseApiResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data: unknown = await res.json()

  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid server response")
  }

  const record = data as Record<string, unknown>
  const success = record.success

  if (success === true) {
    return { success: true, data: record.data as T }
  }

  if (success === false && typeof record.error === "string") {
    return { success: false, error: record.error }
  }

  throw new Error("Invalid server response")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isHeroSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return (
    value.type === "hero" &&
    typeof value.title === "string" &&
    typeof value.subtitle === "string"
  )
}

function isFlowSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "flow" && Array.isArray(value.steps) && value.steps.every((s) => typeof s === "string")
}

function isExplanationSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return (
    value.type === "explanation" &&
    typeof value.title === "string" &&
    Array.isArray(value.points) &&
    value.points.every((p) => typeof p === "string") &&
    Array.isArray(value.highlight) &&
    value.highlight.every((h) => typeof h === "string")
  )
}

function isCtaSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "cta" && typeof value.text === "string"
}

function isParagraphSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return value.type === "paragraph" && typeof value.title === "string" && typeof value.text === "string"
}

function isDiagramSlide(value: unknown): value is StructuredSlide {
  if (!isRecord(value)) return false
  return (
    value.type === "diagram" &&
    typeof value.title === "string" &&
    Array.isArray(value.nodes) &&
    value.nodes.every((n) => typeof n === "string")
  )
}

function isStructuredSlide(value: unknown): value is StructuredSlide {
  return (
    isHeroSlide(value) ||
    isFlowSlide(value) ||
    isExplanationSlide(value) ||
    isParagraphSlide(value) ||
    isDiagramSlide(value) ||
    isCtaSlide(value)
  )
}

function isStructuredPostOutput(value: unknown): value is StructuredPostOutput {
  if (!isRecord(value)) return false

  if (!Array.isArray(value.slides) || !value.slides.every(isStructuredSlide)) {
    return false
  }

  if (!isRecord(value.theme)) return false
  if (typeof value.theme.backgroundColor !== "string") return false

  if (typeof value.caption !== "string") return false
  if (!Array.isArray(value.hashtags) || !value.hashtags.every((t) => typeof t === "string")) {
    return false
  }

  return true
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "Something went wrong"
}

function UploadDropzone({ className, onGenerated }: UploadDropzoneProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const next = e.target.files?.item(0) ?? null
    setFile(next)
  }

  const onGenerate = async () => {
    if (!file || loading) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set("file", file)

      const parseRes = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      })

      const parsed = await parseApiResponse<string>(parseRes)
      if (!parsed.success) {
        throw new Error(parsed.error)
      }

      if (typeof parsed.data !== "string") {
        throw new Error("Invalid server response")
      }

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parsed.data }),
      })

      const generated = await parseApiResponse<StructuredPostOutput>(generateRes)
      if (!generated.success) {
        throw new Error(generated.error)
      }

      if (!isStructuredPostOutput(generated.data)) {
        throw new Error("Invalid server response")
      }

      onGenerated(generated.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              disabled={loading}
            />
            {file ? (
              <div className="text-sm text-neutral-600">{file.name}</div>
            ) : null}
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={onGenerate}
            disabled={!file || loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Carousel"
            )}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

export { UploadDropzone }
