import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { memberId, description, amount } = await request.json()

    // shareUrl から event を取得
    const event = await prisma.event.findUnique({
      where: {
        shareUrl: id,
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // member が event に属しているか確認
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        eventId: event.id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found in this event' },
        { status: 404 }
      )
    }

    const item = await prisma.item.create({
      data: {
        eventId: event.id,
        memberId,
        description,
        amount: parseFloat(amount),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating item:', error)

    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}