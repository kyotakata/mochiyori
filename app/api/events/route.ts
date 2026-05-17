// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateShareUrl } from '@/app/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { name, members } = await request.json()

    if (!name || !members || members.length === 0) {
      return NextResponse.json(
        { error: 'Event name and members are required' },
        { status: 400 }
      )
    }

    const shareUrl = generateShareUrl()

    const event = await prisma.event.create({
      data: {
        name,
        shareUrl,
        members: {
          create: members.map((memberName: string) => ({
            name: memberName,
          })),
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json({
      id: event.id,
      shareUrl: event.shareUrl
    })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
