import React from 'react';
import { Center, Flex, Heading, Text } from '@chakra-ui/react';
import SettingsDialog from '/src/components/SettingsDialog';

function Header( {eventIdentifier, settings, onUpdateSettings, onLogout} ) {
  console.log("Rendering header...");

  const text = eventIdentifier != '' ? `Event: ${eventIdentifier}` : 'Mw,Coda Review';
  return (
    <React.Fragment>
      <Flex color='white' w='100%' h='60px'>
        <Center w='20%' bg='black' color='white'>
          <Heading fontSize='26px' color='white' align='left'>
           <Text>{text}</Text>
          </Heading>
        </Center>
        <Center w='65%' bg='black'/>
        <Center w='15%' bg='black' color='white'>
          <SettingsDialog
           settings={settings}
           onUpdateSettings={onUpdateSettings}
           onLogout={onLogout}
          />
        </Center>
      </Flex>
    </React.Fragment>
  );
}

export default Header;
