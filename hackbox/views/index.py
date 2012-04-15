from flask import redirect, render_template, session, request, jsonify
import dropbox
from hackbox import app

@app.route('/login/')
def login():
    session['sess'] = sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                                            app.config['APP_SECRET'], 
                                                            app.config['ACCESS_TYPE'])
    session['request_token'] = request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/auth")
    return redirect(url)

@app.route('/auth')
def auth():
    session['sess'].obtain_access_token(session['request_token'])
    session['client'] = dropbox.client.DropboxClient(session['sess'])
    return redirect('/')
        
@app.route('/')
def index():
    if 'client' not in session:
        return redirect('/login/')
    else:
        return render_template('index.html')
        
@app.route('/get_folder_data')
def get_folder_data():
    return jsonify({})
