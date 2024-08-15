import React from 'react';
import CCTReview from '/src/components/CCTReview.jsx';
import { Box, Flex, HStack, VStack, Container } from '@chakra-ui/react';
import EventTable from '/src/components/EventTable.jsx';
import SpectraFit from '/src/components/SpectraFit.jsx';
import TableFit from '/src/components/TableFit.jsx';
import Header from '/src/components/Header.jsx';
import Footer from '/src/components/Footer.jsx';
import Login from '/src/components/Login.jsx';
import getAsyncEventData from '/src/utilities/getEventsList.jsx';
import loginToAPI from '/src/utilities/login.jsx';
import '/src/App.css';


function App() {
  var [authenticated, setAuthenticated] = React.useState(false);
  var [userCredentials, setUserCredentials]
    = React.useState( {permissions: 'read-write',
                       user: '',
                       password: '',
                       jsonWebToken: null} );

  const onPageClose = () => {
    console.log("See ya!");
  }

  { /* React.useEffect(() => { */ }
  { /*  window.addEventListener('pagehide', onPageClose); */ }
  { /*  return () => { */ }
  { /*    window.removeEventListener('pagehide', onPageClose); */ }
  { /* } */}
  { /*}, []); */}

  const handleUserCredentials = ( jsonResponse ) => {
    var newUserCredentials = structuredClone(userCredentials);
    if (jsonResponse) {
      console.log('------------------------');
      console.log(jsonResponse);
      console.log('------------------------');
      if (jsonResponse.status === "success") {
        if (jsonResponse.jsonWebToken) {
          newUserCredentials.jsonWebToken = jsonResponse.jsonWebToken;
        }
        else {
          console.warn("JSON web token not returned");
        }
        if (jsonResponse.permissions) {
          newUserCredentials.permissions = jsonResponse.permissions;
        }
        else {
          console.warn("Permissions not returned");
        }
        setUserCredentials(newUserCredentials);
        console.log(userCredentials);
        setAuthenticated(true);
      }
      else {
        console.log(`Validation not successful`);
        if (authenticated) {
          setAuthenticated(false);
        }
      }
    }
  };

  const handleLogin = ( userValue, passwordValue ) => {
    const newUserCredentials = {...userCredentials, user: userValue, password: passwordValue};
    loginToAPI( userValue, passwordValue, handleUserCredentials );
    { /* console.log(JSON.stringify(result)); */ }
    { /* setAuthenticated(false); */ }
  }

  const handleLogout = () => {
     setAuthenticated(false);
  }

  const handleUpdateAuthentication = (newAuthentication) => {
    setAuthenticated(authenticated);
  }

  if ( authenticated )
  {
    return (
      <React.Fragment>
       <CCTReview
        userCredentials={userCredentials}
        onLogout={handleLogout}
       />
      </React.Fragment>
    );
  }
  else {
    return (
      <React.Fragment>
        <Login
         initialUser={userCredentials.user}
         initialPassword={userCredentials.password}
         onHandleLogin={handleLogin}
        />
      </React.Fragment>
    );
  }
}

export default App
