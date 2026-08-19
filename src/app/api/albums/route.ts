import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/albums - Returns all albums with photo count
export async function GET() {
  try {
    const albums = await db.album.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        coverUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Flatten _count to match frontend expected shape
    const data = albums.map((a) => ({
      ...a,
      _count: { photos: a._count.photos },
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch albums:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

// POST /api/albums - Create a new album
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, coverUrl } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Album name is required' },
        { status: 400 }
      )
    }

    const album = await db.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        coverUrl: coverUrl || null,
      },
    })

    return NextResponse.json({ success: true, data: album }, { status: 201 })
  } catch (error) {
    console.error('Failed to create album:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create album' },
      { status: 500 }
    )
  }
}
