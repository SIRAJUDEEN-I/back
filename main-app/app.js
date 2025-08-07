const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 4000;
const RECEIVER_SERVICE_URL = 'http://localhost:5000';

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Function to calculate age from date of birth
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Validation function for name (only letters A-Z, a-z)
function validateName(name) {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
}

// Validation function for mobile number (10 digits starting with 6, 7, 8, or 9)
function validateMobile(mobile) {
    const mobileRegex = /^[6789]\d{9}$/;
    return mobileRegex.test(mobile);
}

// POST endpoint at /api/post - receives form data and sends to receiver service
app.post('/api/post', async (req, res) => {
    try {
        const { name, mobile, dob, action } = req.body;
        
        console.log('📝 Received form data:', req.body);
        
        // Validation - check if all fields are present
        if (!name || !mobile || !dob || !action) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, mobile, dob, action) are required'
            });
        }
        
        // Validate name (only letters A-Z, a-z and spaces)
        if (!validateName(name)) {
            return res.status(400).json({
                success: false,
                message: 'Name should contain only letters (a-zA-Z) and spaces'
            });
        }
        
        // Validate mobile number (10 digits starting with 6, 7, 8, or 9)
        if (!validateMobile(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number should be 10 digits starting with 6, 7, 8, or 9'
            });
        }
        
        // Validate and convert DOB to age
        let age;
        try {
            age = calculateAge(dob);
            if (age < 0 || age > 150) {
                throw new Error('Invalid age calculated');
            }
        } catch (dobError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date of birth format or unrealistic age'
            });
        }
        
        // Validate action field
        const validActions = ['create', 'update', 'delete'];
        if (!validActions.includes(action.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be create, update, or delete.'
            });
        }

        // Prepare processed data to send to receiver service
        const processedData = {
            name: name.trim(),
            mobile: mobile.trim(),
            dob: dob,
            age: age,
            action: action.toLowerCase().trim(),
            processedAt: new Date().toISOString()
        };
        
        console.log('✅ Data processed successfully:', processedData);
        
        // Determine HTTP method based on action
        let httpMethod;
        let httpMethodName;
        
        switch (action.toLowerCase()) {
            case 'create':
                httpMethod = axios.post;
                httpMethodName = 'POST';
                break;
            case 'update':
                httpMethod = axios.put;
                httpMethodName = 'PUT';
                break;
            case 'delete':
                httpMethod = axios.delete;
                httpMethodName = 'DELETE';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action specified'
                });
        }
        
        console.log(`🚀 Sending ${httpMethodName} request to receiver service...`);
        
        // Send data to receiver service with appropriate HTTP method
        try {
            const response = await httpMethod(`${RECEIVER_SERVICE_URL}/api/postdata/db`, processedData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            
            console.log('📤 Data processed by receiver service with', httpMethodName, ':', response.data);
            
            res.status(200).json({
                success: true,
                message: `Form data validated, processed, and ${action.toUpperCase()} action completed successfully in MongoDB`,
                httpMethod: httpMethodName,
                processedData: processedData,
                mongoResponse: response.data
            });
            
        } catch (forwardError) {
            console.error('❌ Error sending to receiver service:', forwardError.message);
            
            res.status(502).json({
                success: false,
                message: `Data processed successfully but failed to send ${httpMethodName} request to MongoDB receiver service`,
                error: forwardError.message,
                processedData: processedData
            });
        }
        
    } catch (error) {
        console.error('❌ Error processing form data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while processing form data',
            error: error.message
        });
    }
});

// GET endpoint at /api/getdata - requests data from receiver service
app.get('/api/getdata', async (req, res) => {
    try {
        console.log('📥 Requesting data from receiver service...');
        
        // Request data from receiver service
        const response = await axios.get(`${RECEIVER_SERVICE_URL}/api/getdata/db`, {
            timeout: 10000 // 10 second timeout
        });
        
        console.log('📊 Data retrieved from MongoDB via receiver service:', response.data.count, 'records');
        
        // Send the data as response
        res.status(200).json({
            success: true,
            message: 'Data retrieved successfully from MongoDB via receiver service',
            timestamp: new Date().toISOString(),
            data: response.data
        });
        
    } catch (error) {
        console.error('❌ Error retrieving data from MongoDB receiver service:', error.message);
        
        res.status(502).json({
            success: false,
            message: 'Failed to retrieve data from MongoDB receiver service',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Main App',
        port: PORT,
        message: 'Main Express app is running successfully',
        timestamp: new Date().toISOString(),
        endpoints: {
            post: 'POST /api/post - Submit form data',
            getData: 'GET /api/getdata - Retrieve all data from receiver service',
            health: 'GET /health - Health check'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: {
            post: 'POST /api/post',
            getData: 'GET /api/getdata',
            health: 'GET /health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀'.repeat(20));
    console.log('🎯 MAIN APP STARTED SUCCESSFULLY');
    console.log('🚀'.repeat(20));
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   POST /api/post     - Submit form data');
    console.log('   GET  /api/getdata  - Retrieve data from receiver');
    console.log('   GET  /health       - Health check');
    console.log('🔗 Receiver service: ' + RECEIVER_SERVICE_URL);
    console.log('🚀'.repeat(20));
});
