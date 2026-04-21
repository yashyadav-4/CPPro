import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE } from '../api';

export default function ProtectedRoute({children}){
    const [isAuthenticated , setIsAuthenticated]= useState(null);

    useEffect(()=>{
        fetch(`${API_BASE}/api/auth/verify`, {credentials:'include'})
            .then(res=>res.json())
            .then(data=>setIsAuthenticated(data.authenticated))
            .catch(()=>setIsAuthenticated(false));
    } , [])
    if(isAuthenticated==null) return null;
    if(!isAuthenticated) return <Navigate to='/login' replace/>;
    return children;
}
     