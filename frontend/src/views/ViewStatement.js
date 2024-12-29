import React, { useState, useEffect } from 'react';
import useAxios from '../utils/useAxios';
import { jwtDecode } from "jwt-decode";

function ViewStatements() {
    const [data, setData] = useState([]);
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

    useEffect(() => {
        const fetchStatements = async () => {
            try {
                const response = await api.get('/dataUpload/view-statement');
                setData(response.data);
                console.log(data)
            } catch (error) {
                console.error('There was an error fetching the data!', error);
            }
        };

        fetchStatements();
    }, [api]);

    return (
        <div>
            <div className="container-fluid" style={{ paddingTop: '100px' }}>
                <div className="row">
                    <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
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
                    </main>
                </div>
            </div>
        </div>
    );
}

export default ViewStatements;
