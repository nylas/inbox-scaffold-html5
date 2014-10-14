Inbox App Scaffold - HTML5
========

The Inbox HTML5 Scaffold is a full-featured mail client built on top of the Inbox API. It is a client-side AngularJS application that leverages the [Inbox Javascript SDK](https://github.com/inboxapp/inbox.js), and is intended to be a foundation for you to build your own mail client or add features that you've always wanted!

The Inbox HTML5 App Scaffold includes support for:

- Authenticating entirely client-side
- Browsing your Inbox, Drafts, and Archive
- Viewing threads
- Viewing and downloading message attachments
- Archiving threads
- Filtering threads
- Replying to threads with attachments
- Saving, editing, and sending drafts

<a href="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_threads.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_threads.png" height="230" /></a>
<a href="://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_thread.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_thread.png" height="230" /></a>

<a href="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_reply.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_reply.png" height="230" /></a>
<a href="://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_compose.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_compose.png" height="230" /></a>

Yes, it even has a dark theme:

<a href="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_dark_theme.png"><img src="https://raw.githubusercontent.com/inboxapp/inbox-scaffold-html5/master/screenshots/screenshot_dark_theme.png" height="230" /></a>


## By Developers, For Developers

The Inbox HTML5 Scaffold is intended for developers - to use it, you need an Inbox Developer Program membership or a copy of the open-source [Inbox Sync Engine](http://github.com/inboxapp/inbox). When you download or fork the Inbox HTML5 Scaffold, you'll need to add your Inbox App ID before you can connect your account.

## Try it online

Try out the Inbox HTML5 Scaffold right now! It's purely client-side javascript, so we [hosted it on Github Pages](https://inboxapp.github.io/inbox-scaffold-html5/).

### Using your Inbox account

Already have an Inbox account? You'll need to create a new app in the [developer console](https://www.inboxapp.com/console/apps) and add `https://inboxapp.github.io/inbox-scaffold-html5/` to the callback URLs.  Then, [set your App ID](http://inboxapp.github.io/inbox-scaffold-html5/set-app-id.html) to try it out.

### Using your local Inbox instance

Already running the sync engine and API server on your local machine?  [Set your App ID](http://inboxapp.github.io/inbox-scaffold-html5/set-app-id.html) to `localhost` and the Inbox HTML5 Scaffold will connect to `http://localhost:5555` instead of our API endpoint.


## Getting Started

```bash

git clone  --recursive git@github.com:inboxapp/inbox-scaffold-html5.git

cd inbox-scaffold-html5

git submodule init

git submodule update

sudo apt-get install node npm gulp bower

npm update

npm run-script postinstall

bower install

foreman start --port 6000
```

Then, follow the instructions under "Try it online" to set up your App ID.  You can connect to our servers or to your own local endpoint.

## Roadmap

The Inbox HTML5 Scaffold is fairly simple and is intended to be a solid foundation. It's built to be easily hackable and extendable. You can fork it and build an entirely different email experience, or write an Angular directive that adds features and functionality you need.

In the future, we plan to:

- Wrap the HTML5 Scaffold in [Atom-Shell](http://github.com/atom/atom-shell) and rewrite key Angular services to use an SQLite cache, offline action queue, and more.

- Clearly define integration points for you to create your own directives and services that extend the client.

- Refactor things for greater hackability.


We'd love for you to help us achieve these goals - check out the Contributing section for more information. If these things get you really excited, check out our [Jobs page!](http://www.inboxapp.com/jobs)


##Contributing

We'd love your help making the Inbox HTML5 Scaffold better! You can join the Inbox Google Group for project updates and feature discussion. We also hang out in [##inbox on irc.freenode.net](http://webchat.freenode.net/?channels=##inbox), or you can email help@inboxapp.com.

Please sign the [Contributor License Agreement](https://www.inboxapp.com/cla.html) before submitting patches. (It's similar to other projects, like NodeJS.)

A more detailed guide on development, testing and contributing code is available in [CONTRIBUTING.md](CONTRIBUTING.md).

##License

Please see the file [LICENSE.md](LICENSE.md) for the copyright licensing conditions attached to
this codebase.
