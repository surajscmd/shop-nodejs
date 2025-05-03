import mongoose from "mongoose";
const connectDB = async () => {
    await mongoose.connect("mongodb+srv://suraj:zDxJTbqzS83pTtKe@cluster0.ajzily6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
}
export default connectDB;