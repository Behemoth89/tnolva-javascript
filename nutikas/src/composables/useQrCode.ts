import QRCode from 'qrcode'

export function useQrCode() {
  async function generateQrDataUrl(cpid: string): Promise<string> {
    return QRCode.toDataURL(cpid, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }

  async function generateQrSvg(cpid: string): Promise<string> {
    return QRCode.toString(cpid, { type: 'svg' })
  }

  async function generateQrBuffer(cpid: string): Promise<Buffer> {
    return QRCode.toBuffer(cpid, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }

  return { generateQrDataUrl, generateQrSvg, generateQrBuffer }
}