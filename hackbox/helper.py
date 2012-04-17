import os
import dropbox
import json
from collections import defaultdict
from hackbox import app
from hurry.filesize import size, alternative
from functools import wraps
from flask import url_for, session, redirect
from hackbox.db import db
from time import time
import re

UPDATE_LIMIT = 15

is_audio = lambda file_: get_actual_file(file_)['mime_type'].startswith('audio/')
is_image = lambda file_: get_actual_file(file_)['mime_type'].startswith('image/')
is_doc = lambda file_: get_actual_file(file_)['mime_type'] == 'application/pdf'

get_images = lambda : get_actual_files(list(db.images.find()))
get_audios = lambda : get_actual_files(list(db.audios.find()))
get_docs = lambda : get_actual_files(list(db.docs.find()))

TYPE_GETTER = { 'audio': get_audios, 'image': get_images, 'doc': get_docs}
TYPE_VERIFIER = { 'audio': is_audio, 'image': is_image, 'doc': is_doc}

def get_type(file_):
    if file_['is_dir']:
        return 'folder'
    for type_, verifier in TYPE_VERIFIER.items():
        if verifier(file_):
            return type_
    return None

def dropbox_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'client' not in session or 'sess' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs) 
    return decorated_function


def get_readable_size(byte):
    return size(byte, system=alternative)

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

def with_folder_size(files, user=None):
    if user:
        if user.get('size_updated'):
            return files
    folders_size = defaultdict(int)
    new_files = []
    for file_ in files:
        path = file_['lc_path']
        if not file_['is_dir']:
            folder_list, file_name = get_folder_list_and_file_name(path)
            for folder in folder_list:
                folders_size[folder] += int(file_['bytes'])
        new_files.append(file_)

    for file_ in new_files:
        path = file_['lc_path']
        if file_['is_dir']:
            file_['bytes'] = folders_size[path]
        file_['size'] = get_readable_size(file_['bytes'])
        db.files.update({'_id': file_['_id']}, {'$set': {'size': file_['size'], 'bytes': file_['bytes']}}, safe=True)

    if user:
        db.users.update({'uid': user['uid']}, {'$set': {'size_updated': True}}, safe=True)

    return new_files

def nested_list(files):
    files_by_depth = defaultdict(list)    
    for file_ in files:
        files_by_depth[get_depth(file_['lc_path'])].append(file_)
    dict_files = get_dict_files(files)
    max_depth = max(files_by_depth.keys()+[0])
    for depth in range(max_depth, 0, -1):
        e = files_by_depth[depth]
        children = defaultdict(list)
        for file_ in e:
            lc_path = file_['lc_path']
            dict_files[lc_path].get('children', []).sort(key=lambda child : -child['bytes'])
            path, folder = os.path.split(lc_path)
            if 'children' not in dict_files[path]:
                dict_files[path]['children'] = []
            processed_entry = file_
            dict_files[path]['children'].append(processed_entry)
    dict_files['/'].get('children', []).sort(key=lambda child: -child['bytes'])
    return dict_files['/']

def strip_object_id(files):
    for file_ in files:
        del file_['_id']
    return files

def get_nested_folder(client):
    return nested_list(strip_object_id(with_folder_size(get_files(client), user=get_user(client))))

def get_client():
    sess = dropbox.session.DropboxSession(app.config['APP_KEY'], 
                                   app.config['APP_SECRET'], 
                                   app.config['ACCESS_TYPE'])
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token)
    os.system('open %s' % url)
    raw_input("%s\nPlease authorize in the browser. After you're done, press enter." % url)
    sess.obtain_access_token(request_token)
    return dropbox.client.DropboxClient(sess)

def get_dict_files(files):
    dict_files = {}
    for file_ in files:
        dict_files[file_['lc_path']] = file_
    return dict_files

def get_user(client=None, uid=None):
    assert client or uid
    return db.users.find_one({'uid': uid or client.account_info()['uid']})

def update_files(client, uid=None, user=None):
    prev = time()
    user = user or get_user(client, uid)
    last_updated = user.get('last_updated', 0)
    if time() - last_updated < UPDATE_LIMIT:
        return

    files = None
    dict_files = None
    cursor = user.get('cursor', None)
    
    while True:
        delta = client.delta(cursor)
        entries = delta["entries"]

        if len(entries) == 0 and not files: # first round of update; nothing new
            return False

        if files is None or dict_files is None:
            files = get_files(client, user=user)
            dict_files = get_dict_files(files)

        for path, file_ in entries:
            if dict_files.get(path):
                id_wrap = { 'file_id': dict_files[path]['_id'] }
                db.files.remove(dict_files[path]['_id'])
                db.public_files.remove(id_wrap)
                db.images.remove(id_wrap)
                db.audios.remove(id_wrap)
                db.docs.remove(id_wrap)
            if file_:
                dict_files[path] = insert_file(user, file_, path)
            else:
                for file_ in files:
                    if file_['lc_path'].startswith(path):
                        db.files.remove(file_['_id'])
                files = filter(lambda file_: not file_['lc_path'].startswith(path), files)
        cursor = delta["cursor"]
        if not delta["has_more"]:
            return True

    def get_file_id(file_):
        if type(file_) != type({}):
            return file_
        return  file_['_id']
    files = map(get_file_id, dict_files.values())

    if '/' not in dict_files:
        file_ = {}
        file_['owner_id'] = user['uid']
        file_['filename'] = ''
        file_['type'] = 'folder'
        file_['path'] = file_['lc_path'] = '/'
        file_['is_dir'] = True
        files.append(db.files.insert(file_, safe=True))

    files = filter(lambda file_: db.files.find_one(file_), files)

    public_files = filter(is_public_file, files)
    audios = filter(TYPE_VERIFIER['audio'], public_files)
    images = filter(TYPE_VERIFIER['image'], public_files)
    docs = filter(TYPE_VERIFIER['doc'], public_files)

    db.users.update(
            {'uid': user['uid']},
            {'$set':
                {'files'        : files,
                 'public_files' : public_files,
                 'audios'       : audios,
                 'images'       : images,
                 'docs'         : docs,
                 'cursor'       : cursor,
                 'last_updated' : time(),
                 'size_updated' : False,
                }
            }, safe=True)

def get_files(client=None, uid=None, user=None):
    if not client:
        return list(db.files.find())
    user = user or get_user(client, uid)
    files = user.get('files', [])
    return filter(bool, [db.files.find_one(file_) for file_ in files])

def is_public_file(file_):
    if type(file_) != type({}):
        file_ = db.files.find_one(file_)
    return not file_['is_dir'] \
           and (file_['lc_path'].startswith('/public/') or file_['lc_path'] == '/public') \
           and get_type(file_)

def get_public_files(client=None):
    if not client:
        return get_actual_files(list(db.public_files.find()))
    return get_user(client)['public_files']

def insert_file(user, file_, path):
    file_['owner_id'] = user['uid']
    file_['filename'] = file_['path'].split('/')[-1]
    file_['type'] = get_type(file_)
    file_['path'] = file_['path']
    file_['lc_path'] = path or file_['path'].lower()
    file_id = db.files.insert( file_ )
    if is_public_file(file_):
        id_wrap = {'file_id' : file_id}
        db.public_files.insert( id_wrap)
        if file_['type'] == 'audio':
            db.audios.insert( id_wrap)
        elif file_['type'] == 'image':
            db.images.insert( id_wrap)
        elif file_['type'] == 'doc':
            db.docs.insert( id_wrap)
    return file_id

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

def get_account_info(session):
    client = session['client']
    return json.dumps(client.account_info())

def get_actual_file(file_):
    if type(file_) != type({}):
        return db.files.find_one(file_)
    return file_

def get_actual_files(files):
    return [db.files.find_one(file_['file_id']) for file_ in files]

def dropdb():
    db.users.drop()
    db.files.drop()
    db.public_files.drop()
    db.images.drop()
    db.audios.drop()
    db.docs.drop()
