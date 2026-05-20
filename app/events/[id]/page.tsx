'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

interface Member {
  id: string
  name: string
}

interface SplitMember {
  member: Member
}

interface Item {
  id: string
  memberId: string
  description: string
  amount: number
  member: Member
  splitAmong: SplitMember[]
  createdAt: string
}

interface Settlement {
  from: string
  to: string
  amount: number
}

interface EventData {
  id: string
  name: string
  members: Member[]
  items: Item[]
  settlements: Settlement[]
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitWith, setSplitWith] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [editEventName, setEditEventName] = useState('')
  const [editMembers, setEditMembers] = useState<string[]>([])
  const [filterMemberId, setFilterMemberId] = useState('')

  const fetchEvent = useCallback(async () => {
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
  }, [eventId])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const resetForm = () => {
    setMemberId('')
    setDescription('')
    setAmount('')
    setSplitWith([])
    setEditingItem(null)
    setShowForm(false)
  }

  const openEditForm = (item: Item) => {
    setEditingItem(item.id)
    setMemberId(item.memberId)
    setDescription(item.description)
    setAmount(item.amount.toString())
    setSplitWith(item.splitAmong.map(s => s.member.id))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId || !description.trim()) {
      alert('項目を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const body = {
        memberId,
        description: description.trim(),
        amount: amount ? parseFloat(amount) : 0,
        splitWith,
      }

      const url = `/api/events/${eventId}/items`
      const method = editingItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { ...body, itemId: editingItem } : body),
      })

      if (!res.ok) throw new Error('Failed')
      resetForm()
      await fetchEvent()
    } catch (error) {
      console.error('Error:', error)
      alert(editingItem ? '更新に失敗しました' : '追加に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('この持ち物を削除しますか？')) return
    try {
      const res = await fetch(`/api/events/${eventId}/items?itemId=${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchEvent()
    } catch (error) {
      console.error('Error:', error)
      alert('削除に失敗しました')
    }
  }

  const toggleSplitWith = (mId: string) => {
    setSplitWith(prev =>
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    )
  }

  const openEditEvent = () => {
    if (!event) return
    setEditEventName(event.name)
    setEditMembers(event.members.map(m => m.name))
    setShowEditEvent(true)
  }

  const handleEditMemberChange = (index: number, value: string) => {
    const newMembers = [...editMembers]
    newMembers[index] = value
    setEditMembers(newMembers)
  }

  const handleAddEditMember = () => {
    setEditMembers([...editMembers, ''])
  }

  const handleRemoveEditMember = (index: number) => {
    setEditMembers(editMembers.filter((_, i) => i !== index))
  }

  const handleSaveEvent = async () => {
    if (!editEventName.trim()) {
      alert('イベント名を入力してください')
      return
    }
    const validMembers = editMembers.filter(m => m.trim())
    if (validMembers.length === 0) {
      alert('最低1人のメンバを入力してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEventName.trim(),
          members: validMembers,
        }),
      })
      if (!res.ok) throw new Error('Failed to update event')
      const data = await res.json()
      setEvent(data)
      setShowEditEvent(false)
    } catch (error) {
      console.error('Error:', error)
      alert('イベント更新に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-lg text-muted-foreground">読み込み中...</p>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-lg text-destructive">イベントが見つかりません</p>
      </main>
    )
  }

  const totalAmount = event.items.reduce((sum, item) => sum + item.amount, 0)

  const splitMemberNames = (item: Item): string | null => {
    if (item.amount === 0) return null
    if (!item.splitAmong?.length) return '全員で割り勘'
    const names = [item.member, ...item.splitAmong.map(s => s.member)]
      .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
      .map(m => m.name)
      .join(', ')
    return `${names}で割り勘`
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-2xl sm:text-3xl truncate">{event.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  メンバ: {event.members.map(m => m.name).join(', ')}
                </p>
              </div>
              <Button variant="outline" size="icon" className="size-8 shrink-0" onClick={openEditEvent}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                <span className="sr-only">イベント編集</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => { resetForm(); setShowForm(true) }} size="sm">
              + 持ち物を追加
            </Button>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {editingItem ? '持ち物を編集' : '持ち物を追加'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Select value={memberId} onValueChange={(v) => v && setMemberId(v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="メンバを選択">
                        {memberId ? event.members.find(m => m.id === memberId)?.name ?? '' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {event.members.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">が</span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="例: テント、食材"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">を持ち寄る</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    かかった金額（円）
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    割り勘するメンバ（未選択の場合は全員で割り勘）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {event.members.map(m => {
                      const selected = splitWith.includes(m.id)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleSplitWith(m.id)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground hover:bg-accent'
                          }`}
                        >
                          {m.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? '登録中...' : editingItem ? '更新' : '登録'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg">持ち物一覧</CardTitle>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMemberId('')}
                  className={`px-2.5 py-1 rounded-full text-xs border transition ${
                    filterMemberId === ''
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-accent'
                  }`}
                >
                  すべて
                </button>
                {event.members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFilterMemberId(m.id)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition ${
                      filterMemberId === m.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-accent'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {event.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">まだ持ち物が登録されていません</p>
            ) : (
              <div className="space-y-2">
                {event.items
                  .filter(item => !filterMemberId || item.memberId === filterMemberId)
                  .map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.member.name}</p>
                      {splitMemberNames(item) && (
                        <p className="text-xs text-muted-foreground">{splitMemberNames(item)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">¥{item.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditForm(item)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        <span className="sr-only">編集</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        <span className="sr-only">削除</span>
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">合計</span>
                  <span className="text-xl font-bold text-primary">¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">割り勘</CardTitle>
          </CardHeader>
          <CardContent>
            {event.settlements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {event.items.length === 0
                  ? '持ち物を追加すると割り勘が計算されます'
                  : 'みんな同じ額を支払っています'}
              </p>
            ) : (
              <div className="space-y-2">
                {event.settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border"
                  >
                    <div className="text-center min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm truncate">{s.from}</p>
                      <p className="text-xs text-muted-foreground">支払い</p>
                    </div>
                    <div className="px-3">
                      <span className="text-xl text-primary font-bold">→</span>
                    </div>
                    <div className="text-center min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm truncate">{s.to}</p>
                      <p className="text-xs text-muted-foreground">受取</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-destructive">¥{s.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditEvent} onOpenChange={setShowEditEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>イベント編集</DialogTitle>
            <DialogDescription>イベント名とメンバを編集できます</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">イベント名</label>
              <Input
                value={editEventName}
                onChange={e => setEditEventName(e.target.value)}
                placeholder="イベント名"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">メンバ名</label>
              <div className="space-y-2">
                {editMembers.map((member, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={member}
                      onChange={e => handleEditMemberChange(index, e.target.value)}
                      placeholder={`メンバ${index + 1}`}
                      className="flex-1"
                    />
                    {editMembers.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveEditMember(index)}
                      >
                        削除
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={handleAddEditMember} className="w-full mt-2">
                + メンバを追加
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              キャンセル
            </DialogClose>
            <Button onClick={handleSaveEvent} disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
