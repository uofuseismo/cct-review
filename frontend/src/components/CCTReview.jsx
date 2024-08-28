import React from 'react';
import { Box, Center, Container, Flex, HStack, VStack } from '@chakra-ui/react';
import EventTable from '/src/components/EventTable.jsx';
import SpectraFit from '/src/components/SpectraFit.jsx';
import TableFit from '/src/components/TableFit.jsx';
import Header from '/src/components/Header.jsx';
import Footer from '/src/components/Footer.jsx';
{ /* import getAsyncEventData from '/src/utilities/getEventsList.jsx'; */ }
import getLightWeightEventDataFromAPI from '/src/utilities/getLightWeightDataFromAPI.jsx';
{ /* import getLightWeightEventDataFromAPI from '/src/utilities/getEventsListFromServer.jsx'; */ }
{ /* import getAsynchEventDataFromAPI from '/src/utilities/getEventsListFromServer.jsx'; */ }

function CCTReview( { userCredentials, onLogout } ) {
  console.log("Rendering app...");
  const jsonWebToken = userCredentials.jsonWebToken;
  var [events, setEvents] = React.useState([]);
  var [eventIdentifier,  setEventIdentifier] = React.useState("");
  var [catalogMagnitude, setCatalogMagnitude] = React.useState( {value: null, type:  null } );
  var [graphData,        setGraphData] = React.useState( null );
  var [settings,         setSettings] = React.useState( {schema: 'production'} );

  const canSubmit = userCredentials.permissions === 'read-write' ? true : false;

  {/* When the user clicks the event identifier button in the EventTable */}
  {/* this callback updates the identifier.  The new identifier will */}
  {/* then cause the header, table, and spectra to re-render provided *}
  {/* that the identifier has changed. */}
  const handleUpdateEventIdentifier = (identifier) => {
    const temporaryIdentifier = eventIdentifier;
    setEventIdentifier((eventIdentifier) = identifier);
    console.log(`Updated event identifier from ${temporaryIdentifier} to ${eventIdentifier}`);
    const rowIndex = events.findIndex( (row) => row.eventIdentifier === eventIdentifier );
    if (rowIndex >= 0 && rowIndex < events.length) {
      { /* setGraphData(extractData(events[rowIndex])); */ }
      setGraphData(events[rowIndex]);
    }   
  }

  const handleUpdateSettings = (newSettings) => {
    if ( newSettings != settings ) {
      console.log("Settings updated");
      setSettings( newSettings ); 
    }
  };

  React.useEffect(() => {
    { /* getAsyncEventData().then((result) => { */ }
    { /* console.log(`CCT loaded ${result.events.length} events`); */ }
    getLightWeightEventDataFromAPI( settings.schema, jsonWebToken, onLogout ).then( (result) => {
    { /* If this is a reload then try to get back to our current event */ }
    console.log(`CCT returned ${result.events.length} events from API`);
    setEvents(result.events);
    var rowIndex = 0;
    if (eventIdentifier !== "") {
      console.log("find index..."); 
      for (var i = 0; i < result.events.length; ++i) {
        if (eventIdentifier === result.events[i].eventIdentifier) {
          rowIndex = i;
          break;
        }
      }
    }
    if (result.events.length > 0) {
      setEventIdentifier(result.events[rowIndex].eventIdentifier);
      { /* setGraphData(extractData(result.events[rowIndex])); */ }
      setGraphData(result.events[rowIndex]);
    }
   });
  }, []);

  { /* getAsynchEventDataFromAPI(); */ }

  return (
    <React.Fragment>
      <VStack minWidth="800px" maxWidth="100%" width="1200px">
        <Container minWidth="100%" maxWidth="100%">
          <Header
           eventIdentifier={eventIdentifier}
           settings={settings}
           onUpdateSettings={handleUpdateSettings}
           onLogout={onLogout}
          />
        </Container>
        <Container minWidth="100%" maxWidth="100%">
          <Flex maxHeight="450px" minWidth="100%">
            <Box width='70%'>
              <SpectraFit
               data={graphData}
              />
            </Box>
            <Box w='30%'>
              <TableFit
               jsonWebToken={jsonWebToken}
               schema={settings.schema}
               canSubmit={canSubmit}
               eventData={graphData}
               onLogout={onLogout}
              />
            </Box>
          </Flex>
        </Container>
        <EventTable
         events={events}
         onUpdateEventIdentifier={handleUpdateEventIdentifier}
         />
        <Container minWidth="100%" maxWidth="100%">
          <Footer />
        </Container>
      </VStack>
    </React.Fragment>
  );
}

export default CCTReview;
