import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import streamifier from "streamifier";

dotenv.config();
cloudinary.config();

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export default cloudinary;
export { uploadBuffer };
