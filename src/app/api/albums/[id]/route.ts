import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// PUT /api/albums/[id] - Update album name/description
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, coverUrl } = body

    // Verify album exists
    const existing = await db.album.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      )
    }

    const updateData: {
      name?: string
      description?: string | null
      coverUrl?: string | null
    } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Album name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (coverUrl !== undefined) {
      updateData.coverUrl = coverUrl || null
    }

    const album = await db.album.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: album })
  } catch (error) {
    console.error('Failed to update album:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update album' },
      { status: 500 }
    )
  }
}

// DELETE /api/albums/[id] - Delete album and cascade delete photos + local files
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify album exists
    const existing = await db.album.findUnique({
      where: { id },
      include: { photos: true },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      )
    }

    // Delete local upload directory if it exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', id)
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true })
    }

    // Delete album (photos are cascade deleted via Prisma schema)
    await db.album.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { deletedPhotosCount: existing.photos.length },
    })
  } catch (error) {
    console.error('Failed to delete album:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}
