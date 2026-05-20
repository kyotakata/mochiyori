'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>イベント作成完了！</CardTitle>
            <CardDescription>以下のURLをメンバに共有してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg break-all text-sm font-mono text-foreground">
              {`${window.location.origin}/events/${shareUrl}`}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCopyUrl} className="flex-1">
                URLをコピー
              </Button>
              <Button onClick={handleNavigateToEvent} variant="secondary" className="flex-1">
                ページを見る
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>イベント作成</CardTitle>
          <CardDescription>イベント名とメンバを入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">イベント名</label>
            <Input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="例: 〇〇キャンプ"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">メンバ名</label>
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder={`メンバ${index + 1}`}
                    className="flex-1"
                  />
                  {members.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(index)}
                    >
                      削除
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={handleAddMember} className="w-full mt-2">
              + メンバを追加
            </Button>
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full"
          >
            {loading ? '作成中...' : '作成'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
