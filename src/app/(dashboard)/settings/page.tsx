'use client';

import { SettingsClient } from "./SettingsClient";
import { useState, useEffect } from "react";
import { apiService } from "@/infrastructure/services/apiService";
import { useAuth } from "@clerk/nextjs";

export default function SettingsPage() {
    const { userId } = useAuth();
    const organizationId = userId || 'default_org';
    const [organization, setOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const data = await apiService.get('config', organizationId);
                setOrganization({ id: organizationId, name: data.orgName || 'Finanças', type: 'Pessoal' });
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [organizationId]);

    if (loading) return <div className="p-10 flex items-center justify-center min-h-[400px]">Carregando configurações...</div>;
    
    return (
        <SettingsClient organization={organization} />
    );
}
