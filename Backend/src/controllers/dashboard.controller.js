import mongoose, { mongo } from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id ;
    // const  totalSubscribers  = await Subscription.countDocuments({channel : userId});
    //But aggregation is more powerful if you're building a dashboard with multiple metrics.

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                // channel : new mongoose.Types.ObjectId(userId)
                channel : mongoose.Types.ObjectId(userId)  // new version not need "new" keyword
            }
        },
        {
            $group: {
                _id: null , //null means “all together” — only one group.
                subscribersCount:{
                    $sum: 1  //means: Add 1 for each document in the group .It's equivalent to counting the total number of documents.
                }
            }
        }
    ]);

    const video = await Video.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes : {
                    $size: "likes"
                },
                totalViews : "$viwes",
                totalVideos : 1
            }
        },
        {
            $group: {
                _id:null ,
                totalLikes : {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$totalViews"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ]);

    const  channelStats = {
        totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
        totalLikes : video[0]?.totalLikes || 0,
        totalViews : video[0]?.totalViews || 0,
        totalVideos : video[0]?.totalVideos || 0,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelStats,
                "channel stats fetched successfully"
            )
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all the videos uploaded by the channel
    const {userId} = req.user?._id ;

    const videos = await Video.aggregate([
        {
            $match : {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount : {
                    $size: "$likes"
                },
                createdAt : {
                    $dateToParts : {  date : "$createdAt"}
                }
            }
        },
        {   
            $sort: {
                createdAt : -1
            }
        },
        {
            $project: {
                _id: 1,
                "videoFile.url" : 1,
                "thumbnail.url" : 1,
                title: 1,
                description:1,
                duration : 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                },
                isPublished: 1,
                likeCount: 1,
                views : 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "channel stats fetched successfully"
            )
        );
});

export {
    getChannelStats, 
    getChannelVideos
}