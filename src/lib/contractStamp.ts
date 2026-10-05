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
  // Either can be missing — called again every time just one party signs,
  // not only once both have, so the PDF shows whoever's signed so far.
  agencySignature?: DocumentSignature
  clientSignature?: DocumentSignature
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Fitted (not stretched) into the drawn box, centred within it — the
  // box is whatever area the agency marked, not assumed to be a fixed size.
  const drawSignature = async (position: StampPosition | undefined, signature: DocumentSignature | undefined) => {
    if (!position || !signature) return
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

  const drawDate = (position: StampPosition | undefined, signature: DocumentSignature | undefined) => {
    if (!position || !signature) return
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

// Appends a clean, dedicated signature page to a contract instead of
// stamping into whatever blank space (if any) the uploaded PDF happens to
// have — that depended on matching a hand-drawn box to the exact spot on
// each document, which never lined up reliably. Since we draw this page
// ourselves, we already know exactly where the boxes are, so the layout
// comes back alongside the bytes — no separate position-marking step.
export async function appendSignaturePage({
  originalBytes,
  designerName,
  clientName,
}: {
  originalBytes: Uint8Array
  designerName: string
  clientName: string
}): Promise<{ bytes: Uint8Array; layout: ContractStampLayout }> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  const { width: pageWidth, height: pageHeight } = pdfDoc.getPage(0).getSize()
  const page = pdfDoc.addPage([pageWidth, pageHeight])
  const pageIndex = pdfDoc.getPageCount() - 1

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const muted = rgb(0.55, 0.55, 0.55)
  const fromTop = (pt: number) => pageHeight - pt

  const margin = 56
  const colWidth = (pageWidth - margin * 2 - 32) / 2
  const leftX = margin
  const rightX = margin + colWidth + 32

  page.drawText('Signatures', { x: margin, y: fromTop(70), size: 26, font: boldFont })
  page.drawText('By signing below, both parties agree to the terms outlined in this agreement.', {
    x: margin,
    y: fromTop(100),
    size: 11,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })
  page.drawLine({
    start: { x: margin, y: fromTop(118) },
    end: { x: pageWidth - margin, y: fromTop(118) },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  })

  const layout: ContractStampLayout = {
    designerSignature: {
      page: pageIndex,
      x: leftX / pageWidth,
      y: 180 / pageHeight,
      width: colWidth / pageWidth,
      height: 70 / pageHeight,
    },
    designerDate: {
      page: pageIndex,
      x: leftX / pageWidth,
      y: 350 / pageHeight,
      width: (colWidth * 0.5) / pageWidth,
      height: 26 / pageHeight,
    },
    clientSignature: {
      page: pageIndex,
      x: rightX / pageWidth,
      y: 180 / pageHeight,
      width: colWidth / pageWidth,
      height: 70 / pageHeight,
    },
    clientDate: {
      page: pageIndex,
      x: rightX / pageWidth,
      y: 350 / pageHeight,
      width: (colWidth * 0.5) / pageWidth,
      height: 26 / pageHeight,
    },
  }

  const drawColumn = (label: string, name: string, x: number, sigBox: StampPosition, dateBox: StampPosition) => {
    page.drawText(label, { x, y: fromTop(160), size: 13, font: boldFont })

    const sigRect = toPdfBox(page, sigBox)
    page.drawRectangle({ ...sigRect, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 1 })
    page.drawText('Signature', { x, y: fromTop(266), size: 9, font, color: muted })

    page.drawText(name, { x, y: fromTop(300), size: 13, font: boldFont })
    page.drawText('Name', { x, y: fromTop(315), size: 9, font, color: muted })

    const dateRect = toPdfBox(page, dateBox)
    page.drawRectangle({ ...dateRect, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 1 })
    page.drawText('Date', { x, y: fromTop(392), size: 9, font, color: muted })
  }

  drawColumn('DESIGNER', designerName, leftX, layout.designerSignature!, layout.designerDate!)
  drawColumn('CLIENT', clientName, rightX, layout.clientSignature!, layout.clientDate!)

  const bytes = await pdfDoc.save()
  return { bytes, layout }
}
