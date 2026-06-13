import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from './api'; // Ensure this points to your axios instance

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    studioName: 'Studio Name',
    companyLogo: '',
    ownerName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    address: '',
    gstNumber: '',
    websiteUrl: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching settings globally:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
