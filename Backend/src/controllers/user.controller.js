import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

import {
   uploadOnCloudinary , 
   deleteImageOnCloudinary,
   getPublicIdFromUrl,
 } from "../utils/cloudinary.js";

import {User} from "../models/user.model.js" ;
import {  userValidationSchema } from "../utils/registerValidateSchema.js";
import { loginValidationSchema } from "../utils/loginValidationSchema.js" ;
import jwt from "jsonwebtoken" ;
import mongoose from "mongoose";

const registerUser = asyncHandler( async (req,res ) => {
    //get user details from frontend
    // validation details - not empty
    // check if user already exists: username, email
    // check for images for both avatar and coverImage , check for avatar
    //  upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


   // const { fullName, email, username, password } = req.body ;
   const fullName = req.body.fullName?.trim();
   const email = req.body.email?.trim();
   const username = req.body.username?.trim();
   const password = req.body.password?.trim(); // Remove whitespace
   // console.log("req.body : " ,req.body);
   // console.log("Email: ", email);

   // 1.Validate input with Joi
    const { error } = userValidationSchema.validate({ fullName, email, username, password });

    if (error) {
      return res.status(400).json({ 
         success: false, 
         message: error.details[0].message  // shows error message like "Email must be valid"
      });
    }

    // 2. Check existing user
   const existedUser = await User.findOne({
      $or : [ { username } , { email }]
   })

   if( existedUser ){
      throw new ApiError(409 , "User with email or username already exists")
   }

   if(
      [ fullName, email, username, password ].some( (field) => field?.trim() === "")
   ){
      throw new ApiError(400 , "All fields are required !!!");
   }

   // console.log("Req.files when check for file: " ,req.files);
   // console.log("Req.files.avatar when check for file: " ,req.files?.avatar);

   const avatarLocalPath = req.files?.avatar[0]?.path ;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path ;

   let coverImageLocalPath ;
   if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
      coverImageLocalPath = req.files.coverImage[0].path ;
   }

   if( !avatarLocalPath ){
      throw new ApiError(400 , "Avatar file is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if( !avatar ) throw new ApiError(400 , "Avatar file is required" );

   const user = await User.create({
      fullName,
      avatar :avatar.url,
      coverImage: coverImage?.url || "" ,
      email,
      password,
      username : username.toLowerCase(),
   });

   // check for user is created or not then remove password and refresh token
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if( !createdUser ) throw new ApiError(500 , "Something went wrong while registering the user");

   return res.status(201).json(
      new ApiResponse(200 , createdUser , "User registered Successfully" )
   )

} ); 

const generateAccessAndRefereshTokens = async( userId ) =>{

   // Here for access own injected method generateAccessToken and generateRefreshToken ,we need instance of mongodb "User" means "user".

   try {
      const user = await User.findById(userId) ;
      const accessToken = await user.generateAccessToken();
      const refreshToken  = await user.generateRefreshToken();

      // Now add refreshToken in database means in user object.
      user.refreshToken = refreshToken;

      // when we save data in database , some fields like password are kickin so validate false becasuse we validate before it.
      await user.save({validateBeforeSave : false });

      return { accessToken , refreshToken }

   } catch (error) {
      throw new ApiError(500 , "Something went wrong while generating referesh and access token" );
   }  
};

const loginUser = asyncHandler( async( req, res ) => {
   // req.body => data
   // username or email based login
   // find the user
   // password check
   // generate access and refresh token
   // send cookies

   if (!req.body) {
      return res.status(400).json({ message: "Missing request body" });
   }

   // const {email, username, password} = req.body ;
   const email = req.body.email?.trim();
   const username = req.body.username?.trim();
   const password = req.body.password?.trim();
   // console.log("Email on login time : ", email);

   // !(username || email) is is also good logic
   if( !username && !email ){
      throw new ApiError(400 ,  "username or email is required" );
   }

   if (!password) {
      throw new ApiError(400, "Password is required");
   }

   // 1.Validate input with Joi
   const { error } = loginValidationSchema.validate(req.body);


   if (error) {
      return res.status(400).json({ 
         success: false, 
         message: error.details[0].message  // shows error message like "Email must be valid"
      });
   }

    // find the user based on username or email
   const user = await User.findOne({
      $or: [ {username } , { email } ]
   })

   if( !user ){
      throw new ApiError(404 , "User does not exist");
   }

   // Here for access own injected method isPasswordCorrect ,we need instance of mongodb "User" means "user".
   
   const  isPasswordValid = await user.isPasswordCorrect(password);

   if( !isPasswordValid ){
      throw new ApiError(401 , "Invalid user credentials" );
   }

   const { accessToken , refreshToken } = await generateAccessAndRefereshTokens(user._id);

   // Now we can add this tokens in user object or try another db call .
   //And also remove password and refresh token field.

   const loggedInUser = await User.findById(user._id).select( "-password -refreshToken");

   // now create cookie make it only server side modifiable.
   const options = {
      httpOnly : true ,
      // secure: process.env.NODE_ENV === "production", // Only true in production
      secure: true,
      // sameSite: "Strict", 
   }

   return res
      .status(200)
      .cookie("accessToken" , accessToken , options )
      .cookie("refreshToken" , refreshToken , options )
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
         )
      )

});

const logoutUser = asyncHandler( async( req , res ) => {
   // here for logout we don't have user info. so we design custom middleware and then add it to route with logout.
   // we use middleware verifyJWT in logout route , so req.user._id we get in req.use .

   await User.findByIdAndUpdate( 
      req.user._id,
      {
         $unset:{
            refreshToken : 1 // $unset is a MongoDB operator used to remove a field from a document.
         }
      },
      {
         new : true //  it returns the new document (after update).
      }
   )

   const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only true in production
    }

    return res
      .status(200)
      .clearCookie( "accessToken" , options )
      .clearCookie( "refreshToken" , options )
      .json( new ApiResponse(200 , {} ,  "User logged Out" ))
});

const refreshAccessToken = asyncHandler( async( req ,res ) => {

   // We take first user's refresh token
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;

   if( !incomingRefreshToken ){
      throw new ApiError(401 , "unauthorized request");
   }

  try {
    const decodedToken = jwt.verify( 
       incomingRefreshToken , 
       process.env.REFRESH_TOKEN_SECRET 
    );
 
    const user = await User.findById(decodedToken?._id);
 
    if(!user){
       throw new ApiError(401 ,"Invalid refresh token");
    }
 
    if( incomingRefreshToken !== user.refreshToken ){
       throw new ApiError(401 , "Refresh token is expired or used" );
    }
 
    // now we confirm refresh token come and valid .
    const options = {
       httpOnly: true,
       secure: true
    };
 
    //now we refresh acccess token .
    const { accessToken , refreshToken } = await generateAccessAndRefereshTokens(user._id);
    const newRefreshToken = refreshToken;

   //  console.log("Access Token:" ,accessToken)
   //  console.log("New Refresh Token:" ,newRefreshToken)
 
    return res
      .status(200)
      .cookie("accessToken" , accessToken , options)
      .cookie("refreshToken" , newRefreshToken , options)
      .json(
         new ApiResponse(
            200,
            { accessToken , refreshToken : newRefreshToken },
            "Access token refreshed"
         )
      )

  } catch (error) {
      throw new ApiError(401 , error?.message ||  "Invalid refresh token" )
  }
});

const changeCurrentPassword = asyncHandler( async(req , res ) => {
   const { oldPassword , newPassword , confirmPassword } = req.body ; 

   if( !(newPassword === confirmPassword) ){
      throw new ApiError(400 , "newPassword and confirmPassword must be same !!")
   }

   const user = await User.findById(req.user?._id);

   const isPasswordCorrect  = await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
      throw new ApiError(400 , "Invalid old password" );
   };

   user.password = newPassword ;
   await user.save( { validateBeforeSave : false });

   return res
      .status(200)
      .json( new ApiResponse( 200 , {} , "Password changed successfully" ));

});

const getCurrentUser = asyncHandler(async(req ,res) => {
   return res
   .status(200)
   .json( new ApiResponse(
      200,
      req.user,
      "User fetched successfully"
   ))

});

const updateAccountDetails  = asyncHandler(async(req , res ) => {
   const { fullName , email } = req.body ;

   if( !fullName || !email ){
      throw new ApiError(400 , "All fields are required");
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullName, // this means fullName : fullName
            email: email
         }
      },
      { new : true }
   ).select("-password") ;

   return res
      .status(200)
      .json(new ApiResponse(200 , user , "Account details updated successfully" ))

});

const updateUserAvatar = asyncHandler(async(req , res) => {
   // Here , when we create this function route we use two middleware multer for take file as input and then verify user is loggedin.

   const  avatarLocalPath = req.file?.path ;

   if(!avatarLocalPath){
      throw new ApiError(400 ,  "Avatar file is missing" );
   }

   // 1. Get current user with avatar URL
   const existingUser = await User.findById( req.user?._id);

   if (!existingUser) {
      throw new ApiError(404, "User not found");
   };

   const oldAvatarUrl  = existingUser.avatar ;
   // console.log("oldAvatarUrl: " , oldAvatarUrl);

   // 2. Upload new avatar
   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if(!avatar.url){
      throw new ApiError( 400 , "Error while uploading on avatar " );
   }

   // 3. Extract public_id from old avatar URL (optional: only if it exists)
   if(oldAvatarUrl){
      const publicId = getPublicIdFromUrl(oldAvatarUrl); 

      if(publicId){
         await deleteImageOnCloudinary(publicId);
      }
   }

   // 4. Update user's avatar in DB
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set : {
            avatar : avatar.url
         }
      },
      { new : true }
   ).select("-password");

   return res
      .status(200)
      .json( 
         new ApiResponse(200 , user , "Avatar image updated successfully" )
      );

});


const updateUserCoverImage = asyncHandler(async(req , res) => {
   // Here , when we create this function route we use two middleware multer for take file as input and then verify user is loggedin.

   const  coverImageLocalPath = req.file?.path ;

   if(!coverImageLocalPath){
      throw new ApiError(400 ,  "Cover image file is missing" );
   }

   // 1. Get current user with conver image URL
   const existingUser = await User.findById( req.user?._id);

   if (!existingUser) {
      throw new ApiError(404, "User not found");
   };

   const oldCoverImageUrl  = existingUser.coverImage ;
   // console.log("oldCoverImageUrl: " , oldCoverImageUrl);

   if(!oldCoverImageUrl){
      throw new ApiError(400 , "Has not old coverImage to delete !!")
   }

   // 2. Upload new coverImage
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!coverImage.url){
      throw new ApiError( 400 , "Error while uploading on coverImage " );
   }

   // 3. Extract public_id from old coverImage URL (optional: only if it exists)
   if(oldCoverImageUrl){
      const publicId = getPublicIdFromUrl(oldCoverImageUrl); 

      if(publicId){
         await deleteImageOnCloudinary(publicId);
      }
   }

   // 4. Update user's avatar in DB
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set : {
            coverImage : coverImage.url
         }
      },
      { new : true }
   ).select("-password");

   return res
      .status(200)
      .json( 
         new ApiResponse(200 , user , "coverImage updated successfully" )
      );
});

const getUserChannelProfile  = asyncHandler( async(req , res) => {
   const { username } = req.params ;

   if( !username?.trim()){
      throw new ApiError( 400 , "username is missing in url ")
   }

   //  Now we select channel based on username and calculate subscriber and subscriedTo
   // Pipeline always return array and mostly in this array first object are important.
   const channel = await User.aggregate([
      {
         $match : {
            username : username?.toLowerCase()
         }
      },
      {
         // Now we get channel and now calculate subscriber.
         $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         // now we calculate subscribedTo means channel subscribed by users
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         }
      },
      {
         // Now we calculate size means size of document selected in subscribers and subscribedTo.
         $addFields: {
            subscribersCount : {
               $size : "$subscribers"
            },
            channelsSubscribedToCount : {
               $size : "$subscribedTo"
            }, 
            // now we decided user is subscribed any channel or not based on isSubscribed. ( for frontend to show which button follow or subscribed)
            
            isSubscribed : {
               $cond: {
                  if : { $in : [req.user?._id , "$subscribers.subscriber"]} ,
                  then : true ,
                  else : false 
               }
            }

         }
      },
      {
         $project : {
            fullName : 1 ,
            username : 1 ,
            email : 1 ,
            avatar: 1,
            coverImage: 1,
            createdAt : 1,
            subscribersCount : 1,
            channelsSubscribedToCount : 1,
            isSubscribed : 1
         }
      }
   ]);

   // console.log( " Channel : " , channel );

   if( !channel?.length ){
      throw new ApiError(404 , "channel does not exists")
   }

   return res
      .status(200)
      .json( 
         new ApiResponse(200 , channel[0] , "User channel fetched successfully")
      )

});


// If we write req.user._id , we get "string" not perfect id , internally means behind scenes mongoose convert into object Id means Perfect Id.
// req.user._id ==> give == 68616bcac5570a50d0c1b7a2
// Mongoose convert it into => _id: ObjectId('68616bcac5570a50d0c1b7a2')

const getWatchHistory = asyncHandler( async( req ,res ) => {
   const user = await User.aggregate([
      {
         // here mongoose not work aggregation pipeline  code directly go .
         // so we need create mongoose id manulally.

         $match: {
            _id : new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup:{
            from : "videos",
            localField: "watchHistory",
            foreignField : "_id",
            as : "watchHistory",
            pipeline : [
               {
                  $lookup : {
                     from : "users",
                     localField : "owner",
                     foreignField : "_id",
                     as : "owner",
                     pipeline: [
                        {
                           $project : {
                              fullName : 1,
                              username: 1,
                              avatar : 1,
                              coverImage : 1,
                              createdAt : 1
                           }
                        }
                     ]
                  }
               },
               {
                  // Now we get owner in form of array , so we modify data structure and made it object by selecting first element of owner array. 
                  $addFields : {
                     owner : {
                        // $first : "$owner"  OR
                        $arrayElemAt : [ "$owner" , 0 ]
                     }
                  } 
               }
            ]
         }
      }
   ]);

   // now we get user array , so we return it's first object.

   return res
      .status(200)
      .json( 
         new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
         )
      )
});

export { 
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}