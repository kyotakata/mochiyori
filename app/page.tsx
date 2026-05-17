import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Mochiyori</h1>
          <p className="text-xl text-gray-600 mb-8">
            イベントの持ち物と割り勘を簡単管理
          </p>
          <Link
            href="/events/new"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            はじめる
          </Link>
        </div>
      </div>
    </main>
  );
}
