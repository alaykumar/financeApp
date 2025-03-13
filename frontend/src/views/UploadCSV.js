import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { jwtDecode } from 'jwt-decode';

function UploadCSV() {
  // State variables for file, selected bank, CSV data, categories, and response message
  const [file, setFile] = useState(null);
  const [cardOrg, setCardOrg] = useState('');
  const [cardType, setCardType] = useState('')
  const [customCardType, setCustomeCardType] = useState('')
  const [csvData, setCsvData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [res, setRes] = useState('');
  const api = useAxios();

  // Retrieve authentication token from local storage
  const token = localStorage.getItem('authTokens');
  let user_id;
  if (token) {
    // Decode JWT token to extract user ID
    const decode = jwtDecode(token);
    user_id = decode.user_id;
  }

  // Function to fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await api.get('/dataUpload/categories_list/');
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error('Invalid categories response format:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle file input change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle bank selection change
  const handleBankChange = (event) => {
    setCardOrg(event.target.value);
  };

  // Upload the selected CSV file
  const handleUpload = async () => {
    if (!file || !cardOrg) {
      setRes('Please select a bank and upload a file.');
      return;
    }

    const selectedCardType = cardType === "Other" ? customCardType : cardType;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cardOrg', cardOrg);
    formData.append('cardType', selectedCardType);

    try {
      const response = await api.post('dataUpload/upload-csv-preview/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Store preview data received from backend
      setCsvData(response.data.preview || []);
      setRes('');
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setRes(error.response?.data?.error || 'Error uploading file.');
      setCsvData([]);
    }
  };

  // Handle updates to CSV data (category selection)
  const handleDataChange = (index, key, value) => {
    const updatedData = [...csvData];
    updatedData[index] = {
      ...updatedData[index],
      [key]: value,
      customCategory: key === 'category' && value === 'Other' ? '' : undefined,
    };
    setCsvData(updatedData);
  };

  // Save categorized transactions to backend
  const handleSave = async () => {
    // Remove unnecessary fields before saving
    const cleanedData = csvData.map(({ suggestedCategory, allCategories, ...rest }) => rest);

    console.log('Cleaned data being sent to backend (formatted):', JSON.stringify(cleanedData, null, 2));

    try {
      const response = await api.post('dataUpload/save-statements/', { 
        data: cleanedData,
        cardOrg,
        cardType 
      });
      setRes(response.data.message || 'Statements saved successfully!');
      setCsvData([]);
    } catch (error) {
      console.error('Error saving data:', error);
      setRes('Failed to save data.');
    }
  };

  return (
    <div>
      <div className="container-fluid" style={{ paddingTop: '75px' }}>
        <div className="row">
          <main role="main" className="col-md-9 col-lg-10 container text-center"> 
            <h1 className="h2">Upload CSV</h1>
            {res && <div className="alert alert-success"><strong>{res}</strong></div>}

            {/* Select bank and upload file */}
            <label htmlFor="cardOrg">Card Organization</label>
            <input
              id="cardOrg"
              type="text"
              placeholder="Enter Bank or Card Org"
              value={cardOrg}
              onChange={(e) => setCardOrg(e.target.value)}
            />

            {/* Card Type Dropdown and Input */}
            <label htmlFor='cardType'>Card Type: </label>
            <select
              id="cardType"
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
            >
              <option value="">--Select Card Type--</option>
              <option value="Visa">Visa</option>
              <option value="MasterCard">MasterCard</option>
              <option value="Other">Other</option>
            </select>

            {cardType === "Other" && (
              <input
                type='text'
                placeholder='Entter Card Type'
                value={customCardType}
                onChange={(e) => setCustomeCardType(e.target.value)}
              />
            )}
           
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <button className="btn btn-primary" onClick={handleUpload}>Upload</button>

            {/* Display uploaded CSV data for review */}
            {csvData.length > 0 && (
              <div>
                <h2>Review and Categorize</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Transaction Date</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.vendorName || 'N/A'}</td>
                        <td>{item.transactionDate || 'N/A'}</td>
                        <td>{item.debit || '0.00'}</td>
                        <td>{item.credit || '0.00'}</td>
                        <td>
                          <select
                            value={item.category || ''}
                            onChange={(e) => handleDataChange(index, 'category', e.target.value)}
                          >
                            <option value="">{item.suggestedCategory || '--Select--'}</option>

                            {/* Sort categories alphabetically by name */}
                            {categories
                              .sort((a, b) => a.name.localeCompare(b.name)) // Sorting alphabetically
                              .map((cat, i) => (
                                <option key={cat.id || `category-${i}`} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}

                            <option value="Other">Other</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-success" onClick={handleSave}>Save Statement</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default UploadCSV;



