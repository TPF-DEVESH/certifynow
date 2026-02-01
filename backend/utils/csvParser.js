const fs = require("fs");
const csv = require("csv-parser");

module.exports = (path) =>
  new Promise((resolve) => {
    const results = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (d) => results.push({ name: d.Name, email: d.Email }))
      .on("end", () => resolve(results));
  });
