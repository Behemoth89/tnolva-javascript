export interface SniffedMime {
  mimeType: string;
  ext: string;
}

const SIGNATURES: Array<{
  mimeType: string;
  ext: string;
  matches: (bytes: Buffer) => boolean;
}> = [
  { mimeType: 'image/png', ext: '.png', matches: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mimeType: 'image/jpeg', ext: '.jpg', matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mimeType: 'image/gif', ext: '.gif', matches: (b) => b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x39 || b[4] === 0x37) && b[5] === 0x61 },
  { mimeType: 'application/pdf', ext: '.pdf', matches: (b) => b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d },
  { mimeType: 'application/zip', ext: '.zip', matches: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) && (b[3] === 0x04 || b[3] === 0x06 || b[3] === 0x08) },
];

const TEXT_MIME_BY_EXT: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.cjs': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.jsx': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.yml': 'application/x-yaml',
  '.yaml': 'application/x-yaml',
  '.py': 'text/x-python',
  '.rs': 'text/x-rust',
  '.go': 'text/x-go',
  '.java': 'text/x-java',
  '.c': 'text/x-c',
  '.h': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.hpp': 'text/x-c++',
  '.sh': 'application/x-sh',
  '.sql': 'application/sql',
};

function isLikelyText(bytes: Buffer): boolean {
  if (bytes.length === 0) {
    return true;
  }
  let suspicious = 0;
  const sample = Math.min(bytes.length, 4096);
  for (let i = 0; i < sample; i += 1) {
    const b = bytes[i] as number;
    if (b === 0) {
      return false;
    }
    if (b < 9 || (b > 13 && b < 32 && b !== 27)) {
      suspicious += 1;
      if (suspicious > 8) {
        return false;
      }
    }
  }
  return true;
}

function extFromFilename(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx <= 0) {
    return '';
  }
  return filename.slice(idx).toLowerCase();
}

export function sniffMimeType(bytes: Buffer, originalFilename: string): SniffedMime {
  for (const sig of SIGNATURES) {
    if (sig.matches(bytes)) {
      return { mimeType: sig.mimeType, ext: sig.ext };
    }
  }
  const ext = extFromFilename(originalFilename);
  if (ext && TEXT_MIME_BY_EXT[ext]) {
    return { mimeType: TEXT_MIME_BY_EXT[ext] as string, ext };
  }
  if (isLikelyText(bytes)) {
    if (ext === '.md' || ext === '.markdown') {
      return { mimeType: 'text/markdown', ext: '.md' };
    }
    if (ext === '.json') {
      return { mimeType: 'application/json', ext: '.json' };
    }
    if (ext === '.csv') {
      return { mimeType: 'text/csv', ext: '.csv' };
    }
    if (ext === '.xml') {
      return { mimeType: 'application/xml', ext: '.xml' };
    }
    if (ext === '.html' || ext === '.htm') {
      return { mimeType: 'text/html', ext };
    }
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      return { mimeType: 'application/javascript', ext };
    }
    if (ext === '.ts' || ext === '.tsx') {
      return { mimeType: 'application/typescript', ext };
    }
    return { mimeType: 'text/plain', ext: ext || '.txt' };
  }
  return { mimeType: 'application/octet-stream', ext: '' };
}

export function isTextMimeType(mimeType: string): boolean {
  if (!mimeType) {
    return false;
  }
  if (mimeType.startsWith('text/')) {
    return true;
  }
  return (
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/x-yaml' ||
    mimeType === 'application/sql' ||
    mimeType === 'application/x-sh' ||
    mimeType === 'text/x-c' ||
    mimeType === 'text/x-c++' ||
    mimeType === 'text/x-python' ||
    mimeType === 'text/x-rust' ||
    mimeType === 'text/x-go' ||
    mimeType === 'text/x-java' ||
    mimeType === 'text/css'
  );
}
