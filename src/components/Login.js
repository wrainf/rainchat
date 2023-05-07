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
      <label>
        Username:
        <input type="text" value={username} onChange={handleUsernameChange} />
      </label>
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;