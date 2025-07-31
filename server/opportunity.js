const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 3000
    },
    category: {
        type: String,
        required: true,
        enum: ['education', 'health', 'environment', 'community', 'disaster-relief', 'technology']
    },
    type: {
        type: String,
        enum: ['one-time', 'ongoing', 'event'],
        default: 'one-time'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    time: {
        type: String
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    volunteersNeeded: {
        type: Number,
        required: true,
        min: 1
    },
    volunteersApplied: {
        type: Number,
        default: 0
    },
    requirements: {
        type: String,
        maxlength: 1000
    },
    skills: [{
        type: String
    }],
    ngoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NGO',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    images: [{
        type: String
    }],
    applicationDeadline: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for search and filtering
opportunitySchema.index({ 
    title: 'text', 
    description: 'text', 
    category: 1, 
    location: 'text',
    startDate: 1,
    isActive: 1
});

// Virtual for checking if opportunity is expired
opportunitySchema.virtual('isExpired').get(function() {
    return this.applicationDeadline && this.applicationDeadline < new Date();
});

module.exports = mongoose.model('Opportunity', opportunitySchema);
