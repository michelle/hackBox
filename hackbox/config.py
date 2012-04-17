import os

DEBUG = not bool(os.environ.get('HEROKU'))
SECRET_KEY = os.environ.get('SECRET_KEY', "DOBOY")
URL_BASE = os.environ.get('URL_BASE', 'http://localhost:5000/')

#mongo
MONGODB_HOST = os.environ.get('MONGOLAB_URI', "127.0.0.1")
MONGODB_DATABASE = os.environ.get('db', "hackbox")

#dropbox
APP_KEY = "ro9f4awbcf19pb0"
APP_SECRET = "rfr4xvnad9nxtnb"
ACCESS_TYPE = "dropbox"
