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

// POST /api/albums/[id]/photos - Save photo URLs to database
// Frontend uploads directly to ImgBB/Cloudinary, then sends URLs here.
// No file data passes through this endpoint — only URLs.
export async function POST(
  request: NextRequest,
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

    const body = await request.json()
    const photos: { filename: string; url: string; thumbnailUrl: string | null; size: number }[] = body.photos

    if (!Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos provided' },
        { status: 400 }
      )
    }

    const needsCoverUpdate = !album.coverUrl

    const created = await db.photo.createMany({
      data: photos.map((p) => ({
        albumId: id,
        filename: p.filename,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        source: 'imgbb',
        size: p.size || null,
      })),
    })

    // Set first photo as album cover if no cover exists
    if (needsCoverUpdate && photos[0]?.url) {
      await db.album.update({
        where: { id },
        data: { coverUrl: photos[0].url },
      })
    }

    return NextResponse.json({
      success: true,
      data: { count: created.count },
    })
  } catch (error) {
    console.error('Failed to save photos:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save photos' },
      { status: 500 }
    )
  }
}
