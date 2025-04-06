import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { jwtDecode } from 'jwt-decode';

function UploadCSV() {
  // State variables
  const [file, setFile] = useState(null);
  const [cardOrg, setCardOrg] = useState('');
  const [cardType, setCardType] = useState('');
  const [customCardType, setCustomeCardType] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [res, setRes] = useState('');
  const api = useAxios();

  // Retrieve user ID from token
  const token = localStorage.getItem('authTokens');
  const user_id = token ? jwtDecode(token).user_id : null;

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

  const handleFileChange = (event) => setFile(event.target.files[0]);
  const handleBankChange = (event) => setCardOrg(event.target.value);
  const handleCardTypeChange = (event) => {
    setCardType(event.target.value);
    if (event.target.value !== 'Other') setCustomeCardType('');
  };
  const handleCustomCardTypeChange = (event) => setCustomeCardType(event.target.value);

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
        headers: { 'Content-Type': 'multipart/form-data' },
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
    updatedData[index] = { ...updatedData[index], [key]: value };
    setCsvData(updatedData);
  };

  const handleCategorySelect = (index, event) => {
    const selectedValue = event.target.value;
    const updatedData = [...csvData];
    updatedData[index].category = selectedValue;
    if (selectedValue !== 'Other') {
      updatedData[index].newCategoryInput = ''; // Clear input if 'Other' is not selected
    }
    setCsvData(updatedData);
  };

  const handleNewCategoryInputChange = (index, event) => {
    const updatedData = [...csvData];
    updatedData[index].newCategoryInput = event.target.value;
    setCsvData(updatedData);
  };

  const handleAddNewCategoryForRow = (index) => {
    const categoryToAdd = csvData[index]?.newCategoryInput?.trim();
    if (categoryToAdd && !categories.some(cat => cat.name === categoryToAdd)) {
      // Create a temporary category object (assuming your category objects have an 'id' and 'name')
      const newCategoryObject = { id: `temp-${Date.now()}`, name: categoryToAdd };
      // Update the categories state with the new category
      setCategories(prevCategories => [...prevCategories, newCategoryObject]);
      // Update the category for the current row in csvData
      const updatedData = [...csvData];
      updatedData[index].category = categoryToAdd;
      updatedData[index].newCategoryInput = '';
      setCsvData(updatedData);
    } else if (categories.some(cat => cat.name === categoryToAdd)) {
      // If the category already exists, just update the row's category
      const updatedData = [...csvData];
      updatedData[index].category = categoryToAdd;
      updatedData[index].newCategoryInput = '';
      setCsvData(updatedData);
    }
  };

  const handleSave = async () => {
    const cleanedData = csvData.map(({ suggestedCategory, allCategories, newCategoryInput, ...rest }) => rest);

    console.log('Cleaned data being sent to backend (formatted):', JSON.stringify(cleanedData, null, 2));

    try {
      const response = await api.post('dataUpload/save-statements/', {
        data: cleanedData,
        cardOrg,
        cardType,
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

            <label htmlFor="cardOrg">Card Organization</label>
            <input
              id="cardOrg"
              type="text"
              placeholder="Enter Bank or Card Org"
              value={cardOrg}
              onChange={handleBankChange}
            />

            <label htmlFor='cardType'>Card Type: </label>
            <select
              id="cardType"
              value={cardType}
              onChange={handleCardTypeChange}
            >
              <option value="">--Select Card Type--</option>
              <option value="Visa">Visa</option>
              <option value="MasterCard">MasterCard</option>
              <option value="Other">Other</option>
            </select>

            {cardType === "Other" && (
              <input
                type='text'
                placeholder='Enter Card Type'
                value={customCardType}
                onChange={handleCustomCardTypeChange}
              />
            )}

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
                            onChange={(e) => handleCategorySelect(index, e)}
                          >
                            <option value="">{item.suggestedCategory || '--Select--'}</option>
                            {categories
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            <option value="Other">Other</option>
                          </select>
                          {item.category === 'Other' && (
                            <>
                              <input
                                type="text"
                                placeholder="New Category"
                                value={item.newCategoryInput || ''}
                                onChange={(e) => handleNewCategoryInputChange(index, e)}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleAddNewCategoryForRow(index)}
                              >
                                Add
                              </button>
                            </>
                          )}
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