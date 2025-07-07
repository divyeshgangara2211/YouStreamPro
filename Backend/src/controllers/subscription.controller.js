import mongoose, {isValidObjectId, mongo} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { json } from "stream/consumers"


const toggleSubscription = asyncHandler(async (req, res) => {

    const {channelId} = req.params
    // toggle subscription means subscriber got unsubscribe and unsubscribe got subscriber.
    
    if(!isValidObjectId(channelId)){
        throw new ApiError( 400 , "Invalid channelId" );
    }

    //Check Existing Subscription
    const isSubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id 
    });
    console.log("isSubscribed : ", isSubscribed);

    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "unsunscribed successfully"
                )
            )
    }

    const newSubscriber = await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id 
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {subscriber :newSubscriber, subscribed : true },
                "subscribed successfully"
            )
        );
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    let {channelId} = req.params ;

    if(!isValidObjectId(channelId)){
        throw new ApiError( 400 , "Invalid channelId");
    }

    channelId = mongoose.Types.ObjectId(channelId);

    const Subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from : "users",
                localField: "subscriber",
                foreignField: "_id",
                as : "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount : {
                                $size : "$subscribers" ,
                            },

                            isSubscribedByCurrentUser:{ 

                            //"$subscribers.subscriber" does not extract an array of subscriber IDs from the subscribers array. $subscribers is an array of objects.

                                $cond : {
                                    if : {$in : [ req.user?._id , {
                                        $map: {
                                            input : "$subscribers", // loop through each item in subscribers array

                                            as: "s",// temporary variable name for each item

                                            in : "$$s.subscriber" // extract the `subscriber` field from each object

                                            // $$ is used to access variables defined inside the expression.
                                        }  
                                    }]},
                                    then : true ,
                                    else : false,
                                }
                            },
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber : { $first : "$subscriber" }
                // subscriber: { $arrayElemAt: ["$subscriber", 0] }
            }
        },
        {
            $project: {
                _id: 0,
                "subscriber._id" : 1,
                "subscriber.username" : 1,
                "subscriber.fullName" : 1,
                "subscriber.avatar.url" : 1,
                "subscriber.isSubscribedByCurrentUser" : 1,
                "subscriber.subscribersCount" : 1,
            }
        }
    ]);

    return res
        .status(200)
        json(
            new ApiResponse(
                200,
                Subscribers,
                "subscribers fetched successfully"
            )   
        );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params ;

    const subscribedChannels = await Subscription.aggregate([
        // 1. Match all subscriptions for the given user
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        //2. Lookup subscribed channels (users)
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    // 3. Inside the subscribedChannel pipeline, lookup videos
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",// channel’s user _id
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    //4. Add the latest video (assume by createdAt order)
                    {
                        $addFields: {
                            latestVideo: {
                                $last : "$videos"
                            }
                        }
                    }
                ]
            }
        },

        // 5.Back to main pipeline — Unwind subscribedChannel means take first element of subscribedChannel array
        {
            // $unwind: "$subscribedChannel"  OR
            $addFields: {
                subscribedChannel: { $first : "$subscribedChannel"}
            }
        },
        //6. Project only required channel + video info
        {
            $project: {
                _id : 0,
                "subscribedChannel._id" : 1,
                "subscribedChannel.username" : 1,
                "subscribedChannel.fullName" : 1,
                "subscribedChannel.avatar.url" : 1,
                "subscribedChannel.latestVideo._id" : 1,
                "subscribedChannel.latestVideo.videoFile.url" : 1,
                "subscribedChannel.latestVideo.thumbnail.url" : 1,
                "subscribedChannel.latestVideo.owner" : 1,
                "subscribedChannel.latestVideo.title" : 1,
                "subscribedChannel.latestVideo.description" : 1,
                "subscribedChannel.latestVideo.duration" : 1,
                "subscribedChannel.latestVideo.createdAt" : 1,
                "subscribedChannel.latestVideo.views" : 1,
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "subscribed channels fetched successfully"
            )
        );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}