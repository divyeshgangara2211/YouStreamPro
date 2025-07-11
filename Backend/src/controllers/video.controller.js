import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {
    uploadOnCloudinary,
    deleteImageOnCloudinary
} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // get all videos based on query, sort, pagination
    console.log("userId: ", userId);

    const pipeline = [] ;  // 2.Initialize MongoDB aggregation pipeline for filtering, searching, and joining


    // To enable full-text search, we need to create a Search Index in MongoDB Atlas.
    // This index tells MongoDB which fields to search in (like title and description).
    // It helps make search results faster and more relevant by focusing only on specific fields.
    // In our case, the index is named 'search-videos' and it targets the title and description fields.


    // 🔍 3. Full Text Search with Atlas Search
    // If search query is present, use Atlas Search index ('search-videos') 
    // to match against 'title' and 'description' fields

    if(query){
        pipeline.push({
            $search:{
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title" , "description"]
                }
            }
        });
    }

    //👤 4. Filter by userId if provided
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError( 400 ,"Invalid userId");
        }

        pipeline.push({
            $match:{
                owner: mongoose.Types.ObjectId(userId)
            }
        });
    }

    // ✅ 5. Only Get Published Videos
    // Only include videos that are published (isPublished = true)
    pipeline.push({ $match : { isPublished: true }});

    // 📊 6. Sort Videos
    // Sort videos by selected field and order
    // If not specified, default to newest first (createdAt descending)
    if(sortBy && sortType){
        pipeline.push({
            $sort :{
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    }else{
        pipeline.push({ $sort : { createdAt : -1}});
    }

    // 🔗 7. Join Owner Details from users Collection
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1 ,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            // $first : "$ownerDetails"
            $unwind: "$ownerDetails"
        }
    );

    // 🔁 8. Apply Pagination using aggregatePaginate
    // Apply pagination on the aggregation result using aggregatePaginate
    const videoAggregate = await Video.aggregate(pipeline);
    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10),
    }

    const video = await Video.aggregatePaginate( videoAggregate , options );

    // 📤 9. Send Final Response
    return res
        .status(200)
        .json( new ApiResponse( 200 , video ,  "Videos fetched successfully" ));

});


const publishAVideo = asyncHandler(async (req, res) => {
    //  get video, upload to cloudinary, create video
    const { title, description} = req.body

    if( [title , description].some( (field) => field?.trim() === "") ){
        throw new ApiError(400 , "All fields are required");
    }

    const videoFileLocalPath = req.files?.videoFile[0].path ;
    const thumbnailLocalPath = req.files?.thumbnail[0].path ;

    if(!videoFileLocalPath){
        throw new ApiError(400 ,  "videoFileLocalPath is required");
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400 ,  "thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath); 

    console.log("videoFile : ", videoFile);
    console.log("thumbnail : ", thumbnail);

    if(!videoFile){
        throw new ApiError( 400 ,  "Video file not found" );
    }

    if(!thumbnail){
        throw new ApiError( 400 ,  "thumbnail not found" );
    }

    const video = await Video.create({
        videoFile: {
            url : videoFile.url,
            public_id : videoFile.public_id,
        },
        thumbnail: {
            url : thumbnail.url,
            public_id : thumbnail.public_id,
        },
        title,
        description,
        duration : videoFile.duration,
        isPublished: false,
        owner: req.user?._id
    });

    const videoUploaded = await Video.findById(video._id);

    if(!videoUploaded){
        throw new ApiError( 500 ,  "videoUpload failed please try again !!!" );
    }

    return res
        .status(200)
        .json(
            new ApiResponse( 200 , video , "Video uploaded successfully")
        );

});

const getVideoById = asyncHandler(async (req, res) => {
    // get video by id
    const { videoId } = req.params ;
    // let { userId } = req.body ;

    // userId = new mongoose.Types.ObjectId(userId)
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid videoId");
    }

    if(!isValidObjectId(req.user?._id)){
        throw new ApiError( 400, "Invalid userId" );
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as : "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as : "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as : "subscribers",
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount : {
                                $size : "$subscribers"
                            },
                            isSubscribed : {
                                $cond: {
                                    if : { $in : [req.user?._id , "$subscribers.subscriber"]} ,
                                    then: true,
                                    else : false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username : 1,
                            "avatar.url" : 1,
                            subscribersCount : 1,
                            isSubscribed : 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner : {
                    $first : "$owner"
                },
                isLiked : {
                    $cond: {
                        if: { $in : [req.user?._id , "$likes.likedBy"]},
                        then: true ,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url" : 1,
                title: 1,
                description: 1,
                duration : 1,
                views: 1,
                // isPublished : 1,
                createdAt : 1,
                comments: 1,
                likesCount: 1,
                owner: 1,
                isLiked: 1
            }
        }
    ]);

    if(!video){
        throw new ApiError( 500 , "failed to fetch video" );
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1
            }
        }
    );

    // add this video to user watch history
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $addToSet: {
                watchHistory: videoId
            }
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video[0],
                "video details fetched successfully",
            )
        );

});

const updateVideo = asyncHandler(async (req, res) => {
    // update video details like title, description, thumbnail
    const { videoId } = req.params ;
    const { title , description } = req.body ;

    if(!isValidObjectId(videoId)){
        throw new ApiError( 400 ,  "Invalid videoId" );
    }

    if(!(title && description)){
        throw new ApiError( 400 , "title and description are required" )
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError( 404, "No video found" );
    }
    
    // if video found then check ownership
    if( video?.owner.toString() !== req.user?._id.toString() ){
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }
    
    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail.public_id ;
    console.log("thumbnailToDelete: ", thumbnailToDelete);

    const  thumbnailLocalPath = req.file?.path ;

    if(!thumbnailLocalPath){
        throw new ApiError( 400 , "thumbnail is required" );
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath) ;

    if(!thumbnail){
        throw new ApiError( 400 , "thumbnail not found" );
    }

    const UpdateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    url: thumbnail.url ,
                    public_id: thumbnail.public_id ,
                },
            }
        },
        { new : true }
    );

    if(!UpdateVideo){
        throw new ApiError( 500 , "Failed to update video please try again" );
    }

    if(UpdateVideo){
        await deleteImageOnCloudinary(thumbnailToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                UpdateVideo,
                "Video updated successfully"
            )
        );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError( 400 , "Invalid videoId" );
    }

    const video = await Video.findById(videoId);

    if(!video){
         throw new ApiError( 404, "No video found" );
    }

    // if video found then check ownership
    if( video?.owner.toString() !== req.user?._id.toString() ){
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    };

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if(!videoDeleted){
        throw new ApiError( 400 ,  "Failed to delete the video please try again" );
    }

    await deleteImageOnCloudinary( video.thumbnail.public_id); // video model has thumbnail public_id stored in it->check videoModel

    await deleteImageOnCloudinary(video.videoFile.public_id , "video"); // specify video while deleting video

    // delete video likes
    await Like.deleteMany({
        video: videoId
    });

    // delete video comments
    await Comment.deleteMany({
        video: videoId
    });

    // delete video from user watchHistory
    //  Use $pull with updateMany
    // updateMany: Updates all matching users.
    // { watchHistory: videoId }: Find users whose watchHistory includes the videoId.
    // $pull: Removes videoId from the array.
    await User.updateMany(
        { watchHistory : videoId},
        {$pull:  {watchHistory : videoId}}
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video deleted successfully"
            )
        );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params ;

    if(!isValidObjectId(videoId)){
        throw new ApiError( 400 , "Invalid videoId" );
    }

    const video = await Video.findById(videoId);

    if(!video){
         throw new ApiError( 404, "No video found" );
    }

    // if video found then check ownership
    if( video?.owner.toString() !== req.user?._id.toString() ){
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    };

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished 
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished : toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}