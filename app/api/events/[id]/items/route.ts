import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { memberId, description, amount, splitWith } = await request.json()

    const event = await prisma.event.findUnique({
      where: { shareUrl: id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const member = await prisma.member.findFirst({
      where: { id: memberId, eventId: event.id },
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
        ...(splitWith && splitWith.length > 0
          ? {
              splitAmong: {
                create: splitWith.map((mId: string) => ({
                  memberId: mId,
                })),
              },
            }
          : {}),
      },
      include: {
        member: true,
        splitAmong: {
          include: { member: true },
        },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { itemId, memberId, description, amount, splitWith } = await request.json()

    const event = await prisma.event.findUnique({
      where: { shareUrl: id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const existingItem = await prisma.item.findFirst({
      where: { id: itemId, eventId: event.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (memberId !== undefined) updateData.memberId = memberId
    if (description !== undefined) updateData.description = description
    if (amount !== undefined) updateData.amount = parseFloat(amount)

    if (splitWith !== undefined) {
      await prisma.itemSplit.deleteMany({ where: { itemId } })
      if (splitWith.length > 0) {
        await prisma.itemSplit.createMany({
          data: splitWith.map((mId: string) => ({
            itemId,
            memberId: mId,
          })),
        })
      }
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: {
        member: true,
        splitAmong: {
          include: { member: true },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.findUnique({
      where: { shareUrl: id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const existingItem = await prisma.item.findFirst({
      where: { id: itemId, eventId: event.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    await prisma.item.delete({ where: { id: itemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
