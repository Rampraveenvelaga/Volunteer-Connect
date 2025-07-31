const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
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
    location: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: 1000
    },
    skills: [{
        type: String,
        enum: ['teaching', 'healthcare', 'technology', 'environment', 'fundraising', 'communication']
    }],
    availability: {
        type: String,
        enum: ['weekends', 'weekdays', 'flexible', 'evenings'],
        default: 'flexible'
    },
    profilePicture: {
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
    completedHours: {
        type: Number,
        default: 0
    },
    joinedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for search functionality
volunteerSchema.index({ 
    name: 'text', 
    bio: 'text', 
    skills: 'text' 
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
