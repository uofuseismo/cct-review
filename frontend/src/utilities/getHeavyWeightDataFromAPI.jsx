import React from 'react';
import axios from 'axios';
import getEndpoint from '/src/utilities/getEndpoint';

function getHeavyWeightDataFromAPI( schema, jsonToken, eventIdentifier ) {
  const apiEndpoint = getEndpoint();

  const authorizationHeader = `Bearer ${jsonToken}`;

  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': authorizationHeader,
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*' 
  };
 
  const requestData = { 
    request_type: 'eventData',
    schema: schema,
    eventIdentifier: eventIdentifier
  };  

  console.debug(headers);
  console.debug(requestData);

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
    const payload = JSON.parse(eventData.data);
    console.debug(`Returning heavy event data...`);
    return payload;
  }

  try {
    return handleGetData();
  } catch (error) {
    console.log(error);
    return null;
  }; 
};

export default getHeavyWeightDataFromAPI;
