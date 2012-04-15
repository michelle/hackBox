from flask import redirect, render_template, session, request, jsonify, url_for
import dropbox
from hackbox import app
from hackbox.helper import nested_list, with_folder_size, dropbox_auth_required

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
