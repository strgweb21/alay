'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Trash2,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon as LucideImage,
  Eye,
  EyeOff,
  FolderOpen,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useAlbumStore, formatDate, type Album, type Photo } from '@/lib/store'

// ==================== ANIMATION VARIANTS ====================

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeIn' } },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

const lightboxOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const lightboxImageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

// ==================== MAIN PAGE ====================

export default function Home() {
  const {
    view,
    albums,
    photos,
    selectedAlbum,
    lightbox,
    loading,
    uploading,
    uploadProgress,
    setView,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    uploadPhotos,
    deletePhoto,
    openLightbox,
    closeLightbox,
    nextPhoto,
    prevPhoto,
  } = useAlbumStore()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Form states
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDesc, setNewAlbumDesc] = useState('')
  const [editAlbumName, setEditAlbumName] = useState('')
  const [editAlbumDesc, setEditAlbumDesc] = useState('')
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)

  // Upload states
  const [uploadMethod, setUploadMethod] = useState<'local' | 'imgbb'>('local')
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

  // Fetch albums on mount
  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox.open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightbox.open, closeLightbox, nextPhoto, prevPhoto])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightbox.open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightbox.open])

  // ---- Handlers ----

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return
    const ok = await createAlbum({ name: newAlbumName.trim(), description: newAlbumDesc.trim() || undefined })
    if (ok) {
      setNewAlbumName('')
      setNewAlbumDesc('')
      setCreateDialogOpen(false)
    }
  }

  const handleOpenEditDialog = (album: Album) => {
    setEditingAlbum(album)
    setEditAlbumName(album.name)
    setEditAlbumDesc(album.description || '')
    setEditDialogOpen(true)
  }

  const handleEditAlbum = async () => {
    if (!editingAlbum || !editAlbumName.trim()) return
    const ok = await updateAlbum(editingAlbum.id, {
      name: editAlbumName.trim(),
      description: editAlbumDesc.trim() || undefined,
    })
    if (ok) {
      setEditDialogOpen(false)
      setEditingAlbum(null)
    }
  }

  const handleDeleteAlbum = async (id: string) => {
    await deleteAlbum(id)
  }

  const handleSelectFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setSelectedFiles((prev) => [...prev, ...newFiles])

    // Generate previews
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearFiles = () => {
    setSelectedFiles([])
    setPreviews([])
  }

  const handleUpload = async () => {
    if (!selectedAlbum || selectedFiles.length === 0) return

    // Save API key to localStorage if using ImgBB
    if (uploadMethod === 'imgbb' && imgbbApiKey.trim()) {
      localStorage.setItem('imgbb_api_key', imgbbApiKey.trim())
    }

    const ok = await uploadPhotos(
      selectedAlbum.id,
      selectedFiles,
      uploadMethod,
      uploadMethod === 'imgbb' ? imgbbApiKey.trim() : undefined
    )
    if (ok) {
      setSelectedFiles([])
      setPreviews([])
      setUploadDialogOpen(false)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleSelectFiles(e.dataTransfer.files)
  }, [])

  // ---- Render ----

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'albums' ? (
            <motion.div
              key="albums"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
              <AlbumsView
                albums={albums}
                loading={loading}
                onOpenCreateDialog={() => setCreateDialogOpen(true)}
                onEditAlbum={handleOpenEditDialog}
                onDeleteAlbum={handleDeleteAlbum}
                onSelectAlbum={(album) => setView('photos', album.id)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="photos"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
              <PhotosView
                album={selectedAlbum}
                photos={photos}
                loading={loading}
                onBack={() => setView('albums')}
                onOpenUploadDialog={() => setUploadDialogOpen(true)}
                onDeletePhoto={deletePhoto}
                onOpenLightbox={openLightbox}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Album Koleksi &mdash; Admin Panel</p>
      </footer>

      {/* Create Album Dialog */}
      <CreateAlbumDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        name={newAlbumName}
        description={newAlbumDesc}
        onNameChange={setNewAlbumName}
        onDescriptionChange={setNewAlbumDesc}
        onSubmit={handleCreateAlbum}
      />

      {/* Edit Album Dialog */}
      <EditAlbumDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        name={editAlbumName}
        description={editAlbumDesc}
        onNameChange={setEditAlbumName}
        onDescriptionChange={setEditAlbumDesc}
        onSubmit={handleEditAlbum}
      />

      {/* Upload Photos Dialog */}
      <UploadPhotosDialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open)
          if (!open) {
            setSelectedFiles([])
            setPreviews([])
          }
        }}
        uploadMethod={uploadMethod}
        onMethodChange={setUploadMethod}
        selectedFiles={selectedFiles}
        previews={previews}
        imgbbApiKey={imgbbApiKey}
        showApiKey={showApiKey}
        isDragOver={isDragOver}
        uploading={uploading}
        uploadProgress={uploadProgress}
        fileInputRef={fileInputRef}
        onApiKeyChange={setImgbbApiKey}
        onToggleShowApiKey={() => setShowApiKey(!showApiKey)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onSelectFiles={handleSelectFiles}
        onRemoveFile={handleRemoveFile}
        onClearFiles={handleClearFiles}
        onUpload={handleUpload}
      />

      {/* Photo Lightbox */}
      <PhotoLightbox
        lightbox={lightbox}
        onClose={closeLightbox}
        onPrev={prevPhoto}
        onNext={nextPhoto}
      />
    </div>
  )
}

// ==================== ALBUMS VIEW ====================

interface AlbumsViewProps {
  albums: Album[]
  loading: boolean
  onOpenCreateDialog: () => void
  onEditAlbum: (album: Album) => void
  onDeleteAlbum: (id: string) => void
  onSelectAlbum: (album: Album) => void
}

function AlbumsView({
  albums,
  loading,
  onOpenCreateDialog,
  onEditAlbum,
  onDeleteAlbum,
  onSelectAlbum,
}: AlbumsViewProps) {
  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Album Koleksi</h1>
          <p className="text-muted-foreground mt-1">Kelola koleksi foto Anda dengan mudah</p>
        </div>
        <Button onClick={onOpenCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 self-start">
          <Plus className="h-4 w-4" />
          Buat Album Baru
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Loading State */}
      {loading && albums.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && albums.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-emerald-50 p-6 mb-4">
            <FolderOpen className="h-12 w-12 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Belum ada album</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Mulai dengan membuat album baru untuk mengorganisir koleksi foto Anda.
          </p>
          <Button
            onClick={onOpenCreateDialog}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Buat Album Pertama
          </Button>
        </motion.div>
      )}

      {/* Albums Grid */}
      {!loading && albums.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {albums.map((album) => (
            <motion.div key={album.id} variants={cardVariants}>
              <AlbumCard
                album={album}
                onEdit={onEditAlbum}
                onDelete={onDeleteAlbum}
                onClick={() => onSelectAlbum(album)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  )
}

// ==================== ALBUM CARD ====================

interface AlbumCardProps {
  album: Album
  onEdit: (album: Album) => void
  onDelete: (id: string) => void
  onClick: () => void
}

function AlbumCard({ album, onEdit, onDelete, onClick }: AlbumCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card
        className="rounded-xl overflow-hidden cursor-pointer group border border-border/60 shadow-sm hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        {/* Cover Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={album.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
              <LucideImage className="h-10 w-10 text-emerald-300" />
            </div>
          )}
          {/* Photo count badge */}
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-black/60 text-white border-0 text-xs"
          >
            {album._count.photos} foto
          </Badge>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground truncate">{album.name}</h3>
          {album.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{album.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">{formatDate(album.createdAt)}</p>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0 flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(album)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(album.id)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Album
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ==================== PHOTOS VIEW ====================

interface PhotosViewProps {
  album: Album | null
  photos: Photo[]
  loading: boolean
  onBack: () => void
  onOpenUploadDialog: () => void
  onDeletePhoto: (id: string) => void
  onOpenLightbox: (photos: Photo[], index: number) => void
}

function PhotosView({
  album,
  photos,
  loading,
  onBack,
  onOpenUploadDialog,
  onDeletePhoto,
  onOpenLightbox,
}: PhotosViewProps) {
  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{album?.name}</h1>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {photos.length} foto
              </Badge>
            </div>
            {album?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{album.description}</p>
            )}
          </div>
        </div>
        <Button onClick={onOpenUploadDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 self-start">
          <Upload className="h-4 w-4" />
          Upload Foto
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Loading State */}
      {loading && photos.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {/* Empty Photos State */}
      {!loading && photos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-emerald-50 p-6 mb-4">
            <ImageIcon className="h-12 w-12 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Belum ada foto</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Unggah foto pertama ke dalam album ini.
          </p>
          <Button
            onClick={onOpenUploadDialog}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Foto Pertama
          </Button>
        </motion.div>
      )}

      {/* Photos Grid */}
      {!loading && photos.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {photos.map((photo, index) => (
            <motion.div key={photo.id} variants={cardVariants}>
              <PhotoCard
                photo={photo}
                index={index}
                onDelete={onDeletePhoto}
                onOpenLightbox={onOpenLightbox}
                photos={photos}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  )
}

// ==================== PHOTO CARD ====================

interface PhotoCardProps {
  photo: Photo
  index: number
  photos: Photo[]
  onDelete: (id: string) => void
  onOpenLightbox: (photos: Photo[], index: number) => void
}

function PhotoCard({ photo, index, photos, onDelete, onOpenLightbox }: PhotoCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative group cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-square"
      onClick={() => onOpenLightbox(photos, index)}
    >
      <img
        src={photo.url}
        alt={photo.filename}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-full bg-white/90 text-red-600 hover:bg-red-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0 shadow-lg"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(photo.id)
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ==================== CREATE ALBUM DIALOG ====================

interface CreateAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  description: string
  onNameChange: (val: string) => void
  onDescriptionChange: (val: string) => void
  onSubmit: () => void
}

function CreateAlbumDialog({
  open,
  onOpenChange,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
}: CreateAlbumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Buat Album Baru</DialogTitle>
          <DialogDescription>Tambahkan album baru untuk mengorganisir foto Anda.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="create-name">
              Nama Album <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-name"
              placeholder="Masukkan nama album"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) onSubmit()
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-desc">Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
            <Textarea
              id="create-desc"
              placeholder="Deskripsi singkat tentang album ini"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Buat Album
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT ALBUM DIALOG ====================

interface EditAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  description: string
  onNameChange: (val: string) => void
  onDescriptionChange: (val: string) => void
  onSubmit: () => void
}

function EditAlbumDialog({
  open,
  onOpenChange,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
}: EditAlbumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Album</DialogTitle>
          <DialogDescription>Perbarui informasi album.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Nama Album <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="Masukkan nama album"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) onSubmit()
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
            <Textarea
              id="edit-desc"
              placeholder="Deskripsi singkat tentang album ini"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== UPLOAD PHOTOS DIALOG ====================

interface UploadPhotosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploadMethod: 'local' | 'imgbb'
  onMethodChange: (method: 'local' | 'imgbb') => void
  selectedFiles: File[]
  previews: string[]
  imgbbApiKey: string
  showApiKey: boolean
  isDragOver: boolean
  uploading: boolean
  uploadProgress: number
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onApiKeyChange: (val: string) => void
  onToggleShowApiKey: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onSelectFiles: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onClearFiles: () => void
  onUpload: () => void
}

function UploadPhotosDialog({
  open,
  onOpenChange,
  uploadMethod,
  onMethodChange,
  selectedFiles,
  previews,
  imgbbApiKey,
  showApiKey,
  isDragOver,
  uploading,
  uploadProgress,
  fileInputRef,
  onApiKeyChange,
  onToggleShowApiKey,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFiles,
  onRemoveFile,
  onClearFiles,
  onUpload,
}: UploadPhotosDialogProps) {
  const canUpload =
    !uploading &&
    selectedFiles.length > 0 &&
    (uploadMethod === 'local' || imgbbApiKey.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Foto</DialogTitle>
          <DialogDescription>Pilih metode dan file foto yang ingin diunggah.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Upload Method Tabs */}
          <Tabs value={uploadMethod} onValueChange={(v) => onMethodChange(v as 'local' | 'imgbb')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local" className="gap-2">
                <Upload className="h-4 w-4" />
                Lokal
              </TabsTrigger>
              <TabsTrigger value="imgbb" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                ImgBB
              </TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Foto akan disimpan secara lokal di server. Cocok untuk penggunaan pribadi.
              </p>
            </TabsContent>

            <TabsContent value="imgbb" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Foto akan diunggah ke ImgBB dan URL publik akan disimpan.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="imgbb-key">ImgBB API Key</Label>
                  <div className="relative">
                    <Input
                      id="imgbb-key"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Masukkan API key ImgBB"
                      value={imgbbApiKey}
                      onChange={(e) => onApiKeyChange(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={onToggleShowApiKey}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API key akan disimpan di browser Anda untuk kemudahan penggunaan.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-border hover:border-emerald-400 hover:bg-muted/50'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onSelectFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-emerald-50 p-3">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Seret & lepas foto di sini
              </p>
              <p className="text-xs text-muted-foreground">atau klik untuk memilih file</p>
              <p className="text-xs text-muted-foreground">Mendukung: JPG, PNG, GIF, WebP</p>
            </div>
          </div>

          {/* Previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  File dipilih ({selectedFiles.length})
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-red-600"
                  onClick={onClearFiles}
                >
                  Hapus semua
                </Button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                {previews.map((preview, idx) => (
                  <div
                    key={`${selectedFiles[idx]?.name}-${idx}`}
                    className="relative aspect-square rounded-lg overflow-hidden group/thumb"
                  >
                    <img
                      src={preview}
                      alt={selectedFiles[idx]?.name || `Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveFile(idx)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
                      {selectedFiles[idx]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mengunggah...</span>
                <span className="font-medium text-emerald-600">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button
            onClick={onUpload}
            disabled={!canUpload}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload ({selectedFiles.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== PHOTO LIGHTBOX ====================

interface LightboxProps {
  lightbox: { open: boolean; currentIndex: number; photos: Photo[] }
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function PhotoLightbox({ lightbox, onClose, onPrev, onNext }: LightboxProps) {
  const currentPhoto = lightbox.photos[lightbox.currentIndex]

  return (
    <AnimatePresence>
      {lightbox.open && currentPhoto && (
        <motion.div
          variants={lightboxOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
            {lightbox.currentIndex + 1} / {lightbox.photos.length}
          </div>

          {/* Prev button */}
          {lightbox.photos.length > 1 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation()
                onPrev()
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <motion.img
            key={currentPhoto.id}
            variants={lightboxImageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            src={currentPhoto.url}
            alt={currentPhoto.filename}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {lightbox.photos.length > 1 && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
