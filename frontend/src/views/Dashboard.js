import React from 'react'
import { useState, useEffect } from 'react'
import { jwtDecode } from "jwt-decode";
import useAxios from "../utils/useAxios"


function Dashboard() {

    const [res, setRes] = useState("")
    const api = useAxios()
    const token = localStorage.getItem("authTokens")

    if (token) {
        const decode = jwtDecode(token)
        var user_id = decode.user_id
        var username = decode.username
        var first_name = decode.first_name
        var last_name = decode.last_name
    }
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("api/test/")
                setRes(response.data.response)
            } catch (error) {
                console.log(error)
                setRes("Something went wrong.")
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        const fetchPostData = async () => {
            try {
                const response = await api.post("/test/")
                setRes(response.data.response)
            } catch (error) {
                console.log(error)
                setRes("Something went wrong.")
            }
        }
        fetchPostData()
    }, [])

    return (
        <div>
            <>
                {/* Bootstrap core JavaScript
  ================================================== */}
                {/* Placed at the end of the document so the pages load faster */}
                {/* Icons */}
                {/* Graphs */}
            </>

        </div>
    )
  
}

export default Dashboard
