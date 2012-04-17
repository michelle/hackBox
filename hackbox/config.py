import os

DEBUG = True
SECRET_KEY = "DOBOY"

#mongo
MONGODB_HOST = os.environ.get('DATABASE_URL', "127.0.0.1")
MONGODB_PORT = 27017
MONGODB_DATABASE = "hackbox"

#dropbox
APP_KEY = "ro9f4awbcf19pb0"
APP_SECRET = "rfr4xvnad9nxtnb"
ACCESS_TYPE = "dropbox"
