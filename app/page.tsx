"use client"

import * as React from "react"

import { Header } from "@/components/layout/header"
import { Container } from "@/components/layout/container"
import { UploadDropzone } from "@/components/upload/upload-dropzone"
import { SlideGrid } from "@/components/result/slide-grid"
import { CaptionBox } from "@/components/result/caption-box"
import { HashtagList } from "@/components/result/hashtag-list"
import { DownloadActions } from "@/components/result/download-actions"
import type { StructuredPostOutput } from "@/types/post"

export default function Home() {
  const [result, setResult] = React.useState<StructuredPostOutput | null>(null)

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="py-10">
        <Container>
          <div className="mx-auto w-full max-w-3xl space-y-8">
            <UploadDropzone onGenerated={setResult} />

            {result ? (
              <section className="space-y-6">
                <SlideGrid slides={result.slides} />
                <CaptionBox caption={result.caption} />
                <HashtagList hashtags={result.hashtags} />
                <DownloadActions slides={result.slides} theme={result.theme} />
              </section>
            ) : null}
          </div>
        </Container>
      </main>
    </div>
  );
}
