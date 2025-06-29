import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken" ;
import { User } from "../models/user.model.js" ;

export const verifyJWT = asyncHandler( async( req , _ , next ) => {

    try {
        // here we handle if user send info. from mobile so header.
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");
    
        console.log("Token: " , token);
        if(!token){
            throw new ApiError(401 , "Unauthorized request" );
        }
    
        const decodedTokenInfo = await jwt.verify(token , process.env.ACCESS_TOKEN_SECRET );
    
        // when we generate access token , we provide _id in it. so now we get and get user info.
    
        const user = await User.findById(decodedTokenInfo?._id).select("-password -refreshToken");
    
        if( !user ){
            throw new ApiError(401 , "Invalid Access Token" );
        }
    
        // Now we inject user into req ,so we get this in logout function for logout in user.controller.js .
    
        req.user = user ;
        next()

    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid access token" );
    }
});