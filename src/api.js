import axios from 'axios';

const API_URL = 'http://13.219.89.22:5000/api';

export const register = async (formData) => {
  const response = await axios.post(`${API_URL}/register`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data;
};

export const addConsumption = async (token, consumptionData) => {
  const response = await axios.post(`${API_URL}/consumption`, consumptionData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateConsumption = async (token, entryId, consumptionData) => {
  const response = await axios.put(`${API_URL}/consumption/${entryId}`, consumptionData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteConsumption = async (token, entryId) => {
  const response = await axios.delete(`${API_URL}/consumption/${entryId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getDashboard = async (token) => {
  const response = await axios.get(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};