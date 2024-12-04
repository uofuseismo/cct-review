import getEndpoint from '/src/utilities/getEndpoint';
import { jwtDecode } from 'jwt-decode';

function rejectFromAPI( schema, jsonToken, eventIdentifier, handleLogout ) {
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
 
  const rejectRequest = { 
    request_type: 'reject',
    schema: schema,
    eventIdentifier: eventIdentifier
  };  

  async function handleRejectRequest() {
    const response
      = await fetch(apiEndpoint, {
                method: 'POST',
                withCredentials: true,
                crossorigin: true,
                headers: headers,
                body: JSON.stringify(rejectRequest),
                });
    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      throw new Error(message);
    }

    const result = await response.json();
    return result;
  }

  try {
    return handleRejectRequest();
  } catch (error) {
    console.log(`Failed to reject event because ${error}`);
    return null;
  }; 
};

export default rejectFromAPI;
