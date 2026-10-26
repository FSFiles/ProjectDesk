import { ApiError } from '../utils/apiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { storeFile, deleteStoredFile } from '../services/storage.service.js';

const PROFILE_IMAGE_MAX = 5 * 1024 * 1024; // 5 MB
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * POST /api/profile/photo (any authenticated user)
 * Multipart field: `photo`. Ownership is implicit — the photo is attached to
 * req.user resolved from the JWT; the client never supplies a user id.
 */
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image selected. Please choose an image to upload.', [
      { field: 'photo', message: 'Please choose an image to upload.' },
    ]);
  }
  // Defence-in-depth (multer already filters by extension + mime).
  if (!IMAGE_MIMES.includes(req.file.mimetype)) {
    throw ApiError.badRequest('Invalid image format. Please upload a JPG, JPEG, PNG, or WEBP image.', [
      { field: 'photo', message: 'Invalid image format. Please upload a JPG, JPEG, PNG, or WEBP image.' },
    ]);
  }
  if (req.file.size > PROFILE_IMAGE_MAX) {
    throw ApiError.badRequest('Image is too large. Please upload an image smaller than 5 MB.', [
      { field: 'photo', message: 'Image is too large. Please upload an image smaller than 5 MB.' },
    ]);
  }

  const user = req.user;

  // Replace any previously stored photo (best-effort cleanup of the old file).
  await deleteStoredFile(user.profileImage?.publicId);
  const stored = await storeFile(req.file, 'profile-photos');
  user.profileImage = {
    url: stored.url,
    publicId: stored.publicId,
    originalName: stored.originalName,
  };
  await user.save();

  ok(res, { user: user.toSafeJSON() });
});

/**
 * DELETE /api/profile/photo (any authenticated user)
 * Clears the stored reference and restores the default avatar everywhere.
 * Idempotent — removing when no photo exists is a successful no-op.
 */
export const removeProfilePhoto = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.profileImage?.url) {
    await deleteStoredFile(user.profileImage.publicId);
    user.profileImage = { url: null, publicId: null, originalName: null };
    await user.save();
  }
  ok(res, { user: user.toSafeJSON() });
});
