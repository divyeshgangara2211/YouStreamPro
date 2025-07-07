import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //toggle like on comment

    if(!commentId){
        new ApiError(400 , "Invalid CommentId");
    }

    const likedAlready = await Like.findOne({
        comment : commentId,
        likedBy: req.user?._id
    });

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json( new ApiResponse(200 , {isLiked: false}));
    }

    await Like.create({
        comment : commentId,
        likedBy: req.user?._id
    });

    return res
        .status(200)
        .json( new ApiResponse(200 , {isLiked: true}));
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        new ApiError(400 , "Invalid TweetId");
    }

    const likedAlready = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user?._id
    });

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id);

        return  res
            .status(200)
            .json(new ApiResponse(200 , { tweetId , isLiked: false }));
    };

    await Like.create({
        tweet : tweetId,
        likedBy : req.user?._id
    });

    return res  
        .status(200)
        .json( new ApiResponse(200 ,  { tweetId , isLiked: true }));
});


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if(!isValidObjectId(videoId)){
        new ApiError(400 ,"Invalid videoId" );
    }

    const likedAlready = await Like.findOne({
        video : videoId,
        likedBy: req.user?._id
    });

    console.log("likedAlready: ", likedAlready);

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(
                ApiResponse(
                    200,
                    {isLiked : false},
                )
            );
    };

    await Like.create({
        video : videoId,
        likedBy: req.user?._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {isLiked: true})
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideosAggegate = await Like.aggregate([
        {
            $match:  {
                likedBy: mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as : "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        }
                    },
                    {
                        $unwind: "$ownerDetails",
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1,
            }
        },
        {
            $project: {
                _id : 0,
                "likedVideo._id" : 1,
                "likedVideo.videoFile.url" : 1,
                "likedVideo.thumbnail.url" : 1,
                "likedVideo.owner" : 1,
                "likedVideo.title" : 1,
                "likedVideo.description" : 1,
                "likedVideo.duration" : 1,
                "likedVideo.views" : 1,
                "likedVideo.isPublished" : 1,
                "likedVideo.createdAt" : 1,
                "likedVideo.ownerDetails.username" : 1,
                "likedVideo.ownerDetails.fullName" : 1,
                "likedVideo.ownerDetails.avatar.url" : 1,
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200 , 
                likedVideosAggegate , 
                "liked videos fetched successfully"
            )
        );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}