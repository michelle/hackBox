from flask import Flask, url_for
#from flaskext.compass import Compass
from flask.logging import create_logger
from hackbox import template_helper
import os

app = Flask(__name__)
app.config.from_pyfile('config.py')
app.jinja_env.globals.update(helper=template_helper)

#app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')

#compass = Compass(app)
logger = create_logger(app)

try:
	from flask_debugtoolbar import DebugToolbarExtension
	toolbar = DebugToolbarExtension(app)
except ImportError: pass

import hackbox.views
