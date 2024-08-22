import React from "react";
import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  Stack,
  InputLeftElement,
  chakra,
  Box,
  Link,
  Avatar,
  FormControl,
  FormHelperText,
  InputRightElement,
  Toast
} from "@chakra-ui/react";
import { FaUserAlt, FaLock } from "react-icons/fa";

const CFaUserAlt = chakra(FaUserAlt);
const CFaLock = chakra(FaLock);


function Login( {initialUser, initialPassword, onHandleLogin} ) {
  console.log("Rendering login");
  const [userValue, setUserValue] = React.useState(initialUser);
  const [passwordValue, setPasswordValue] = React.useState(initialPassword);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleShowClick = () => setShowPassword(!showPassword);

  return (
    <Flex
      flexDirection="column"
      width="100%"
      height="400px"
      maxWidth="500px"
      backgroundColor="#707271"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Avatar bg="black" />
        <Heading
         height="50px"
         color="black"
        >
          CCT Review Login
        </Heading>
        <Box minW={{ base: "90%", md: "468px" }}>
          <form>
            <Stack
              spacing={4}
              p="1rem"
              backgroundColor="white"
              boxShadow="md"
            >
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<CFaUserAlt color="#707271" />}
                  />
                  <Input
                   value={userValue}
                   onChange={(event) => {
                             setUserValue(event.target.value);
                            }}  
                   type="text"
                   placeholder="User"
                  />
                </InputGroup>
              </FormControl>
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    color="#707271"
                    children={<CFaLock color="#707271" />}
                  />
                  <Input
                    value={passwordValue}
                    onChange={(event) => {
                              setPasswordValue(event.target.value);
                             }}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                     h="1.75rem"
                     size="sm"
                     onClick={handleShowClick}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button
                borderRadius={0}
                variant="solid"
                backgroundColor="black"
                color="white"
                width="full"
                onClick={() => {
                          console.log(`Attempting to login as user ${userValue}...`);
                          onHandleLogin( userValue, passwordValue ); 
                         }}
              >
                Login
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Login;
