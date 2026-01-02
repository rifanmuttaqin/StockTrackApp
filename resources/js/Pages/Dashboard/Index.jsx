import React from 'react';
import Dashboard from '../Dashboard';

// This file acts as a wrapper to maintain compatibility with the controller
// that expects Dashboard/Index but the actual component is in Dashboard.jsx
export default function DashboardIndex(props) {
    return <Dashboard {...props} />;
}
