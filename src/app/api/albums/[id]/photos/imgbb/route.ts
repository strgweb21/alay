import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/albums/[id]/photos/imgbb - Upload photos via ImgBB API
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

    const formData = await request.formData()
    const clientApiKey = formData.get('apiKey') as string | null
    const apiKey = clientApiKey || process.env.IMGBB_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ImgBB API key is required. Please provide it in the upload form.' },
        { status: 400 }
      )
    }

    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    const createdPhotos = []
    let needsCoverUpdate = !album.coverUrl
    const errors: string[] = []

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString('base64')

        const imgbbFormData = new FormData()
        imgbbFormData.append('key', apiKey)
        imgbbFormData.append('image', base64)

        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: imgbbFormData,
        })

        const result = await response.json()

        if (!result.success) {
          errors.push(`Failed to upload ${file.name}: ${result.error?.message || 'Unknown ImgBB error'}`)
          continue
        }

        // image.url = original full-quality, display_url = potentially compressed
        const imageUrl = result.data?.image?.url || result.data?.url || result.data?.display_url
        const thumbUrl = result.data?.thumb?.url || null

        if (!imageUrl) {
          errors.push(`Failed to upload ${file.name}: No URL returned from ImgBB`)
          continue
        }

        const photo = await db.photo.create({
          data: {
            albumId: id,
            filename: file.name,
            url: imageUrl,
            thumbnailUrl: thumbUrl,
            source: 'imgbb',
            size: file.size,
          },
        })

        createdPhotos.push(photo)

        if (needsCoverUpdate) {
          await db.album.update({
            where: { id },
            data: { coverUrl: imageUrl },
          })
          needsCoverUpdate = false
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name} to ImgBB:`, err)
        errors.push(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    if (createdPhotos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All uploads failed', details: errors },
        { status: 500 }
      )
    }

    const responseData: { photos: typeof createdPhotos; errors?: string[] } = { photos: createdPhotos }
    if (errors.length > 0) responseData.errors = errors

    const statusCode = errors.length > 0 && createdPhotos.length > 0 ? 207 : 201
    return NextResponse.json({ success: true, data: responseData }, { status: statusCode })
  } catch (error) {
    console.error('Failed to upload photos to ImgBB:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload photos' },
      { status: 500 }
    )
  }
}
