import { useState } from 'react'
import './App.css'
import LandingPage from './pages/LandingPage';

function App() {
  const handleShowLogin = () => {
    console.log('Show login clicked');
    // Add your login navigation logic here
  };

  const handleShowRegister = () => {
    console.log('Show register clicked');
    // Add your register navigation logic here
  };

  return (
    <>
      <LandingPage 
        onShowLogin={handleShowLogin} 
        onShowRegister={handleShowRegister} 
      />
    </>
  )
}

export default App
