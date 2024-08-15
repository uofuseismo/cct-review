import React from 'react';
import { Badge, Button, Container, Link, Text, Tooltip, HStack, VStack } from '@chakra-ui/react';
import { Table, TableContainer, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { ArrowForwardIcon, CheckIcon, DeleteIcon, DownloadIcon, ExternalLinkIcon } from '@chakra-ui/icons';
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

function LikelyPoorlyConstrained( {likelyPoorlyConstrained,} ) { 
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

function FitBadges( {likelyPoorlyConstrained, inconsistentMagnitude} ) {
  if ( likelyPoorlyConstrained | inconsistentMagnitude ) {
    return (
      <React.Fragment>
        <HStack>
          <InconsistentMagnitude inconsistentMagnitude={inconsistentMagnitude} />
          <LikelyPoorlyConstrained likelyPoorlyConstrained={likelyPoorlyConstrained} />
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

function TableFit( {jsonWebToken, schema, canSubmit, eventData} ) {
  var [ dataIsRequested, setDataIsRequested ] = React.useState( false ); 
  var eventIdentifier = null;
  var mwCodaMagnitude = null;
  var catalogMagnitude = null;
  var catalogMagnitudeType = null;
  var likelyPoorlyConstrained = false;
  if ( eventData ) {
    eventIdentifier = eventData.eventIdentifier; 
    mwCodaMagnitude = eventData.cctMagnitude;
    catalogMagnitude = eventData.authoritativeMagnitude;
    catalogMagnitudeType = eventData.authoritativeMagnitudeType;
    likelyPoorlyConstrained = eventData.likelyPoorlyConstrained;
  }

  const url = `https://earthquake.usgs.gov/earthquakes/eventpage/uu${eventIdentifier}/executive`;
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
        console.log("Inconsistent magnitude");
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

  // Javascript solution to download a file
  const downloadJSON = () => {
     if ( {eventIdentifier} ) {
       setDataIsRequested(true);
       getHeavyWeightDataFromAPI( schema, jsonWebToken, eventIdentifier ).then( (jsonData) => {
         setDataIsRequested(false);
         // File object
         if ( jsonData !== null ) {
           console.debug("Creating download link...");
           console.debug(jsonData);
           //const file = new Blob([{jsonData}], {type: 'data:text/json;charset=utf-8,'});
           const dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
           // Anchor link
           let downloadAnchorNode = document.createElement("a");
           downloadAnchorNode.setAttribute("href",      dataString);
           downloadAnchorNode.setAttribute("download", `${eventIdentifier}-cct-data.json`);
           // Simulte link click
           document.body.appendChild(downloadAnchorNode); // Required for firefox
           downloadAnchorNode.click(); 
           downloadAnchorNode.remove();
           console.log("Download");
         }
         else {
           console.warn("No data to download");
         }
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
         isDisabled={!canSubmit}
         onClick={ () => {
           alert('Magnitude submitted!');
         } } 
        >
         Accept
        </Button>
        <Button
         aria-label='Reject magnitude'
         width='90%'
         colorScheme='red'
         rightIcon={<DeleteIcon />} 
         isDisabled={!canSubmit}
         onClick={ () => {
           alert('Magnitude rejected!');
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
           downloadJSON();
         } }
        >
         Download
        </Button>
      </VStack>
    </React.Fragment>
  );
}

function TableFit1( {eventIdentifier,
                     mwCodaMagnitude,
                     catalogMagnitude,
                     likelyPoorlyConstrained} ) {
  console.log("Rendering table fit...");
  const url = `https://earthquake.usgs.gov/earthquakes/eventpage/uu${eventIdentifier}/executive`;
  const jsonData = "{'event': 1212}";

  // Javascript solution to download a file
  const downloadJSON = () => {
     // File object
     //const file = new Blob([{jsonData}], {type: 'data:text/json;charset=utf-8,'});
     const dataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({jsonData}));
     // Anchor link
     let downloadAnchorNode = document.createElement("a");
     downloadAnchorNode.setAttribute("href",      dataString);
     downloadAnchorNode.setAttribute("download", `${eventIdentifier}-cct-data.json`);
     // Simulte link click
     document.body.appendChild(downloadAnchorNode); // Required for firefox
     downloadAnchorNode.click(); 
     downloadAnchorNode.remove();
     console.log("download");
  }

  var mwCodaMagnitudeToDisplay = "";
  if (typeof mwCodaMagnitude === 'number') {
    mwCodaMagnitudeToDisplay = mwCodaMagnitude.toFixed(2);
  }
  var catalogMagnitudeToDisplay = "";
  if (typeof catalogMagnitude.value === 'number') {
    catalogMagnitudeToDisplay = `${catalogMagnitude.value.toFixed(2)} M${catalogMagnitude.type}`;
  }

  return (
    <div>
      <Box height={500}
           component="section"
           sx={ { borderRight: '1px dashed grey',
                  p: 2
                } }>
        <Stack spacing={1}>
          <Item>Event: <a href={url} target="_blank">{eventIdentifier}</a></Item>
          <Item>Mw,Coda: {mwCodaMagnitudeToDisplay} Mw</Item>
          <Item>Catalog Magnitude: {catalogMagnitudeToDisplay}</Item>
          <Item>
            <Stack direction="row" spacing={1}>
              <Tooltip title="CCT indicates the magnitude was not well estimated.">
                <Chip label="Unconstrained!"  icon={<WarningAmberIcon />} color="warning"/>
              </Tooltip>
              <Tooltip title="Mw,coda is too different from the Richter magnitude; i.e., |Mw,coda - 0.94 Ml + 0.36| > 0.29.">
                <Chip label="MagDev!"  icon={<WarningAmberIcon />} color="warning"/>
              </Tooltip>
              <Tooltip title="Magnitudes appear consistent and CCT thinks the magnitude was well-estimated">
                <Chip label="" icon={<CheckIcon />} color="success"/>
              </Tooltip>
            </Stack>
          </Item>
          <Stack direction="column" spacing={0.3}>
            <Tooltip title="Publish the magnitude to AQMS/ComCat">
              <Button aria-label="Accept magnitude" variant="contained" color="success" endIcon={<SendIcon />}
                      onClick={ () => {
                       alert('Magnitude submitted!');
                      } } >
                Accept
              </Button>
            </Tooltip>
            <Tooltip title="Reject the Mw,Coda magnitude">
              <Button aria-label="Reject magnitude" variant="contained" color="error" endIcon={<DeleteIcon />}
                      onClick={ () => {
                      alert('Magnitude rejected!');
                    } } >
                Reject
              </Button>
            </Tooltip>
            <Tooltip title="Download the CCT JSON payload">
              <Button aria-label="Download JSON" variant="outlined" color="secondary" endIcon={<FileDownloadIcon />}
                      onClick={downloadJSON}
                              >
                Download
              </Button>
             </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </div>
  );
}; 

export default TableFit;
