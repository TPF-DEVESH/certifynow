const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

module.exports = async (template, name, x, y) => {
  const pdfBytes = fs.readFileSync(template);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(name, {
    x,
    y: page.getHeight() - y,
    size: 28,
    font,
    color: rgb(0, 0, 0)
  });

  const out = `uploads/${Date.now()}-${name}.pdf`;
  fs.writeFileSync(out, await pdfDoc.save());
  return out;
};
