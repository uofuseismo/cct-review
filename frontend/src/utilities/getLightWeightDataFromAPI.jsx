import getEndpoint from '/src/utilities/getEndpoint';

function getLightWeightEventDataFromAPI( schema, jsonToken ) {
  console.log(schema);
  console.log(typeof(jsonToken));
  const apiEndpoint = getEndpoint();

  const authorizationHeader = `Bearer ${jsonToken}`;

  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': authorizationHeader,
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*'
  };  

  const requestData = { 
    request_type: 'cctData',
    schema: schema
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
    eventData.events = JSON.parse(eventData.events);
    console.debug(`Returning event data...`);
    console.log(typeof (eventData.events) );
    console.log(eventData.events);
    return eventData;
  } 

  try {
    return handleGetData();
  } catch (error) {
    console.log(error);
    var eventData = { events: null };
    return eventData;
  };

};

export default getLightWeightEventDataFromAPI;
