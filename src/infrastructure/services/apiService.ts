'use client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/financas/api';

const getAuthHeaders = () => {
    // Check if we are in the browser
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
        }
    }
    return { 'Content-Type': 'application/json' };
};

const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('organization');
            window.location.href = '/sign-in'; // Redirect to sign-in page
        }
        throw new Error('Unauthorized - Token expired or invalid');
    }
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Some endpoints might return empty body on DELETE
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

export const apiService = {
    async get(endpoint: string, organizationId: string) {
        const response = await fetch(`${BASE_URL}/${endpoint}.php?organizationId=${organizationId}`);
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    },

    async post(endpoint: string, data: any) {
        const response = await fetch(`${BASE_URL}/${endpoint}.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    },

    async put(endpoint: string, id: string, data: any) {
        const response = await fetch(`${BASE_URL}/${endpoint}.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    },

    async delete(endpoint: string, id: string) {
        const response = await fetch(`${BASE_URL}/${endpoint}.php?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }
};
