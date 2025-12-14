import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // this is file system provided by node.js for file hadling.
import { ApiError } from "../utils/ApiError.js";

cloudinary.config(
    {
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME ,
        api_key:process.env.CLOUDINARY_API_KEY ,
        api_secret:process.env.CLOUDINARY_API_SECRET ,
    }
);

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null ;

        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload( localFilePath ,{
            resource_type: "auto"
        })

        // file has been uploaded successfull
        // console.log("This is Response Provided by cloudinary:", response);
        // console.log("File is uploaded on cloudinary !! This is response URL:", response.url);

        fs.unlinkSync( localFilePath );
        return response;

    } catch (error) {
        fs.unlinkSync( localFilePath ) ; // remove the locally saved temporary file as the upload operation got failed

        return null ;
    }
};

const deleteImageOnCloudinary = async(publicId , resource_type="image") => {
    try {

        if (!publicId || typeof publicId !== "string") {
            throw new ApiError(400, "Invalid public ID for Cloudinary deletion");
        }

        const result = await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: `${resource_type}`
            }
        );

        // console.log("Image Deleted successfully :", result);

        return result ;
        
    } catch (error) {
        throw new ApiError(400, error?.message || "Error While deleting image on cloudinary");
    }
};

const getPublicIdFromUrl = (url) => {
   try {
      // Example: https://res.cloudinary.com/<cloud-name>/image/upload/v1623254365/foldername/filename.jpg

      const parts = url.split("/");
      const fileWithExtension = parts[parts.length - 1]; // filename.jpg with extension
      const folder = parts[parts.length - 2]; // foldername
      const fileName = fileWithExtension.split(".")[0]; // filename without extension

      return `${folder}/${fileName}`; // foldername/filename

   } catch (error) {
      console.error("Failed to extract public_id:", error);
      return null;
   }
};

export { 
    uploadOnCloudinary,
    deleteImageOnCloudinary,
    getPublicIdFromUrl,
 }