from flask import redirect, render_template, session, request, jsonify, url_for
import dropbox
from hackbox import app
import hackbox.helper as helper
from hackbox.db import db

@app.route('/login/')
def login():
    session['sess'] = sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                                            app.config['APP_SECRET'], 
                                                            app.config['ACCESS_TYPE'])
    session['request_token'] = request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/auth")
    return redirect(url)

@app.route('/auth')
def auth(): # TODO change this to "obtain_access" later
    session['sess'].obtain_access_token(session['request_token'])
    session['client'] = dropbox.client.DropboxClient(session['sess'])
    post_auth(session['client'])
    return redirect('/')
        
@app.route('/')
@helper.dropbox_auth_required
def index():
    user = helper.get_or_add_user(session['client'])
    return render_template('index.html', user=user)

@app.route('/share')
@helper.dropbox_auth_required
def share():
    client = session['client']
    user = helper.get_or_add_user(client)
    helper.update_files(client, user=user)
    files = helper.get_public_files(client)
    return render_template('share.html', files=files)
        
@app.route('/get_folder_data')
@helper.dropbox_auth_required
def get_folder_data():
    client = session['client']
    if 'folder_data' not in session:
        folder_data = get_nested_folder(client)
    else:
        folder_data = session['folder_data']
    return jsonify(folder_data)
