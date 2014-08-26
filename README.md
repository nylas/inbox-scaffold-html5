Baobab
========

## Requirements

```
sudo apt-get install node npm gulp
npm update
npm run-script postinstall
```

##Running Baobab

To begin with, it's necessary to set up a development environment:

```bash
git clone  --recursive git@heroku.com:inbox-baobab.git

cd baobab

git submodule init
git submodule update

foreman start --port 6000

```

##Contributing

We'd love your help making Inbox better! Join the Google Group for project updates and feature discussion. We also hang out in [##inbox on irc.freenode.net](http://webchat.freenode.net/?channels=##inbox), or you can email help@inboxapp.com.

Please sign the [Contributor License Agreement](https://www.inboxapp.com/cla.html) before submitting patches. (It's similar to other projects, like NodeJS.)

A more detailed guide on development, testing and contributing code is available in [CONTRIBUTING.md](CONTRIBUTING.md).

##License

Please see the file [LICENSE.md](LICENSE.md) for the copyright licensing conditions attached to
this codebase.
