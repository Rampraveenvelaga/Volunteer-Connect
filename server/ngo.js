const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        maxlength: 2000
    },
    causes: [{
        type: String,
        enum: ['education', 'health', 'environment', 'poverty', 'human-rights', 'disaster-relief']
    }],
    logo: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    foundedYear: {
        type: Number
    },
    size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'small'
    },
    registrationNumber: {
        type: String,
        trim: true
    },
    joinedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for search functionality
ngoSchema.index({ 
    name: 'text', 
    description: 'text', 
    causes: 'text' 
});

module.exports = mongoose.model('NGO', ngoSchema);
