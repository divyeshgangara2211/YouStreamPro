import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken" ;
import { User } from "../models/user.model.js" ;

export const verifyJWT = asyncHandler( async( req , _ , next ) => {

    try {
        // here we handle if user send info. from mobile so header.
        // const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");

        const {accessToken} = req.cookies;
        // console.log("Access token:" ,accessToken )
        const authHeader = req.header("Authorization");

        let headerToken = null;
        if (authHeader && authHeader.startsWith("Bearer ")) {
        headerToken = authHeader.replace("Bearer ", "").trim();
        }

        const token = accessToken || headerToken;

        if (!token || typeof token !== "string" || token.trim() === "") {
        throw new ApiError(401, "Unauthorized: Token missing ");
        }


        // console.log("Token: " , token);
        // console.log("Authorization Header:", req.header("Authorization"));
        // console.log("Cookies:", req.cookies);

        if(!token){
            throw new ApiError(401 , "Unauthorized request" );
        }
    
        const decodedTokenInfo = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET );
    
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