---
articleId: COD-GUI-CRE
slug: create-your-first-discord-bot
title: Create your first Discord Bot
summary: A starter guide for creating a Discord bot and introducing basic bot concepts for communities and gaming servers.
kind: guide
topic: codes
category: software-tools
createdAt: 2025-06-05T10:00:00.000+00:00
updatedAt: 2026-03-06T21:40:00.000+00:00
tags:
  - bot
  - discord
  - programming
featuredImage:
  src: /images/COD-GUI-CRE/COD-GUI-CRE-01-featured-image.png
  alt: ""
---

Discord is a popular platform for gamers and communities to communicate, share content and play games. Discord bots are automated programs that can be used to perform various tasks on a Discord server, such as moderating chats, playing music, and responding to user commands. In this article, we’ll show you how to create a basic Discord bot using Node.js and the Discord.js library.

## Prerequisites

Before we start, you’ll need to have the following:

- Node.js and NPM installed on your machine.
- A Discord account.
- A Discord server where you have administrator privileges.
- A Discord bot token.
To get a bot token, follow these steps:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
1. Click on “New Application” and give it a name.
1. Navigate to the “Bot” section and click “Add Bot”.
1. Click on “Copy” to copy the bot token to your clipboard.
## Setting up the project

First, create a new directory for your project and navigate to it in your terminal. Then, initialize a new Node.js project using NPM:

```
npm init -y
```

Next, install the Discord.js library:

```
npm install discord.js
```

## Creating the bot

Create a new file named `bot.js` in your project directory. This will be the entry point for your bot. Paste the following code into the file:

{ console.log(`Logged in as ${client.user.tag}!`); }); client.on('message', msg => { if (msg.content === 'ping') { msg.reply('Pong!'); } }); client.login('your-token-goes-here');">

```
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});

client.login('your-token-goes-here');
```

Let’s go over this code. First, we import the `discord.js` library and create a new `Client` instance. The `Client` class represents our Discord bot.

Next, we add two event listeners using the `client.on()` method:

- The `'ready'` event is emitted when the bot has connected to Discord and is ready to receive messages. We log a message to the console to confirm that the bot has successfully logged in.
- The `'message'` event is emitted whenever a message is sent in a channel that the bot can see. We check if the message content is `"ping"`, and if it is, we reply with `"Pong!"`.
Finally, we call the `client.login()` method and pass in our bot token.

## Running the bot

To run the bot, open a terminal window in your project directory and type:

```
node bot.js
```

You should see a message in the console indicating that the bot has logged in.

## Adding the bot to your Discord server

To add your bot to your Discord server, you’ll need to generate an invite link. Follow these steps:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
1. Click on your bot application.
1. Navigate to the “OAuth2” section.
1. Under “Scopes”, select “bot”.
1. Under “Bot Permissions”, select the permissions you want your bot to have.
1. Copy the generated invite link and paste it into your browser.
You’ll be prompted to select a server where you want to add the bot. Make sure you have administrator privileges on that server, and then click “Authorize”. The bot should now appear in your Discord server’s member list.

## Conclusion

In this article, we showed you how to create a basic Discord bot using Node.js and the Discord.js library. We covered how to set up
