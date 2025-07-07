import { Router  } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/channel/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription);

router
    .route("/channel/:subscriberId")
    .get(getSubscribedChannels);


export default router