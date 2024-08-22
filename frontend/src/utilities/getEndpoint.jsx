export default function getEndpoint() {
  var apiEndpoint = 'http://127.0.0.1:8080/';
  if (process.env.CCT_ENDPOINT !== '') {
    apiEndpoint = process.env.CCT_ENDPOINT; 
  }
  return apiEndpoint;
};

