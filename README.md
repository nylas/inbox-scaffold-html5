Inbox Client Scaffold - Web
========

The Inbox Web Client Scaffold is a full-featured mail client built on top of the Inbox API. It is a client-side AngularJS application that leverages the [Inbox Javascript SDK](https://github.com/inboxapp/inbox.js), and is intended to be a foundation for you to build your own mail client or add features that you've always wanted! 

The Inbox Web Client Scaffold includes support for:

- Authenticating entirely client-side
- Browsing your Inbox, Drafts, and Archive
- Viewing threads
- Viewing and downloading message attachments
- Archiving threads
- Filtering threads
- Replying to threads with attachments
- Saving, editing, and sending drafts

<a href="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_threads.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_threads.png" width="175" /></a><a href="://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_thread.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_thread.png" width="175" /></a><a href="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_reply.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_reply.png" width="175" /></a><a href="://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_compose.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_compose.png" width="175" /></a>

Yes, it even has a dark theme:

<a href="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_dark_theme.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-client-scaffold-web/master/screenshots/screenshot_dark_theme.png" width="250" /></a>


## By Developers, For Developers

The Inbox Client Scaffold is intended for developers - to use it, you need an Inbox Developer Program membership or a copy of the open-source [Inbox Sync Engine](http://github.com/inboxapp/inbox). When you download or fork the Inbox Client Scaffold, you'll need to add your Inbox App ID before you can connect your account.


##Getting Started




```bash

git clone  --recursive git@github.com:inboxapp/inbox-client-scaffold-web.git

cd inbox-client-scaffold-web

git submodule init

git submodule update

sudo apt-get install node npm gulp bower

npm update

npm run-script postinstall

bower install

foreman start --port 6000

```

## Roadmap

The Inbox Web Client Scaffold is fairly simple and is intended to be a solid foundation. It's built to be easily hackable and extendable. You can fork it and build an entirely different email experience, or write an Angular directive that adds features and functionality you need.

In the future, we plan to:

- Wrap the Client Scaffold in [Atom-Shell](http://github.com/github/atom-shell) and rewrite key Angular services to use an SQLite cache, offline action queue, and more.

- Clearly define integration points for you to create your own directives and services that extend the client.

- Refactor things for greater hackability.


We'd love for you to help us achieve these goals - check out the Contributing section for more information. If these things get you really excited, check out our [Jobs page!](http://www.inboxapp.com/jobs)


##Contributing

We'd love your help making the Inbox Client Scaffold better! You can join the Inbox Google Group for project updates and feature discussion. We also hang out in [##inbox on irc.freenode.net](http://webchat.freenode.net/?channels=##inbox), or you can email help@inboxapp.com.

Please sign the [Contributor License Agreement](https://www.inboxapp.com/cla.html) before submitting patches. (It's similar to other projects, like NodeJS.)

A more detailed guide on development, testing and contributing code is available in [CONTRIBUTING.md](CONTRIBUTING.md).

##License

Please see the file [LICENSE.md](LICENSE.md) for the copyright licensing conditions attached to
this codebase.
