import os
from collections import defaultdict

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
    #print folders_size['/']
    new_entries.append(['/', {'is_dir': True, 'bytes': folders_size['/'], 'path': '/'}])
    return new_entries

def nested_list(entries):
    entries_by_depth = defaultdict(list)    
    for entry in entries:
        entries_by_depth[get_depth(entry[0])].append(entry)
    #print [entry[0] for entry in entries_by_depth[2]]
    dict_entries = dict(entries)
    max_depth = max(entries_by_depth.keys())
    for depth in range(max_depth, 0, -1):
        e = entries_by_depth[depth]
        children = defaultdict(list)
        for entry in e:
            path, metadata = entry
            path, folder = os.path.split(path)
            if 'children' not in dict_entries[path]:
                dict_entries[path]['children'] = []
            dict_entries[path]['children'].append(entry)
            #metadata['children'].append(entry)
            #children[path].append(entry)
    return dict_entries['/']

def get_children(entries):
    
    return children
        
def sort_entry(entries):
    return sorted(entries, key=lambda x: get_depth(x[1]['path']))
