import React from 'react';
import { MdBuild } from "react-icons/md";
import { Text } from '@chakra-ui/react';
import {Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { Radio, RadioGroup, Stack } from '@chakra-ui/react';


function SettingsDialog( {settings, onUpdateSettings, onLogout} ) {
  console.debug("Rendering settings dialog...");
  const [ schema, setSchema ] = React.useState( settings.schema );
  const { isOpen, onOpen, onClose } = useDisclosure();

   
  function switchSchema() {
    if (settings.schema != schema) {
      onUpdateSettings({...settings, schema: schema});
    }
  }

  return (
    <React.Fragment>
      <Button
       leftIcon={<MdBuild />}
       colorScheme='blue'
       variant='solid'
       onClick={onOpen}
      >
      Settings
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
         minWidth='fit-content'
         height='fit-content'
        >
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <RadioGroup onChange={setSchema} value={schema}>
              <Stack direction='row'>
                <Radio value='production'>Production</Radio>
                <Radio value='test'>Test</Radio>
              </Stack>
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
             variant='ghost'
             onClick={() => switchSchema()}
            >
              Update
            </Button>
            <Button
             variant='ghost'
             onClick={() => {
                      console.log('Logging out');
                      onLogout();
                     }}
            >
              Logout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </React.Fragment>
  );
};

export default SettingsDialog;
