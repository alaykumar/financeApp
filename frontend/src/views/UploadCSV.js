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

      setCsvData(response.data.preview || []);
      setRes('');
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setRes(error.response?.data?.error || 'Error uploading file.');
      setCsvData([]);
    }
  };

  const handleDataChange = (index, key, value) => {
    const updatedData = [...csvData];
    updatedData[index] = {
      ...updatedData[index],
      [key]: value,
      customCategory: key === 'category' && value === 'Other' ? '' : undefined,
    };
    setCsvData(updatedData);
  };

  const handleCustomCategoryChange = (index, value) => {
    const updatedData = [...csvData];
    updatedData[index].customCategory = value;
    setCsvData(updatedData);
  };

  const handleAddCustomCategory = (index) => {
    const updatedData = [...csvData];
    const customCategory = updatedData[index].customCategory?.trim();

    if (customCategory && !categories.some((cat) => cat.name === customCategory)) {
      setCategories((prevCategories) => [...prevCategories, { id: `custom-${Date.now()}`, name: customCategory }]);
    }

    // Save the finalized custom category to the entry's `category`
    updatedData[index].category = customCategory;
    updatedData[index].customCategory = ''; // Clear the input field
    setCsvData(updatedData);
  };

  const handleSave = async () => {
    const cleanedData = csvData.map(({ suggestedCategory, allCategories, ...rest }) => rest);

    console.log('Cleaned data being sent to backend (formatted):');
    console.log(JSON.stringify(cleanedData, null, 2));

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
                            {categories.map((cat, i) => (
                              <option key={cat.id || `category-${i}`} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                          {item.category === 'Other' && (
                            <div>
                              <input
                                type="text"
                                placeholder="Enter custom category"
                                value={item.customCategory || ''}
                                onChange={(e) => handleCustomCategoryChange(index, e.target.value)}
                              />
                              <button onClick={() => handleAddCustomCategory(index)}>Add</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-success" onClick={handleSave}>
                  Save Statement
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