declare module 'he' {
  export function decode(str: string): string
  export function encode(str: string, options?: { useNamedReferences?: boolean }): string
  export function escape(str: string): string
}