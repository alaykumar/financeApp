import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { jwtDecode } from 'jwt-decode';

function ViewStatements() {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(''); // New state for month
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [currentPage, setCurrentPage] = useState(1); 
    const [totalItems, setTotalItems] = useState(0); 
    const [totalPages, setTotalPages] = useState(0); 
    const api = useAxios();
    const token = localStorage.getItem('authTokens');

    let user_id, username, first_name, last_name;
    if (token) {
        const decode = jwtDecode(token);
        user_id = decode.user_id;
        username = decode.username;
        first_name = decode.first_name;
        last_name = decode.last_name;
    }

    // Fetch statements based on the current page and selected filters (category, month)
    const fetchStatements = async (page = 1, category = '', month = '') => {
        try {
            const response = await api.get(`/dataUpload/view-statement?page=${page}&category=${category}&month=${month}`);
            setData(response.data.results);
            setTotalItems(response.data.count);
            setTotalPages(Math.ceil(response.data.count / 20));
        } catch (error) {
            console.error('There was an error fetching the data!', error);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await api.get('/dataUpload/categories');
            setCategories(response.data.categories);
            setLoadingCategories(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchStatements(currentPage, selectedCategory, selectedMonth); // Fetch data when the component mounts
    }, [currentPage, selectedCategory, selectedMonth]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div>
            <div className="container-fluid" style={{ paddingTop: '75px' }}>
                <div className="row">
                    <main role="main" className="col-md-9 col-lg-10 container text-center">
                        {/* <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                            <h1 className="h2">View Statements</h1>
                        </div> */}
                        <h2>Statement Data</h2>

                        {/* Filter Section */}
                        <div className="filters">
                            {/* Category Filter */}
                            <select
                                className="form-select mb-3"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>

                            {/* Month Filter */}
                            <select
                                className="form-select mb-3"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="">All Months</option>
                                <option value="01">January</option>
                                <option value="02">February</option>
                                <option value="03">March</option>
                                <option value="04">April</option>
                                <option value="05">May</option>
                                <option value="06">June</option>
                                <option value="07">July</option>
                                <option value="08">August</option>
                                <option value="09">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                        </div>

                        {/* Table with data */}
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Vendor</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.transactionDate}</td>
                                        <td>{item.vendorName}</td>
                                        <td>{item.debit}</td>
                                        <td>{item.credit}</td>
                                        <td>{item.category}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <nav aria-label="Page navigation">
                            <ul className="pagination justify-content-center">
                                {currentPage > 1 && (
                                    <li className="page-item">
                                        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                                            Previous
                                        </button>
                                    </li>
                                )}
                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => handlePageChange(page)}>
                                            {page}
                                        </button>
                                    </li>
                                ))}
                                {currentPage < totalPages && (
                                    <li className="page-item">
                                        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                                            Next
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </nav>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default ViewStatements;
