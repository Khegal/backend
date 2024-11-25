import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  email: String,
});

const UserModel = mongoose.model("users", userSchema);

export default UserModel;
