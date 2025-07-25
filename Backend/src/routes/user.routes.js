import {Router}  from "express";
import { 
    registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
} from "../controllers/user.controller.js";

import {upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").get( verifyJWT , logoutUser );
router.route("/refresh-token").post(refreshAccessToken) ;
router.route("/change-password").post(verifyJWT , changeCurrentPassword);

router.route("/current-user").get(verifyJWT , getCurrentUser);

router.route("/update-account").patch(verifyJWT , updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT , upload.single("avatar"), updateUserAvatar);
router.route("/update-coverImage").patch(verifyJWT , upload.single("coverImage"), updateUserCoverImage);

// In this we get data from params so ":" must important .
router.route("/channel/:username").post(verifyJWT , getUserChannelProfile);

router.route("/watchHistory").get(verifyJWT , getWatchHistory);



export default router