const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err.message);
    console.log('Shutting down...');
    process.exit(1);
});

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection with better error handling
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/volunteerconnect', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

connectDB();

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Import models with error handling
let Application, Volunteer, NGO, Opportunity;

try {
    Application = require('./application');
    Volunteer = require('./volunteer');
    NGO = require('./ngo');
    Opportunity = require('./opportunity');
} catch (error) {
    console.error('Error importing models:', error.message);
    process.exit(1);
}

// Routes with error handling
try {
    const volunteerRoutes = require('./volunteers');
    const ngoRoutes = require('./ngos');
    const opportunityRoutes = require('./opportunities');

    app.use('/api/volunteers', volunteerRoutes);
    app.use('/api/ngos', ngoRoutes);
    app.use('/api/opportunities', opportunityRoutes);
} catch (error) {
    console.error('Error setting up routes:', error.message);
}

// Stats endpoint with error handling
app.get('/api/stats', async (req, res) => {
    try {
        const [volunteers, ngos, opportunities, applications] = await Promise.all([
            Volunteer.countDocuments().catch(() => 0),
            NGO.countDocuments().catch(() => 0),
            Opportunity.countDocuments().catch(() => 0),
            Application.countDocuments().catch(() => 0)
        ]);
        
        res.json({
            volunteers,
            ngos,
            opportunities,
            applications,
            hours: volunteers * 15
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to load statistics' });
    }
});

// Applications endpoints with improved error handling
app.post('/api/applications', async (req, res) => {
    try {
        const { opportunityId, volunteerName, volunteerEmail, message } = req.body;
        
        console.log('Received application:', { opportunityId, volunteerName, volunteerEmail });
        
        if (!opportunityId) {
            return res.status(400).json({ error: 'Opportunity ID is required' });
        }

        // Get opportunity details
        const opportunity = await Opportunity.findById(opportunityId).populate('ngoId');
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        
        // Check if volunteer already applied
        const existingApplication = await Application.findOne({
            opportunityId,
            volunteerEmail: volunteerEmail || 'volunteer@email.com'
        });
        
        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied to this opportunity' });
        }
        
        // Create new application
        const application = new Application({
            opportunityId,
            opportunityTitle: opportunity.title,
            volunteerName: volunteerName || 'Anonymous Volunteer',
            volunteerEmail: volunteerEmail || 'volunteer@email.com',
            ngoId: opportunity.ngoId ? opportunity.ngoId._id : new mongoose.Types.ObjectId(),
            message: message || '',
            status: 'pending'
        });
        
        await application.save();
        console.log('Application saved:', application._id);
        
        // Update opportunity application count
        await Opportunity.findByIdAndUpdate(
            opportunityId,
            { $inc: { volunteersApplied: 1 } }
        );
        
        res.json({ 
            message: 'Application submitted successfully',
            applicationId: application._id
        });
    } catch (error) {
        console.error('Application error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get applications for current volunteer
app.get('/api/applications/my', async (req, res) => {
    try {
        const volunteerEmail = req.headers['volunteer-email'] || 'volunteer@email.com';
        
        const applications = await Application.find({ volunteerEmail })
            .populate('opportunityId')
            .sort({ appliedDate: -1 })
            .catch(() => []);
        
        res.json(applications);
    } catch (error) {
        console.error('Error fetching volunteer applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get applications for NGO - FIXED VERSION
app.get('/api/applications/ngo', async (req, res) => {
    try {
        // Get ALL applications for testing
        const applications = await Application.find({})
            .populate('opportunityId')
            .sort({ appliedDate: -1 })
            .catch(() => []);
        
        console.log(`Found ${applications.length} total applications`);
        res.json(applications);
    } catch (error) {
        console.error('Error fetching NGO applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update application status
app.put('/api/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewedBy } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const application = await Application.findByIdAndUpdate(
            id,
            { 
                status,
                reviewedDate: new Date(),
                reviewedBy: reviewedBy || 'NGO Admin'
            },
            { new: true }
        );
        
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        console.log(`Application ${id} ${status} by ${reviewedBy || 'NGO Admin'}`);
        
        res.json({ 
            message: `Application ${status} successfully`,
            application 
        });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint
app.get('/api/debug/applications', async (req, res) => {
    try {
        const applications = await Application.find({}).catch(() => []);
        const opportunities = await Opportunity.find({}).catch(() => []);
        const ngos = await NGO.find({}).catch(() => []);
        
        res.json({
            applications: applications.length,
            opportunities: opportunities.length,
            ngos: ngos.length,
            applicationData: applications.slice(0, 5),
            opportunityData: opportunities.slice(0, 5),
            ngoData: ngos.slice(0, 5)
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Promise Rejection:', err.message);
    console.log('Shutting down the server...');
    process.exit(1);
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
