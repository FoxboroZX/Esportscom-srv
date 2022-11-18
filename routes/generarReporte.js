const PDFDocument = require("pdfkit");

const fs = require("fs");

const width = 1500; // define width and height of canvas
const 
height = 1000;


module.exports = async (res) => {
  
// Create a document
  
const doc = new PDFDocument({
   
size: "LETTER",
  
});
  
// Pipe its output somewhere, like to a file or HTTP response
 
// See below for browser usage
  
//doc.pipe(fs.createWriteStream("output.pdf"));
  
doc.pipe(res);

  
// build pdf
  
  
// Finalize PDF file
  
doc.end();

};