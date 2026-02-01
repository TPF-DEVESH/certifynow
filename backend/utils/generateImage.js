const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

module.exports = async (template, name, x, y) => {
  const img = await loadImage(template);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0);
  ctx.font = "40px Arial";
  ctx.fillStyle = "#000";
  ctx.fillText(name, x, y);

  const out = `uploads/${Date.now()}-${name}.png`;
  fs.writeFileSync(out, canvas.toBuffer());
  return out;
};
