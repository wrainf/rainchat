import React, { useState } from 'react';

function Login(props) {
  const [username, setUsername] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    props.updateName(username);
  }

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div id='welcome-text'>
        <h1 id='welcome'>Welcome to RainChat!</h1>
        <p id='desc' className="lead">Our app allows you to easily connect with friends, family, or colleagues from anywhere in the world using high-quality video and audio. With just a few clicks, you can start a video call and have a face-to-face conversation with anyone, whether they're on a desktop or mobile device.</p>
        <p>Try it out now and experience simple, reliable video chat.</p>
      </div>
      <div id='buttons'>
        <input className="form-control" type="text" value={username} placeholder="Username" onChange={handleUsernameChange} />
        <button className='btn btn-outline-primary' type="submit">Login</button>
      </div>
      
      <p>Developed by <a target="_black" rel="noopener noreferrer" href="https://github.com/wrainf">Faiz</a></p>
    </form>
  );
}

export default Login;