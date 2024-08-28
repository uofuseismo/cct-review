import React from 'react';
import CCTReview from '/src/components/CCTReview.jsx';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react'
import EventTable from '/src/components/EventTable.jsx';
import SpectraFit from '/src/components/SpectraFit.jsx';
import TableFit from '/src/components/TableFit.jsx';
import Header from '/src/components/Header.jsx';
import Footer from '/src/components/Footer.jsx';
import Login from '/src/components/Login.jsx';
import loginToAPI from '/src/utilities/login.jsx';
import { jwtDecode } from 'jwt-decode';
import '/src/App.css';


function App() {
  var [tokenExpiration, setTokenExpiration] = React.useState(0);
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
      console.debug(jsonResponse);
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
        return true;
      }
      else {
        console.log(`Validation not successful`);
        if (authenticated) {
          setAuthenticated(false);
        }
        return false;
      }
    }
    return false;
  };

  const handleLogin = ( userValue, passwordValue ) => {
    const newUserCredentials = {...userCredentials, user: userValue, password: passwordValue};
    var loggedIn = loginToAPI( userValue, passwordValue, handleUserCredentials );
    if (loggedIn) {
      return (
        <React.Fragment>
        </React.Fragment>
      );
    }    
    else {
      return (
        <React.Fragment>
          <Alert status='error'>
            <AlertIcon />
            <AlertTitle>Login failed!</AlertTitle>
            <AlertDescription>Could not validate your credentials.</AlertDescription>
          </Alert>
        </React.Fragment>
      );
    }
  }

  const handleLogout = () => {
     setAuthenticated(false);
     setTokenExpiration(0);
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
