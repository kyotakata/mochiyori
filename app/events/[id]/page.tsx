// app/events/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Member {
  id: string
  name: string
}

interface Item {
  id: string
  memberId: string
  description: string
  amount: number
  member: Member
  createdAt: string
}

interface Settlement {
  from: string
  to: string
  amount: number
}

interface Event {
  id: string
  name: string
  members: Member[]
  items: Item[]
  settlements: Settlement[]
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showItemForm, setShowItemForm] = useState(false)
  const [formData, setFormData] = useState({
    memberId: '',
    description: '',
    amount: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch event')
      const data = await response.json()
      setEvent(data)
    } catch (error) {
      console.error('Error:', error)
      alert('イベント情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.memberId || !formData.description.trim() || !formData.amount) {
      alert('全ての項目を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: formData.memberId,
          description: formData.description,
          amount: parseFloat(formData.amount),
        }),
      })

      if (!response.ok) throw new Error('Failed to add item')

      setFormData({ memberId: '', description: '', amount: '' })
      setShowItemForm(false)
      await fetchEvent()
    } catch (error) {
      console.error('Error:', error)
      alert('持ち物の追加に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">読み込み中...</div>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-red-600">イベントが見つかりません</div>
      </main>
    )
  }

  const totalAmount = event.items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.name}</h1>
          <p className="text-gray-600 mb-4">メンバ: {event.members.map(m => m.name).join(', ')}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowItemForm(!showItemForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              + 持ち物を追加
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              更新
            </button>
          </div>
        </div>

        {/* 持ち物追加フォーム */}
        {showItemForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">持ち物を追加</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  誰が持ってくるか
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">選択してください</option>
                  {event.members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  持ち物
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="例: テント、食材、etc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  金額（円）
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? '登録中...' : '登録'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemForm(false)
                    setFormData({ memberId: '', description: '', amount: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 持ち物一覧 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">持ち物一覧</h2>
          {event.items.length === 0 ? (
            <p className="text-gray-600">まだ持ち物が登録されていません</p>
          ) : (
            <div className="space-y-3">
              {event.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-600">{item.member.name}</p>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">¥{item.amount.toLocaleString()}</p>
                </div>
              ))}
              <div className="border-t-2 pt-3 flex justify-between items-center">
                <p className="font-semibold text-gray-900">合計</p>
                <p className="text-xl font-bold text-green-600">¥{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* 割り勘一覧 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">割り勘</h2>
          {event.settlements.length === 0 ? (
            <p className="text-gray-600">
              {event.items.length === 0
                ? '持ち物を追加すると割り勘が計算されます'
                : 'みんな同じ額を支払っています'}
            </p>
          ) : (
            <div className="space-y-3">
              {event.settlements.map((settlement, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-center flex-1">
                    <p className="font-semibold text-gray-900">{settlement.from}</p>
                    <p className="text-sm text-gray-600">支払い</p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-2xl text-blue-600 font-bold">→</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-semibold text-gray-900">{settlement.to}</p>
                    <p className="text-sm text-gray-600">受取</p>
                  </div>
                  <div className="text-right flex-1">
                    <p className="text-xl font-bold text-red-600">¥{settlement.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
