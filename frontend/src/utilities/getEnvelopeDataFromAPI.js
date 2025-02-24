import getEndpoint from '/src/utilities/getEndpoint';
import { jwtDecode } from 'jwt-decode';

function getEnvelopeDataFromAPI( schema, jsonToken, eventIdentifier, handleLogout ) {
  const apiEndpoint = getEndpoint();

  const decodedToken = jwtDecode(jsonToken);
  if (decodedToken.exp) {
    var now = new Date()/1000;
    if (now > decodedToken.exp) {
      console.warn("Token expired");
      handleLogout();
    }   
  }

  const authorizationHeader = `Bearer ${jsonToken}`;

  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': authorizationHeader,
    'Connection': 'close',
  };
 
  const requestData = { 
    requestType: 'envelopeData',
    schema: schema,
    eventIdentifier: eventIdentifier
  };  

  async function handleGetData() {
    const response
      = await fetch(apiEndpoint, {
                method: 'PUT',
                withCredentials: true,
                crossorigin: true,
                headers: headers,
                body: JSON.stringify(requestData),
                });
    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      throw new Error(message);
    }

    const envelopeData = await response.json();
    const payload = JSON.parse(envelopeData.data);
    console.debug(`Returning envelope data...`);
    return payload;
  }

  try {
    return handleGetData();
  } catch (error) {
    console.error(error);
    return null;
  }; 
};

export default getEnvelopeDataFromAPI;
