const multer = require('multer');
const sharp = require('sharp');
const exifr = require('exifr');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configure multer for file uploads (Disk Storage for report submission)
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/temp');
    try {
      await fs.access(uploadPath);
    } catch (error) {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = crypto.randomBytes(16).toString('hex') + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, fileName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and HEIC images are allowed'), false);
  }
};

// Configure multer (Disk Storage)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: fileFilter
});

// NEW: Configure multer for in-memory storage for analysis
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});


// Middleware for processing uploaded images
const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = [];
    const reportsPath = path.join(__dirname, '../uploads/reports');
    const thumbnailsPath = path.join(__dirname, '../uploads/thumbnails');

    // Ensure directories exist
    await fs.mkdir(reportsPath, { recursive: true });
    await fs.mkdir(thumbnailsPath, { recursive: true });

    for (const file of req.files) {
      const tempPath = file.path;
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.filename, path.extname(file.filename));
      
      const finalFileName = `${baseName}.webp`;
      const thumbnailFileName = `thumb_${baseName}.webp`;
      const finalPath = path.join(reportsPath, finalFileName);
      const thumbnailPath = path.join(thumbnailsPath, thumbnailFileName);

      try {
        let metadata = {};
        try {
          const exifData = await exifr.parse(tempPath);
          if (exifData) {
            metadata = {
              takenAt: exifData.DateTimeOriginal || exifData.DateTime || null,
              gpsCoordinates: exifData.latitude && exifData.longitude ? {
                latitude: exifData.latitude,
                longitude: exifData.longitude
              } : null,
              deviceInfo: {
                make: exifData.Make || null,
                model: exifData.Model || null
              }
            };
          }
        } catch (exifError) {
          console.log('Could not extract EXIF data:', exifError.message);
        }

        await sharp(tempPath)
          .resize(1920, 1080, { 
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(finalPath);

        await sharp(tempPath)
          .resize(300, 200, { 
            fit: 'cover' 
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        const stats = await fs.stat(finalPath);
        
        const processedFile = {
          filename: finalFileName,
          originalName: file.originalname,
          path: `uploads/reports/${finalFileName}`,
          thumbnailPath: `uploads/thumbnails/${thumbnailFileName}`,
          size: stats.size,
          mimeType: 'image/webp',
          metadata: metadata
        };

        processedFiles.push(processedFile);

        try {
          await fs.unlink(tempPath);
        } catch (unlinkError) {
          console.log('Could not delete temp file:', unlinkError.message);
        }

      } catch (processError) {
        console.error('Error processing image:', processError);
        try {
          await fs.unlink(tempPath);
        } catch (unlinkError) {
          console.log('Could not delete temp file after error:', unlinkError.message);
        }
        throw new Error(`Failed to process image: ${file.originalname}`);
      }
    }

    req.processedFiles = processedFiles;
    next();

  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({
      error: 'Failed to process uploaded images',
      message: error.message
    });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  console.log('Upload error occurred:', error);
  console.log('Error type:', error.constructor.name);
  console.log('Error code:', error.code);
  console.log('Error message:', error.message);
  
  if (error instanceof multer.MulterError) {
    console.log('Multer error detected');
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 5 files allowed per upload'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Please use the correct file upload field'
      });
    }
  }
  
  if (error.message.includes('Only JPEG, PNG, WebP, and HEIC images are allowed')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only JPEG, PNG, WebP, and HEIC images are allowed'
    });
  }

  console.log('Passing error to next middleware');
  next(error);
};

// Utility function to delete uploaded files
const deleteUploadedFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      await fs.unlink(fullPath);
      
      const thumbnailPath = filePath.replace('uploads/reports/', 'uploads/thumbnails/thumb_');
      const fullThumbnailPath = path.join(__dirname, '..', thumbnailPath);
      try {
        await fs.unlink(fullThumbnailPath);
      } catch (thumbError) {
        // Thumbnail might not exist, ignore error
      }
    } catch (error) {
      console.log(`Could not delete file ${filePath}:`, error.message);
    }
  }
};

// Validate image dimensions and quality
const validateImage = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    
    if (metadata.width < 200 || metadata.height < 200) {
      throw new Error('Image must be at least 200x200 pixels');
    }
    
    if (!metadata.format) {
      throw new Error('Invalid or corrupted image file');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Image validation failed: ${error.message}`);
  }
};

module.exports = {
  upload: upload.array('photos', 5),
  uploadMemory,
  processImages,
  handleUploadError,
  deleteUploadedFiles,
  validateImage
};