import React from 'react';
import { Box, Button, Center, Flex, Heading, Text } from '@chakra-ui/react';
import SettingsDialog from '/src/components/SettingsDialog.jsx';
import { useDisclosure } from '@chakra-ui/react';

function Header( {eventIdentifier, settings, onUpdateSettings, onLogout} ) {
  console.log("Rendering header...");

  const text = `Mw,Coda Review: ${eventIdentifier}`;
  return (
    <React.Fragment>
      <Flex color='white' w='100%' h='60px'>
        <Center w='35%' bg='black' color='white'>
          <Heading fontSize='28px' color='white' align='left'>Mw,Coda Review: {eventIdentifier}</Heading>
        </Center>
        <Center w='50%' bg='black'/>
        <Center w='15%' bg='black' color='white'>
          { /* <Button leftIcon={<MdBuild />} colorScheme='blue' variant='solid'> */ }
          { /* Settings */ }
          { /* onClick={isSettingsOpen} */ }
          { /*</Button> */}
          <SettingsDialog
           settings={settings}
           onUpdateSettings={onUpdateSettings}
           onLogout={onLogout}
          />
        </Center>
      </Flex>
      { /* <header className="header"> */ }
      { /* <h1>{text}</h1> */ }
      { /* </header> */ }
    </React.Fragment>
  );
}

export default Header;
