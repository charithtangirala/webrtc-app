require(["webrtc"], function(webrtc){
	var socket = io.connect();
	var mediaConstraints = {"audio":true,"video":{"mandatory":{},"optional":[]}};
	var sdpConstraints = {
		'mandatory': {
			'OfferToReceiveVideo': true
		}
	};
	var rtcPeerConnectionConfig = {
		"iceServers":[{
			"url":"stun:stun.services.mozilla.com"
		}]
	};
	var localMediaStream = undefined;
	var remoteMediaStream = undefined;
	var pc = undefined;
	var isInitiator = false;
	var isStarted = false;
	var isChannelReady = false;
	var messageQueue = [];
	
	if(webrtc.isWebRTCSupported()){
		var room = location.search.split('?id=')[1];
		socket.emit('create or join', room);
		pc = webrtc.createPeerConnection({
			onIceCandidate: onIceCandidate,
			onRemoteStreamAdded: onRemoteStreamAdded,
			onRemoteStreamRemoved: onRemoteStreamRemoved,
			rtcPeerConnectionConfig: rtcPeerConnectionConfig
		});
		webrtc.setLocalMedia({
			constraints: mediaConstraints,
			onSuccess: onUserMediaSuccess,
			onError: onUserMediaError
		});
	}
	
	function maybeStart(){
		if (!isStarted && localMediaStream && isChannelReady) {
			pc.addStream(localMediaStream);
			console.log('Successfully added local media stream to peer connection.');
			isStarted = true;
			if(isInitiator){
				webrtc.createOffer(pc, onCreateOfferSuccess, onCreateOfferError, sdpConstraints);
			}
			else{
				while(messageQueue.length > 0) {
					processSignalingMessage(messageQueue.shift());
				}
			}
		}
		else{
			console.log('Not ready to create a peer connection yet.');
		}
	}
	function processSignalingMessage(message){
		var RTCSD = undefined;
		if(message.type === 'offer' && !isInitiator){
			console.log('Got a message (offer) from peer: ', message);
			if(isStarted){
				if(navigator.mozGetUserMedia){
					RTCSD = new mozRTCSessionDescription(message);
				}
				else{
					RTCSD = new RTCSessionDescription(message);
				}
				pc.setRemoteDescription(RTCSD);
				console.log('RemoteDescription set using: ', RTCSD);
				webrtc.createAnswer(pc, onCreateAnswerSuccess, onCreateAnswerError, sdpConstraints);
			}
			else{
				console.log('RTCPeerConnection is not ready yet. Queuing the offer.');
				messageQueue.unshift(message);
			}
		}
		else if(message.type === 'answer' && isInitiator && isStarted){
			console.log('Got a message (answer) from peer: ', message);
			if(navigator.mozGetUserMedia){
				RTCSD = new mozRTCSessionDescription(message);
			}
			else{
				RTCSD = new RTCSessionDescription(message);
			}
			pc.setRemoteDescription(RTCSD);
			console.log('RemoteDescription set using: ', RTCSD);
		}
	}
	/*
	 * Callback Functions
	 */
	function onUserMediaSuccess(stream){
		console.log('User granted permission for media devices.');
		var obj = document.getElementById('localVideo');
		obj.src = window.URL.createObjectURL(stream);
		localMediaStream = stream;
		maybeStart();
	}
	function onUserMediaError(error){
		console.log('Error encountered while getting use media.');
	}
	function onIceCandidate(event){
		console.log('Handling ICE Candidates');
	}
	function onRemoteStreamAdded(event){
		console.log('Remote Stream Added: ', event.stream);
		var remoteVideo = document.getElementById('remoteVideo');
		remoteVideo.src = window.URL.createObjectURL(event.stream);
		remoteMediaStream = event.stream;
	}
	function onRemoteStreamRemoved(event){
		console.log('Remote Stream Removed');
	}
	function onCreateOfferSuccess(sessionDescription){
		console.log('createOffer successful. Session Description for this offer is: ', sessionDescription);
		pc.setLocalDescription(sessionDescription);
		console.log('LocalDescription set successfully. Sending a message to server with this sessionDescription.');
		socket.emit('message', sessionDescription);
	}
	function onCreateOfferError(error){
		console.error('createOffer failed to execute correctly. Error is: ', error);
	}
	function onCreateAnswerSuccess(sessionDescription){
		console.log('Answer created successfully. Session Description for this answer is: ', sessionDescription);
		pc.setLocalDescription(sessionDescription);
		console.log('LocalDescription set successfully. Sending message to server with this sessionDescription.');
		socket.emit('message', sessionDescription);
	}
	function onCreateAnswerError(error){
		console.error('createAnswer failed to execute correctly. Error is: ', error);
	}
	/*
	 * Socket Listeners
	 */
	socket.on('log', function (array){
		console.log.apply(console, array);
	});
	socket.on('created', function (room){
		console.log('You are the initiator');
		console.log('Created room ' + room);
		isInitiator = true;
		maybeStart();
	});
	socket.on('join', function (room){
		console.log('Another peer is requesting to join your room: ' + room);
		isChannelReady = true;
		maybeStart();
	});
	socket.on('joined', function (room){
		console.log('You joined room ' + room);
		isChannelReady = true;
		maybeStart();
	});
	socket.on('full', function (room){
		console.log('Room ' + room + ' is full');
	});
	socket.on('message', processSignalingMessage);
});