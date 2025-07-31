const express = require('express');
const router = express.Router();
const Volunteer = require('./volunteer'); // Direct import from same folder

// Get all volunteers
router.get('/', async (req, res) => {
    try {
        const volunteers = await Volunteer.find({ isVerified: true });
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get volunteer profile (in real app, would use authentication)
router.get('/profile', async (req, res) => {
    try {
        // In a real app, you'd get the volunteer ID from authentication
        const volunteerId = req.headers['volunteer-id'];
        if (!volunteerId) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }
        
        const volunteer = await Volunteer.findById(volunteerId);
        res.json(volunteer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update volunteer profile
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if volunteer already exists
        let volunteer = await Volunteer.findOne({ email });
        
        if (volunteer) {
            // Update existing volunteer
            Object.assign(volunteer, req.body);
            await volunteer.save();
        } else {
            // Create new volunteer
            volunteer = new Volunteer(req.body);
            await volunteer.save();
        }
        
        res.json(volunteer);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Email already registered' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Search volunteers
router.get('/search', async (req, res) => {
    try {
        const { skills, location, availability } = req.query;
        let query = { isVerified: true };
        
        if (skills) {
            query.skills = { $in: skills.split(',') };
        }
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        if (availability) {
            query.availability = availability;
        }
        
        const volunteers = await Volunteer.find(query);
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get volunteer by ID
router.get('/:id', async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }
        res.json(volunteer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update volunteer
router.put('/:id', async (req, res) => {
    try {
        const volunteer = await Volunteer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!volunteer) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }
        
        res.json(volunteer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete volunteer
router.delete('/:id', async (req, res) => {
    try {
        const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }
        res.json({ message: 'Volunteer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
