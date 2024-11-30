import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  fullName: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const UserModel = mongoose.model("users", userSchema);

export default UserModel;
