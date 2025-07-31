const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/volunteerconnect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Import models
const Application = require('./application');
const Volunteer = require('./volunteer');
const NGO = require('./ngo');
const Opportunity = require('./opportunity');

// Routes - Import directly from server folder
const volunteerRoutes = require('./volunteers');
const ngoRoutes = require('./ngos');
const opportunityRoutes = require('./opportunities');

app.use('/api/volunteers', volunteerRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/opportunities', opportunityRoutes);

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const [volunteers, ngos, opportunities, applications] = await Promise.all([
            Volunteer.countDocuments(),
            NGO.countDocuments(),
            Opportunity.countDocuments(),
            Application.countDocuments()
        ]);
        
        res.json({
            volunteers,
            ngos,
            opportunities,
            applications,
            hours: volunteers * 15 // Estimated average hours per volunteer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Application endpoints - UPDATED TO WORK PROPERLY
app.post('/api/applications', async (req, res) => {
    try {
        const { opportunityId, volunteerName, volunteerEmail, message } = req.body;
        
        console.log('Received application:', { opportunityId, volunteerName, volunteerEmail, message });
        
        // Get opportunity details
        const opportunity = await Opportunity.findById(opportunityId).populate('ngoId');
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        
        // Check if volunteer already applied
        const existingApplication = await Application.findOne({
            opportunityId,
            volunteerEmail
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
            ngoId: opportunity.ngoId._id,
            message: message || '',
            status: 'pending'
        });
        
        await application.save();
        console.log('Application saved:', application);
        
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
            .sort({ appliedDate: -1 });
        
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get applications for NGO
app.get('/api/applications/ngo', async (req, res) => {
    try {
        const ngoId = req.headers['ngo-id'] || '507f1f77bcf86cd799439011';
        
        const applications = await Application.find({ ngoId })
            .populate('opportunityId')
            .sort({ appliedDate: -1 });
        
        console.log(`Found ${applications.length} applications for NGO ${ngoId}`);
        res.json(applications);
    } catch (error) {
        console.error('Error fetching NGO applications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update application status (Accept/Reject)
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

// Delete application
app.delete('/api/applications/:id', async (req, res) => {
    try {
        const application = await Application.findByIdAndDelete(req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        // Decrease opportunity application count
        await Opportunity.findByIdAndUpdate(
            application.opportunityId,
            { $inc: { volunteersApplied: -1 } }
        );
        
        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get application statistics
app.get('/api/applications/stats', async (req, res) => {
    try {
        const stats = await Application.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const result = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0
        };
        
        stats.forEach(stat => {
            result[stat._id] = stat.count;
            result.total += stat.count;
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
