import React, { useContext } from 'react';
import { jwtDecode } from "jwt-decode"; // jwtDecode should not be destructured
import AuthContext from '../context/AuthContext';
import { Link, NavLink } from "react-router-dom";

function Navbar() {
    const { user, logoutUser } = useContext(AuthContext);
    const token = localStorage.getItem("authTokens");

    let user_id = null;
    if (token) {
        const decode = jwtDecode(token);
        user_id = decode.user_id;
    }

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-dark fixed-top bg-dark">
                <div className="container-fluid">
                <Link className="navbar-brand" to="#">
                    <img 
                    style={{ width: "80px", height: "80px", padding: "6px" }} 
                    src="../images/economics.png"  
                    alt="Economics"  
                    />
                </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <NavLink className="nav-link" exact to="/">Home</NavLink>
                            </li>
                            {!token && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/login">Login</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/register">Register</NavLink>
                                    </li>
                                </>
                            )}
                            {token && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                                    </li>
                                </>
                            )}
                            {token && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/view-statement">View Statement    </NavLink>
                                    </li>
                                </>
                            )}
                            {token && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/uploadcsv">UploadCSV</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <span className="nav-link" onClick={logoutUser} style={{ cursor: "pointer" }}>Logout</span>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default Navbar;
