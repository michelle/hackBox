#!/usr/bin/env python

from hackbox import app
from flask import redirect
from dropbox import client, session

sess = session.DropboxSession(app.config['APP_KEY'], 
                              app.config['APP_SECRET'], 
                              app.config['ACCESS_TYPE'])

@app.route('/login')
def login():
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/login/%s" % request_token)
    return redirect(url)

@app.route('/login/<request_token>/')
def auth_login(request_token):
    access_token = sess.obtain_access_token(request_token)
    
if __name__ == '__main__':
    if app.debug:
        app.run(debug=True, use_debugger=True)
    else:
        app.run(host='0.0.0.0')
