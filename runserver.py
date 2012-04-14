#!/usr/bin/env python

from hackbox import app
from hackbox._helper import rlistdir
import os

if __name__ == '__main__':
    if app.debug:
        app.run(debug=True, use_debugger=True)
    else:
        app.run(host='0.0.0.0')
