import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/albums/[id]/videos
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

    const videos = await db.video.findMany({
      where: { albumId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: videos })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// POST /api/albums/[id]/videos - Add video to album
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
    const { title, url } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video title is required' },
        { status: 400 }
      )
    }

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Convert YouTube/other URLs to embed URLs
    let embedUrl = url.trim()
    let thumbnailUrl: string | null = null

    // YouTube
    const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
      thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
    }

    // Vimeo
    const vimeoMatch = embedUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    const video = await db.video.create({
      data: {
        albumId: id,
        title: title.trim(),
        url: embedUrl,
        thumbnailUrl,
      },
    })

    // Set as cover if album has no cover
    if (!album.coverUrl && thumbnailUrl) {
      await db.album.update({
        where: { id },
        data: { coverUrl: thumbnailUrl },
      })
    }

    return NextResponse.json({ success: true, data: video }, { status: 201 })
  } catch (error) {
    console.error('Failed to add video:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add video' },
      { status: 500 }
    )
  }
}
