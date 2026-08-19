import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/albums/[id]/photos - Return all photos for an album
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const album = await db.album.findUnique({ where: { id } })
    if (!album) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      )
    }

    const photos = await db.photo.findMany({
      where: { albumId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: photos })
  } catch (error) {
    console.error('Failed to fetch photos:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}
