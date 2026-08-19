'use client'

import { create } from 'zustand'
import { toast } from '@/hooks/use-toast'

// ---------- Types ----------

export interface Album {
  id: string
  name: string
  description: string | null
  category: string | null
  coverUrl: string | null
  createdAt: string
  updatedAt: string
  _count: { photos: number; videos: number; total: number }
}

export interface Photo {
  id: string
  albumId: string
  filename: string
  url: string
  thumbnailUrl: string | null
  source: string
  size: number | null
  createdAt: string
  updatedAt: string
}

export interface Video {
  id: string
  albumId: string
  title: string
  url: string
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

type ViewType = 'albums' | 'items'

type MediaItem =
  | { type: 'photo'; data: Photo }
  | { type: 'video'; data: Video }

interface LightboxState {
  open: boolean
  currentIndex: number
  items: MediaItem[]
}

interface AlbumStore {
  // State
  view: ViewType
  albums: Album[]
  photos: Photo[]
  videos: Video[]
  categories: string[]
  selectedAlbum: Album | null
  lightbox: LightboxState
  loading: boolean
  uploading: boolean
  uploadProgress: number
  searchQuery: string
  searchCategory: string

  // Actions - Navigation
  setView: (view: ViewType, albumId?: string) => void

  // Actions - Search & Filter
  setSearch: (query: string) => void
  setFilterCategory: (category: string) => void

  // Actions - Albums
  fetchAlbums: () => Promise<void>
  createAlbum: (data: { name: string; description?: string; category?: string }) => Promise<boolean>
  updateAlbum: (id: string, data: { name?: string; description?: string; category?: string }) => Promise<boolean>
  deleteAlbum: (id: string) => Promise<boolean>
  fetchCategories: () => Promise<void>

  // Actions - Photos
  fetchPhotos: (albumId: string) => Promise<void>
  uploadPhotos: (albumId: string, files: File[], apiKey: string) => Promise<boolean>
  deletePhoto: (id: string) => Promise<boolean>

  // Actions - Videos
  fetchVideos: (albumId: string) => Promise<void>
  addVideo: (albumId: string, title: string, url: string) => Promise<boolean>
  deleteVideo: (id: string) => Promise<boolean>

  // Actions - Lightbox
  openLightbox: (items: MediaItem[], index: number) => void
  closeLightbox: () => void
  nextItem: () => void
  prevItem: () => void
}

// ---------- Helpers ----------

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export { formatDate }

// ---------- Store ----------

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  // Initial state
  view: 'albums',
  albums: [],
  photos: [],
  videos: [],
  categories: [],
  selectedAlbum: null,
  lightbox: { open: false, currentIndex: 0, items: [] },
  loading: false,
  uploading: false,
  uploadProgress: 0,
  searchQuery: '',
  searchCategory: '',

  // ---------- Navigation ----------

  setView: (view, albumId) => {
    if (view === 'items' && albumId) {
      const album = get().albums.find((a) => a.id === albumId) || null
      set({ view: 'items', selectedAlbum: album })
      get().fetchPhotos(albumId)
      get().fetchVideos(albumId)
    } else {
      set({ view: 'albums', selectedAlbum: null, photos: [], videos: [] })
      get().fetchAlbums()
    }
  },

  // ---------- Search & Filter ----------

  setSearch: (query) => {
    set({ searchQuery: query })
    get().fetchAlbums()
  },

  setFilterCategory: (category) => {
    set({ searchCategory: category })
    get().fetchAlbums()
  },

  // ---------- Albums ----------

  fetchAlbums: async () => {
    set({ loading: true })
    try {
      const { searchQuery, searchCategory } = get()
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (searchCategory) params.set('category', searchCategory)
      const qs = params.toString()
      const res = await fetch(`/api/albums${qs ? `?${qs}` : ''}`)
      const json = await res.json()
      if (json.success) {
        set({ albums: json.data })
      } else {
        toast({ title: 'Gagal memuat album', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      set({ loading: false })
    }
  },

  createAlbum: async (data) => {
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Album dibuat', description: `"${data.name}" berhasil dibuat` })
        await get().fetchAlbums()
        await get().fetchCategories()
        return true
      } else {
        toast({ title: 'Gagal membuat album', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    }
  },

  updateAlbum: async (id, data) => {
    try {
      const res = await fetch(`/api/albums/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Album diperbarui', description: 'Perubahan berhasil disimpan' })
        await get().fetchAlbums()
        await get().fetchCategories()
        const current = get().selectedAlbum
        if (current && current.id === id) {
          set({ selectedAlbum: { ...current, ...data } })
        }
        return true
      } else {
        toast({ title: 'Gagal memperbarui album', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    }
  },

  deleteAlbum: async (id) => {
    const album = get().albums.find((a) => a.id === id)
    try {
      const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Album dihapus', description: `"${album?.name || 'Album'}" berhasil dihapus` })
        await get().fetchAlbums()
        await get().fetchCategories()
        return true
      } else {
        toast({ title: 'Gagal menghapus album', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      if (json.success) {
        set({ categories: json.data })
      }
    } catch {
      // silent
    }
  },

  // ---------- Photos ----------

  fetchPhotos: async (albumId) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/albums/${albumId}/photos`)
      const json = await res.json()
      if (json.success) {
        set({ photos: json.data })
      } else {
        toast({ title: 'Gagal memuat foto', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
    } finally {
      set({ loading: false })
    }
  },

  uploadPhotos: async (albumId, files, apiKey) => {
    set({ uploading: true, uploadProgress: 0 })
    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }
      formData.append('apiKey', apiKey)

      let progress = 0
      const interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90)
        set({ uploadProgress: progress })
      }, 300)

      const res = await fetch(`/api/albums/${albumId}/photos/imgbb`, {
        method: 'POST',
        body: formData,
      })
      clearInterval(interval)
      set({ uploadProgress: 100 })

      const json = await res.json()
      if (json.success) {
        const uploadedCount = json.data?.photos?.length ?? json.data?.length ?? 0
        const partialErrors = json.data?.errors
        if (partialErrors && partialErrors.length > 0) {
          toast({
            title: `${uploadedCount} foto berhasil`,
            description: `${partialErrors.length} gagal. Cek konsol untuk detail.`,
            variant: 'destructive',
          })
          console.warn('Partial upload errors:', partialErrors)
        } else {
          toast({ title: 'Berhasil', description: `${uploadedCount} foto berhasil diunggah` })
        }
        await get().fetchPhotos(albumId)
        await get().fetchAlbums()
        return true
      } else {
        toast({ title: 'Gagal mengunggah', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    } finally {
      set({ uploading: false, uploadProgress: 0 })
    }
  },

  deletePhoto: async (id) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Foto dihapus', description: 'Foto berhasil dihapus' })
        const albumId = get().selectedAlbum?.id
        if (albumId) {
          await get().fetchPhotos(albumId)
          await get().fetchAlbums()
        }
        return true
      } else {
        toast({ title: 'Gagal menghapus foto', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    }
  },

  // ---------- Videos ----------

  fetchVideos: async (albumId) => {
    try {
      const res = await fetch(`/api/albums/${albumId}/videos`)
      const json = await res.json()
      if (json.success) {
        set({ videos: json.data })
      }
    } catch {
      // silent
    }
  },

  addVideo: async (albumId, title, url) => {
    try {
      const res = await fetch(`/api/albums/${albumId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Video ditambahkan', description: `"${title}" berhasil ditambahkan` })
        await get().fetchVideos(albumId)
        await get().fetchAlbums()
        return true
      } else {
        toast({ title: 'Gagal menambahkan video', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    }
  },

  deleteVideo: async (id) => {
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Video dihapus', description: 'Video berhasil dihapus' })
        const albumId = get().selectedAlbum?.id
        if (albumId) {
          await get().fetchVideos(albumId)
          await get().fetchAlbums()
        }
        return true
      } else {
        toast({ title: 'Gagal menghapus video', description: json.error, variant: 'destructive' })
        return false
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal terhubung ke server', variant: 'destructive' })
      return false
    }
  },

  // ---------- Lightbox ----------

  openLightbox: (items, index) => {
    set({ lightbox: { open: true, currentIndex: index, items } })
  },

  closeLightbox: () => {
    set({ lightbox: { open: false, currentIndex: 0, items: [] } })
  },

  nextItem: () => {
    const { lightbox } = get()
    if (lightbox.items.length === 0) return
    const next = (lightbox.currentIndex + 1) % lightbox.items.length
    set({ lightbox: { ...lightbox, currentIndex: next } })
  },

  prevItem: () => {
    const { lightbox } = get()
    if (lightbox.items.length === 0) return
    const prev = (lightbox.currentIndex - 1 + lightbox.items.length) % lightbox.items.length
    set({ lightbox: { ...lightbox, currentIndex: prev } })
  },
}))
