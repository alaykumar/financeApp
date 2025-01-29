import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { jwtDecode } from 'jwt-decode';

function ViewStatements() {
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // To keep track of the current page
    const [totalItems, setTotalItems] = useState(0); // To keep track of total items
    const [totalPages, setTotalPages] = useState(0); // To keep track of total pages
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

    // Fetch statements based on the current page
    const fetchStatements = async (page = 1) => {
        try {
            const response = await api.get(`/dataUpload/view-statement?page=${page}`);
            setData(response.data.results); // Set the paginated data
            setTotalItems(response.data.count); // Set total item count
            setTotalPages(Math.ceil(response.data.count / 20)); // Calculate total pages
        } catch (error) {
            console.error('There was an error fetching the data!', error);
        }
    };

    useEffect(() => {
        fetchStatements(currentPage); // Fetch statements on page load
    }, [currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page); // Change the current page
    };

    return (
        <div>
            <div className="container-fluid" style={{ paddingTop: '100px' }}>
                <div className="row">
                    <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3">
                        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                            <h1 className="h2">View Statements</h1>
                        </div>
                        <h2>Statement Data</h2>
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
                                    <li
                                        key={page}
                                        className={`page-item ${page === currentPage ? 'active' : ''}`}
                                    >
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
