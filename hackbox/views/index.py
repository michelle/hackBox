from flask import redirect, render_template, session, request
import dropbox
from hackbox import app

@app.route('/login/')
def login():
    session['sess'] = sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                                            app.config['APP_SECRET'], 
                                                            app.config['ACCESS_TYPE'])
    session['request_token'] = request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/")
    return redirect(url)

@app.route('/')
def index():
    try:
        session['sess'].obtain_access_token(session['request_token'])
        client = session['client'] = dropbox.client.DropboxClient(session['sess'])
        return render_template('index.html', access_token="None")
    except (KeyError, ResponseError):
        return redirect('/login/')
        
@app.route('/get_folder_data')
def get_folder_data():
    return {}
