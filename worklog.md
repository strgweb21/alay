# Worklog

## Session: Photo Album Backend API Routes

**Date**: 2025-06-25

### What was done

Created all backend API routes for the photo album collection app using Next.js 16 App Router route handlers with Prisma (SQLite) for persistence.

### Files created

| File | Endpoints | Description |
|------|-----------|-------------|
| `src/app/api/albums/route.ts` | `GET /api/albums`, `POST /api/albums` | List all albums with photo count; create new album |
| `src/app/api/albums/[id]/route.ts` | `PUT /api/albums/[id]`, `DELETE /api/albums/[id]` | Update album metadata; delete album + cascade photos + local files |
| `src/app/api/albums/[id]/photos/route.ts` | `GET /api/albums/[id]/photos`, `POST /api/albums/[id]/photos` | List photos for album; upload photos to local storage (`public/uploads/`) |
| `src/app/api/albums/[id]/photos/imgbb/route.ts` | `POST /api/albums/[id]/photos/imgbb` | Upload photos to ImgBB via server-side fetch, base64 encoding |
| `src/app/api/photos/[id]/route.ts` | `DELETE /api/photos/[id]` | Delete photo, remove local file if applicable, clear album cover if needed |

### Design decisions

- **Consistent response shape**: All endpoints return `{ success: boolean, data?: any, error?: string }`
- **Next.js 16 params**: Used `params: Promise<{ id: string }>` (async params pattern required by Next.js 16)
- **Local uploads**: Files saved to `public/uploads/[albumId]/` with `{timestamp}-{index}{ext}` naming to avoid collisions
- **Auto cover assignment**: First uploaded photo (local or ImgBB) is set as album cover if none exists
- **ImgBB uploads**: Server-side fetch with base64-encoded image; returns 207 Multi-Status on partial failures
- **Cascade cleanup**: Album deletion removes local upload directory via `fs.rmSync` and relies on Prisma `onDelete: Cascade` for photo records
- **Error handling**: All routes wrapped in try/catch with proper HTTP status codes (400, 404, 500)

### Lint status

All files pass `bun run lint` with zero errors.

---

## Session: Photo Album Frontend (Complete UI)

**Date**: 2025-06-25

### What was done

Built the complete frontend for the photo album collection app — a single-page application with three views (albums grid, photos grid, lightbox) and three dialogs (create album, edit album, upload photos) all managed via Zustand state within `src/app/page.tsx`.

### Files created

| File | Description |
|------|-------------|
| `src/lib/store.ts` | Zustand store with all state (albums, photos, view, lightbox, upload progress) and async actions (CRUD for albums/photos, ImgBB upload, lightbox navigation) |
| `src/app/page.tsx` | Complete UI with 7 sub-components: `Home`, `AlbumsView`, `AlbumCard`, `PhotosView`, `PhotoCard`, `CreateAlbumDialog`, `EditAlbumDialog`, `UploadPhotosDialog`, `PhotoLightbox` |

### Files modified

| File | Change |
|------|--------|
| `src/app/api/albums/[id]/photos/imgbb/route.ts` | Added support for client-provided `apiKey` via FormData field (falls back to `IMGBB_API_KEY` env var) |

### Features implemented

- **Albums View**: Responsive grid (2/3/4 cols), album cards with cover images, photo count badge, created date, edit/delete actions, empty state
- **Photos View**: Back navigation, album name heading with photo count, responsive photo grid with aspect-square cards, hover overlay with delete button, empty state
- **Create Album Dialog**: Name (required) + description (optional) inputs, Enter key support
- **Edit Album Dialog**: Same form as create, pre-filled with current values
- **Upload Photos Dialog**: Tabs for Local/ImgBB method, drag & drop zone with visual feedback, multi-file selection, preview thumbnails with individual remove, clear all button, ImgBB API key with show/hide toggle, localStorage persistence for API key, upload progress bar
- **Photo Lightbox**: Full-screen overlay, prev/next navigation with arrows, photo counter, close button, keyboard navigation (Esc, Left, Right), body scroll lock, enter/exit animations
- **Animations**: Framer Motion page transitions between views, staggered card grid animations, card hover scale effects, lightbox overlay/image animations, progress bar animation
- **State Management**: Zustand store with all CRUD actions, loading/uploading states, simulated upload progress, toast notifications for success/error

### Design system

- Emerald/teal accent colors (`emerald-500`, `emerald-600`, `emerald-700`, `emerald-50`, `emerald-300`)
- White background, rounded-xl cards, subtle shadows
- Responsive: mobile-first with 2/3/4 column grids
- Sticky footer with admin credits (`min-h-screen flex flex-col` + `mt-auto`)
- Indonesian language UI labels

### Lint status

All files pass `bun run lint` with zero errors.
