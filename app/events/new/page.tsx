// app/events/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateEventPage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [members, setMembers] = useState([''])
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const handleAddMember = () => {
    setMembers([...members, ''])
  }

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members]
    newMembers[index] = value
    setMembers(newMembers)
  }

  const handleCreate = async () => {
    if (!eventName.trim()) {
      alert('イベント名を入力してください')
      return
    }

    const validMembers = members.filter(m => m.trim())
    if (validMembers.length === 0) {
      alert('最低1人のメンバを入力してください')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          members: validMembers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const data = await response.json()
      setShareUrl(data.shareUrl)
    } catch (error) {
      console.error('Error:', error)
      alert('イベント作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = () => {
    const fullUrl = `${window.location.origin}/events/${shareUrl}`
    navigator.clipboard.writeText(fullUrl)
    alert('URLをコピーしました！')
  }

  const handleNavigateToEvent = () => {
    router.push(`/events/${shareUrl}`)
  }

  if (shareUrl) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            イベント作成完了！
          </h1>
          <p className="text-gray-600 mb-6">
            以下のURLをメンバに共有してください
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 break-all">
            <p className="text-sm font-mono text-gray-700">
              {`${window.location.origin}/events/${shareUrl}`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyUrl}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              URLをコピー
            </button>
            <button
              onClick={handleNavigateToEvent}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              ページを見る
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          イベント作成
        </h1>
        <p className="text-gray-600 mb-6">
          イベント名とメンバを入力してください
        </p>

        <div className="space-y-4">
          {/* イベント名入力 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              イベント名
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="例: 〇〇キャンプ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* メンバ入力 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              メンバ名
            </label>
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder={`メンバ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleAddMember}
              className="mt-2 w-full px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              + メンバを追加
            </button>
          </div>

          {/* 作成ボタン */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '作成'}
          </button>
        </div>
      </div>
    </main>
  )
}
