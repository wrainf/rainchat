import React, { useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCVmMxz4PtAE8CoQCKY9kpJzYw3nWTkKkM",
  authDomain: "rainchat-f1e6c.firebaseapp.com",
  projectId: "rainchat-f1e6c",
  storageBucket: "rainchat-f1e6c.appspot.com",
  messagingSenderId: "79205426354",
  appId: "1:79205426354:web:e8b80ab0dfbc64151995ab",
  measurementId: "G-5SK3EN5T00"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

function VideoChatDisplay(props) {
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const callInput = useRef(null);
    const hangupBtn = useRef(null);
    const answerBtn = useRef(null);
    const webcamBtn = useRef(null);
    const callBtn = useRef(null);
    const callerName = useRef(null);
    const callOptions = useRef(null);
    const roomID = useRef(null);
    const roomOptions = useRef(null);
    

    let pc = null;
    let localStream = null;
    let remoteStream = null;
  
    async function setupSources() {
      const servers = {
        iceServers: [
          {
            urls: [
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
            ],
          },
        ],
        iceCandidatePoolSize: 10,
      }
    
      pc = new RTCPeerConnection(servers)
    
      try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        console.log(localStream)
        remoteStream = new MediaStream();

        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        })

        pc.ontrack = (event) => {
          remoteVideo.current.style.display = 'block';
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          })
        }

        localVideo.current.srcObject = localStream;
        remoteVideo.current.srcObject = remoteStream;
        
        callOptions.current.style.display = 'flex';
        webcamBtn.current.style.display = 'none';
    
      } catch (error) {
        
        console.error("Error getting user media:", error);
      }
    }

    async function createOffer() {
      console.log('here')
      const callDocument = firestore.collection('calls').doc();
      const offerCandidates = callDocument.collection('offerCandidates');
      const answerCandidates = callDocument.collection('answerCandidates');

      roomID.current.textContent = "Room ID: "+callDocument.id;

      pc.onicecandidate = (event) => {
        if(event.candidate) {
          const candidate = event.candidate.toJSON();
          candidate.name = props.name;
          offerCandidates.add(candidate);
        }
      }

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      }

      await callDocument.set({offer})

      callDocument.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if(!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });

      answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if(change.type === 'added') {
            const data = change.doc.data()
            const candidate = new RTCIceCandidate(data);
            pc.addIceCandidate(candidate);
            console.log(data.name);
            callerName.current.style.display = 'block';
            callerName.current.textContent = data.name;
          }
        })
      })

      callOptions.current.style.display = 'none';
      roomOptions.current.style.display = 'flex';
    }

    async function answerOffer() {
      const callId = callInput.current.value;
      const callDoc = firestore.collection('calls').doc(callId);
      const answerCandidates = callDoc.collection('answerCandidates');
      const offerCandidates = callDoc.collection('offerCandidates');

      roomID.current.textContent = "Room ID: "+callId;
      pc.onicecandidate = (event) => {
        if(event.candidate) {
          const candidate = event.candidate.toJSON();
          candidate.name = props.name;
          answerCandidates.add(candidate);
        }
        
        
      };

      const callData = (await callDoc.get()).data();

      const offerDescription = callData.offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await callDoc.update({ answer });

      offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log(change);
          if (change.type === 'added') {
            let data = change.doc.data();
            pc.addIceCandidate(new RTCIceCandidate(data));
            callerName.current.style.display = 'block';
            callerName.current.textContent = data.name;
          }
        });
      });
      callOptions.current.style.display = 'none';
      roomOptions.current.style.display = 'flex';
      
    }

    async function hangUp() {
      console.log('Hanging up...');
      await pc.close(); // Close the RTCPeerConnection
      pc.onicecandidate = null; // Remove the event listener
      localStream.getTracks().forEach(track => track.stop()); // Stop all tracks in the local stream
      localStream = null;
      remoteStream = null;
      localVideo.current.srcObject = null; // Clear the video srcObject
      remoteVideo.current.srcObject = null;
      callInput.current.value = ''; // Clear the call input
      callerName.current.textContent = '';
      remoteVideo.current.style.display = 'none';
      roomOptions.current.style.display = 'none';
      webcamBtn.current.style.display = 'block';
      callerName.current.style.display = 'none';
    }
    
  
    return (
      <div id='video-chat-display'>
        
        <div id='videos-container'>
          <div style={{ position: 'relative' }}>
            <video id="localStream" autoPlay playsInline ref={localVideo}></video>
            <h3 className='names' style={{ position: 'absolute', bottom: '5%', left: '3%', zIndex: '1' }}>{props.name}</h3>
          </div>

          <div style={{ position: 'relative' }}>
            <video id="remoteStream" autoPlay playsInline ref={remoteVideo} style={{display: 'none'}}></video>
            <h3 className='names' style={{ position: 'absolute', bottom: '5%', left: '3%', zIndex: '1', display: 'none' }} ref={callerName}>{null}</h3>
          </div>
        </div>
        
        <div id='buttons'>
          <button className='btn btn-primary shadow-lg' onClick={setupSources} ref={webcamBtn}>Open Webcam</button>
          <div id='call-buttons' ref={callOptions} style={{display: 'none'}}>
            <div className="card bg-dark" style={{width: '18rem'}}>
              <div className="card-body shadow-lg">
                <h5 className="card-title">Start chatting 📞</h5>
                <p className="card-text">Create a new call for your friend to join!</p>
                <button className='btn btn-primary' onClick={createOffer} ref={callBtn} >New call</button>
              </div>
            </div>

            <p style={{margin: 0}}>Or</p>

            <div className="card bg-dark" style={{width: '18rem'}}>
              <div className="card-body shadow-lg">
                <h5 className="card-title">Join a call 🎉</h5>
                <p className="card-text">Join an existing call with your friend. RoomID required.</p>
                <input className='form-control' style={{marginBottom: '1rem'}} placeholder='Room ID' ref={callInput} />
                <button className='btn btn-primary' onClick={answerOffer} ref={answerBtn}>Join call</button>
              </div>
            </div>
            
            
          </div>
          <div id='room-options' style={{display: 'none'}} ref={roomOptions}>
            <div style={{margin: 0}} className='alert alert-primary' ref={roomID}></div>
            <button id='hangup' onClick={hangUp} ref={hangupBtn}>×</button>
            

          </div>
          
        </div>
  
      </div>
    );
  }

  export default VideoChatDisplay;
  