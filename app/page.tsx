import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-foreground mb-4">Mochiyori</h1>
        <p className="text-lg text-muted-foreground mb-8">
          イベントの持ち物と割り勘を簡単管理
        </p>
        <Link href="/events/new">
          <Button size="lg" className="text-base px-10 py-6">
            はじめる
          </Button>
        </Link>
      </div>
    </main>
  );
}
