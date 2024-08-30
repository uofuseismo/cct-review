import React from 'react';
import getEndpoint from '/src/utilities/getEndpoint';
import { jwtDecode } from 'jwt-decode';

function acceptFromAPI( schema, jsonToken, eventIdentifier, handleLogout ) {
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
    'Access-Control-Allow-Origin': '*' 
  };
 
  const acceptRequest = { 
    request_type: 'accept',
    schema: schema,
    eventIdentifier: eventIdentifier
  };  

  { /* console.debug(headers); */ }
  { /* console.debug(acceptRequest); */ }

  async function handleAcceptRequest() {
    const response
      = await fetch(apiEndpoint, {
                method: 'POST',
                withCredentials: true,
                crossorigin: true,
                headers: headers,
                body: JSON.stringify(acceptRequest),
                });
    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      throw new Error(message);
    }

    const result = await response.json();
    return result;
  }

  try {
    return handleAcceptRequest();
  } catch (error) {
    console.log(error);
    return null;
  }; 
};

export default acceptFromAPI;
