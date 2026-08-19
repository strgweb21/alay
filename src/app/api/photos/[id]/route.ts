import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// DELETE /api/photos/[id] - Delete a photo
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the photo
    const photo = await db.photo.findUnique({
      where: { id },
      include: { album: true },
    })

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete local file if source is 'local'
    if (photo.source === 'local') {
      // Resolve the file path from the URL (e.g. /uploads/albumId/filename)
      const filePath = path.join(process.cwd(), 'public', photo.url)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Check if this photo is the album's cover
    const wasCover = photo.album.coverUrl === photo.url

    // Delete the photo record from DB
    await db.photo.delete({ where: { id } })

    // If it was the cover, clear the album's coverUrl
    if (wasCover) {
      await db.album.update({
        where: { id: photo.albumId },
        data: { coverUrl: null },
      })
    }

    return NextResponse.json({ success: true, data: { id: photo.id } })
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
