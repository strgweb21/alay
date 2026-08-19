import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories - Return all unique categories
export async function GET() {
  try {
    const categories = await db.album.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    })

    const data = categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null)
      .sort()

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
