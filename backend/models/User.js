import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: { type: String, unique: true, index: true },
        name: { type: String, required: true },
        avatar: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model('User', userSchema);
