import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema( {
        videoFile: {
            type: {
                url : String, // //cloudinary url
                public_id: String,
            },
            required: true,
        },
        thumbnail: {
            type: {
                url : String, // //cloudinary url
                public_id: String,
            },
            required: true,
        },
        title: {
            type: String, 
            required: true,
        },
        description: {
            type: String, 
            required: true,
        },
        duration: {
            type: Number, 
            required: true,
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

// This line enables pagination support for MongoDB aggregation queries .
// mongoose-aggregate-paginate adds a special .aggregatePaginate() method to you.
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model( "Video" , videoSchema );