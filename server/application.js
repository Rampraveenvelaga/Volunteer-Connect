const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    volunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volunteer'
    },
    volunteerName: {
        type: String,
        required: true
    },
    volunteerEmail: {
        type: String,
        required: true
    },
    opportunityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity',
        required: true
    },
    opportunityTitle: {
        type: String,
        required: true
    },
    ngoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NGO',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    message: {
        type: String,
        maxlength: 500
    },
    reviewedDate: {
        type: Date
    },
    reviewedBy: {
        type: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
applicationSchema.index({ 
    volunteerId: 1, 
    opportunityId: 1, 
    ngoId: 1,
    status: 1,
    volunteerEmail: 1
});

module.exports = mongoose.model('Application', applicationSchema);
