#!/usr/bin/env python
# encoding: utf-8

from hackbox import app
import pymongo

def create_database_instance():
	connection = pymongo.Connection(app.config["MONGODB_HOST"], app.config["MONGODB_PORT"])
	return connection[app.config["MONGODB_DATABASE"]]

db = create_database_instance()

db.users.ensure_index("email", 1, unique=True)
db.sessions.ensure_index("token", unique=True)
