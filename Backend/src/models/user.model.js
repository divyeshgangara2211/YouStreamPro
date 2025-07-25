import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema( {
        username : {
            type: String,
            required: true ,
            unique : true ,
            lowercase: true,
            trim : true,
            index: true
        },
        email : {
            type: String,
            required: true ,
            unique : true ,
            lowercase: true,
            trim : true,
        },
        fullName : {
            type: String,
            required: true ,
            trim : true,
            index: true
        },
        avatar : {
            type: String,  // cloudinary url
            required: true ,
        },
        coverImage : {
            type: String,  // cloudinary url
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password: { 
            // Here we need to incrypt and decrypt this password
            type: String,
            required: [ true , 'Password is required !!' ],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        refreshToken: {
            type: String
        }       
    },
    {
        timestamps: true
    }
);

// Here we need access of "This" so use Function not arrow function.
// Here we incrypt password before save if it is modified.
userSchema.pre("save" , async function(next){
    if( !this.isModified("password")) return next() ;

    this.password = await bcrypt.hash(this.password , 10);
    next()
});

//Now design custome methods and inject it into Schema.

userSchema.methods.isPasswordCorrect = async function(password){

    return await bcrypt.compare(password , this.password ); //2nd parameter is incrypted password
};

// Access and Refresh Token both JWT token only differce is in thier uses.

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName : this.fullName,   
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};

export const User = mongoose.model( "User" , userSchema );