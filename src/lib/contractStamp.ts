import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFPage } from 'pdf-lib'
import type { ContractStampLayout, DocumentSignature, StampPosition } from '@/types'

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Stored positions are page-relative 0-1 boxes, top-left origin (how
// they're drawn on screen) — pdf-lib's origin is bottom-left and anchors
// drawImage/drawText at the box's bottom-left corner, so y needs both
// flipping and shifting down by the box's own height.
function toPdfBox(page: PDFPage, position: StampPosition): { x: number; y: number; width: number; height: number } {
  const { width: pageWidth, height: pageHeight } = page.getSize()
  const width = position.width * pageWidth
  const height = position.height * pageHeight
  const x = position.x * pageWidth
  const y = pageHeight - (position.y + position.height) * pageHeight
  return { x, y, width, height }
}

export async function stampContractPdf({
  originalBytes,
  layout,
  agencySignature,
  clientSignature,
}: {
  originalBytes: Uint8Array
  layout: ContractStampLayout
  agencySignature: DocumentSignature
  clientSignature: DocumentSignature
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Fitted (not stretched) into the drawn box, centred within it — the
  // box is whatever area the agency marked, not assumed to be a fixed size.
  const drawSignature = async (position: StampPosition | undefined, signature: DocumentSignature) => {
    if (!position) return
    const page = pages[position.page]
    if (!page) return
    const png = await pdfDoc.embedPng(dataUrlToBytes(signature.signatureData))
    const box = toPdfBox(page, position)
    const scale = Math.min(box.width / png.width, box.height / png.height)
    const drawWidth = png.width * scale
    const drawHeight = png.height * scale
    page.drawImage(png, {
      x: box.x + (box.width - drawWidth) / 2,
      y: box.y + (box.height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    })
  }

  const drawDate = (position: StampPosition | undefined, signature: DocumentSignature) => {
    if (!position) return
    const page = pages[position.page]
    if (!page) return
    const box = toPdfBox(page, position)
    const fontSize = Math.max(8, Math.min(box.height * 0.6, 16))
    page.drawText(signature.dateText, {
      x: box.x + 2,
      y: box.y + (box.height - fontSize) / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  }

  await drawSignature(layout.designerSignature, agencySignature)
  drawDate(layout.designerDate, agencySignature)
  await drawSignature(layout.clientSignature, clientSignature)
  drawDate(layout.clientDate, clientSignature)

  return pdfDoc.save()
}
