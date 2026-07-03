---
articleId: COD-GUI-CODE
slug: codes-discord-stream-overlay-hack
title: Discord Stream Overlay Hack
summary: A BetterDiscord CSS guide for keeping stream overlay names visible while gaming or tabbed away from Discord.
kind: guide
topic: codes
category: software-tools
createdAt: 2025-09-15T10:00:00.000+00:00
updatedAt: 2026-03-06T21:40:00.000+00:00
tags:
  - discord
  - hacks
  - voip
featuredImage:
  src: /images/COD-GUI-CODE/COD-GUI-CODE-01-featured-image.png
  alt: ""
---

I’ve been playing games whilst using Discord to stream them to friends, for a long time now. The days of using Teamspeak are long gone and Discord is now reigning supreme. There is something that has been nagging me and that is to be able to create plugins for the apps I enjoy using. Problem is, I need a problem to fix. Recently that became evident when discord friends playing Escape from Tarkov have had issues differentiating between stream sharing which has lead to the odd death or miscommunication. Great news for me. I can look into making a plugin to fix this. I have not done that, however I have started the journey and am unproud to day that you don’t even need a plugin for it.

I will make one though!

First thing’s first, BetterDiscord is an extension to Discord that is going to be most vital to create the plugin, but to also use this hack. Make sure you download it before going any further.

Once you have done that, you have the settings to control your CSS throughout the UI, which leads to the hack… for now!

In your CSS settings, add the following code and save the file. What this does is find the elements associated with the class name, and ensure that it is always at the opacity of 1 (visible) regardless of the state of the app.

```
.overlayTitle-2efoIF.idle-3MGs7O {
  opacity: 1;
}
```

Voila, you now have name overlays that won’t go away when you tab away from Discord. Happy Gaming Noobs!
