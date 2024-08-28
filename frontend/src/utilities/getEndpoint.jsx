export default function getEndpoint() {
  const apiUrl = import.meta.env.NODE_ENV === 'production' ? import.meta.env.REACT_APP_PROD_API_URL : import.meta.env.REACT_APP_DEV_API_URL;
  return apiUrl;
};

