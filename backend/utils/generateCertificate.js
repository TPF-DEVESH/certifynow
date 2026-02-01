const path = require("path");
const img = require("./generateImage");
const pdf = require("./generatePdf");

module.exports = async (template, name, x, y) => {
  return path.extname(template) === ".pdf"
    ? pdf(template, name, x, y)
    : img(template, name, x, y);
};
