import { initializeApp} from 'firebase/app'
import {firebaseConfig} from './firebaseConfig'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { useState, useEffect } from 'react'
import './App.css'
import { nanoid } from 'nanoid'
import { getFirestore, doc, setDoc, collection, query, onSnapshot } from 'firebase/firestore'

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
const auth = getAuth(app)

// Initialize cloud firestore
const db = getFirestore(app)

export default function App(){
  const [user, setUser] = useState()

  // check if user is logged in
  onAuthStateChanged(auth, (thisUser) => {
    if(thisUser){
      // user is logged in
      setUser(thisUser)
    } else {
      // user is logged out
      setUser(false)
    }
  })

  // component that will be displayed when user is not logged in
  const AuthenticationComponent = () => {
    const [signInEmail, setSignInEmail] = useState('')
    const [signInPassword, setSignInPassword] = useState('')

    function handleSubmit(e){
      e.preventDefault()
      signInWithEmailAndPassword(auth, signInEmail, signInPassword)
    }

    return(
      <form onSubmit={handleSubmit}>
        <h1>Email</h1>
        <input 
          type="email" 
          value={signInEmail} 
          onChange={(e) => setSignInEmail(e.target.value)} 
          placeholder="Email..." 
        />
        <h1>Password</h1>
        <input 
          type="text"
          value={signInPassword}
          onChange={(e) => setSignInPassword(e.target.value)}
          placeholder="Password..."
        />
        <button>Sign in</button>
      </form>
    )
  }

  // component that will be displayed if user exists
  const PhoneComponent = () => {
    const [message, setMessage] = useState('')
    const [messageData, setMessageData] = useState([])

    // get messages from the database.
    useEffect(() => {
      const q = query(collection(db, "messages"))

      onSnapshot(q, (snapshot) => {
        let messages = []
        snapshot.forEach((doc) => {
          messages.push({...doc.data(), id: doc.id})
        })

        setMessageData(messages)
      })
    }, [])

    // write/save message to the database
    async function sendMessage(){
      // check if message is not empty
      if(message) {
        await setDoc(doc(db, "messages", nanoid()), {
          email: user.email,
          msg: message
        }).then((val) => {
          setMessage('')
        })
      } else {
        console.log('message is empty.')
      }
    }

    const messageElements = messageData.map((message) => {
      return(
        <div className={message.email === user.email ? 'right-chat' : 'left-chat'}>
          <h3 className='username'>{message.email}</h3>
          <div className={message.email === user.email ? 'native-C' : 'foreign-C'}>
            <div className={message.email === user.email ? 'native-message' : 'foreign-message'}>
              <p>{message.msg}</p>
            </div>
          </div>
        </div>
      )
    })

    return(
      <div className="messengerApp">
        <div className="formContainer">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Compose your message..."/>
          <button className='send' onClick={sendMessage}>
            SEND
          </button>
        </div>
        {messageElements}
      </div>
    )
  }

  return(
    <div className="pageContainer">
      <div className="phoneContainer">
        {user === false && <AuthenticationComponent />}
        {user && <PhoneComponent />}
      </div>
    </div>
  )
}