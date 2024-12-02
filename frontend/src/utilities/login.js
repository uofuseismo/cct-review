import React from 'react';
import axios from 'axios';
import getEndpoint from '/src/utilities/getEndpoint.jsx';
import { encode as base64_encode } from 'base-64';

export default function loginToAPI( user, password, onUpdateUserCredentials ) { 
  const apiEndpoint = getEndpoint();
  console.debug(`Will login at endpoint ${apiEndpoint}`);

  const authorizationHeader = 'Basic ' + base64_encode(`${user}:${password}`);
  console.debug(authorizationHeader);

  const requestData = { 
    request_type: 'login',
    schema: null
  };  

  console.debug(authorizationHeader);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authorizationHeader,
    'Connection': 'close',
    //'Access-Control-Allow-Origin': '*',
    //'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
    //'Access-Control-Allow-Headers': 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization'
  };

  //console.log(headers);

  async function handlePutCredentials() {
    const response
      = await fetch(apiEndpoint, {
                method: 'PUT',
                withCredentials: true,
                crossorigin: true,
                headers: headers,
                body: null,
                });
    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      throw new Error(message);
    }

    const credentials = await response.json();
    onUpdateUserCredentials(credentials);
  };

  try {
    handlePutCredentials();
  } catch (error) {
    console.log(error);
  };
}
