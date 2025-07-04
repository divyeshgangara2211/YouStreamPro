import mongoose from "mongoose";
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    // get all comments for a video

    const {videoId} = req.params ; //Used to capture values from the URL path.
    const {page = 1, limit = 10} = req.query ;  // Used to get values from the URL after the ? mark. use when You want to filter, sort, or paginate data.
    //From req.query, all values are strings.

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400 , "Video not found !!")
    }

    const commentsAggregate =  await Video.aggregate([
        {   // 1. Match comments for specific video
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {   // 2. Lookup: likes on the comment
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        { // 3. Lookup: owner info
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {    // 4. Add like count, owner and comment is liked by user or not.
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $size: "$owner"
                },
                isLiked : {
                    $cond: {
                        if: { $in : [req.user?._id , "$likes.likedBy"]} ,
                        then: true ,
                        else: false
                    }
                }
            }
        },
        {   // 5. Sort by latest
            $sort: {
                createdAt : -1
            }
        },
        {  // 6. Project final fields to return
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                "owner.username" : 1,
                "owner.fullName" : 1,
                "owner.avatar.url" : 1,
                isLiked: 1
            }
        }
    ]);

    const options = {
        //Uses 10 as the radix (base-10, decimal number system).
        page: parseInt(page,10) || 1, 
        limit: parseInt(limit,10) || 10
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comments ,"Comments fetched successfully"))
});


const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
    const {videoId} = req.params ;
    const {content} = req.body ;

    //  1.Validate the Input
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    if(!content){
        throw new ApiError(400, "Content is required");
    }

    //2. Check if the Video Exists
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400 ,  "Video not found");
    }

    //3.Create a New Comment Document
    const comment = await Comment.create({
        content,
        video : videoId,
        owner: req.user?._id
    });

    if(!comment){
        throw new ApiError(500 , "Failed to add comment please try again");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201,comment ,"Comment added successfully")
        )
});


const updateComment = asyncHandler(async (req, res) => {
    // update a comment
    // 1. Get Input Data
    const {commentId} = req.params ;
    const {newContent} = req.body ;

    // 3. Validate the Inputs &  Find the Comment
    if(!newContent){
        throw new ApiError(400 , "Content is required");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404 , "Comment not found");
    }

    // 4. Check Ownership
    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    // 5. Update the Comment
    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content: newContent
            }
        },
        {
            new: true
        }
    );

    if(!updatedComment){
        throw new ApiError(500 , "Failed to edit comment please try again");
    }

    return res
        .status(200)
        .json(
            new ApiResponse( 200, updatedComment , "Comment edited successfully")
        )

});

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment
    // 1. Get Input Data and find comment and check if exist.
    const {commentId} = req.params;

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,  "Comment not found");
    }

    //2.Check Ownership
    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    });

    //🔍 Usually, in REST APIs, the second argument is data, and it's expected to be an object, not a primitive value like a string or number.

    return res
        .status(200)
        .json(
            new ApiResponse(200, {commentId }, "Comment deleted successfully" )
        )

});

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}