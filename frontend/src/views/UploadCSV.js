import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { jwtDecode } from 'jwt-decode';

function UploadCSV() {
  const [file, setFile] = useState(null);
  const [cardOrg, setCardOrg] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [res, setRes] = useState('');
  const api = useAxios();

  const token = localStorage.getItem('authTokens');
  let user_id;
  if (token) {
    const decode = jwtDecode(token);
    user_id = decode.user_id;
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/dataUpload/categories/');
      const uniqueCategories = response.data.filter(cat => cat && cat.name); // Ensure valid data
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleBankChange = (event) => {
    setCardOrg(event.target.value);
  };

  const handleUpload = async () => {
    if (!file || !cardOrg) {
      setRes('Please select a bank and upload a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('cardOrg', cardOrg);

    try {
      const response = await api.post('dataUpload/upload-csv-preview/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCsvData(response.data.preview || []); // Handle no preview case
      setRes('');
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setRes(error.response?.data?.error || 'Error uploading file.');
      setCsvData([]);
    }
  };

  //const handleDataChange = (index, key, value) => {
  //  const updatedData = [...csvData];
  //  updatedData[index][key] = value;
  //  setCsvData(updatedData);
  //};

  const handleDataChange = (index, key, value) => {
    // Log the current state for debugging
    console.log('Before Update:', csvData);
  
    // Create a new array by copying csvData
    const updatedData = [...csvData];
  
    // Update the specific item in the array
    updatedData[index] = {
      ...updatedData[index], // Keep all other fields intact
      [key]: value, // Update the field specified by 'key'
    };
  
    // Update the state
    setCsvData(updatedData);
  
    // Log the updated state for debugging
    console.log('After Update:', updatedData);
  };

  /*
  const handleSave = async () => {
    console.log("Data being sent to backend")
    console.log(csvData)
    try {
      
      //const response = await api.post('dataUpload/save-statements/', { data: csvData });
      const response = await api.post('dataUpload/save-statements/', { data: csvData });
      
      setRes(response.data.message || 'Statements saved successfully!');
      setCsvData([]);
    } catch (error) {
      console.error('Error saving data:', error);
      setRes('Failed to save data.');
    }
  };*/

  /*
  const handleSave = async () => {
    console.log("Data being sent to backend (formatted):");
    console.log(JSON.stringify(csvData, null, 2)); // Print data in a readable JSON format
    
    try {
      const response = await api.post('dataUpload/save-statements/', { data: csvData });
      setRes(response.data.message || 'Statements saved successfully!');
      setCsvData([]);
    } catch (error) {
      console.error('Error saving data:', error);
      setRes('Failed to save data.');
    }
  };*/

  const handleSave = async () => {
    // Remove `suggestedCategory` and `category` fields from the payload
    const cleanedData = csvData.map(({ suggestedCategory, allCategories, ...rest }) => rest);
  
    console.log("Cleaned data being sent to backend (formatted):");
    console.log(JSON.stringify(cleanedData, null, 2)); // Print cleaned data in readable JSON format
    
    try {
      const response = await api.post('dataUpload/save-statements/', { data: cleanedData });
      setRes(response.data.message || 'Statements saved successfully!');
      setCsvData([]);
    } catch (error) {
      console.error('Error saving data:', error);
      setRes('Failed to save data.');
    }
  };
  
  

  return (
    <div>
      <div className="container-fluid" style={{ paddingTop: '100px' }}>
        <div className="row">
          <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
            <h1 className="h2">Upload CSV</h1>
            {res && <div className="alert alert-success"><strong>{res}</strong></div>}

            <label htmlFor="cardOrg">Select Bank: </label>
            <select id="cardOrg" value={cardOrg} onChange={handleBankChange}>
              <option value="">--Select Bank--</option>
              <option value="RBC">RBC</option>
              <option value="TD">TD</option>
              <option value="AMEX">AMEX</option>
            </select>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <button className="btn btn-primary" onClick={handleUpload}>Upload</button>

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
                      <th>Keyword</th>
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
                            onChange={(e) => handleDataChange(index, 'category', e.target.value)}>
                            <option value="">{item.suggestedCategory}</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.keyword || ''}
                            onChange={(e) =>
                              handleDataChange(index, 'keyword', e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-success" onClick={handleSave}>
                  Save Statements
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default UploadCSV;
