define(function(){
	return{
		_webRTCSupported: undefined,
		_localMediaStream: undefined,
		_isStarted: false,
		_remoteStream: undefined,
		
		isWebRTCSupported: function(){
			if(this._webRTCSupported === undefined){
				navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
				this._webRTCSupported = (navigator.getUserMedia != undefined);
				return this._webRTCSupported;
			}
			else{
				return this._webRTCSupported;
			}
		},
		/**
		 *	args: {obj: <An HTML element>, constraints: <A constraints object>}
		 *
		 */
		setLocalMedia: function(args){
			navigator.getUserMedia(args.constraints, args.onSuccess, args.onError);
		},
		createPeerConnection: function(args){
			var pc = undefined;
			try{
				if(navigator.mozGetUserMedia){
					pc = new mozRTCPeerConnection(args.rtcPeerConnectionConfig);
				}
				else if(navigator.webkitGetUserMedia){
					pc = new webkitRTCPeerConnection(args.rtcPeerConnectionConfig);
				}
				else{
					pc = new RTCPeerConnection(args.rtcPeerConnectionConfig);
				}
				pc.onicecandidate = args.onIceCandidate;
				pc.onaddstream = args.onRemoteStreamAdded;
				pc.onremovestream = args.onRemoteStreamRemoved;
				console.log('RTCPeerConnnection created successfully: ', pc);
				return pc;
			}
			catch(e){
				console.error('Failed to create RTCPeerConnection, exception: ' + e.message);
		     	return;
	     	}
		},
		createOffer: function(pc, success, error, constraints){
			pc.createOffer(success, error, constraints);
			console.log('createOffer called using RTCPeerConnection object: ', pc);
		},
		createAnswer: function(pc, success, error, constraints){
			pc.createAnswer(success, error, constraints);
			console.log('createAnswer called using RTCPeerConnection: ', pc);
		}
	};
});