// app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { calculateSettlements } from '@/app/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { shareUrl: id },
      include: {
        members: true,
        items: {
          include: {
            member: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const settlements = calculateSettlements(event.members, event.items)

    return NextResponse.json({
      ...event,
      settlements,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
