export default function getEndpoint() {
  if (import.meta.env.MODE === 'production') {
    console.log(import.meta.env.VITE_CCT_API_PRODUCTION_URL);
    return import.meta.env.VITE_CCT_API_PRODUCTION_URL;
  }
  else {
    return import.meta.env.VITE_CCT_API_DEVELOPMENT_URL;
  }
  console.warn("Unhandled mode; returning localhost URL");
  return "http://127.0.0.1:8080";
};

