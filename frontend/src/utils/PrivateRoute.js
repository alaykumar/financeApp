/*import { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import AuthContext from "../context/AuthContext"

const PrivateRoute = ({children, ...rest}) => {
    let {user} = useContext(AuthContext)
    return <Route {...rest}>{!user ? <Redirect to="/login" /> : children}</Route>
};

export default PrivateRoute*/

// utils/PrivateRoute.js
import React, { useContext } from "react";
import { Route, Redirect } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ component: Component, ...rest }) => {
  let { user } = useContext(AuthContext);
  return (
    <Route
      {...rest}
      render={(props) =>
        user ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export default PrivateRoute;
