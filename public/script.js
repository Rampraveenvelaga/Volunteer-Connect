// Global Variables
let currentTab = 'profile';
let currentView = 'grid';
let currentPage = 1;
let itemsPerPage = 12;
let allOpportunities = [];
let allVolunteers = [];
let currentUser = {
    name: '',
    email: '',
    type: 'volunteer' // or 'ngo'
};

// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadStats();
});

// Page Initialization
function initializePage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(page) {
        case 'index.html':
        case '':
            initializeHomePage();
            break;
        case 'volunteers.html':
            initializeVolunteerPage();
            break;
        case 'ngos.html':
            initializeNGOPage();
            break;
        case 'opportunities.html':
            initializeOpportunitiesPage();
            break;
    }
}

// Home Page Functions
function initializeHomePage() {
    animateStats();
}

function animateStats() {
    const stats = [
        { id: 'volunteer-count', target: 15420 },
        { id: 'ngo-count', target: 850 },
        { id: 'opportunity-count', target: 3240 },
        { id: 'hours-count', target: 89350 }
    ];
    
    stats.forEach(stat => {
        animateNumber(stat.id, stat.target);
    });
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 20);
}

// Navigation Functions
function navigateTo(page) {
    window.location.href = page;
}

// Tab Management - UPDATED
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Load content based on tab
    switch(tabName) {
        case 'search':
            loadOpportunities();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'manage-opportunities':
            loadNGOOpportunities();
            break;
        case 'review-applications':  // ADDED THIS CASE
            loadNGOApplications();
            break;
        case 'volunteers-pool':
            loadVolunteers();
            break;
    }
}

// Volunteer Page Functions
function initializeVolunteerPage() {
    setupVolunteerForms();
    loadVolunteerProfile();
}

function setupVolunteerForms() {
    const volunteerForm = document.getElementById('volunteer-form');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', handleVolunteerSubmit);
    }
}

async function handleVolunteerSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('volunteer-name').value,
        email: document.getElementById('volunteer-email').value,
        phone: document.getElementById('volunteer-phone').value,
        location: document.getElementById('volunteer-location').value,
        bio: document.getElementById('volunteer-bio').value,
        skills: getSelectedSkills(),
        availability: document.getElementById('volunteer-availability').value
    };
    
    // Update current user
    currentUser.name = formData.name;
    currentUser.email = formData.email;
    currentUser.type = 'volunteer';
    
    try {
        const response = await fetch(`${API_BASE}/volunteers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('Profile saved successfully!', 'success');
        } else {
            showMessage('Error saving profile. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    }
}

function getSelectedSkills() {
    const checkboxes = document.querySelectorAll('.skills-grid input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

async function loadVolunteerProfile() {
    // Load existing profile if available
    try {
        const response = await fetch(`${API_BASE}/volunteers/profile`);
        if (response.ok) {
            const profile = await response.json();
            populateVolunteerForm(profile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function populateVolunteerForm(profile) {
    if (!profile) return;
    
    const nameField = document.getElementById('volunteer-name');
    const emailField = document.getElementById('volunteer-email');
    const phoneField = document.getElementById('volunteer-phone');
    const locationField = document.getElementById('volunteer-location');
    const bioField = document.getElementById('volunteer-bio');
    const availabilityField = document.getElementById('volunteer-availability');
    
    if (nameField) nameField.value = profile.name || '';
    if (emailField) emailField.value = profile.email || '';
    if (phoneField) phoneField.value = profile.phone || '';
    if (locationField) locationField.value = profile.location || '';
    if (bioField) bioField.value = profile.bio || '';
    if (availabilityField) availabilityField.value = profile.availability || '';
    
    // Set skills checkboxes
    if (profile.skills) {
        profile.skills.forEach(skill => {
            const checkbox = document.querySelector(`input[value="${skill}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// NGO Page Functions
function initializeNGOPage() {
    setupNGOForms();
    loadNGOProfile();
}

function setupNGOForms() {
    const ngoForm = document.getElementById('ngo-form');
    if (ngoForm) {
        ngoForm.addEventListener('submit', handleNGOSubmit);
    }
    
    const opportunityForm = document.getElementById('opportunity-form');
    if (opportunityForm) {
        opportunityForm.addEventListener('submit', handleOpportunitySubmit);
    }
}

async function handleNGOSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('ngo-name').value,
        email: document.getElementById('ngo-email').value,
        phone: document.getElementById('ngo-phone').value,
        website: document.getElementById('ngo-website').value,
        address: document.getElementById('ngo-address').value,
        description: document.getElementById('ngo-description').value,
        causes: getSelectedCauses()
    };
    
    // Update current user
    currentUser.name = formData.name;
    currentUser.email = formData.email;
    currentUser.type = 'ngo';
    
    try {
        const response = await fetch(`${API_BASE}/ngos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('Organization profile saved successfully!', 'success');
        } else {
            showMessage('Error saving profile. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    }
}

function getSelectedCauses() {
    const checkboxes = document.querySelectorAll('.causes-grid input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

async function handleOpportunitySubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('opp-title').value,
        description: document.getElementById('opp-description').value,
        category: document.getElementById('opp-category').value,
        type: document.getElementById('opp-type').value,
        startDate: document.getElementById('opp-start-date').value,
        time: document.getElementById('opp-time').value,
        location: document.getElementById('opp-location').value,
        volunteersNeeded: document.getElementById('opp-volunteers-needed').value,
        requirements: document.getElementById('opp-requirements').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/opportunities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('Opportunity posted successfully!', 'success');
            document.getElementById('opportunity-form').reset();
            // Refresh the manage opportunities tab if it's active
            if (currentTab === 'manage-opportunities') {
                loadNGOOpportunities();
            }
        } else {
            showMessage('Error posting opportunity. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error. Please check your connection.', 'error');
    }
}

async function loadNGOProfile() {
    try {
        const response = await fetch(`${API_BASE}/ngos/profile`);
        if (response.ok) {
            const profile = await response.json();
            populateNGOForm(profile);
        }
    } catch (error) {
        console.error('Error loading NGO profile:', error);
    }
}

function populateNGOForm(profile) {
    if (!profile) return;
    
    const nameField = document.getElementById('ngo-name');
    const emailField = document.getElementById('ngo-email');
    const phoneField = document.getElementById('ngo-phone');
    const websiteField = document.getElementById('ngo-website');
    const addressField = document.getElementById('ngo-address');
    const descriptionField = document.getElementById('ngo-description');
    
    if (nameField) nameField.value = profile.name || '';
    if (emailField) emailField.value = profile.email || '';
    if (phoneField) phoneField.value = profile.phone || '';
    if (websiteField) websiteField.value = profile.website || '';
    if (addressField) addressField.value = profile.address || '';
    if (descriptionField) descriptionField.value = profile.description || '';
    
    // Set causes checkboxes
    if (profile.causes) {
        profile.causes.forEach(cause => {
            const checkbox = document.querySelector(`.causes-grid input[value="${cause}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Opportunities Functions
function initializeOpportunitiesPage() {
    loadAllOpportunities();
    setupFilters();
}

async function loadAllOpportunities() {
    try {
        showLoading('all-opportunities');
        const response = await fetch(`${API_BASE}/opportunities`);
        if (response.ok) {
            allOpportunities = await response.json();
            displayOpportunities(allOpportunities);
            updateResultsCount(allOpportunities.length);
        } else {
            showMessage('Error loading opportunities', 'error');
        }
    } catch (error) {
        console.error('Error loading opportunities:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadOpportunities() {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    try {
        showLoading('search-results');
        const response = await fetch(`${API_BASE}/opportunities`);
        if (response.ok) {
            const opportunities = await response.json();
            displayOpportunities(opportunities, 'search-results');
        }
    } catch (error) {
        console.error('Error loading opportunities:', error);
    }
}

function displayOpportunities(opportunities, containerId = 'all-opportunities') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (opportunities.length === 0) {
        container.innerHTML = '<p class="no-results">No opportunities found matching your criteria.</p>';
        return;
    }
    
    container.innerHTML = opportunities.map(opp => createOpportunityCard(opp)).join('');
}

function createOpportunityCard(opportunity) {
    const formattedDate = new Date(opportunity.startDate).toLocaleDateString();
    
    return `
        <div class="opportunity-card">
            <h3>${opportunity.title}</h3>
            <div class="opportunity-meta">
                <span class="meta-item">${opportunity.category}</span>
                <span class="meta-item">${opportunity.location}</span>
                <span class="meta-item">${formattedDate}</span>
                <span class="meta-item">${opportunity.type}</span>
            </div>
            <p class="opportunity-description">${opportunity.description}</p>
            <div class="opportunity-footer">
                <div class="opportunity-stats">
                    <p><strong>Volunteers needed:</strong> ${opportunity.volunteersNeeded}</p>
                    <p><strong>Applied:</strong> ${opportunity.volunteersApplied || 0}</p>
                </div>
                <button class="btn btn-primary" onclick="applyToOpportunity('${opportunity._id}', '${opportunity.title}')">
                    Apply Now
                </button>
            </div>
        </div>
    `;
}

// UPDATED APPLICATION FUNCTION - NOW WORKS PROPERLY
async function applyToOpportunity(opportunityId, opportunityTitle) {
    // Check if user has filled profile
    if (!currentUser.name || !currentUser.email) {
        // Prompt for basic info if profile not complete
        const name = prompt('Please enter your name:');
        const email = prompt('Please enter your email:');
        
        if (!name || !email) {
            showMessage('Name and email are required to apply', 'error');
            return;
        }
        
        currentUser.name = name;
        currentUser.email = email;
    }
    
    const message = prompt('Optional: Add a message with your application:');
    
    try {
        const response = await fetch(`${API_BASE}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                opportunityId,
                volunteerName: currentUser.name,
                volunteerEmail: currentUser.email,
                message: message || 'No message provided'
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Application submitted successfully!', 'success');
            // Refresh opportunities to show updated application count
            if (window.location.pathname.includes('opportunities.html')) {
                loadAllOpportunities();
            } else {
                loadOpportunities();
            }
        } else {
            showMessage(result.error || 'Error submitting application', 'error');
        }
    } catch (error) {
        console.error('Error applying:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Search and Filter Functions
function setupFilters() {
    const sortSelect = document.getElementById('sort-options');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
}

async function searchOpportunities() {
    const keyword = document.getElementById('search-keyword').value;
    const category = document.getElementById('filter-category').value;
    const location = document.getElementById('filter-location').value;
    
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    
    try {
        const response = await fetch(`${API_BASE}/opportunities/search?${params}`);
        if (response.ok) {
            const opportunities = await response.json();
            displayOpportunities(opportunities, 'search-results');
        }
    } catch (error) {
        console.error('Error searching opportunities:', error);
    }
}

function filterAllOpportunities() {
    const keyword = document.getElementById('global-search').value.toLowerCase();
    const category = document.getElementById('global-category').value;
    const location = document.getElementById('global-location').value;
    const type = document.getElementById('global-type').value;
    
    let filtered = allOpportunities.filter(opp => {
        const matchesKeyword = !keyword || 
            opp.title.toLowerCase().includes(keyword) ||
            opp.description.toLowerCase().includes(keyword);
        const matchesCategory = !category || opp.category === category;
        const matchesLocation = !location || opp.location.toLowerCase().includes(location);
        const matchesType = !type || opp.type === type;
        
        return matchesKeyword && matchesCategory && matchesLocation && matchesType;
    });
    
    displayOpportunities(filtered);
    updateResultsCount(filtered.length);
}

function handleSort() {
    const sortBy = document.getElementById('sort-options').value;
    const container = document.getElementById('all-opportunities');
    const cards = Array.from(container.children);
    
    cards.sort((a, b) => {
        const titleA = a.querySelector('h3').textContent;
        const titleB = b.querySelector('h3').textContent;
        
        switch(sortBy) {
            case 'title':
                return titleA.localeCompare(titleB);
            case 'date':
                // Implement date sorting logic
                return 0;
            case 'location':
                // Implement location sorting logic
                return 0;
            default:
                return 0;
        }
    });
    
    container.innerHTML = '';
    cards.forEach(card => container.appendChild(card));
}

// View Management
function setView(viewType) {
    currentView = viewType;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const container = document.getElementById('all-opportunities');
    const mapContainer = document.getElementById('map-container');
    
    switch(viewType) {
        case 'grid':
            container.className = 'opportunities-container grid-view';
            container.style.display = 'grid';
            if (mapContainer) mapContainer.style.display = 'none';
            break;
        case 'list':
            container.className = 'opportunities-container list-view';
            container.style.display = 'block';
            if (mapContainer) mapContainer.style.display = 'none';
            break;
        case 'map':
            container.style.display = 'none';
            if (mapContainer) mapContainer.style.display = 'block';
            break;
    }
}

// Applications Management - UPDATED WITH REAL FUNCTIONALITY
async function loadApplications() {
    const container = document.getElementById('applications-list');
    if (!container) return;
    
    try {
        showLoading('applications-list');
        const response = await fetch(`${API_BASE}/applications/my`, {
            headers: {
                'volunteer-email': currentUser.email || 'volunteer@email.com'
            }
        });
        if (response.ok) {
            const applications = await response.json();
            displayApplications(applications);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

function displayApplications(applications) {
    const container = document.getElementById('applications-list');
    if (!applications || applications.length === 0) {
        container.innerHTML = '<p>No applications found.</p>';
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="application-item">
            <div class="application-info">
                <h4>${app.opportunityTitle}</h4>
                <p>Applied on: ${new Date(app.appliedDate).toLocaleDateString()}</p>
                ${app.message && app.message !== 'No message provided' ? `<p><strong>Message:</strong> ${app.message}</p>` : ''}
                ${app.reviewedDate ? `<p>Reviewed on: ${new Date(app.reviewedDate).toLocaleDateString()}</p>` : ''}
            </div>
            <span class="application-status status-${app.status}">${app.status}</span>
        </div>
    `).join('');
}

// NGO Applications Management - UPDATED
async function loadNGOApplications() {
    const container = document.getElementById('ngo-applications');
    if (!container) return;
    
    try {
        showLoading('ngo-applications');
        const response = await fetch(`${API_BASE}/applications/ngo`, {
            headers: {
                'ngo-id': '507f1f77bcf86cd799439011' // Mock NGO ID
            }
        });
        if (response.ok) {
            const applications = await response.json();
            console.log('Loaded applications:', applications); // Debug log
            displayNGOApplications(applications);
            updateApplicationStats(applications);
        } else {
            console.error('Error response:', response.status);
            showMessage('Error loading applications', 'error');
        }
    } catch (error) {
        console.error('Error loading NGO applications:', error);
        showMessage('Network error loading applications', 'error');
    }
}

// Add this new function to update stats
function updateApplicationStats(applications) {
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    const pendingElement = document.getElementById('pending-count');
    const approvedElement = document.getElementById('approved-count');
    const rejectedElement = document.getElementById('rejected-count');
    
    if (pendingElement) pendingElement.textContent = pending;
    if (approvedElement) approvedElement.textContent = approved;
    if (rejectedElement) rejectedElement.textContent = rejected;
}

function displayNGOApplications(applications) {
    const container = document.getElementById('ngo-applications');
    if (!applications || applications.length === 0) {
        container.innerHTML = '<div class="no-results">No applications received yet.</div>';
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="application-item">
            <div class="application-info">
                <h4>${app.volunteerName || 'Anonymous Volunteer'}</h4>
                <p><strong>Email:</strong> ${app.volunteerEmail || 'No email provided'}</p>
                <p><strong>Opportunity:</strong> ${app.opportunityTitle || 'Unknown Opportunity'}</p>
                <p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
                ${app.message && app.message !== 'No message provided' ? `<p><strong>Message:</strong> ${app.message}</p>` : ''}
                <p><strong>Status:</strong> <span class="status-${app.status}">${app.status}</span></p>
                ${app.reviewedDate ? `<p><strong>Reviewed:</strong> ${new Date(app.reviewedDate).toLocaleDateString()}</p>` : ''}
            </div>
            <div class="application-actions">
                ${app.status === 'pending' ? `
                    <button class="btn btn-success" onclick="updateApplicationStatus('${app._id}', 'approved')">
                        Accept
                    </button>
                    <button class="btn btn-danger" onclick="updateApplicationStatus('${app._id}', 'rejected')">
                        Reject
                    </button>
                ` : `
                    <span class="status-badge status-${app.status}">${app.status}</span>
                    ${app.reviewedDate ? `<small>Reviewed: ${new Date(app.reviewedDate).toLocaleDateString()}</small>` : ''}
                `}
            </div>
        </div>
    `).join('');
}

// NEW FUNCTION: Accept/Reject Applications
async function updateApplicationStatus(applicationId, status) {
    try {
        const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                status,
                reviewedBy: currentUser.name || 'NGO Admin'
            })
        });
        
        if (response.ok) {
            showMessage(`Application ${status} successfully!`, 'success');
            loadNGOApplications(); // Refresh the applications list
        } else {
            showMessage('Error updating application', 'error');
        }
    } catch (error) {
        console.error('Error updating application:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Filter and Search Applications
function filterApplications() {
    const filter = document.getElementById('application-filter').value;
    loadNGOApplications(); // Reload and filter on backend in future
}

function searchApplications() {
    const searchTerm = document.getElementById('applications-search').value;
    // Implement search functionality
    loadNGOApplications();
}

// NGO Opportunities Management
async function loadNGOOpportunities() {
    const container = document.getElementById('ngo-opportunities');
    if (!container) return;
    
    try {
        showLoading('ngo-opportunities');
        const response = await fetch(`${API_BASE}/opportunities/my`);
        if (response.ok) {
            const opportunities = await response.json();
            displayNGOOpportunities(opportunities);
            updateOpportunityStats(opportunities);
        }
    } catch (error) {
        console.error('Error loading NGO opportunities:', error);
    }
}

function updateOpportunityStats(opportunities) {
    const total = opportunities.length;
    const active = opportunities.filter(opp => opp.isActive).length;
    
    const totalElement = document.getElementById('total-opportunities');
    const activeElement = document.getElementById('active-opportunities');
    
    if (totalElement) totalElement.textContent = total;
    if (activeElement) activeElement.textContent = active;
}

function displayNGOOpportunities(opportunities) {
    const container = document.getElementById('ngo-opportunities');
    if (!opportunities || opportunities.length === 0) {
        container.innerHTML = '<p>No opportunities posted yet.</p>';
        return;
    }
    
    container.innerHTML = opportunities.map(opp => `
        <div class="opportunity-card">
            <h3>${opp.title}</h3>
            <div class="opportunity-meta">
                <span class="meta-item">${opp.category}</span>
                <span class="meta-item">${opp.location}</span>
                <span class="meta-item">${new Date(opp.startDate).toLocaleDateString()}</span>
            </div>
            <p class="opportunity-description">${opp.description}</p>
            <div class="opportunity-stats">
                <p><strong>Volunteers needed:</strong> ${opp.volunteersNeeded}</p>
                <p><strong>Applications received:</strong> ${opp.volunteersApplied || 0}</p>
                <p><strong>Status:</strong> ${opp.isActive ? 'Active' : 'Inactive'}</p>
            </div>
            <div class="opportunity-actions">
                <button class="btn btn-secondary" onclick="editOpportunity('${opp._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteOpportunity('${opp._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Volunteers Management
async function loadVolunteers() {
    const container = document.getElementById('volunteers-list');
    if (!container) return;
    
    try {
        showLoading('volunteers-list');
        const response = await fetch(`${API_BASE}/volunteers`);
        if (response.ok) {
            allVolunteers = await response.json();
            displayVolunteers(allVolunteers);
        }
    } catch (error) {
        console.error('Error loading volunteers:', error);
    }
}

function displayVolunteers(volunteers) {
    const container = document.getElementById('volunteers-list');
    if (!volunteers || volunteers.length === 0) {
        container.innerHTML = '<p>No volunteers found.</p>';
        return;
    }
    
    container.innerHTML = volunteers.map(volunteer => `
        <div class="volunteer-card">
            <div class="volunteer-avatar">
                ${volunteer.name.charAt(0).toUpperCase()}
            </div>
            <h3>${volunteer.name}</h3>
            <p><strong>Location:</strong> ${volunteer.location || 'Not specified'}</p>
            <p><strong>Availability:</strong> ${volunteer.availability || 'Not specified'}</p>
            <div class="volunteer-skills">
                ${volunteer.skills && volunteer.skills.length > 0 ? volunteer.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : '<span class="skill-tag">No skills listed</span>'}
            </div>
            <button class="btn btn-primary" onclick="contactVolunteer('${volunteer._id}')">
                Contact
            </button>
        </div>
    `).join('');
}

async function searchVolunteers() {
    const keyword = document.getElementById('volunteer-search').value.toLowerCase();
    const skillFilter = document.getElementById('skill-filter').value;
    
    let filtered = allVolunteers.filter(volunteer => {
        const matchesKeyword = !keyword || 
            volunteer.name.toLowerCase().includes(keyword) ||
            (volunteer.location && volunteer.location.toLowerCase().includes(keyword)) ||
            (volunteer.skills && volunteer.skills.some(skill => skill.toLowerCase().includes(keyword)));
        
        const matchesSkill = !skillFilter || 
            (volunteer.skills && volunteer.skills.includes(skillFilter));
        
        return matchesKeyword && matchesSkill;
    });
    
    displayVolunteers(filtered);
}

function contactVolunteer(volunteerId) {
    showMessage('Contact feature coming soon!', 'info');
}

// Utility Functions
function editOpportunity(opportunityId) {
    showMessage('Edit feature coming soon!', 'info');
}

async function deleteOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/opportunities/${opportunityId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Opportunity deleted successfully!', 'success');
            loadNGOOpportunities();
        } else {
            showMessage('Error deleting opportunity', 'error');
        }
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Pagination
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(allOpportunities.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updatePagination();
        // Implement pagination logic here
    }
}

function updatePagination() {
    const pageInfo = document.getElementById('page-info');
    const totalPages = Math.ceil(allOpportunities.length / itemsPerPage);
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

// Stats Loading
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatsDisplay(stats) {
    const elements = {
        'volunteer-count': stats.volunteers || 15420,
        'ngo-count': stats.ngos || 850,
        'opportunity-count': stats.opportunities || 3240,
        'hours-count': stats.hours || 89350
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString();
        }
    });
}

// Utility Functions
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    }
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the main content
    const main = document.querySelector('.container') || document.body;
    main.insertBefore(messageDiv, main.firstChild);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function updateResultsCount(count) {
    const element = document.getElementById('results-count');
    if (element) {
        element.textContent = count;
    }
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showMessage('An unexpected error occurred. Please refresh the page.', 'error');
});

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
