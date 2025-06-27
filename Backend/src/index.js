//  As early as possible in our application , import and config dotenv because it will load the environment variables as early as possible when application load .

import dotenv from "dotenv";
//  import 'dotenv/config' // if you're using ES6
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})


connectDB()




// // This is first method to connect to the database in which we declare the connection in same file and listen on same file. 
// this is not a good practise because we are not using the seprate file for connection and listening.


// import mongoose, { mongo } from "mongoose";
// import { DB_NAME } from "./constants.js";

// import express from "express";
// const app = express();

// IIFE :- ()()

// ;( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); 

//         app.on("error", (error) => {
//             console.log("ERROR: ",error);
//             throw error;
//         })

//         app.listen( process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("ERROR: ",error);
//         throw error
//     }
// })()