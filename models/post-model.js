import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    descreption: { type: String },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    mediaUrl: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const PostModel = mongoose.model("posts", postSchema);

export default PostModel;
