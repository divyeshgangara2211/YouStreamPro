import { Router } from "express";
import {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}  from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT , upload.none()); // Apply verifyJWT middleware to all routes in this file. Expect no files, only plain text fields.It parses incoming form-data but rejects if files are included.

router.route("/:videoId")
    .get(getVideoComments)
    .post(addComment);

router.route("/channel/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;