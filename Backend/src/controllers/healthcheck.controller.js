import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //build a healthcheck response that simply returns the OK status as json with a message

    return res
        .stat
        .json(
            new ApiResponse(200 , { message : "Everything is Ok"} , "Ok")
        );
});

export {
    healthcheck
};