import React from 'react';
import { Button, Table, TableContainer, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";

function EventTable( { events, onUpdateEventIdentifier } ) {
  console.log("Rendering event table...");
  return (
    <React.Fragment>
      <TableContainer width='97%' maxHeight='300px' overflowY='auto'>
        <Table colorScheme='blackAlpha' w='100%' variant='striped' size='sm'>
          <Thead position='sticky' top={0} zIndex='docked' bg='white'>
            <Tr>
              <Th>Identifier</Th>
              <Th>Catalog Magnitude</Th>
              <Th>Origin Time (UTC)</Th>
              <Th>Latitude</Th>
              <Th>Longitude</Th>
              <Th>Depth</Th>
              <Th>Review Status</Th>
            </Tr>
          </Thead>
          <Tbody>
           {events.map( (row) => (
             <Tr key={row.eventIdentifier}>
               <Td>
                 <Button
                   variant='outline'
                   onClick={() => {
                            console.log(`Updating identifier: ${row.eventIdentifier}...`);
                            onUpdateEventIdentifier(row.eventIdentifier);
                   }}
                 >
                   {row.eventIdentifier}
                 </Button>
               </Td>
               <Td>{row.authoritativeMagnitude.toFixed(2)} M{row.authoritativeMagnitudeType}</Td>
               <Td>{row.originTime}</Td>
               <Td>{row.latitude.toFixed(4)}</Td>
               <Td>{row.longitude.toFixed(4)}</Td>
               <Td>{row.depth.toFixed(2)}</Td>
               <Td>{row.reviewStatus}</Td>
             </Tr>
            ))
           }
          </Tbody>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
}

export default EventTable;
