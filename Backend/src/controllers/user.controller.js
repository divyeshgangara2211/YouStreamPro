import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {User} from "../models/user.model.js" ;
import {  userValidationSchema } from "../utils/registerValidateSchema.js";
import { loginValidationSchema } from "../utils/loginValidationSchema.js"

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


   const { fullName, email, username, password } = req.body ;
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
      const accessToken = user.generateAccessToken();
      const refreshToken  = user.generateRefreshToken();

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

   const {username , email , password } = req.body ;
   console.log("Email on login time : ", email);

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

   // now create cookie make it only server side mofifiable.
   const options = {
      httpOnly : true ,
      secure : true ,
      sameSite: "Strict", 
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
        secure: true
    }

    return res
      .status(200)
      .clearCookie( "accessToken" , options )
      .clearCookie( "refreshToken" , options )
      .json( new ApiResponse(200 , {} ,  "User logged Out" ))
});

export { 
   registerUser,
   loginUser,
}