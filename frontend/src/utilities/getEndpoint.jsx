export default function getEndpoint() {
  var apiEndpoint = 'http://127.0.0.1:8080/';
  if (import.meta.env.mode === 'production') {
    if (import.meta.env.production.CCT_ENDPOINT !== '') {
      apiEndpoint = import.meta.env.production.CCT_ENDPOINT; 
    }
  }
  return apiEndpoint;
};

