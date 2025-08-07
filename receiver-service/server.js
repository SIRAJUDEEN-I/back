const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/formdatadb')
.then(() => {
    console.log('📦 Connected to MongoDB successfully');
})
.catch(err => {
    console.log('❌ MongoDB connection failed:', err);
});

// MongoDB Schema for form data
const FormDataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    processedAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

const FormData = mongoose.model('FormData', FormDataSchema);

// POST /api/postdata/db - Store data in MongoDB (CREATE action)
app.post('/api/postdata/db', async (req, res) => {
    try {
        const { name, mobile, dob, age, action, processedAt } = req.body;
        
        console.log('📥 CREATE: Received data for MongoDB storage:', req.body);
        
        // Validate required fields
        if (!name || !mobile || !dob || age === undefined || !action) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, mobile, dob, age, action) are required'
            });
        }
        
        // Create and save new form data to MongoDB
        const formData = new FormData({
            name: name.trim(),
            mobile: mobile.trim(),
            dob: dob,
            age: parseInt(age),
            action: action.trim(),
            processedAt: processedAt ? new Date(processedAt) : new Date()
        });
        
        const savedData = await formData.save();
        
        console.log('✅ Data CREATED in MongoDB successfully');
        
        res.status(201).json({
            success: true,
            message: 'Data created in MongoDB successfully',
            action: 'CREATE',
            data: {
                id: savedData._id,
                name: savedData.name,
                mobile: savedData.mobile,
                dob: savedData.dob,
                age: savedData.age,
                action: savedData.action,
                processedAt: savedData.processedAt,
                createdAt: savedData.createdAt,
                updatedAt: savedData.updatedAt
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating data in MongoDB:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to create data in MongoDB',
            error: error.message
        });
    }
});

// PUT /api/postdata/db - Update data in MongoDB (UPDATE action)
app.put('/api/postdata/db', async (req, res) => {
    try {
        const { name, mobile, dob, age, action, processedAt } = req.body;
        
        console.log('📥 UPDATE: Received data for MongoDB update:', req.body);
        
        // Validate required fields
        if (!name || !mobile || !dob || age === undefined || !action) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, mobile, dob, age, action) are required for update'
            });
        }
        
        // Find existing record by mobile number (assuming mobile is unique identifier)
        let existingData = await FormData.findOne({ mobile: mobile.trim() });
        
        if (!existingData) {
            // If not found, create new record
            const formData = new FormData({
                name: name.trim(),
                mobile: mobile.trim(),
                dob: dob,
                age: parseInt(age),
                action: action.trim(),
                processedAt: processedAt ? new Date(processedAt) : new Date()
            });
            
            const savedData = await formData.save();
            
            console.log('✅ Data CREATED (not found for update) in MongoDB successfully');
            
            return res.status(201).json({
                success: true,
                message: 'Data created (record not found for update) in MongoDB successfully',
                action: 'CREATE (from UPDATE)',
                data: {
                    id: savedData._id,
                    name: savedData.name,
                    mobile: savedData.mobile,
                    dob: savedData.dob,
                    age: savedData.age,
                    action: savedData.action,
                    processedAt: savedData.processedAt,
                    createdAt: savedData.createdAt,
                    updatedAt: savedData.updatedAt
                }
            });
        }
        
        // Update existing record
        existingData.name = name.trim();
        existingData.dob = dob;
        existingData.age = parseInt(age);
        existingData.action = action.trim();
        existingData.processedAt = processedAt ? new Date(processedAt) : new Date();
        
        const updatedData = await existingData.save();
        
        console.log('✅ Data UPDATED in MongoDB successfully');
        
        res.status(200).json({
            success: true,
            message: 'Data updated in MongoDB successfully',
            action: 'UPDATE',
            data: {
                id: updatedData._id,
                name: updatedData.name,
                mobile: updatedData.mobile,
                dob: updatedData.dob,
                age: updatedData.age,
                action: updatedData.action,
                processedAt: updatedData.processedAt,
                createdAt: updatedData.createdAt,
                updatedAt: updatedData.updatedAt
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating data in MongoDB:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to update data in MongoDB',
            error: error.message
        });
    }
});

// DELETE /api/postdata/db - Delete data from MongoDB (DELETE action)
app.delete('/api/postdata/db', async (req, res) => {
    try {
        const { mobile, action } = req.body;
        
        console.log('📥 DELETE: Received request to delete data:', req.body);
        
        // Validate required fields for delete
        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required for delete operation'
            });
        }
        
        // Find and delete the record by mobile number
        const deletedData = await FormData.findOneAndDelete({ mobile: mobile.trim() });
        
        if (!deletedData) {
            return res.status(404).json({
                success: false,
                message: 'Record not found for deletion',
                mobile: mobile.trim()
            });
        }
        
        console.log('✅ Data DELETED from MongoDB successfully');
        
        res.status(200).json({
            success: true,
            message: 'Data deleted from MongoDB successfully',
            action: 'DELETE',
            deletedData: {
                id: deletedData._id,
                name: deletedData.name,
                mobile: deletedData.mobile,
                dob: deletedData.dob,
                age: deletedData.age,
                action: deletedData.action,
                processedAt: deletedData.processedAt,
                createdAt: deletedData.createdAt,
                updatedAt: deletedData.updatedAt
            }
        });
        
    } catch (error) {
        console.error('❌ Error deleting data from MongoDB:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete data from MongoDB',
            error: error.message
        });
    }
});

// GET /api/getdata/db - Get all data from MongoDB
app.get('/api/getdata/db', async (req, res) => {
    try {
        console.log('📊 Fetching all data from MongoDB...');
        
        // Get all data sorted by newest first
        const allData = await FormData.find().sort({ createdAt: -1 });
        
        console.log(`� Sending ${allData.length} records from MongoDB`);
        
        res.json({
            success: true,
            count: allData.length,
            data: allData,
            retrievedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching data from MongoDB:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch data from MongoDB',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check MongoDB connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        const recordCount = await FormData.countDocuments();
        
        res.json({
            status: 'OK',
            service: 'Receiver Service with MongoDB',
            port: PORT,
            database: {
                status: dbStatus,
                name: 'formdatadb',
                totalRecords: recordCount
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            service: 'Receiver Service with MongoDB',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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
            postData: 'POST /api/postdata/db - Store data in MongoDB',
            getData: 'GET /api/getdata/db - Get all data from MongoDB',
            health: 'GET /health - Health check'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🍃'.repeat(20));
    console.log('📡 RECEIVER SERVICE WITH MONGODB STARTED');
    console.log('🍃'.repeat(20));
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`� Database: MongoDB (formdatadb)`);
    console.log('📋 Available endpoints:');
    console.log('   POST /api/postdata/db - Store data in MongoDB');
    console.log('   GET  /api/getdata/db  - Get all data from MongoDB'); 
    console.log('   GET  /health          - Health check');
    console.log('🍃'.repeat(20));
});
