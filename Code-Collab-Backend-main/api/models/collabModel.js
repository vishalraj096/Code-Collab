import mongoose from 'mongoose';

const CollabSpaceSchema = new mongoose.Schema({
    collabId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: "Untitled Space"
    },
    code: {
        type: String,
        default: ""
    },
    language: {
        type: Object,
        default: { name: "javascript", val: "js" }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const CollabSpace = mongoose.model('CollabSpace', CollabSpaceSchema);

export default CollabSpace;