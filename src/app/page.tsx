'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowLeft,
  Upload,
  Trash2,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  FolderOpen,
  Loader2,
  Play,
  Video,
  Image as ImageIcon,
  Tag,
  Eye,
  EyeOff,
  LayoutGrid,
  Rows3,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAlbumStore,
  formatDate,
  type Album,
  type Photo,
  type Video,
  type MediaItem,
} from '@/lib/store'

// ==================== ANIMATIONS ====================

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2, ease: 'easeIn' } },
}

// ==================== MAIN PAGE ====================

export default function Home() {
  const {
    view,
    albums,
    photos,
    videos,
    categories,
    selectedAlbum,
    lightbox,
    loading,
    uploading,
    uploadProgress,
    searchQuery,
    searchCategory,
    setView,
    setSearch,
    setFilterCategory,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    fetchCategories,
    uploadPhotos,
    deletePhoto,
    fetchVideos,
    addVideo,
    deleteVideo,
    openLightbox,
    closeLightbox,
    nextItem,
    prevItem,
  } = useAlbumStore()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)

  // Album form
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDesc, setNewAlbumDesc] = useState('')
  const [newAlbumCategory, setNewAlbumCategory] = useState('')
  const [editAlbumName, setEditAlbumName] = useState('')
  const [editAlbumDesc, setEditAlbumDesc] = useState('')
  const [editAlbumCategory, setEditAlbumCategory] = useState('')
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)

  // View mode
  const [gridCols, setGridCols] = useState(4)

  // Upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imgbbApiKey, setImgbbApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('imgbb_api_key') || ''
    }
    return ''
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video form
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  // Computed: merged media items for album view
  const mediaItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = []
    // Combine photos and videos sorted by createdAt desc
    const combined = [
      ...photos.map((p) => ({ type: 'photo' as const, data: p, createdAt: p.createdAt })),
      ...videos.map((v) => ({ type: 'video' as const, data: v, createdAt: v.createdAt })),
    ]
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return combined.map((c) => ({ type: c.type, data: c.data }))
  }, [photos, videos])

  // Fetch albums and categories on mount
  useEffect(() => {
    fetchAlbums()
    fetchCategories()
  }, [fetchAlbums, fetchCategories])

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox.open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextItem()
      if (e.key === 'ArrowLeft') prevItem()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [lightbox.open, closeLightbox, nextItem, prevItem])

  // File handling
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setSelectedFiles((prev) => [...prev, ...arr])
    arr.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearFiles = () => {
    setSelectedFiles([])
    setPreviews([])
  }

  // Handlers
  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return
    const ok = await createAlbum({
      name: newAlbumName.trim(),
      description: newAlbumDesc.trim() || undefined,
      category: newAlbumCategory.trim() || undefined,
    })
    if (ok) {
      setNewAlbumName('')
      setNewAlbumDesc('')
      setNewAlbumCategory('')
      setCreateDialogOpen(false)
    }
  }

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album)
    setEditAlbumName(album.name)
    setEditAlbumDesc(album.description || '')
    setEditAlbumCategory(album.category || '')
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingAlbum || !editAlbumName.trim()) return
    const ok = await updateAlbum(editingAlbum.id, {
      name: editAlbumName.trim(),
      description: editAlbumDesc.trim() || undefined,
      category: editAlbumCategory.trim() || undefined,
    })
    if (ok) {
      setEditDialogOpen(false)
      setEditingAlbum(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedAlbum || selectedFiles.length === 0 || !imgbbApiKey.trim()) return
    localStorage.setItem('imgbb_api_key', imgbbApiKey.trim())
    const ok = await uploadPhotos(selectedAlbum.id, selectedFiles, imgbbApiKey.trim())
    if (ok) {
      handleClearFiles()
      setUploadDialogOpen(false)
    }
  }

  const handleAddVideo = async () => {
    if (!selectedAlbum || !videoTitle.trim() || !videoUrl.trim()) return
    const ok = await addVideo(selectedAlbum.id, videoTitle.trim(), videoUrl.trim())
    if (ok) {
      setVideoTitle('')
      setVideoUrl('')
      setVideoDialogOpen(false)
    }
  }

  const handleOpenAlbum = (album: Album) => {
    setView('items', album.id)
  }

  const handleBack = () => {
    setView('albums')
  }

  const handleDeleteAlbum = async (album: Album) => {
    await deleteAlbum(album.id)
    if (selectedAlbum?.id === album.id) {
      setView('albums')
    }
  }

  const currentLightboxItem = lightbox.items[lightbox.currentIndex]

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* HEADER & TOP BAR SAMA SEPERTI SEBELUMNYA */}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {view === 'albums' ? (
            /* BAGIAN ALBUM VIEW SAMA */
            null 
          ) : (
            <motion.div
              key="items"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Album Header */}
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedAlbum?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlbum?._count.total ?? 0} item
                  </p>
                </div>

                {/* Pemilih Jumlah Kolom Grid */}
                <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v))}>
                  <SelectTrigger className="h-8 w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Kolom</SelectItem>
                    <SelectItem value="3">3 Kolom</SelectItem>
                    <SelectItem value="4">4 Kolom</SelectItem>
                    <SelectItem value="5">5 Kolom</SelectItem>
                    <SelectItem value="6">6 Kolom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* GRID VIEW (Tampilan Tunggal) */}
              {loading && mediaItems.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-40" />
                  <p className="text-lg font-medium">Belum ada konten</p>
                </div>
              ) : (
                <motion.div
                  className={[
                    'grid gap-0.5 sm:gap-1',
                    gridCols === 2 && 'grid-cols-1 sm:grid-cols-2',
                    gridCols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                    gridCols === 4 && 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
                    gridCols === 5 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
                    gridCols === 6 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
                  ].filter(Boolean).join(' ')}
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {mediaItems.map((item, index) => (
                    <MediaCard
                      key={item.type === 'photo' ? item.data.id : item.data.id}
                      item={item}
                      index={index}
                      onClick={() => openLightbox(mediaItems, index)}
                      onDelete={() => {
                        if (item.type === 'photo') deletePhoto(item.data.id)
                        else deleteVideo(item.data.id)
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ====== LIGHTBOX (BISA CLOSE JIKA DIKLIK DI LUAR) ====== */}
      <AnimatePresence>
        {lightbox.open && currentLightboxItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox} /* KLIK BACKGROUND UNTUK CLOSE */
          >
            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/70 text-sm pointer-events-none">
              {lightbox.currentIndex + 1} / {lightbox.items.length}
            </div>

            {/* Tombol Silang (Tetap Dipertahankan) */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white z-20"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Tombol Navigasi Kiri */}
            {lightbox.items.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevItem() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-20"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
            )}

            {/* Konten Foto/Video (e.stopPropagation MENCEGAH CLOSE SAAT FOTO DIKLIK) */}
            <motion.div
              key={lightbox.currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center p-8 sm:p-12 cursor-default"
              onClick={(e) => e.stopPropagation()} /* CEGAH CLOSE JIKA KLIK DI DALAM AREA MEDIA */
            >
              {currentLightboxItem.type === 'photo' ? (
                <img
                  src={(currentLightboxItem.data as Photo).url}
                  alt=""
                  className="max-w-full max-h-full object-contain pointer-events-auto"
                />
              ) : (
                <div className="w-full max-w-4xl aspect-video pointer-events-auto">
                  <iframe
                    src={(currentLightboxItem.data as Video).url}
                    title={(currentLightboxItem.data as Video).title}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </motion.div>

            {/* Tombol Navigasi Kanan */}
            {lightbox.items.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextItem() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-20"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

function AlbumCard({ album, onClick, onEdit, onDelete }: {
  album: Album
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.div variants={cardVariants} layout>
      <Card
        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
        onClick={onClick}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Actions overlay */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base truncate">{album.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {album.category && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Tag className="h-3 w-3" />{album.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {album._count.total} item
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(album.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TooltipButton({ icon, label, active, onClick }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center h-8 px-2.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  )
}

function MediaCard({ item, index, onClick, onDelete, className }: {
  item: MediaItem
  index: number
  onClick: () => void
  onDelete: () => void
  className?: string
}) {
  const isVideo = item.type === 'video'
  const videoData = isVideo ? (item.data as Video) : null
  
  const src = isVideo
    ? videoData?.thumbnailUrl || ''
    : (item.data as Photo).url

  const title = isVideo
    ? videoData?.title
    : (item.data as Photo).filename

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={`relative overflow-hidden group cursor-pointer ${className || ''}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          className="jw-preview w-full h-auto block object-cover"
        />
      ) : isVideo ? (
        <div className="relative w-full aspect-video overflow-hidden pointer-events-none">
          <iframe
            src={videoData?.url}
            title={title}
            className="jw-preview w-full h-full border-0 pointer-events-none"
            tabIndex={-1}
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-muted flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Delete overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors z-20">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-none shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}