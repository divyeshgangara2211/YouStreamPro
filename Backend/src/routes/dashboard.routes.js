import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getChannelStats, 
    getChannelVideos
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(verifyJWT ); // Apply verifyJWT middleware to all routes in this file

//✅ HTTP GET — because you're retrieving data, not creating or modifying it.
router.route("/stats").get(getChannelStats);
// router.get("/stats", getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router