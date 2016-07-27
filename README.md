Monocular Background Subtractor Demo
====================

This demo shows how to create and use a basic Background Subtractor with Monocular API in Javascript, using your Computers webcam as a video feed.

You can view the source in `app.js` to see how it works. You can also try the [live version of the app](https://cdn.jemsoft.io/bgsubtrator/).

Begin by initializing a new Background Subtractor. The app will capture a frame to use as reference for a background.

From here you can *capture* (Subtract) new images and visualize the difference in those images.

As this is just a basic demo we only learn the background off the initial image and have a small learning rate for subsequent images. In a real world application your learning rate should reflect how much your 'background' changes over time based on light/moving objects ect. 