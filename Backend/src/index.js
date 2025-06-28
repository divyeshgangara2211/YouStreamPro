//  As early as possible in our application , import and config dotenv because it will load the environment variables as early as possible when application load .

//  import 'dotenv/config' // if you're using ES6
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then( () => {
    app.on("error" , (error) => {
        console.log("ERROR: ", error);
        throw error;
    })

    app.listen( process.env.PORT || 8000 , () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch( (error) => {
    console.log("Mongodb connection Failed !! ", error);
})




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