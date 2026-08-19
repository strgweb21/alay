import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

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

// POST /api/albums/[id]/photos - Upload photos locally via FormData
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify album exists
    const album = await db.album.findUnique({ where: { id } })
    if (!album) {
      return NextResponse.json(
        { success: false, error: 'Album not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', id)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const createdPhotos = []
    let needsCoverUpdate = !album.coverUrl

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const timestamp = Date.now()
      const ext = path.extname(file.name) || '.jpg'
      const uniqueFilename = `${timestamp}-${i}${ext}`
      const filePath = path.join(uploadDir, uniqueFilename)
      const urlPath = `/uploads/${id}/${uniqueFilename}`

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      // Create Photo record
      const photo = await db.photo.create({
        data: {
          albumId: id,
          filename: file.name,
          url: urlPath,
          source: 'local',
          size: file.size,
        },
      })

      createdPhotos.push(photo)

      // Set first photo as cover if album has no cover
      if (needsCoverUpdate) {
        await db.album.update({
          where: { id },
          data: { coverUrl: urlPath },
        })
        needsCoverUpdate = false
      }
    }

    return NextResponse.json({ success: true, data: createdPhotos }, { status: 201 })
  } catch (error) {
    console.error('Failed to upload photos:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload photos' },
      { status: 500 }
    )
  }
}
