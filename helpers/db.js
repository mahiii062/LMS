const fs = require("fs"); // import file system module
const path = require("path"); // import path module

// JSON file read data
function readJSON(filename) {
  const p = path.join(__dirname, "..", "data", filename); // data folder path
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify([], null, 2));
  }

  // read file content
  const raw = fs.readFileSync(p, "utf8");
  try { // parse JSON content to JS object
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

// JSON file write data
function writeJSON(filename, obj) {
  const p = path.join(__dirname, "..", "data", filename); // data folder path
  fs.writeFileSync(p, JSON.stringify(obj, null, 2)); // write JS object as JSON string
}

module.exports = { readJSON, writeJSON }; // export functions so that other files can use them
