import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
import { randomBytes } from "crypto"; 

dotenv.config();

// AWS S3 Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

// Multer S3 Storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read", // Makes uploaded files publicly accessible
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // cb(null, `products/${Date.now()}-${file.originalname}`);
      try {
        const rawBytes = randomBytes(16);
        const imageName = rawBytes.toString("hex"); // Generates a unique filename
        cb(null, `products/${imageName}-${file.originalname}`);
      } catch (error) {
        cb(error);
      }
    },
  }),
});

const deleteFile = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey, // Example: "products/9f2d3b7a1c4e56789a0b123cdeffabcd-image.png"
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    console.log(`File deleted: ${fileKey}`);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, message: "Failed to delete file", error };
  }
};

export { upload , deleteFile };
