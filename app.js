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

  var subtractorOptions = {
    history: 1
  }

  $('#initButton').on('click', function (event) {
    initBgSubtractor();
  });
  
  $('#captureButton').on('click', function (event) {
    if (!subtractorId & !loading) {
      return;
    }
    capture();
    addImageToSubtractor();
  });

  $('#deleteButton').on('click', function (event) {
    deleteBgSubtractor();
  });

  var webcamInit = function() {
    var mediaConstraint = { video: true };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(mediaConstraint).then(webcamOnSuccess).catch(webcamOnFailure);
    } else if (navigator.getUserMedia) {
      navigator.getUserMedia(mediaConstraint, webcamOnSuccess, webcamOnFailure);
    } else {
      console.error('Browser does not support getUserMedia!');
    }
  }

  var webcamOnSuccess = function onSuccess(stream) {
    videoStream = stream;
    // Firefox supports a src object
    if (navigator.mozGetUserMedia) {
      webcamVideoElem.mozSrcObject = stream;
    } else {
      var vendorURL = window.URL || window.webkitURL;
      webcamVideoElem.src = vendorURL.createObjectURL(stream);
    }

    /* Start playing the video to show the stream from the webcam */
    webcamVideoElem.play();
  };

  var webcamOnFailure = function onFailure(err) {
    console.error(err);
  };

  var capture = function captureWebcam() {
    var context = inputCanvas.getContext('2d');
    inputCanvas.width = webcamVideoElem.videoWidth;
    inputCanvas.height = webcamVideoElem.videoHeight;
    context.drawImage(webcamVideoElem, 0, 0, webcamVideoElem.videoWidth, webcamVideoElem.videoHeight);
  };

  var setLoading = function loading(val) {
    if (val) {
      loading = true;
      spinnerImg.style.display = "inline";
    } else {
      loading = false;
      spinnerImg.style.display = "none";
    }
  }

  var initBgSubtractor = function() {
    // Don't create a new subtractor if we already have one
    if (subtractorId && !loading) {
      return;
    }
    var timeStamp = Math.floor(Date.now() / 1000);
    setLoading(true);
    Monocular.backgroundSubtractor.create('bg-subtractor-demo' + timeStamp, subtractorOptions).then(function(res) {
      setLoading(false);
      subtractorId = res.id;
    }).catch(function(err) {
      setLoading(false);
      console.error(err);
    });
  };

  var deleteBgSubtractor = function() {
    // Don't delete subtractor if we don't have one
    if (!subtractorId  && !loading) {
      return;
    }
    setLoading(true);
    Monocular.backgroundSubtractor.del(subtractorId).then(function(res) {
      setLoading(false);
      subtractorId = null;
    }).catch(function(err) {
      setLoading(false);
      console.error(err);
    });
  };

  var addImageToSubtractor = function addImage() {
    setLoading(true);
    var canvasImg = inputCanvas.toBlob(function(blob) {
      var requestOptions = {
        encodeType: 'JPEG'
      }

      Monocular.backgroundSubtractor.addImage(subtractorId, blob, requestOptions).then(function(res) {
        setLoading(false);
        drawToOutput(res);
      }).catch(function(err) {
        setLoading(false);
        console.error(err);
      });
    }, 'image/png', 1);
  };

  var drawToOutput = function(canvas) {
    var context = outputCanvas.getContext('2d');
    context.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);
  };

  // Init Webcam
  webcamInit();
})();