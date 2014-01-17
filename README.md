**WORK IN PROGRESS**. Please pardon the dust.

This is a user testing prototype designed to be run on a Firefox OS phone.

Goals for this prototype:

* Test the feasibility of animation experiments
* Test the ergonomics of notifications at the bottom of the screen.


Installing
----------

1.  Open Firefox Nightly
2.  Open `about:app-manager`
3.  Go to Apps
4.  Add app at `http://gordonbrander.github.io/2014-01-gaia-notifications-proto/manifest.webapp`
5.  Enable remote debugging on your phone. Plug it in.
6.  Connect to your phone from `about:app-manager`.
7.  Hit `update` button for app. This will install app on phone.


How to use it
-------------

After installing, hit "Debug" on app from `about:app-manager`. This will pull
up a remote debugging console. From there, click the "Console" tab. In the
bar beneath, you can run the following commands:

Send first fake SMS notification:

    sms1()

Send second fake SMS notification:

    sms2()


Developing Locally
------------------

Run a local server (requires `python` in `PATH`):

    make server

How to install as app:

1.  Open Firefox Nightly
2.  Open `about:app-manager`
3.  Go to Apps
4.  Find URL to manifest on your computer's local IP address, port 800.
    Network Activity is a good way to get this info. For example:
    `http://192.168.16.80:8001/manifest.webapp`. Add app at the address.
5.  Enable remote debugging on your phone. Plug it in.
6.  Connect to your phone from `about:app-manager`.
7.  Hit `update` button for app. This will install app on phone.

This will install the app locally and full-screen. You can remotely debug the
app using the app manager. Note that if your computer's
local IP changes, you will have to re-install.
