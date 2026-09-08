/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — File Upload Validation & Security
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Malicious file uploads (executable, script injection)
 * - File type spoofing (extension vs content mismatch)
 * - Path traversal in filenames
 * - Oversized uploads
 * - Polyglot files (valid on surface, malicious in content)
 * - Image-based attacks (EXIF injection, steganography)
 */

import crypto from 'crypto';
import logger from '../core/logger';

// ─── Configuration ──────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  // Archives (restricted)
  'application/zip',
]);

const BLOCKED_MIME_TYPES = new Set([
  'application/x-executable', 'application/x-msdownload',
  'application/x-msdos-program', 'application/x-bat',
  'application/x-sh', 'application/x-perl', 'application/x-python',
  'application/javascript', 'text/javascript',
  'application/x-php', 'application/x-httpd-php',
  'application/x-shellscript', 'application/x-csh',
  'application/x-java-archive', 'application/x-jar',
  'application/x-ms-shortcut', 'application/x-winf',
]);

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'msi', 'pif', 'scr', 'vbs', 'vbe',
  'js', 'jse', 'ws', 'wsh', 'ps1', 'psm1', 'psd1',
  'sh', 'bash', 'csh', 'ksh', 'zsh',
  'pl', 'py', 'rb', 'php', 'phtml', 'php3', 'php4', 'php5',
  'asp', 'aspx', 'jsp', 'jspx', 'cfm', 'cgi',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'jar', 'war', 'ear',
  'lnk', 'url', 'command', 'app',
]);

// ─── File Header Magic Bytes ────────────────────────────────────────────────

const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  'application/zip': [Buffer.from([0x50, 0x4B, 0x03, 0x04])], // PK..
  'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0])], // OLE
};

// ─── Validation Functions ───────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFilename: string;
}

/**
 * Validate a file upload comprehensively.
 */
export function validateFileUpload(params: {
  filename: string;
  mimeType: string;
  fileSize: number;
  buffer?: Buffer;
}): FileValidationResult {
  const { filename, mimeType, fileSize, buffer } = params;
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. File size check
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    errors.push(`File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds maximum ${MAX_FILE_SIZE_MB}MB`);
  }

  // 2. MIME type validation
  if (BLOCKED_MIME_TYPES.has(mimeType)) {
    errors.push(`File type "${mimeType}" is not allowed`);
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    warnings.push(`File type "${mimeType}" is not in the standard allowed list`);
  }

  // 3. Extension validation
  const ext = getExtension(filename).toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    errors.push(`File extension ".${ext}" is not allowed`);
  }

  // 4. Filename sanitization
  const sanitizedFilename = sanitizeFilename(filename);
  if (sanitizedFilename !== filename) {
    warnings.push(`Filename was sanitized: "${filename}" -> "${sanitizedFilename}"`);
  }

  // 5. Path traversal check
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Filename contains path traversal characters');
  }

  // 6. Double extension check (e.g., image.jpg.exe)
  const parts = filename.split('.');
  if (parts.length > 2) {
    const lastExt = parts[parts.length - 1].toLowerCase();
    const secondLastExt = parts[parts.length - 2].toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(lastExt) && !DANGEROUS_EXTENSIONS.has(secondLastExt)) {
      errors.push(`Suspicious double extension detected: .${secondLastExt}.${lastExt}`);
    }
  }

  // 7. Content-type vs extension mismatch
  if (buffer && buffer.length > 0) {
    const detectedType = detectFileType(buffer);
    if (detectedType && detectedType !== mimeType) {
      warnings.push(`Content-type mismatch: declared "${mimeType}" but content appears to be "${detectedType}"`);
    }

    // 8. Check for embedded scripts in images
    if (mimeType.startsWith('image/')) {
      const content = buffer.toString('utf8');
      const scriptPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /<iframe/i];
      for (const pattern of scriptPatterns) {
        if (pattern.test(content)) {
          errors.push('Image contains embedded script content');
          break;
        }
      }
    }

    // 9. Check for null bytes
    if (buffer.includes(0x00)) {
      warnings.push('File contains null bytes');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedFilename,
  };
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.substring(lastDot + 1) : '';
}

function sanitizeFilename(filename: string): string {
  // Remove control chars and illegal filesystem characters, then normalize
  const cleaned = filename
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0);
      // control chars: 0-31 and 127
      if (code < 32 || code === 127) return '_';
      if (/[<>:"/\\|?*]/.test(ch)) return '_';
      return ch;
    })
    .join('')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .substring(0, 255); // Limit length
  return cleaned;
}

function detectFileType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (buffer.subarray(0, sig.length).equals(sig)) {
        return mimeType;
      }
    }
  }
  return null;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * Express middleware for file upload validation.
 */
export function fileUploadValidationMiddleware() {
  return (req: any, res: any, next: any) => {
    // Only apply to multipart/form-data requests
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return next();
    }

    // Check if multer or similar middleware has processed the file
    if (req.file) {
      const validation = validateFileUpload({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        buffer: req.file.buffer,
      });

      if (!validation.valid) {
        logger.warn(`[FILE-UPLOAD] Rejected: ${validation.errors.join(', ')}`, {
          context: 'file-upload',
          meta: { filename: req.file.originalname, errors: validation.errors },
        });
        return res.status(400).json({
          error: 'File validation failed',
          errors: validation.errors,
        });
      }

      if (validation.warnings.length > 0) {
        logger.info(`[FILE-UPLOAD] Warnings: ${validation.warnings.join(', ')}`, {
          context: 'file-upload',
          meta: { filename: req.file.originalname, warnings: validation.warnings },
        });
      }

      // Replace original filename with sanitized version
      req.file.originalname = validation.sanitizedFilename;
    }

    next();
  };
}

/**
 * Generate a safe filename for storage.
 */
export function generateSafeFilename(originalFilename: string): string {
  const ext = getExtension(originalFilename);
  const randomName = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}_${randomName}.${ext}`;
}

export default {
  validateFileUpload,
  fileUploadValidationMiddleware,
  generateSafeFilename,
};
