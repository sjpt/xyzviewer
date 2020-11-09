var Maestro, log, renderVR = {}, dockeydowninner, animateNum, nop, WA, renderer, nircmd;

var WEBVR = {

	realsetup: function WEBVRsetup( options) {
		if ( options && options.referenceSpaceType ) {
			renderer.xr.setReferenceSpaceType( options.referenceSpaceType );
		}
		var currentSession = null;
		var pending = false;

		function onSessionStarted( session ) {
			log('requestSession started');
			renderer.xr.addEventListener( 'sessionend', onSessionEnded );
			renderer.xr.setSession( session );
			currentSession = session;
			pending = false;
			Maestro.trigger('xrsessionstarted');
			renderVR.reenter = false;
			renderer.setAnimationLoop(animateNum);	// sjpt, resart animation after resolution switch
		}
		// WEBVR.onSessionStarted = onSessionStarted;

		function onSessionEnded( event ) {
			renderer.xr.removeEventListener( 'sessionend', onSessionEnded );
			renderer.xr.setSession( null );
			currentSession = null;
			if (renderVR.reenter) {
				log('session end, restarting')
				// WEBVR.enter();					// won't work coming from controller?
				nircmd(`sendkey f2 press`);
				renderer.setAnimationLoop(nop);    // don't animate during switch
			}
		}
		// WEBVR.onSessionEnded = onSessionEnded;

		WEBVR.enter = function () {
			if (pending) return;
			if (currentSession !== null ) return(alert('WEBVR', 'attempt to reenter xr when already in xr'));
			renderer.xr.setFramebufferScaleFactor(renderVR.ratio);
			log('requestSession immersive-vr, ratio', renderVR.ratio);
			navigator.xr.requestSession( 'immersive-vr' ).then( onSessionStarted ).catch(onRequestError);
			pending = true;
		}

		WEBVR.exit = function() {
			currentSession.end();
		}

		function onRequestError(e) {
			console.error('xrfs', 'WEBXR got an error getting immersive-vr session for XR', e);
		}

	},	// realsetup

	setup: function() {
		navigator.xr.isSessionSupported( 'immersive-vr' )
			.then( WEBVR.realsetup )
			.catch( () => {
				alert('VR', "'XR no FOUND by navigator.xr.isSessionSupported( 'immersive-vr' )");
				WEBVR.novr = true;
			});
	}
};

/** enter and leave xr */
renderVR.xrfs = async function xrenderVRfs(bool = true) {
    log('renderVR.xrfs wanted', bool, 'current', renderer.xr.isPresenting );
    renderVR.xrfs.lastrequest = bool;       // remembers if we want to be in XR
	if (renderer.xr.isPresenting === bool) return;   // already in correct

    if (WEBVR.novr) {
        WA.makevr2 = nop;      //  no point in going on trying
        return;
	}

    log('renderVR.xrfs change', bool);
    // renderer.xr.setFramebufferScaleFactor(renderVR.ratio);
	if (bool) {
		WEBVR.enter();
		const callnum = renderVR.xrfs.startcalls++;
	} else {
		WEBVR.exit();
	}
    if (!bool) return;      // we've asked it to go away, that seems safe

}
renderVR.xrfs.restarts = 0;
renderVR.xrfs.lastRestartTime = 0;
renderVR.xrfs.startcalls = 0;
renderVR.xrfs.state = 'unguarded';
