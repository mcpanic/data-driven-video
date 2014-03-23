data-driven-video: Data-Driven Video Analytics and Interaction
===============

This is a video analytics platform, analyzing users' interaction patterns using online videos. It processes video player's clickstream data (play, pause, etc.) to reconstruct watching sessions and viewership / interaction peaks.


Step 1. Install required libraries.

(possibly inside a virtualenv)
`pip install -r requirements.txt`

Some of the requirements might ask you to install additional dependencies. Examples are as follows:

(matlibplot on linux)
`sudo apt-get install freetype*` (yes, there is an asterisk in the name)
`sudo apt-get install libpng-dev`
`sudo apt-get install libagg-dev`
`sudo apt-get install python-cxx-dev`

(scipy on linux)
`sudo apt-get install libatlas-base-dev`
`sudo apt-get install gfortran`


Step 2. Run Django server inside project
`python manage.py runserver 0.0.0.0:5555`
