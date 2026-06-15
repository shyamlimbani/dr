const crypto = require('crypto');

// In-memory cache for temporary PDF files
const tempPdfs = new Map();

/**
 * Temp Upload PDF (Protected, requires JWT)
 * Accepts base64 PDF and filename, caches it, and returns a downloadId.
 */
const tempUpload = (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;
    
    if (!pdfBase64 || !filename) {
      return res.status(400).json({ 
        success: false, 
        message: 'pdfBase64 and filename are required.' 
      });
    }

    const downloadId = crypto.randomBytes(16).toString('hex');
    
    // Store in cache
    tempPdfs.set(downloadId, {
      pdfBase64,
      filename,
      timestamp: Date.now()
    });

    // Auto self-destruct after 60 seconds to prevent leaks
    setTimeout(() => {
      if (tempPdfs.has(downloadId)) {
        tempPdfs.delete(downloadId);
      }
    }, 60000);

    return res.json({ 
      success: true, 
      downloadId 
    });
  } catch (error) {
    console.error('PDF Temp Upload failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to stage PDF for download.' 
    });
  }
};

/**
 * Temp Download PDF (Public GET endpoint)
 * Retrieves PDF by downloadId, decodes base64, sends file attachment, and purges from cache.
 */
const tempDownload = (req, res) => {
  try {
    const { downloadId } = req.params;
    const entry = tempPdfs.get(downloadId);

    if (!entry) {
      return res.status(404).send('Download link expired or invalid.');
    }

    const buffer = Buffer.from(entry.pdfBase64, 'base64');

    // Force download direct to device, preventing browser PDF preview
    res.setHeader('Content-Disposition', `attachment; filename="${entry.filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);

    // Single-use guarantee: delete immediately on download
    tempPdfs.delete(downloadId);
  } catch (error) {
    console.error('PDF Temp Download failed:', error);
    return res.status(500).send('Internal Server Error while serving PDF.');
  }
};

module.exports = {
  tempUpload,
  tempDownload
};
