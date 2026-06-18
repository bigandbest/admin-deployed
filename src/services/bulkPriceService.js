import api from '../utils/api.js';

export const downloadPriceSheet = async ({ category_id, vertical } = {}) => {
  const params = new URLSearchParams();
  if (category_id) params.append('category_id', category_id);
  if (vertical) params.append('vertical', vertical);

  const response = await api.get(`/admin/products/bulk-price-export?${params.toString()}`, {
    responseType: 'blob',
    timeout: 120000,
  });

  const date = new Date().toISOString().split('T')[0];
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `price-update-${date}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const uploadPriceSheet = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/admin/products/bulk-price-update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/admin/products/bulk-price-update/${jobId}`);
  return response.data;
};

export const getJobResults = async (jobId) => {
  const response = await api.get(`/admin/products/bulk-price-update/${jobId}/results`);
  return response.data;
};
