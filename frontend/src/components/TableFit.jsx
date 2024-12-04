import React from 'react';
import { Badge, Button, Container, Link, Text, Tooltip, HStack, VStack } from '@chakra-ui/react';
import { Table, TableContainer, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { ArrowForwardIcon, CheckIcon, DeleteIcon, DownloadIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Alert, AlertIcon } from '@chakra-ui/react';
import acceptFromAPI from '/src/utilities/acceptFromAPI';
import rejectFromAPI from '/src/utilities/rejectFromAPI';
import getHeavyWeightDataFromAPI from '/src/utilities/getHeavyWeightDataFromAPI';
{ /* import downloadJSONData from '/src/utilities/downloadJSONData'; */ }
{ /* import Button from '@mui/material/Button'; */ }
{ /* import ButtonGroup from '@mui/material/ButtonGroup'; */ }
{ /* import Box from '@mui/material/Box'; */ }
{ /* import Chip from '@mui/material/Chip'; */ }
{ /* import Grid from '@mui/material/Grid'; */ }
{ /* import Paper from '@mui/material/Paper'; */ }
{ /* import DeleteIcon from '@mui/icons-material/Delete'; */ }
{ /* import CheckIcon from '@mui/icons-material/Check'; */ }
{ /* import FileDownloadIcon from '@mui/icons-material/FileDownload'; */ }
{ /* import WarningAmberIcon from '@mui/icons-material/WarningAmber'; */ }
{ /* import SendIcon from '@mui/icons-material/Send'; */ }
{ /* import { styled } from '@mui/material/styles'; */ }
{ /* import Stack from '@mui/material/Stack'; */ }
{ /* import Tooltip from '@mui/material/Tooltip'; */ }


{ /* const Item = styled(Paper)(({ theme }) => ({ */ } 
{ /*  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff', */ }
{ /*  ...theme.typography.body2, */ }
{ /*  padding: theme.spacing(1), */ }
{ /*  textAlign: 'left', */ }
{ /*   color: theme.palette.text.secondary, */ }
{ /* })); */ }

function InconsistentMagnitude( {inconsistentMagnitude} ) {
  if ( inconsistentMagnitude ) {
    return (
      <React.Fragment>
        <Tooltip label='The catalog and Mw,coda magnitude are inconsistent'>
          <Badge colorScheme='orange'>IM</Badge> 
        </Tooltip>
      </React.Fragment>
    );
  }
  else {
    return (
      <React.Fragment>
      </React.Fragment>
    );
  }
}

function LikelyPoorlyConstrained( {likelyPoorlyConstrained} ) { 
  if ( likelyPoorlyConstrained ) { 
    return (
      <React.Fragment>
        <Tooltip label='The CCT software indicates the magnitude is pooly-constrained'>
          <Badge colorScheme='orange'>PC</Badge> 
        </Tooltip>
      </React.Fragment>
    );  
  }
  else {
    return (
      <React.Fragment>
      </React.Fragment>
    );  
  }
}

function AnomalousAmplitude( {anomalousAmplitude} ) {  
  if ( anomalousAmplitude ) { 
    return (
      <React.Fragment>
        <Tooltip label='There exists a residual that exceeds one order of magnitude'>
          <Badge colorScheme='orange'>AA</Badge> 
        </Tooltip>
      </React.Fragment>
    );  
  }
  else {
    return (
      <React.Fragment>
      </React.Fragment>
    );
  }
}


function FitBadges( {likelyPoorlyConstrained,
                     inconsistentMagnitude,
                     anomalousAmplitude} ) {
  if ( likelyPoorlyConstrained | inconsistentMagnitude  | anomalousAmplitude ) {
    return (
      <React.Fragment>
        <HStack>
          <InconsistentMagnitude inconsistentMagnitude={inconsistentMagnitude} />
          <LikelyPoorlyConstrained likelyPoorlyConstrained={likelyPoorlyConstrained} />
          <AnomalousAmplitude anomalousAmplitude={anomalousAmplitude} />
        </HStack>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <HStack>
        <Tooltip label='The automatic result has not triggered automatic flag(s)'>
          <Badge colorScheme='green'>No Issues</Badge>
        </Tooltip>
      </HStack>
    </React.Fragment>
  );
}

function TableFit( {jsonWebToken, schema, canSubmit, eventData, onLogout, onAcceptOrRejectEvent} ) {
  var [ dataIsRequested,  setDataIsRequested  ] = React.useState( false ); 
  var [ acceptRequested,  setAcceptRequested  ] = React.useState( false );
  var [ rejectRequested,  setRejectRequested  ] = React.useState( false );
  var [ showSuccessAlert, setShowSuccessAlert ] = React.useState( false );
  var [ showFailureAlert, setShowFailureAlert ] = React.useState( false ); 
  var eventIdentifier = null;
  var mwCodaMagnitude = null;
  var catalogMagnitude = null;
  var catalogMagnitudeType = null;
  var isAccepted = false;
  var isRejected = false;
  var likelyPoorlyConstrained = false;
  if ( eventData ) {
    eventIdentifier = eventData.eventIdentifier; 
    mwCodaMagnitude = eventData.cctMagnitude;
    catalogMagnitude = eventData.authoritativeMagnitude;
    catalogMagnitudeType = eventData.authoritativeMagnitudeType;
    likelyPoorlyConstrained = eventData.likelyPoorlyConstrained;
    if (eventData.reviewStatus === 'A') {
      console.debug('Event is accepted');
      isAccepted = true;
    }
    if (eventData.reviewStatus === 'R') {
      console.debug('Event is rejected');
      isRejected = true;
    }
  }

  var url = `https://earthquake.usgs.gov/earthquakes/eventpage/uu${eventIdentifier}/executive`;
  if ( eventIdentifier != null ) {
    if ( eventIdentifier[0] === '3' ) {
      url = `https://staging-earthquake.usgs.gov/earthquakes/eventpage/uu${eventIdentifier}/executive`;
    }
  }
  var mwCodaMagnitudeToDisplay = ""; 
  if ( mwCodaMagnitude ) {
    mwCodaMagnitudeToDisplay = mwCodaMagnitude.toFixed(2);
  }
  var catalogMagnitudeToDisplay = ""; 
  if ( catalogMagnitude ) {
    catalogMagnitudeToDisplay = `${catalogMagnitude.toFixed(2)} M${catalogMagnitudeType}`;
  }

  var inconsistentMagnitude = false;
  if ( catalogMagnitude && mwCodaMagnitude ) {
    if ( catalogMagnitudeType === 'l' ) {
      if (Math.abs(mwCodaMagnitude - (0.94*catalogMagnitude + 0.36)) > 0.29) {
        console.debug("Inconsistent magnitude");
        inconsistentMagnitude = true;
      } 
    } 
    else if ( catalogMagnitudeType === 'w') {
      console.warn("Need a Mw inconsistent magnitude rule");
      if ( Math.abs(mwCodaMagnitude - catalogMagnitude) > 0.29 ) {
        inconsistentMagnitude = true;
      }
    }
  }

  var anomalousAmplitude = false;
  if ( eventData) {
    if ( eventData.stationMeasurements ) {
      const stationMeasurements = eventData.stationMeasurements;
      for (var i = 0; i < stationMeasurements.length; i++) {
        anomalousAmplitude = stationMeasurements[i].measurements.some(
            (element) => Math.abs(element.residual) >= 1.0 );
        if (anomalousAmplitude) {
          break;
        }
      }
      if ( anomalousAmplitude ) {
        console.info('Anomalous amplitude detected');
      }
    }
  }

  { /* Download heavyweight data for event in a JSON file */ }
  const downloadJSON = () => {
    if ( {eventIdentifier} ) {
      setDataIsRequested(true);
      getHeavyWeightDataFromAPI( schema, jsonWebToken, eventIdentifier, onLogout ).then( (jsonData) => {
        setDataIsRequested(false);
        { /* File object */ }
        if ( jsonData !== null ) {
          console.debug("Creating download link...");
          console.debug(jsonData);
          //const file = new Blob([{jsonData}], {type: 'data:text/json;charset=utf-8,'});
          const dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
          { /* Anchor link */ }
          let downloadAnchorNode = document.createElement("a");
          downloadAnchorNode.setAttribute("href",      dataString);
          downloadAnchorNode.setAttribute("download", `${eventIdentifier}-cct-data.json`);
          { /* Simulate link click */ }
          document.body.appendChild(downloadAnchorNode); { /* Required for firefox */ }
          downloadAnchorNode.click(); 
          downloadAnchorNode.remove();
          console.log("Download");
        }
        else {
          console.warn("No data to download");
        }
      })
      .catch(error => {
        setDataIsRequested(false);
        console.error(`Failed to get heavy weight data from API; failed with ${error}`);
      });
    }
  }

  const acceptMagnitude = () => {
    if ( {eventIdentifier} ) {
      setAcceptRequested(true);
      acceptFromAPI( schema, jsonWebToken, eventIdentifier, onLogout ).then( (jsonData) => {
        setAcceptRequested(false);
        if ( jsonData !== null ) {
          if (jsonData.status.toLowerCase() === 'success') {
            try {
               onAcceptOrRejectEvent();
            }
            catch (error) {
               console.error(`Failed to update event data after accept; failed with ${error}`);
            }
            alert('Successfully accepted magnitude');
            return;
          }
        }
        alert('Failed to accept magnitude');
      })
      .catch(error => {
        setAcceptRequested(false);
        console.error(error);
      });
    }
  }

  const rejectMagnitude = () => {
    if ( {eventIdentifier} ) { 
      setRejectRequested(true);
      rejectFromAPI( schema, jsonWebToken, eventIdentifier, onLogout ).then( (jsonData) => {
        setRejectRequested(false);
        if ( jsonData !== null ) { 
          if (jsonData.status.toLowerCase() === 'success') {
            try {
               onAcceptOrRejectEvent();
            }   
            catch (error) {
               console.error(`Failed to update event data after accept; failed with ${error}`);
            }   
            alert('Successfully rejected magnitude');
            return;
          }
        }
        alert('Failed to reject magnitude');
      })
      .catch(error => {
        setAcceptRequested(false);
        console.error(`Failed to reject magnitude; failed with ${error}`);
      });
    }
  }

  return (
    <React.Fragment>
      <VStack>
        <TableContainer w='100%'>
          <Table variant='simple' size='sm'>
             <Tbody>
               <Tr>
                 <Td align='left'>Event Identifier</Td>
                 <Td align='left'>
                   <Link href={url} isExternal>
                     {eventIdentifier} <ExternalLinkIcon mx='2px' />
                   </Link>
                 </Td>
               </Tr>
               <Tr>
                 <Td align='left'>Mw,Coda</Td>
                 <Td>{mwCodaMagnitudeToDisplay}</Td>
               </Tr>
               <Tr>
                 <Td align='left'>Catalog Magnitude</Td>
                 <Td>{catalogMagnitudeToDisplay}</Td>
               </Tr>
               <Tr>
                 <Td align='left'>Issues</Td>
                 <Td>
                   <FitBadges
                     likelyPoorlyConstrained={likelyPoorlyConstrained}
                     inconsistentMagnitude={inconsistentMagnitude}
                     anomalousAmplitude={anomalousAmplitude}
                   />
                 </Td>
               </Tr>
             </Tbody> 
          </Table> 
        </TableContainer>
        <Button
         aria-label='Accept magnitude'
         width='90%'
         colorScheme='green'
         rightIcon={<CheckIcon />}
         isDisabled={!canSubmit || isAccepted}
         isLoading={acceptRequested}
         onClick={ () => {
           acceptMagnitude()
         } }
        >
         Accept
        </Button>
        <Button
         aria-label='Reject magnitude'
         width='90%'
         colorScheme='red'
         rightIcon={<DeleteIcon />} 
         isDisabled={!canSubmit || isRejected}
         isLoading={rejectRequested}
         onClick={ () => {
           rejectMagnitude();
         } }
        >
         Reject 
        </Button>
        <Button
         aria-label='Download the detailed CCT data for this event'
         width='90%'
         colorScheme='purple'
         variant='outline'
         rightIcon={<DownloadIcon />}
         isLoading={dataIsRequested}
         onClick={ () => {
           downloadJSON()
         } }
        >
         Download
        </Button>
      </VStack>
    </React.Fragment>
  );
}

export default TableFit;
