import React from 'react';
import { Box, Center, Container, Flex, VStack } from '@chakra-ui/react';
import EventTable from '/src/components/EventTable';
import SpectraFit from '/src/components/SpectraFit';
import TableFit from '/src/components/TableFit';
import Header from '/src/components/Header';
import Footer from '/src/components/Footer';
import getLightWeightEventDataFromAPI from '/src/utilities/getLightWeightDataFromAPI';

/// Don't need a ton of refreshes - every minute is fine
const catalogRefreshRate = 60;

function CCTReview( { userCredentials, onLogout } ) {
  console.debug('Rendering CCTReview...');
  const jsonWebToken = userCredentials.jsonWebToken;
  var [events, setEvents] = React.useState([]);
  var [eventIdentifier,  setEventIdentifier] = React.useState("");
  //var [catalogMagnitude, setCatalogMagnitude] = React.useState( {value: null, type:  null } );
  var [graphData,        setGraphData] = React.useState( null );
  var [settings,         setSettings] = React.useState( {schema: 'production'} );

  const canSubmit = userCredentials.permissions === 'read-write' ? true : false;

  const handleGetEvents = () => {
    getLightWeightEventDataFromAPI( settings.schema, jsonWebToken, onLogout ).then( (result) => {
    console.debug(`CCT returned ${result.events.length} events from API`);
    // Sort the events - most recent first
    result.events.sort(function (a, b) {
      if (a.originTime < b.originTime){return +1;}
      if (a.originTime > b.originTime){return -1;}
      return 0;
    }); 
    var rowIndex = 0;
    if (eventIdentifier !== "") {
      for (var i = 0; i < result.events.length; ++i) {
        if (eventIdentifier === result.events[i].eventIdentifier) {
          rowIndex = i;
          break;
        }
      }   
    }   
    if (result.events.length > 0) {
      setEvents(result.events);
      setEventIdentifier(result.events[rowIndex].eventIdentifier);
      setGraphData(result.events[rowIndex]);
    }
    else {
      setEvents([]);
      setEventIdentifier("");
      setGraphData(null);
    }
   })
   .catch(error => {
     console.error(`Failed to get events from API; failed with ${error}`);
   });
  }

  {/* When the user clicks the event identifier button in the EventTable */}
  {/* this callback updates the identifier.  The new identifier will */}
  {/* then cause the header, table, and spectra to re-render provided *}
  {/* that the identifier has changed. */}
  const handleUpdateEventIdentifier = (identifier) => {
    const temporaryIdentifier = eventIdentifier;
    setEventIdentifier((eventIdentifier) = identifier);
    console.debug(`Updated event identifier from ${temporaryIdentifier} to ${eventIdentifier}`);
    const rowIndex = events.findIndex( (row) => row.eventIdentifier === eventIdentifier );
    if (rowIndex >= 0 && rowIndex < events.length) {
      setGraphData(events[rowIndex]);
    }   
  }

  const handleUpdateSettings = (newSettings) => {
    if ( newSettings != settings ) {
      var queryEvents = (newSettings.schema != settings.schema) ? true : false;
      console.debug('Settings updated!');
      setSettings( newSettings ); 
      if (queryEvents) {
        settings.schema = newSettings.schema;
        handleGetEvents();
        //console.debug(`Fetching events for new schema from ${newSettings.schema}`);
        //getLightWeightEventDataFromAPI( newSettings.schema, jsonWebToken, onLogout ).then( (result) => {
        //  console.debug(`CCT returned ${result.events.length} events from API`);
        //  if (result.events.length > 0) {
        //    setEventIdentifier(result.events[0].eventIdentifier);
        //    setGraphData(result.events[0]);
        //  }
        //  else {
        //    setEventIdentifier("");
        //    setGraphData(null);
        //  }
        //  setEvents(result.events);
        //})
        //.catch(error => {
        //  console.error(`Failed to get events from other schema; failed with ${error}`);
        //  setEvents([]);
        //});
      }
      else {
        console.debug(`Will not query events from schema ${newSettings.schema}`);
      }
    }
    else {
      console.debug('Settings not updated');
    }
  };

  // Run once on start up
  React.useEffect(() => {
    handleGetEvents();
  }, []);

  // Now poll the API
  React.useEffect( () => {
    console.debug('Refresh from poller');
    const timer = setInterval(handleGetEvents, catalogRefreshRate*1000);
    return () => clearInterval(timer);
  }, [events, eventIdentifier, graphData, settings]);


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
               onAcceptOrRejectEvent={handleGetEvents}
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
