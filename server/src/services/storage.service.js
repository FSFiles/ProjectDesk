import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';
import { config, isCloudinaryConfigured } from '../config/env.js';
import { uploadsDir } from '../middleware/upload.js';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  configured = true;
}

/**
 * Store an uploaded file. Uses Cloudinary when credentials are configured;
 * otherwise falls back to local disk under server/uploads (served at /uploads).
 * Returns { url, publicId, originalName, provider }.
 */
export async function storeFile(file, folderPrefix) {
  const originalName = file.originalname || 'file';

  if (isCloudinaryConfigured()) {
    ensureConfigured();
    const b64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(b64, {
      folder: `projectdesk/${folderPrefix}`,
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName,
      provider: 'cloudinary',
    };
  }

  // Local fallback: file already written to disk by multer diskStorage.
  if (!file.path) {
    throw new Error('Local storage requested but no file path available');
  }
  const baseUrl = config.serverUrl.replace(/\/$/, '');
  return {
    url: `${baseUrl}/uploads/${path.basename(file.path)}`,
    publicId: null,
    originalName,
    provider: 'local',
  };
}

/** Delete a previously stored file (best-effort; never blocks the request). */
export async function deleteStoredFile(publicId, provider) {
  try {
    if (publicId && provider === 'cloudinary') {
      ensureConfigured();
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }
  } catch (err) {
    console.warn('[storage] failed to delete stored file:', err?.message);
  }
}
