from flask import redirect, render_template, url_for
from dropbox import client, session
from hackbox import app


@app.route('/')
def index():
    return render_template('index.jade')

sess = session.DropboxSession(app.config['APP_KEY'], 
                              app.config['APP_SECRET'], 
                              app.config['ACCESS_TYPE'])

@app.route('/login/')
def login():
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback=url_for('auth_login', request_key=request_token.key, request_secret=request_token.secret, _external=True))
    return redirect(url)

@app.route('/login/<request_key>/<request_secret>/')
def auth_login(request_key, request_secret ):
    request_token = sess.set_request_token(request_key, request_secret )
    access_token = sess.obtain_access_token(request_token)
    return render_template('hello.html', access_token=access_token)
