import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/albums?search=xxx&category=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (category) {
      where.category = category
    }

    const albums = await db.album.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        coverUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            photos: true,
            videos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const data = albums.map((a) => ({
      ...a,
      _count: {
        photos: a._count.photos,
        videos: a._count.videos,
        total: a._count.photos + a._count.videos,
      },
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
    const { name, description, category, coverUrl } = body

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
        category: category?.trim() || null,
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
