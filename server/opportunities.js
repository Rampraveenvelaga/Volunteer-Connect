const express = require('express');
const router = express.Router();
const Opportunity = require('./opportunity');

// Get all opportunities
router.get('/', async (req, res) => {
    try {
        const opportunities = await Opportunity.find({ isActive: true })
            .populate('ngoId', 'name')
            .sort({ startDate: 1 });
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get opportunities for a specific NGO
router.get('/my', async (req, res) => {
    try {
        // In a real app, you'd get the NGO ID from authentication
        const ngoId = req.headers['ngo-id'] || '507f1f77bcf86cd799439011'; // Mock ID
        
        const opportunities = await Opportunity.find({ ngoId })
            .sort({ createdAt: -1 });
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new opportunity
router.post('/', async (req, res) => {
    try {
        // In a real app, you'd get the NGO ID from authentication
        const ngoId = req.headers['ngo-id'] || '507f1f77bcf86cd799439011'; // Mock ID
        
        const opportunityData = {
            ...req.body,
            ngoId
        };
        
        const opportunity = new Opportunity(opportunityData);
        await opportunity.save();
        
        res.status(201).json(opportunity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search opportunities
router.get('/search', async (req, res) => {
    try {
        const { keyword, category, location, type, urgency } = req.query;
        let query = { isActive: true };
        
        if (keyword) {
            query.$text = { $search: keyword };
        }
        
        if (category) {
            query.category = category;
        }
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        if (type) {
            query.type = type;
        }
        
        if (urgency) {
            query.urgency = urgency;
        }
        
        const opportunities = await Opportunity.find(query)
            .populate('ngoId', 'name')
            .sort({ startDate: 1 });
            
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get opportunity by ID
router.get('/:id', async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id)
            .populate('ngoId', 'name email phone');
            
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        
        res.json(opportunity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update opportunity
router.put('/:id', async (req, res) => {
    try {
        const opportunity = await Opportunity.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('ngoId', 'name');
        
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        
        res.json(opportunity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete opportunity
router.delete('/:id', async (req, res) => {
    try {
        const opportunity = await Opportunity.findByIdAndDelete(req.params.id);
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        res.json({ message: 'Opportunity deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Apply to opportunity
router.post('/:id/apply', async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const opportunityId = req.params.id;
        
        // In a real app, you'd create an Application model
        // For now, just increment the applied count
        const opportunity = await Opportunity.findByIdAndUpdate(
            opportunityId,
            { $inc: { volunteersApplied: 1 } },
            { new: true }
        );
        
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        
        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get opportunities by category
router.get('/category/:category', async (req, res) => {
    try {
        const opportunities = await Opportunity.find({ 
            category: req.params.category,
            isActive: true 
        }).populate('ngoId', 'name')
          .sort({ startDate: 1 });
          
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get urgent opportunities
router.get('/urgent/all', async (req, res) => {
    try {
        const opportunities = await Opportunity.find({ 
            urgency: 'high',
            isActive: true 
        }).populate('ngoId', 'name')
          .sort({ startDate: 1 });
          
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
