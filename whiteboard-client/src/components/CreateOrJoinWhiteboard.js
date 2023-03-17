import React, { useState } from 'react'

// Need to pass user to Whiteborad, if useSelector is used here typeError happens.
function CreateOrJoinWhiteboard({ user, setWhiteBoardSessionId }) {
  const [sessionID, setSessionId] = useState('')

  if (!user) {
    return null
  }

  const createNewSession = () => {
    console.log('createNewSession')
    setWhiteBoardSessionId('newSession')
  }

  const joinSession = () => {
    console.log(`joinSession ${sessionID}`)
    setWhiteBoardSessionId(sessionID)
  }

  const formInputStyle = { width: '250px', margin: '10px' }

  return (
    <div>
      <h3>Create a new session:</h3>
      <div>
        <button onClick={createNewSession}>
          Create new whiteboard session
        </button>
      </div>
      <h3>Or ask to join pre-existing session:</h3>
      <div>
        <form onSubmit={joinSession}>
          whiteboard session id:
          <input
            type='text'
            value={sessionID}
            style={formInputStyle}
            onChange={({ target }) => setSessionId(target.value)}
          />
          <button type='submit'>join</button>
        </form>
      </div>
    </div>
  )
}
export default CreateOrJoinWhiteboard
