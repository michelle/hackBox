import os
import dropbox
from collections import defaultdict
from hackbox import app
from hurry.filesize import size, alternative
from functools import wraps
from flask import url_for, session, redirect
from hackbox.db import db

ACCEPTABLE_TYPES = { 'audio',
                     'image', }

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
        if not metadata:
            continue
        if not metadata['is_dir']:
            folder_list, file_name = get_folder_list_and_file_name(path)
            for folder in folder_list:
                folders_size[folder] += int(metadata['bytes'])
        new_entries.append([path, metadata])
    for entry in new_entries:
        path, metadata = entry
        if not metadata:
            continue
        if metadata['is_dir']:
            metadata['bytes'] = folders_size[path]
            if metadata['bytes'] == 0:
                print 'zero', path
        metadata['size'] = size(metadata['bytes'], system=alternative)
    new_entries.append(['/', {'is_dir': True, 'bytes': folders_size['/'], 'path': '/', 'size' : size(folders_size['/'], system=alternative)}])
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
            lc_path, metadata = entry
            path, folder = os.path.split(lc_path)
            if 'children' not in dict_entries[path]:
                dict_entries[path]['children'] = []
            processed_entry = metadata
            processed_entry['lc_path'] = lc_path
            dict_entries[path]['children'].append(processed_entry)
    return dict_entries['/']

def get_nested_folder(client):
    return nested_list(with_folder_size(get_files(client)))

def getClient():
    sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                   app.config['APP_SECRET'], 
                                   app.config['ACCESS_TYPE'])
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token)
    raw_input("%s\nPlease authorize in the browser. After you're done, press enter." % url)
    sess.obtain_access_token(request_token)
    return dropbox.client.DropboxClient(sess)

def update_files(client, uid=None, user=None):
    user = user or db.users.find_one({'uid': uid or client.account_info()['uid']})
    files = user.get('files', [])
    dict_files = {}
    for file_ in files:
        dict_files[db.files.find_one(file_)['lc_path']] = file_
    cursor = user.get('cursor', None)
    while True:
        delta = client.delta(cursor)
        entries = delta["entries"]
        for path, file_ in entries:
            if dict_files.get(path):
                db.files.remove(dict_files[path])
            if file_:
                dict_files[path] = insert_file(user, file_, path)
            else: # TODO recursively delete all children if file_ is None
                pass
                """for path, file_ in files.iteritems():
                    if file_['lc_path'].startswith(path):
                        db.files.remove(file_)"""
        cursor = delta["cursor"]
        if not delta["has_more"]:
            break
    files = dict_files.values()
    db.users.update({'uid': user['uid']}, {'$set': {'files': files}}, safe=True)#, 'files': files}})
    db.users.update({'uid': user['uid']}, {'$set': {'cursor': cursor}}, safe=True)#, 'files': files}})

def get_files(client=None, uid=None, user=None):
    if not client:
        return list(db.files.find())
    user = user or db.users.find_one({'uid': uid or client.account_info()['uid']})
    files = user.get('files', [])
    return [db.files.find_one(file_) for file_ in files]

def is_public_file(file_):
    return not file_['is_dir'] \
           and (file_['lc_path'].startswith('/public/') or file_['lc_path'] == '/public') \
           and file_['mime_type'].split('/')[0] in ACCEPTABLE_TYPES

def get_public_files(client):
    return filter(is_public_file, get_files(client))

def insert_file(user, file_, path):
    file_['owner_id'] = user['uid']
    file_['filename'] = file_['path'].split('/')[-1]
    if 'mime_type' in file_:
        file_['type'] = file_['mime_type'].split('/')[0]
    else:
        file_['type'] = 'folder'
    file_['path'] = file_['path']
    file_['lc_path'] = path or file_['path'].lower()
    return db.files.insert( file_ )

def get_or_add_user(client):
    account_info = client.account_info()
    email = account_info['email'] 
    display_name = account_info['display_name']
    uid = account_info['uid']
    if db.users.find({'uid': uid}).count() > 0:
        db.users.update({'uid': uid}, {'$set': {'email': email, 'display_name': display_name}})
    else:
        db.users.insert({
            'email': email,
            'display_name': display_name,
            'uid': uid,
            'cursor': None,
        })
    return db.users.find_one({'uid': uid})

def post_auth(client):
    user = get_or_add_user(client) 
    update_files(client, user=user)
