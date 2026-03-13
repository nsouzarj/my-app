'use client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/financas/api';

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
