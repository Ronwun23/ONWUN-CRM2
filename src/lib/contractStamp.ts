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

const SIGNATURE_WIDTH = 140
const SIGNATURE_HEIGHT = 50
const DATE_FONT_SIZE = 11

// Stored positions are page-relative 0-1, top-left origin (how they were
// clicked on screen) — pdf-lib's origin is bottom-left, so y needs
// flipping before anything gets drawn.
function toPdfPoint(page: PDFPage, position: StampPosition): { x: number; y: number } {
  const { width, height } = page.getSize()
  return { x: position.x * width, y: height - position.y * height }
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

  // The clicked point is the signature/date LINE itself (the obvious,
  // reliable click target) — pdf-lib anchors drawImage/drawText at the
  // BOTTOM of what they draw, which already extends upward from there,
  // so the stamp lands sitting above the line, same as a handwritten one.
  const drawSignature = async (position: StampPosition | undefined, signature: DocumentSignature) => {
    if (!position) return
    const page = pages[position.page]
    if (!page) return
    const png = await pdfDoc.embedPng(dataUrlToBytes(signature.signatureData))
    const { x, y } = toPdfPoint(page, position)
    page.drawImage(png, { x, y, width: SIGNATURE_WIDTH, height: SIGNATURE_HEIGHT })
  }

  const drawDate = (position: StampPosition | undefined, signature: DocumentSignature) => {
    if (!position) return
    const page = pages[position.page]
    if (!page) return
    const dateText = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(signature.createdAt)
    )
    const { x, y } = toPdfPoint(page, position)
    page.drawText(dateText, { x, y: y + 2, size: DATE_FONT_SIZE, font, color: rgb(0, 0, 0) })
  }

  await drawSignature(layout.designerSignature, agencySignature)
  drawDate(layout.designerDate, agencySignature)
  await drawSignature(layout.clientSignature, clientSignature)
  drawDate(layout.clientDate, clientSignature)

  return pdfDoc.save()
}
