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
      const validNewNames = members
        .map((m: string) => m.trim())
        .filter(Boolean)

      if (validNewNames.length > 0) {
        const existingMembers = await prisma.member.findMany({
          where: { eventId: event.id },
        })
        const existingNames = new Set(existingMembers.map(m => m.name))
        const existingNameToId = new Map(existingMembers.map(m => [m.name, m.id]))

        const toAdd = validNewNames.filter(name => !existingNames.has(name))
        if (toAdd.length > 0) {
          await prisma.member.createMany({
            data: toAdd.map(name => ({ eventId: event.id, name })),
          })
        }

        const toRemove = existingMembers.filter(m => !validNewNames.includes(m.name))
        for (const member of toRemove) {
          const itemCount = await prisma.item.count({ where: { memberId: member.id } })
          if (itemCount === 0) {
            await prisma.member.delete({ where: { id: member.id } })
          }
        }
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
