from flask import redirect, render_template, session, request, jsonify, url_for
import dropbox
from hackbox import app
from hackbox.helper import nested_list, with_folder_size, dropbox_auth_required
from hackbox.db import db

@app.route('/login/')
def login():
    session['sess'] = sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                                            app.config['APP_SECRET'], 
                                                            app.config['ACCESS_TYPE'])
    session['request_token'] = request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token, oauth_callback="http://localhost:5000/auth")
    return redirect(url)

def post_auth(client):
    account_info = client.account_info()
    email = account_info['email'] 
    display_name = account_info['display_name']
    uid = account_info['uid']
    if len(db.users.find({'uid': uid})) > 0:
        db.users.update({'uid': uid}, {'$set': {'email': email, 'display_name': display_name}})
    else:
        db.users.insert({
            'email': email,
            'display_name': display_name,
            'uid': uid,
        })

@app.route('/auth')
def auth(): # TODO change this to "obtain_access" later
    session['sess'].obtain_access_token(session['request_token'])
    session['client'] = dropbox.client.DropboxClient(session['sess'])
    post_auth(session['client'])
    return redirect('/')
        
@app.route('/')
@dropbox_auth_required
def index():
    return render_template('index.html')
        
@app.route('/get_folder_data')
@dropbox_auth_required
def get_folder_data():
    client = session['client']
    if 'folder_data' not in session:
        folder_data = nested_list(with_folder_size(client.delta()["entries"]))
    else:
        folder_data = session['folder_data']
    return jsonify(folder_data)

