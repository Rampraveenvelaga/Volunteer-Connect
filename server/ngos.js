const express = require('express');
const router = express.Router();
const NGO = require('./ngo'); // Direct import from same folder

// Get all NGOs
router.get('/', async (req, res) => {
    try {
        const ngos = await NGO.find({ isVerified: true });
        res.json(ngos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get NGO profile (in real app, would use authentication)
router.get('/profile', async (req, res) => {
    try {
        // In a real app, you'd get the NGO ID from authentication
        const ngoId = req.headers['ngo-id'];
        if (!ngoId) {
            return res.status(404).json({ error: 'NGO not found' });
        }
        
        const ngo = await NGO.findById(ngoId);
        res.json(ngo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update NGO profile
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if NGO already exists
        let ngo = await NGO.findOne({ email });
        
        if (ngo) {
            // Update existing NGO
            Object.assign(ngo, req.body);
            await ngo.save();
        } else {
            // Create new NGO
            ngo = new NGO(req.body);
            await ngo.save();
        }
        
        res.json(ngo);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Email already registered' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Search NGOs
router.get('/search', async (req, res) => {
    try {
        const { causes, location, size } = req.query;
        let query = { isVerified: true };
        
        if (causes) {
            query.causes = { $in: causes.split(',') };
        }
        
        if (location) {
            query.address = { $regex: location, $options: 'i' };
        }
        
        if (size) {
            query.size = size;
        }
        
        const ngos = await NGO.find(query);
        res.json(ngos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get NGO by ID
router.get('/:id', async (req, res) => {
    try {
        const ngo = await NGO.findById(req.params.id);
        if (!ngo) {
            return res.status(404).json({ error: 'NGO not found' });
        }
        res.json(ngo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update NGO
router.put('/:id', async (req, res) => {
    try {
        const ngo = await NGO.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!ngo) {
            return res.status(404).json({ error: 'NGO not found' });
        }
        
        res.json(ngo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete NGO
router.delete('/:id', async (req, res) => {
    try {
        const ngo = await NGO.findByIdAndDelete(req.params.id);
        if (!ngo) {
            return res.status(404).json({ error: 'NGO not found' });
        }
        res.json({ message: 'NGO deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
