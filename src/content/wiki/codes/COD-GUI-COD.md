---
articleId: COD-GUI-COD
slug: codes-discord-stream-overlay-hack-for-pop-out
title: Discord Stream Overlay Hack (For Pop Out)
summary: A Codes-side workaround for keeping Discord stream name tags visible when streams are opened in pop-out windows.
kind: guide
topic: codes
category: software-tools
createdAt: 2025-10-01T10:00:00.000+00:00
updatedAt: 2026-03-06T21:40:00.000+00:00
tags:
  - discord
  - hacks
  - voip
featuredImage:
  src: /images/COD-GUI-COD/COD-GUI-COD-01-featured-image.png
  alt: ""
---

As soon as I demo’d the Discord stream overlay hack to a friend, I was presented with an issue that only he has. It seems that BetterDiscord’s CSS override does not work on pop outs of video streams.

To this, I say, “That’s a you problem!”. But alas, I feel the need to please. And so, I have another hack! Well actually, it’s the same hack, except it has to be done every time a stream is popped out. Good news is that it doesn’t take much to get to work.

First of all, download BetterDiscord as nothing will get done unless you have it as part of your Discord instance (assuming you did that earlier as part of the last post). Now go to the settings and find the window preferences for DevTools. You will need to turn this on, and remember the hotkey to access it.

If you have ever played around with your browser’s inspector tools, this is pretty much that, except on your discord window. When you decide you want to pop out your friends’ video streams, press the hotkey (default ctrl+shift+i) and check the inspector tool on the side of the pop out screen.

Please note to ignore the “Neb” on one of the video streams, that’s just a foolish attempt to feed the name manually via OBS as a webcam feed (effective but requires everyone to do it).

Now all you have to do is inspect the right element in one of the video streams to find the CSS code that effectively changes the opacity of the name that overlays on the video when focused on the window. The most effective way to do this is to use the inspect tool at the top right of the window and click on one of the videos.

The navbar should navigate to the parent element of the video with a collapsed nest of children within it, you’ll want to navigate through them until you get to the element which represents the name tag at the bottom of the video.

Once you find the right element, you should see CSS code shown at the bottom of the sidebar with some familiar CSS styling. You’ll probably recognise the same code snippet from the previous post about the overlay hack, but with one property being different.

What you’ll want to do is change the opacity from 0 to 1 and you should be able to see the name tags visible on all the videos.

Once that’s done, all you have to do is close the inspector tool and your pop out window will keep showing the name tags even after you’ve tabbed away from the window and are in your game. Hopefully this was quite straight forward for you, as you’ll have to do this every time you want to see names persist on a new pop out window. Sorry but for now, this is the only way you can do this.
