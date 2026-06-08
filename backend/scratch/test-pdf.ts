import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

async function testPdf() {
  console.log('--- Testing PDF Generation ---');
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, 'test_invoice.pdf');
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  doc.fontSize(25).text('Clinic Test Invoice', 100, 80);
  doc.fontSize(12).text('Testing PDFKit integration...', 100, 120);
  doc.end();

  stream.on('finish', () => {
    console.log(`✅ PDF generated successfully at: ${filePath}`);
    console.log('--- PDF Test Finished ---');
  });
}

testPdf();
