import { describe, expect, it } from '@jest/globals';
import { isTextMimeType, sniffMimeType } from '../../src/projects/mime';

describe('mime (unit)', () => {
  it('detects PNG signature', () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = sniffMimeType(bytes, 'foo.png');
    expect(result.mimeType).toBe('image/png');
    expect(result.ext).toBe('.png');
  });

  it('detects JPEG signature', () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const result = sniffMimeType(bytes, 'photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.ext).toBe('.jpg');
  });

  it('detects GIF signature', () => {
    const bytes = Buffer.from('GIF89a');
    const result = sniffMimeType(bytes, 'anim.gif');
    expect(result.mimeType).toBe('image/gif');
    expect(result.ext).toBe('.gif');
  });

  it('detects PDF signature', () => {
    const bytes = Buffer.from('%PDF-1.4');
    const result = sniffMimeType(bytes, 'spec.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.ext).toBe('.pdf');
  });

  it('detects ZIP signature', () => {
    const bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    const result = sniffMimeType(bytes, 'a.zip');
    expect(result.mimeType).toBe('application/zip');
    expect(result.ext).toBe('.zip');
  });

  it('sniffs plain text and uses the original extension when text-like', () => {
    const bytes = Buffer.from('hello world\nline 2');
    const result = sniffMimeType(bytes, 'note.txt');
    expect(result.mimeType).toBe('text/plain');
    expect(result.ext).toBe('.txt');
  });

  it('sniffs JSON content', () => {
    const bytes = Buffer.from('{"a":1}');
    const result = sniffMimeType(bytes, 'x.json');
    expect(result.mimeType).toBe('application/json');
    expect(result.ext).toBe('.json');
  });

  it('sniffs markdown content', () => {
    const bytes = Buffer.from('# Hello');
    const result = sniffMimeType(bytes, 'a.md');
    expect(result.mimeType).toBe('text/markdown');
    expect(result.ext).toBe('.md');
  });

  it('sniffs XML content', () => {
    const bytes = Buffer.from('<?xml version="1.0"?><x/>');
    const result = sniffMimeType(bytes, 'a.xml');
    expect(result.mimeType).toBe('application/xml');
    expect(result.ext).toBe('.xml');
  });

  it('sniffs CSV content', () => {
    const bytes = Buffer.from('a,b,c\n1,2,3');
    const result = sniffMimeType(bytes, 'a.csv');
    expect(result.mimeType).toBe('text/csv');
    expect(result.ext).toBe('.csv');
  });

  it('sniffs HTML content', () => {
    const bytes = Buffer.from('<!doctype html><html></html>');
    const result = sniffMimeType(bytes, 'a.html');
    expect(result.mimeType).toBe('text/html');
    expect(result.ext).toBe('.html');
  });

  it('sniffs JavaScript content', () => {
    const bytes = Buffer.from('const x = 1;');
    const result = sniffMimeType(bytes, 'a.js');
    expect(result.mimeType).toBe('application/javascript');
    expect(result.ext).toBe('.js');
  });

  it('sniffs TypeScript content', () => {
    const bytes = Buffer.from('const x: number = 1;');
    const result = sniffMimeType(bytes, 'a.ts');
    expect(result.mimeType).toBe('application/typescript');
    expect(result.ext).toBe('.ts');
  });

  it('falls back to application/octet-stream for binary data without a known signature', () => {
    const bytes = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]);
    const result = sniffMimeType(bytes, 'blob.bin');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(result.ext).toBe('');
  });

  it('isTextMimeType recognises text and common text-like types', () => {
    expect(isTextMimeType('text/plain')).toBe(true);
    expect(isTextMimeType('text/markdown')).toBe(true);
    expect(isTextMimeType('application/json')).toBe(true);
    expect(isTextMimeType('application/javascript')).toBe(true);
    expect(isTextMimeType('application/typescript')).toBe(true);
    expect(isTextMimeType('image/png')).toBe(false);
    expect(isTextMimeType('application/octet-stream')).toBe(false);
  });
});
