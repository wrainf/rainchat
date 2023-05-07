import React, { useRef, useState } from 'react';
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
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          })
        }

        localVideo.current.srcObject = localStream;
        remoteVideo.current.srcObject = remoteStream;
        
        callBtn.current.disabled = false;
        callBtn.current.onclick = createOffer;
        answerBtn.current.disabled = false;
        answerBtn.current.onclick = answerOffer;
        webcamBtn.current.disabled = true;
    
      } catch (error) {
        
        console.error("Error getting user media:", error);
      }
    }

    async function createOffer() {
      console.log('here')
      const callDocument = firestore.collection('calls').doc();
      const offerCandidates = callDocument.collection('offerCandidates');
      const answerCandidates = callDocument.collection('answerCandidates');

      callInput.current.value = callDocument.id;

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
            callerName.current.textContent = data.name;
          }
        })
      })
      hangupBtn.current.disabled = false;
      hangupBtn.current.onclick = hangUp;
    }

    async function answerOffer() {
      const callId = callInput.current.value;
      const callDoc = firestore.collection('calls').doc(callId);
      const answerCandidates = callDoc.collection('answerCandidates');
      const offerCandidates = callDoc.collection('offerCandidates');

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
            callerName.current.textContent = data.name;
          }
        });
      });
      hangupBtn.current.disabled = false;
      hangupBtn.current.onclick = hangUp;
      
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
      hangupBtn.current.disabled = true; // Disable the hangup button
      callBtn.current.disabled = true; // Disable the call button
      webcamBtn.current.disabled = false; // Enable the webcam button
      answerBtn.current.disabled = true; // Enable the answer button
      callInput.current.value = ''; // Clear the call input
      callerName.current.textContent = '';
    }
    
  
    return (
      <div>
        <h1>Welcome {props.name}!</h1>
  
        
          <div id='videos-container'>
            <div>
              <video id="localStream" autoPlay playsInline ref={localVideo}></video>
              <h3>{props.name}</h3>
            </div>

            <div>
              <video id="remoteStream" autoPlay playsInline ref={remoteVideo}></video>
              <h3 ref={callerName}>""</h3>
            </div>
          </div>
        
  
  
        <div id='buttons'>
          <button className='' onClick={setupSources} ref={webcamBtn}>Open Webcam</button>
          <button onClick={createOffer} ref={callBtn} disabled>Call</button>
          <input ref={callInput}/>
          <button onClick={answerOffer} ref={answerBtn} disabled>Answer</button>
          <button onClick={hangUp} ref={hangupBtn} disabled>Hangup</button>
        </div>
  
      </div>
    );
  }

  export default VideoChatDisplay;
  