#!/usr/bin/env python
# encoding: utf-8

import config
import pymongo

def create_database_instance():
	connection = pymongo.Connection(config.MONGODB_HOST, config.MONGODB_PORT)
	return connection[config.MONGODB_DATABASE]

db = create_database_instance()

#db.users.ensure_index("email", 1, unique=True)
#db.users.ensure_index("uid", 1, unique=True)
#db.sessions.ensure_index("token", unique=True)
