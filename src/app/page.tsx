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
  type ViewMode = 'grid' | 'list' | 'horizontal'
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
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
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold tracking-tight">Album Koleksi</h1>
            {view === 'albums' ? (
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Buat Album
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setVideoDialogOpen(true)}>
                  <Video className="h-4 w-4 mr-1.5" /> Tambah Video
                </Button>
                <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-1.5" /> Upload Foto
                </Button>
              </div>
            )}
          </div>

          {/* SEARCH + FILTER BAR (only on albums view) */}
          {view === 'albums' && (
            <div className="flex flex-col sm:flex-row gap-3 pb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari album..."
                  value={searchQuery}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={searchCategory} onValueChange={(v) => setFilterCategory(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {view === 'albums' ? (
            <motion.div
              key="albums"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {loading && albums.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : albums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FolderOpen className="h-16 w-16 mb-4 opacity-40" />
                  <p className="text-lg font-medium">Belum ada album</p>
                  <p className="text-sm mt-1">Klik &quot;Buat Album&quot; untuk memulai</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      onClick={() => handleOpenAlbum(album)}
                      onEdit={() => handleEditAlbum(album)}
                      onDelete={() => handleDeleteAlbum(album)}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="items"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Album header */}
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedAlbum?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlbum?._count.total ?? 0} item
                    {selectedAlbum?.category && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        <Tag className="h-3 w-3 mr-1" />{selectedAlbum.category}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* View mode toolbar */}
              <div className="flex items-center gap-1.5 mb-5 p-1 bg-muted rounded-lg w-fit">
                <TooltipButton
                  icon={<LayoutGrid className="h-4 w-4" />}
                  label="Grid"
                  active={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                />
                <TooltipButton
                  icon={<Rows3 className="h-4 w-4" />}
                  label="Scroll"
                  active={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                />
                <TooltipButton
                  icon={<ArrowRightLeft className="h-4 w-4" />}
                  label="Horizontal"
                  active={viewMode === 'horizontal'}
                  onClick={() => setViewMode('horizontal')}
                />
                {viewMode === 'grid' && (
                  <div className="w-px h-6 bg-border mx-1" />
                )}
                {viewMode === 'grid' && (
                  <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v))}>
                    <SelectTrigger className="h-8 w-auto min-w-[60px] border-0 bg-transparent shadow-none focus:ring-0 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 Kolom</SelectItem>
                      <SelectItem value="5">5 Kolom</SelectItem>
                      <SelectItem value="6">6 Kolom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {loading && mediaItems.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-40" />
                  <p className="text-lg font-medium">Belum ada konten</p>
                  <p className="text-sm mt-1">Upload foto atau tambahkan video</p>
                </div>
              ) : viewMode === 'horizontal' ? (
                /* ============ HORIZONTAL SCROLL ============ */
                <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
                  <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory scrollbar-hide">
                    {mediaItems.map((item, index) => (
                      <motion.div
                        key={item.type === 'photo' ? item.data.id : item.data.id}
                        variants={cardVariants}
                        className="snap-start shrink-0 w-[280px] sm:w-[320px]"
                      >
                        <MediaCard
                          item={item}
                          index={index}
                          onClick={() => openLightbox(mediaItems, index)}
                          onDelete={() => {
                            if (item.type === 'photo') deletePhoto(item.data.id)
                            else deleteVideo(item.data.id)
                          }}
                          className="aspect-[4/3]"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                /* ============ LIST / VERTICAL SCROLL ============ */
                <motion.div
                  className="flex flex-col gap-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {mediaItems.map((item, index) => (
                    <motion.div
                      key={item.type === 'photo' ? item.data.id : item.data.id}
                      variants={cardVariants}
                      className="relative group cursor-pointer rounded-xl overflow-hidden"
                      onClick={() => openLightbox(mediaItems, index)}
                    >
                      {item.type === 'video' ? (
                        <div className="relative w-full aspect-video bg-muted">
                          {(item.data as Video).thumbnailUrl ? (
                            <img
                              src={(item.data as Video).thumbnailUrl!}
                              alt={(item.data as Video).title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full p-3">
                              <Play className="h-7 w-7 text-white fill-white" />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                            <p className="text-white text-sm font-medium truncate">{(item.data as Video).title}</p>
                            <p className="text-white/70 text-xs">{formatDate((item.data as Video).createdAt)}</p>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg"
                              onClick={(e) => { e.stopPropagation(); deleteVideo((item.data as Video).id) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full bg-muted">
                          <img
                            src={(item.data as Photo).url}
                            alt={(item.data as Photo).filename}
                            className="w-full max-h-[70vh] object-contain group-hover:scale-[1.01] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg"
                              onClick={(e) => { e.stopPropagation(); deletePhoto((item.data as Photo).id) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* ============ GRID VIEW ============ */
                <motion.div
                  className={`grid grid-cols-2 sm:grid-cols-3 ${gridCols === 5 ? 'lg:grid-cols-5' : gridCols === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-4 sm:gap-4`}
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

      {/* FOOTER */}
      <footer className="border-t py-4 mt-auto">
        <p className="text-center text-xs text-muted-foreground">
          Album Koleksi &mdash; Next.js + Prisma + ImgBB
        </p>
      </footer>

      {/* ====== DIALOGS ====== */}

      {/* Create Album */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Album Baru</DialogTitle>
            <DialogDescription>Isi detail album yang ingin dibuat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="create-name">Nama Album *</Label>
              <Input
                id="create-name"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Contoh: Liburan Bali 2025"
              />
            </div>
            <div>
              <Label htmlFor="create-category">Kategori</Label>
              <Input
                id="create-category"
                value={newAlbumCategory}
                onChange={(e) => setNewAlbumCategory(e.target.value)}
                placeholder="Contoh: Pribadi, Proyek, Event"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="create-desc">Deskripsi</Label>
              <Textarea
                id="create-desc"
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                placeholder="Opsional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateAlbum} disabled={!newAlbumName.trim()}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Album */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
            <DialogDescription>Ubah detail album</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-name">Nama Album *</Label>
              <Input
                id="edit-name"
                value={editAlbumName}
                onChange={(e) => setEditAlbumName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Kategori</Label>
              <Input
                id="edit-category"
                value={editAlbumCategory}
                onChange={(e) => setEditAlbumCategory(e.target.value)}
                list="category-suggestions-edit"
              />
              <datalist id="category-suggestions-edit">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="edit-desc">Deskripsi</Label>
              <Textarea
                id="edit-desc"
                value={editAlbumDesc}
                onChange={(e) => setEditAlbumDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={!editAlbumName.trim()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Photos (ImgBB only) */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!open) handleClearFiles()
        setUploadDialogOpen(open)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Foto via ImgBB</DialogTitle>
            <DialogDescription>
              Foto akan diupload ke ImgBB. Pastikan API key sudah terisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* API Key */}
            <div>
              <Label htmlFor="imgbb-key">ImgBB API Key *</Label>
              <div className="relative mt-1">
                <Input
                  id="imgbb-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={imgbbApiKey}
                  onChange={(e) => setImgbbApiKey(e.target.value)}
                  placeholder="Masukkan API key ImgBB"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Daftar gratis di{' '}
                <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" className="underline">
                  api.imgbb.com
                </a>
              </p>
            </div>

            {/* Drop Zone */}
            <div>
              <Label>Pilih Foto</Label>
              <div
                className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragOver ? 'border-emerald-500 bg-emerald-50' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop foto ke sini, atau <span className="text-emerald-600 font-medium">klik untuk pilih</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF, WEBP</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Previews */}
            {previews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{selectedFiles.length} file dipilih</Label>
                  <Button variant="ghost" size="sm" onClick={handleClearFiles}>
                    <X className="h-3.5 w-3.5 mr-1" /> Hapus Semua
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(i) }}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress */}
            {uploading && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Mengunggah...</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { handleClearFiles(); setUploadDialogOpen(false) }}>Batal</Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0 || !imgbbApiKey.trim()}
            >
              {uploading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Video */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Video</DialogTitle>
            <DialogDescription>
              Paste link YouTube, Vimeo, atau URL embed video lainnya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="video-title">Judul Video *</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Contoh: Behind the scene"
              />
            </div>
            <div>
              <Label htmlFor="video-url">URL Video *</Label>
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mendukung YouTube &amp; Vimeo. Link otomatis dikonversi ke embed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddVideo} disabled={!videoTitle.trim() || !videoUrl.trim()}>
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== LIGHTBOX ====== */}
      <AnimatePresence>
        {lightbox.open && currentLightboxItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/70 text-sm">
              {lightbox.currentIndex + 1} / {lightbox.items.length}
            </div>

            {/* Prev */}
            {lightbox.items.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevItem() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
            )}

            {/* Content */}
            <motion.div
              key={lightbox.currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center p-12"
              onClick={(e) => e.stopPropagation()}
            >
              {currentLightboxItem.type === 'photo' ? (
                <img
                  src={(currentLightboxItem.data as Photo).url}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="w-full max-w-4xl aspect-video">
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

            {/* Next */}
            {lightbox.items.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextItem() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10"
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
  const src = isVideo
    ? (item.data as Video).thumbnailUrl || ''
    : (item.data as Photo).url
  const title = isVideo
    ? (item.data as Video).title
    : (item.data as Photo).filename

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={`relative ${className || 'aspect-square'} rounded-xl overflow-hidden group cursor-pointer`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {isVideo ? (
            <Video className="h-10 w-10 text-muted-foreground/40" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          )}
        </div>
      )}

      {/* Video play icon */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-3">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Delete overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
