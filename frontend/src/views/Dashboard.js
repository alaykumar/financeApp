import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import useAxios from "../utils/useAxios";

const Dashboard = () => {
    const api = useAxios();
    const [chartData, setChartData] = useState([["Category", "Amount"]]);
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState("all_time");

    const [lineChartData, setLineChartData] = useState([["Month", "Loading..."]]);


    const fetchCategoryData = async (range) => {
        setLoading(true);
        try {
            const response = await api.get(`/dashboard/pie-chart/?range=${range}`);
            if (response.data && response.data.data) {
                setChartData(response.data.data);
            } else {
                console.error("Invalid API response format:", response.data);
                setChartData([["Category", "Amount"]]);
            }
        } catch (error) {
            console.error("Error fetching category data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategoryData(selectedRange);
    }, [selectedRange]);

    const fetchMonthlyData = async () => {
        setLoading(true);

        try {
            const response = await api.get("/dashboard/multi-line-chart/");
            if (response.data && response.data.data) {
                setLineChartData(response.data.data);
            } else {
                console.error("Invalid API response format:", response.data);
                setLineChartData([["Month", "No Data"]]);
            }
        } catch (error) {
            console.error("Error fetching monthly spending data:", error);
        } finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        fetchMonthlyData();
    }, [])


    return (
        <div style={{ padding: "20px", marginTop: "80px" }}>
            {/* Dropdown for selecting time range */}


            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)", // Two columns
                    gridTemplateRows: "auto auto", // Two rows
                    gap: "20px",
                }}
            >
                {/* First row - Two Charts */}
                <div>
                    <h2>Category Pie Chart</h2>
                    <div style={{ marginBottom: "20px" }}>
                        <label htmlFor="timeRange" style={{ fontWeight: "bold", marginRight: "10px" }}>
                            Select Time Range:
                        </label>
                        <select
                            id="timeRange"
                            value={selectedRange}
                            onChange={(e) => setSelectedRange(e.target.value)}
                            style={{ padding: "5px", fontSize: "16px" }}
                        >
                            <option value="last_month">Last Month</option>
                            <option value="last_6_months">Last 6 Months</option>
                            <option value="last_year">Last Year</option>
                            <option value="all_time">All Time</option>
                        </select>
                    </div>
                    {loading ? (
                        <p>Loading chart...</p>
                    ) : (
                        <Chart
                            chartType="PieChart"
                            data={chartData}
                            options={{
                                title: "Spending Breakdown",
                                pieHole: 0.4, // Donut chart
                                is3D: false,
                            }}
                            width={"100%"}
                            height={"400px"}
                        />
                    )}
                </div>

                <div>
                    <h2>Chart 2</h2>
                    <Chart
                        chartType="LineChart"
                        data={[["X", "Y"], [1, 3], [2, 5], [3, 7]]}
                        width={"100%"}
                        height={"400px"}
                    />
                </div>

                {/* Second row - Full-width Chart */}
                <div style={{ gridColumn: "span 2" }}>  {/* This makes it span two columns */}
                    <h2>Monthly Spending by Category</h2>
                    {loading ? (
                        <p>Loading chart...</p>
                    ) : (
                        <Chart
                            chartType="LineChart"
                            data={lineChartData}
                            options={{
                                title: "Monthly Spending Trends",
                                hAxis: { title: "Month" },
                                vAxis: { title: "Amount Spent ($)", minValue: 0 },
                                curveType: "function", // Smooth curve
                                legend: { position: "bottom" },
                                focusTarget: "category",
                                tooltip: { isHtml: true }, // <-- Enables all tooltips on hover
                            }}
                            width={"100%"}
                            height={"400px"}
                        />

                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
