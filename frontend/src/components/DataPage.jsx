import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name.trim());
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6789]\d{9}$/;
    return mobileRegex.test(mobile.trim());
  };

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:4000/api/getdata');
      console.log('Fetched data:', response.data);
      
      if (response.data.success && response.data.data) {
        setData(response.data.data.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingId(record._id);
    setEditFormData({
      name: record.name,
      mobile: record.mobile,
      dob: record.dob
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  // Handle input change in edit mode
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    // Validate data
    if (!validateName(editFormData.name)) {
      alert('Name should contain only letters and spaces');
      return;
    }
    
    if (!validateMobile(editFormData.mobile)) {
      alert('Mobile number should be 10 digits starting with 6, 7, 8, or 9');
      return;
    }
    
    if (!editFormData.dob) {
      alert('Date of birth is required');
      return;
    }

    try {
      const dataToSend = {
        name: editFormData.name.trim(),
        mobile: editFormData.mobile.trim(),
        dob: editFormData.dob,
        action: 'update'
      };

      console.log('Updating data:', dataToSend);

      const response = await axios.post('http://localhost:4000/api/post', dataToSend);
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        alert('✅ Record updated successfully!');
        setEditingId(null);
        setEditFormData({});
        // Refresh data
        fetchData();
      } else {
        alert('❌ Failed to update record');
      }
    } catch (err) {
      console.error('Error updating data:', err);
      alert(`❌ Error updating record: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle delete
  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${record.name}?`)) {
      return;
    }

    try {
      const dataToSend = {
        name: record.name,
        mobile: record.mobile,
        dob: record.dob,
        action: 'delete'
      };

      console.log('Deleting data:', dataToSend);

      const response = await axios.post('http://localhost:4000/api/post', dataToSend);
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        alert('✅ Record deleted successfully!');
        // Refresh data
        fetchData();
      } else {
        alert('❌ Failed to delete record');
      }
    } catch (err) {
      console.error('Error deleting data:', err);
      alert(`❌ Error deleting record: ${err.response?.data?.message || err.message}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="data-page">
      <div className="data-container">
        <div className="data-header">
          <h2>📊 All Records</h2>
          <button 
            onClick={fetchData} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <p>🔄 Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="no-data">
            <p>📭 No records found. <a href="/">Add some records</a> to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>👤 Name</th>
                  <th>📱 Mobile</th>
                  <th>🎂 Date of Birth</th>
                  <th>🎂 Age</th>
                  <th>📅 Created</th>
                  <th>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record) => (
                  <tr key={record._id}>
                    <td>
                      {editingId === record._id ? (
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name || ''}
                          onChange={handleEditInputChange}
                          className="edit-input"
                        />
                      ) : (
                        record.name
                      )}
                    </td>
                    <td>
                      {editingId === record._id ? (
                        <input
                          type="tel"
                          name="mobile"
                          value={editFormData.mobile || ''}
                          onChange={handleEditInputChange}
                          className="edit-input"
                          maxLength="10"
                        />
                      ) : (
                        record.mobile
                      )}
                    </td>
                    <td>
                      {editingId === record._id ? (
                        <input
                          type="date"
                          name="dob"
                          value={editFormData.dob || ''}
                          onChange={handleEditInputChange}
                          className="edit-input"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      ) : (
                        formatDate(record.dob)
                      )}
                    </td>
                    <td>{record.age}</td>
                    <td>{formatDate(record.createdAt)}</td>
                    <td className="actions">
                      {editingId === record._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit()}
                            className="save-button"
                            title="Save changes"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="cancel-button"
                            title="Cancel edit"
                          >
                            ❌ Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(record)}
                            className="edit-button"
                            title="Edit record"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            className="delete-button"
                            title="Delete record"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPage;
