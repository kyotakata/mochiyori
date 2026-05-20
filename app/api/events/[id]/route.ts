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
            splitAmong: {
              include: { member: true },
            },
          },
          orderBy: { createdAt: 'asc' },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, members } = await request.json()

    const event = await prisma.event.findUnique({
      where: { shareUrl: id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (name) {
      await prisma.event.update({
        where: { id: event.id },
        data: { name },
      })
    }

    if (members && Array.isArray(members)) {
      const validMembers = members.filter((m: string) => m.trim())
      if (validMembers.length > 0) {
        await prisma.member.deleteMany({
          where: { eventId: event.id },
        })

        await prisma.member.createMany({
          data: validMembers.map((name: string) => ({
            eventId: event.id,
            name: name.trim(),
          })),
        })
      }
    }

    const updated = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        members: true,
        items: {
          include: {
            member: true,
            splitAmong: {
              include: { member: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const settlements = updated ? calculateSettlements(updated.members, updated.items) : []

    return NextResponse.json({
      ...updated,
      settlements,
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}
