(function() {
  navigator.getUserMedia = ( navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia ||
                             navigator.msGetUserMedia);


  Monocular.initialize({
    clientId: '958d95436452ead6d84f201f4066e218',
  });

  var webcamVideoElem = $('#webcamVideo').get(0);
  var inputCanvas = $('#inputCanvas').get(0);
  var outputCanvas = $('#outputCanvas').get(0);
  var spinnerImg = $('#spinnerImg').get(0);
  var loading = false;
  var videoStream = null;

  var subtractorId = null;

  var subtractorOptions = {};

  function log(str) {
    $('#log').append(str + '<br>');
  }

  $('#initButton').on('click', function (event) {
    // Don't create a new subtractor if we already have one
    if (subtractorId && !loading) {
      log('Cannot create a new subtractor when we already have one or a request is in progress');
      return;
    }
    setLoading(true);
    initBgSubtractor().done(function() {
      capture();
      log('Sending first frame to Subtractor');
      addImageToSubtractor(true);
    })
  });

  $('#captureButton').on('click', function (event) {
    if (!subtractorId & !loading) {
      log('Cannot send a new frame when subtractor doesn\'t exist or a request is in progress');
      return;
    }
    capture();
    addImageToSubtractor(false);
  });

  $('#deleteButton').on('click', function (event) {
    // Don't delete subtractor if we don't have one
    if (!subtractorId  && !loading) {
      log('Cannot delete subtractor when it doesn\'t exist or a request is in progress');
      return;
    }
    deleteBgSubtractor();
  });

  var webcamInit = function() {
    var mediaConstraint = { video: true };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(mediaConstraint).then(webcamOnSuccess).catch(webcamOnFailure);
    } else if (navigator.getUserMedia) {
      navigator.getUserMedia(mediaConstraint, webcamOnSuccess, webcamOnFailure);
    } else {
      log('Browser does not support getUserMedia!');
    }
  }

  var webcamOnSuccess = function onSuccess(stream) {
    // Attach webcam stream to video elem
    videoStream = stream;
    // Firefox supports a src object
    if (navigator.mozGetUserMedia) {
      webcamVideoElem.mozSrcObject = stream;
    } else {
      var vendorURL = window.URL || window.webkitURL;
      webcamVideoElem.src = vendorURL.createObjectURL(stream);
    }

    // Start playing the video to show the stream from the webcam
    webcamVideoElem.play();
    log('Webcam initialized, click initialize to create a subtractor');
  };

  var webcamOnFailure = function onFailure(err) {
    log('Webcam failed to initialize');
    console.error(err);
  };

  var capture = function captureWebcam() {
    // Capture frame from webcam feed
    var context = inputCanvas.getContext('2d');
    inputCanvas.width = webcamVideoElem.videoWidth;
    inputCanvas.height = webcamVideoElem.videoHeight;
    context.drawImage(webcamVideoElem, 0, 0, webcamVideoElem.videoWidth, webcamVideoElem.videoHeight);
  };

  var setLoading = function loading(val) {
    // Hide or show loading gif
    if (val) {
      loading = true;
      spinnerImg.style.display = "inline";
    } else {
      loading = false;
      spinnerImg.style.display = "none";
    }
  }

  var initBgSubtractor = function() {
    // Create a new BG Subtractor
    deferred = $.Deferred();

    var timeStamp = Math.floor(Date.now() / 1000);
    setLoading(true);
    
    Monocular.backgroundSubtractor.create('bg-subtractor-demo' + timeStamp, subtractorOptions).then(function(res) {
      subtractorId = res.id;
      log('Subtractor ID:' + res.id);
      setLoading(false);
      deferred.resolve();
    }).catch(function(err) {
      log('Error creating subtractor');
      setLoading(false);
      deferred.reject(err);
    });
    return deferred;
  };

  var deleteBgSubtractor = function() {
    setLoading(true);
    Monocular.backgroundSubtractor.del(subtractorId).then(function(res) {
      setLoading(false);
      subtractorId = null;
      log('Deleted subtractor, click initialize to create a subtractor');
    }).catch(function(err) {
      setLoading(false);
      log('Error deleting subtractor');
      console.error(err);
    });
  };

  var addImageToSubtractor = function addImage(learn) {
    // Learning rate should always be a small amount so the subtractor can learn small changes in the background over time.
    var learningRate = 0.1;
    if (learn) {
      // If we want to learn the entire image as the background (i.e. first frame) then set value to 1
      learningRate = 1;
    }

    setLoading(true);

    // Convert canvas to blob to send to API, use JPEG as it's smaller
    var canvasImg = inputCanvas.toBlob(function(blob) {
      var requestOptions = {
        encodeType: 'JPEG',
        learningRate: learningRate
      };

      Monocular.backgroundSubtractor.addImage(subtractorId, blob, requestOptions).then(function(res) {
        setLoading(false);
        drawToOutput(res);
        log('Frame Subtracted, click Capture to subtract again');
      }).catch(function(err) {
        setLoading(false);
        log('Error Subtracting Frame');
        console.error(err);
      });
    }, 'image/jpeg', 1);
  };

  var drawToOutput = function(canvas) {
    // Draw response to Canvas
    var context = outputCanvas.getContext('2d');
    context.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);
  };

  // Init Webcam
  webcamInit();
})();