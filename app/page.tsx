import { Header } from "@/components/layout/header"
import { Container } from "@/components/layout/container"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="py-10">
        <Container>
          <div className="flex justify-center">
            <Card className="w-full max-w-xl">
              <CardHeader>
                <CardTitle>Generate Carousel</CardTitle>
                <CardDescription>
                  Upload a PDF and generate slides, caption, and hashtags.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-6" />
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
