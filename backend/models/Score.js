import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: Number, required: true },
    },
    { timestamps: true }
);

export default mongoose.model('Score', scoreSchema);
