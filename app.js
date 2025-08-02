// Update filename display
document.getElementById('fileInput').addEventListener('change', function(e) {
  const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
  document.getElementById('fileName').textContent = fileName;
});

async function processFile() {
  const fileInput = document.getElementById('fileInput');
  const resultDiv = document.getElementById('result');
  const downloadBtn = document.getElementById('downloadBtn');
  const file = fileInput.files[0];

  if (!file) {
    resultDiv.textContent = "Please select a file first.";
    return;
  }

  try {
    resultDiv.textContent = "Processing... (This may take a moment)";
    downloadBtn.disabled = true;

    let text;
    if (file.type.startsWith('image/')) {
      const { data: { text: extractedText } } = await Tesseract.recognize(file);
      text = extractedText;
    } else if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else {
      throw new Error("Unsupported file type.");
    }

    resultDiv.textContent = text || "No text could be extracted.";
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => downloadAsTxt(text, `extracted-${file.name.replace(/\.[^/.]+$/, "")}.txt`);
  } catch (error) {
    resultDiv.textContent = `Error: ${error.message}`;
    downloadBtn.disabled = true;
  }
}

async function extractTextFromPDF(pdfFile) {
  // Initialize PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
  
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

function downloadAsTxt(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
