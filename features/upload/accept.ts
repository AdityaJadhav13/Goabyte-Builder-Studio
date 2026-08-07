/**
 * Formats offered in the file picker.
 *
 * HEIC is listed deliberately. On iOS, EXCLUDING it makes the OS transcode to
 * JPEG at pick time — which would conveniently sidestep our HEIC path, but also
 * hide it from testing and leave us blind to what real users hit when they
 * share a photo from Files or AirDrop. Listing it means we handle the real
 * thing. SPIKE-1 confirms whether that is the right trade.
 */
export const ACCEPTED_FILE_TYPES =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'
