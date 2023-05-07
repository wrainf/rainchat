import Login from './components/Login';
import VideoChatDisplay from './components/VideoChatDisplay'
import './App.css';
import { useState } from 'react';

function App() {

  const [name, setName] = useState(null);

  function updateName(name) {
    setName(name);
  }
 
  return (
    <div className="App">
        {!name ? (<Login updateName={updateName} />) : (<VideoChatDisplay name={name} />)}
    </div>
  );
}

export default App;
