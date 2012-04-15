import os
import dropbox
from collections import defaultdict
from hackbox import app
from hurry.filesize import size, alternative
from functools import wraps
from flask import url_for, session, redirect
from hackbox.db import db

def dropbox_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'client' not in session or 'sess' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs) 
    return decorated_function


def get_folder_list_and_file_name(path):
    folders = []
    while True:
        folders.append(path)
        path, folder = os.path.split(path)
        if folder == "":
            break
    folders.reverse()
    return folders[:-1], folders[-1]

def get_depth(path):
    folder_list, file_name = get_folder_list_and_file_name(path)
    if len(folder_list) == 0 or folder_list[0] == '':
        return 0
    return len(folder_list)

def with_folder_size(entries):
    folders_size = defaultdict(int)
    new_entries = []
    for entry in entries:
        path, metadata = entry
        if not metadata['is_dir']:
            folder_list, file_name = get_folder_list_and_file_name(path)
            for folder in folder_list:
                folders_size[folder] += int(metadata['bytes'])
        new_entries.append([path, metadata])
    for entry in new_entries:
        path, metadata = entry
        if metadata['is_dir']:
            metadata['bytes'] = folders_size[path]
        metadata['size'] = size(metadata['bytes'], system=alternative)
    new_entries.append(['/', {'is_dir': True, 'bytes': folders_size['/'], 'path': '/'}])
    return new_entries

def nested_list(entries):
    entries_by_depth = defaultdict(list)    
    for entry in entries:
        entries_by_depth[get_depth(entry[0])].append(entry)
    dict_entries = dict(entries)
    max_depth = max(entries_by_depth.keys())
    for depth in range(max_depth, 0, -1):
        e = entries_by_depth[depth]
        children = defaultdict(list)
        for entry in e:
            uncanonical_path, metadata = entry
            path, folder = os.path.split(uncanonical_path)
            if 'children' not in dict_entries[path]:
                dict_entries[path]['children'] = []
            processed_entry = metadata
            processed_entry['uncanonical_path'] = uncanonical_path
            dict_entries[path]['children'].append(processed_entry)
    return dict_entries['/']

def getClient():
    sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                   app.config['APP_SECRET'], 
                                   app.config['ACCESS_TYPE'])
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token)
    raw_input("%s\nPlease authorize in the browser. After you're done, press enter." % url)
    sess.obtain_access_token(request_token)
    return dropbox.client.DropboxClient(sess)

def get_public_files(client):
    entries = client.delta()["entries"]
    return [ dict(metadata.items() + [("uncanonical_path", path)])
             for path, metadata in entries if
             not metadata['is_dir'] and (path.startswith('/public/') or path == '/public') ]

def save_public_files(user, client):
    files = []
    for file_ in get_public_files(client):
        files.append(insert_file(file_))
    user['files'] = files
    db.users.update({'uid': user['uid']}, {'$set': {'files': files}})

def insert_file(file_):
    pass

def post_auth(client):
    account_info = client.account_info()
    email = account_info['email'] 
    display_name = account_info['display_name']
    uid = account_info['uid']
    user = db.users.find_one({'uid': uid})
    if user:
        db.users.update({'uid': uid}, {'$set': {'email': email, 'display_name': display_name}})
    else:
        user = { 'email': email,
                 'display_name': display_name,
                 'uid': uid,
                 }
        db.users.insert(user)
    save_public_files(user, client)
