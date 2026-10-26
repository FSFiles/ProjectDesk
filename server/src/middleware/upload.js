import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ApiError } from '../utils/apiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const PDF_MIMES = ['application/pdf'];
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const ALLOWED = {
  pdf: { mimes: PDF_MIMES, exts: ['.pdf'], maxSize: 10 * 1024 * 1024, label: 'PDF' },
  image: {
    mimes: [...IMAGE_MIMES, 'image/svg+xml'],
    exts: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
    maxSize: 2 * 1024 * 1024,
    label: 'PNG, JPG, WEBP or SVG',
  },
  // Profile photos: raster formats only, 5 MB max.
  profileImage: {
    mimes: IMAGE_MIMES,
    exts: ['.png', '.jpg', '.jpeg', '.webp'],
    maxSize: 5 * 1024 * 1024,
    label: 'JPG, JPEG, PNG or WEBP',
  },
};

/** Disk storage (used for local fallback when Cloudinary is not configured). */
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

/** Memory storage (used when forwarding uploads to Cloudinary). */
const memoryStorage = multer.memoryStorage();

function makeUploader(kind) {
  const rule = ALLOWED[kind];
  return multer({
    storage: process.env.CLOUDINARY_CLOUD_NAME ? memoryStorage : diskStorage,
    limits: { fileSize: rule.maxSize, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimeOk = rule.mimes.includes(file.mimetype);
      const extOk = rule.exts.includes(ext);
      if (!mimeOk || !extOk) {
        return cb(ApiError.badRequest(`Invalid file type. Only ${rule.label} files are allowed.`));
      }
      return cb(null, true);
    },
  });
}

export const uploadPdf = makeUploader('pdf');
export const uploadImage = makeUploader('image');
export const uploadProfileImage = makeUploader('profileImage');

/** Normalize multer errors into clean ApiErrors. */
export function multerErrorHandler(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('File is too large. Please upload a smaller file.'));
    }
    return next(ApiError.badRequest('File upload failed. Please check the file and try again.'));
  }
  return next(err);
}
