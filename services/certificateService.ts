
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { VariableConfig } from '../types';

// Simple placeholder for QR code generation using a canvas
const drawQRCodePlaceholder = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(x - size/2, y - size/2, size, size);
  ctx.fillStyle = "#fff";
  // Draw some "QR-like" squares
  for(let i=0; i<3; i++) {
    for(let j=0; j<3; j++) {
      if((i+j)%2 === 0) ctx.fillRect(x - size/2 + i*size/4 + 5, y - size/2 + j*size/4 + 5, size/5, size/5);
    }
  }
};

const isCertIdKey = (key: string): boolean => {
  const k = key.toLowerCase().trim();
  return k === 'certid' || k === 'certificateid' || k === 'id';
};

const getValueForKey = (key: string, data: Record<string, string>, certId: string): string => {
  if (isCertIdKey(key)) return certId;
  
  // Try direct match
  if (data[key]) return data[key];
  
  // Try case-insensitive matches for "Name", etc.
  const lowerKey = key.toLowerCase();
  const foundKey = Object.keys(data).find(k => k.toLowerCase() === lowerKey);
  if (foundKey) return data[foundKey];
  
  return `[${key}]`;
};

export const processImageCertificate = async (
  imageUrl: string,
  variables: VariableConfig[],
  recipientData: Record<string, string>,
  certId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use higher resolution for crisp output
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context error");

      ctx.drawImage(img, 0, 0);
      
      variables.forEach(v => {
        const actualX = (v.x / 100) * img.width;
        const actualY = (v.y / 100) * img.height;

        if (v.type === 'QR_CODE') {
          drawQRCodePlaceholder(ctx, actualX, actualY, v.fontSize * 3);
        } else {
          const text = getValueForKey(v.key, recipientData, certId);
          ctx.font = `bold ${v.fontSize}px Arial, Inter, sans-serif`;
          ctx.fillStyle = v.fontColor;
          ctx.textAlign = v.textAlign || "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, actualX, actualY);
        }
      });

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = reject;
  });
};

export const processPdfCertificate = async (
  pdfArrayBuffer: ArrayBuffer,
  variables: VariableConfig[],
  recipientData: Record<string, string>,
  certId: string
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  variables.forEach(v => {
    const actualX = (v.x / 100) * width;
    const actualY = height - (v.y / 100) * height;

    if (v.type === 'TEXT') {
      const text = getValueForKey(v.key, recipientData, certId);
      const hex = v.fontColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      let xPos = actualX;
      if (v.textAlign === 'center') {
        xPos = actualX - (font.widthOfTextAtSize(text, v.fontSize) / 2);
      } else if (v.textAlign === 'right') {
        xPos = actualX - font.widthOfTextAtSize(text, v.fontSize);
      }

      firstPage.drawText(text, {
        x: xPos,
        y: actualY,
        size: v.fontSize,
        font: font,
        color: rgb(r, g, b),
      });
    } else {
      firstPage.drawRectangle({
        x: actualX - (v.fontSize),
        y: actualY - (v.fontSize),
        width: v.fontSize * 2,
        height: v.fontSize * 2,
        color: rgb(0, 0, 0),
      });
    }
  });

  return await pdfDoc.save();
};
