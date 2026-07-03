---
articleId: COD-BLO-SWA
slug: swapping-over-to-windows-11
title: Swapping over to Windows 11
summary: A clean-install diary about moving to Windows 11, refreshing the operating system, and rebuilding a working setup.
kind: article
topic: codes
category: software-tools
createdAt: 2025-11-05T10:00:00.000+00:00
updatedAt: 2026-03-06T21:40:00.000+00:00
tags:
  - operating-system
  - windows
featuredImage:
  src: /images/COD-BLO-SWA/COD-BLO-SWA-01-featured-image.png
  alt: ""
---

So as of this weekend, I had decided it was time to have a clean install of windows. May as well upgrade to Windows 11 whilst I’m at it. I have previously experienced Windows 11 in a VM environment, when it was in alpha release. A lot has changed since then, at least I hope so considering how many bugs there are.

So why am I doing a clean install of Windows?

It’s quite simple. Bloat!

It doesn’t take long for all the changes you’ve made to your PC, to create issues with the performance of your hardware. This is especially the case when you run software applications that you then decide to uninstall as they are never fully removed (including settings changes). It’s been over 3 years since I’ve last reset my PC, and I think that is quite long for a software engineer who tinkers with software and 3rd party applications.

I did intend to upgrade straight from Windows 10 to Windows 11 during Covid, but I was having issues with getting the upgrade assistant to recognise my TPM chip. It was really annoying considering I had both, a TPM 2.0 chip on my motherboard, but also an AMD 3700x processor which emulates TPM 2.0 for the operating system.

This was my only problem with moving to Windows 11 this weekend. I perceived more issues but fortunately the rest of the install ran smoothly. First thing I did was download the ISO of Windows 11 and used the media creation tool to apply it to a bootable USB drive.

Once I had done that, I was fully expecting to start the setup and have to deal with the TPM issues I was having. That is exactly what happened. Fortunately it looked like a new BIOS update was going to save the day for me. My ASUS Prime X570-P was updated which reset my BIOS settings. This would normally be unfortunate, however I think this fixed my issues with my TPM chip not being detected.

Before booting into Windows, I thought I’d go ahead and make sure my fan curves and my XMP settings for my RAM were set properly. Loading the installer and starting a clean install of Windows 11 was very self explanatory, but be warned. Throughout the process, I was not asked which drive to have the OS installed on (this defaulted to the same drive that the current copy of Windows was on). If you want to install on a different drive, you will have to boot into the USB drive to set those settings and format the drive.

So now I have Windows 11, and I have a few things to say. First of all, it’s curvy! You’ll know what I mean if you’ve seen screenshots of the desktop and any open windows. This is somewhat interesting but gave me a few Windows Vista nightmares. Good thing is, it is a good marker of whether you’ve set your window is floating or set to a side of the desktop screen.

Other than the UI changes, I’ve also noticed some changes to how tooltips are shown and right click context menus. You sometimes have to click for further settings which can be a little annoying. Applications run pretty much the same, however I do feel like there is some smoothing with how Windows presents these applications. It’s hard to say how that is occurring and why.

For now, the experience is nice but somewhat underwhelming. The main benefit for me now is the clean install, which means I have a lot of application setting up to do.
