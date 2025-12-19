import mongoose from 'mongoose';
export const connectdb = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/codecollab', {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ MongoDB connected successfully to 'codecollab' database");
    }
    catch(err){
        console.error("❌ MongoDB connection error:", err.message);
        console.log("Make sure MongoDB is running on localhost:27017");
        // Don't exit the process, let the app continue
    }
}
