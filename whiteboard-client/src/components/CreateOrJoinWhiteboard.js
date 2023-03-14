import React, { useState } from 'react' //useState, useRef
//import { useSelector } from 'react-redux'

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

  return (
    <div>
      <h3>Create new session or ask to join pre-existing session</h3>
      <div>
        <button onClick={createNewSession}>
          Create new whiteboard session
        </button>
      </div>
      <div>
        <form onSubmit={joinSession}>
          <div>
            whiteboard session id:
            <input
              value={sessionID}
              onChange={(e) => setSessionId(e.target.value)}
            />
          </div>
          <div>
            <button type='Ask to join'>add</button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default CreateOrJoinWhiteboard
