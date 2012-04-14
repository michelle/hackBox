from flask import redirect, render_template, session
import dropbox
from hackbox import app


@app.route('/')
def index():
    return render_template('index.jade')

sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                      app.config['APP_SECRET'], 
                                      app.config['ACCESS_TYPE'])

@app.route('/login')
def login():
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/")
    session['request_token'] = request_token
    return redirect(url)

@app.route('/')
def index():
    request_token = session['request_token']
    access_token = session['access_token'] = sess.obtain_access_token(request_token)
    return render_template('hello.html', access_token=access_token)


