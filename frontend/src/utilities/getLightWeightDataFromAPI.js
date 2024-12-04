import { jwtDecode } from 'jwt-decode';
import getEndpoint from '/src/utilities/getEndpoint';

function getLightWeightEventDataFromAPI( schema, jsonToken, handleLogout ) {
  { /* console.log(schema); */ }
  { /* console.log(typeof(jsonToken)); */ }
  const decodedToken = jwtDecode(jsonToken);
  if (decodedToken.exp) {
    var now = new Date()/1000;
    if (now > decodedToken.exp) {
      console.warn("Token expired");
      handleLogout();
    }
  }
  
  const apiEndpoint = getEndpoint();

  const authorizationHeader = `Bearer ${jsonToken}`;

  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': authorizationHeader,
    'Connection': 'close',
  };  

  const requestData = { 
    request_type: 'cctData',
    schema: schema
  }; 

  //console.debug(headers);
  //console.debug(requestData);
  
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

    const eventData = await response.json();
    eventData.events = JSON.parse(eventData.events);
    console.debug(`Returning event data...`);
    return eventData;
  } 

  try {
    return handleGetData();
  } catch (error) {
    console.error(error);
    var eventData = { events: null };
    return eventData;
  };

};

export default getLightWeightEventDataFromAPI;
