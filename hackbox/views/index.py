from flask import redirect, render_template, session, request, jsonify
import dropbox
from hackbox import app
from helper import nested_list, with_folder_size

@app.route('/login/')
def login():
    session['sess'] = sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                                            app.config['APP_SECRET'], 
                                                            app.config['ACCESS_TYPE'])
    session['request_token'] = request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/")
    return redirect(url)

@dropbox_auth_required
@app.route('/')
def index():
    session['sess'].obtain_access_token(session['request_token'])
    client = session['client'] = dropbox.client.DropboxClient(session['sess'])
    return render_template('hello.html', access_token="None")
        
@dropbox_auth_required
@app.route('/get_folder_data')
def get_folder_data():
    client = session['clinet']
    if 'folder_data' not in session['folder_data']:
        folder_data = nested_list(with_folder_size(client.delta()))
    else:
        folder_data = session['folder_data']
    return jsonify(nested_list(with_folder_size(client.delta())))
