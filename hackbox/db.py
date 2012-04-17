#!/usr/bin/env python
# encoding: utf-8

import config
import pymongo
import os

def create_database_instance():
	connection = pymongo.Connection(config.MONGODB_HOST)
	return connection[config.MONGODB_DATABASE]

db = create_database_instance()

if os.environ.get('HEROKU'):
	username = os.environ.get('DB_USERNAME')
	password = os.environ.get('DB_PASSWORD')
	db.authenticate(username, password)

db.users.ensure_index("email", 1, unique=True)
db.users.ensure_index("uid", 1, unique=True)
db.sessions.ensure_index("token", unique=True)
