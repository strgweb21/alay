'use client'

import { create } from 'zustand'
import { toast } from '@/hooks/use-toast'

// ---------- Types ----------

export interface Album {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  createdAt: string
  updatedAt: string
  _count: { photos: number }
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

type ViewType = 'albums' | 'photos'

interface LightboxState {
  open: boolean
  currentIndex: number
  photos: Photo[]
}

interface AlbumStore {
  // State
  view: ViewType
  albums: Album[]
  photos: Photo[]
  selectedAlbum: Album | null
  lightbox: LightboxState
  loading: boolean
  uploading: boolean
  uploadProgress: number

  // Actions - Navigation
  setView: (view: ViewType, albumId?: string) => void

  // Actions - Albums
  fetchAlbums: () => Promise<void>
  createAlbum: (data: { name: string; description?: string }) => Promise<boolean>
  updateAlbum: (id: string, data: { name?: string; description?: string }) => Promise<boolean>
  deleteAlbum: (id: string) => Promise<boolean>

  // Actions - Photos
  fetchPhotos: (albumId: string) => Promise<void>
  uploadPhotos: (albumId: string, files: File[], method: 'local' | 'imgbb', apiKey?: string) => Promise<boolean>
  deletePhoto: (id: string) => Promise<boolean>

  // Actions - Lightbox
  openLightbox: (photos: Photo[], index: number) => void
  closeLightbox: () => void
  nextPhoto: () => void
  prevPhoto: () => void
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
  selectedAlbum: null,
  lightbox: { open: false, currentIndex: 0, photos: [] },
  loading: false,
  uploading: false,
  uploadProgress: 0,

  // ---------- Navigation ----------

  setView: (view, albumId) => {
    if (view === 'photos' && albumId) {
      const album = get().albums.find((a) => a.id === albumId) || null
      set({ view: 'photos', selectedAlbum: album })
      get().fetchPhotos(albumId)
    } else {
      set({ view: 'albums', selectedAlbum: null, photos: [] })
      get().fetchAlbums()
    }
  },

  // ---------- Albums ----------

  fetchAlbums: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/albums')
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
        // Update selectedAlbum if it's the one being edited
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

  uploadPhotos: async (albumId, files, method, apiKey) => {
    set({ uploading: true, uploadProgress: 0 })
    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }
      if (method === 'imgbb' && apiKey) {
        formData.append('apiKey', apiKey)
      }

      const endpoint =
        method === 'imgbb'
          ? `/api/albums/${albumId}/photos/imgbb`
          : `/api/albums/${albumId}/photos`

      // Simulate progress (real progress with XHR is complex, use a simple animation)
      let progress = 0
      const interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90)
        set({ uploadProgress: progress })
      }, 300)

      const res = await fetch(endpoint, { method: 'POST', body: formData })
      clearInterval(interval)
      set({ uploadProgress: 100 })

      const json = await res.json()
      if (json.success) {
        const uploadedCount = json.data?.photos?.length ?? json.data?.length ?? 0
        const partialErrors = json.data?.errors
        if (partialErrors && partialErrors.length > 0) {
          toast({
            title: `${uploadedCount} foto berhasil diunggah`,
            description: `${partialErrors.length} gagal. Lihat konsol untuk detail.`,
            variant: 'destructive',
          })
          console.warn('Partial upload errors:', partialErrors)
        } else {
          toast({ title: 'Berhasil', description: `${uploadedCount} foto berhasil diunggah` })
        }
        await get().fetchPhotos(albumId)
        await get().fetchAlbums() // refresh cover
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

  // ---------- Lightbox ----------

  openLightbox: (photos, index) => {
    set({ lightbox: { open: true, currentIndex: index, photos } })
  },

  closeLightbox: () => {
    set({ lightbox: { open: false, currentIndex: 0, photos: [] } })
  },

  nextPhoto: () => {
    const { lightbox } = get()
    if (lightbox.photos.length === 0) return
    const nextIndex = (lightbox.currentIndex + 1) % lightbox.photos.length
    set({ lightbox: { ...lightbox, currentIndex: nextIndex } })
  },

  prevPhoto: () => {
    const { lightbox } = get()
    if (lightbox.photos.length === 0) return
    const prevIndex = (lightbox.currentIndex - 1 + lightbox.photos.length) % lightbox.photos.length
    set({ lightbox: { ...lightbox, currentIndex: prevIndex } })
  },
}))
