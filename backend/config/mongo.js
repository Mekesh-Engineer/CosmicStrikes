import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('Missing MONGO_URI in .env');
    process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
    .connect(uri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error: ' + err.message);
        console.error('Server will continue running, but database features will not work.');
        // process.exit(1); // Keep server running even if DB fails
    });
