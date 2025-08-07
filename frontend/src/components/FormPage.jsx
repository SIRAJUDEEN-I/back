import React, { useState } from 'react';
import axios from 'axios';

const FormPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    dob: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name.trim());
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6789]\d{9}$/;
    return mobileRegex.test(mobile.trim());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Name should contain only letters and spaces';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Mobile number should be 10 digits starting with 6, 7, 8, or 9';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate >= today) {
        newErrors.dob = 'Date of birth should be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const dataToSend = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        dob: formData.dob,
        action: 'create'
      };

      console.log('Sending data:', dataToSend);

      const response = await axios.post('http://localhost:4000/api/post', dataToSend);
      
      console.log('Response:', response.data);
      
      setMessage({
        type: 'success',
        text: `✅ Data submitted successfully! Age calculated: ${response.data.processedData?.age || 'N/A'} years`
      });
      
      // Reset form
      setFormData({
        name: '',
        mobile: '',
        dob: ''
      });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit data';
      setMessage({
        type: 'error',
        text: `❌ Error: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>📝 Add New Record</h2>
        <p className="form-description">
          Fill in the details below to add a new record to the system
        </p>

        <form onSubmit={handleSubmit} className="data-form">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              👤 Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name (letters and spaces only)"
              disabled={isLoading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Mobile Field */}
          <div className="form-group">
            <label htmlFor="mobile" className="form-label">
              📱 Mobile Number *
            </label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              className={`form-input ${errors.mobile ? 'error' : ''}`}
              placeholder="Enter 10-digit mobile number (6,7,8,9 + 9 digits)"
              maxLength="10"
              disabled={isLoading}
            />
            {errors.mobile && <span className="error-message">{errors.mobile}</span>}
          </div>

          {/* Date of Birth Field */}
          <div className="form-group">
            <label htmlFor="dob" className="form-label">
              🎂 Date of Birth *
            </label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              className={`form-input ${errors.dob ? 'error' : ''}`}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              disabled={isLoading}
            />
            {errors.dob && <span className="error-message">{errors.dob}</span>}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Submitting...' : '🚀 Submit Data'}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormPage;
