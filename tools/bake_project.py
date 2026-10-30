#!/usr/bin/env python3
"""Bake exports from the phone into SideScroll's built-in content (publishing).

Usage (run from the repo root, by a Claude session or on a desktop):
    python3 tools/bake_project.py FILE [FILE ...]

Each FILE can be:
  - a Project Backup export (SS-PROJECT-SNAPSHOT-....json): rebuilds the whole
    built-in content from it;
  - a character export (SS-CHARACTER-....json) or "Export all characters" file
    (SS-CHARACTERS-ALL-....json): publishes those characters on top.
With only character files, the current built-in content is the starting point,
so a single character can be published without a full backup.

Writes:
  project-defaults-data.js  built-in content, read by project-defaults.js whenever
                            a device has no saved value for a key
  design-doc.json           the Design Lab working document (Project Backup only)
  assets/char-<id>-<hash>.png
                            imported character artwork, so published characters
                            work on every device; their atlas documents are
                            switched to {kind:'bundled', file}. The content hash
                            gives changed art a new file name (art is cached by
                            exact URL); older files for that character are removed.

What is built in comes from storage-catalogue.json: keys with scope "content"
or "migration" are built in; everything else (local settings, play progress,
transient state, backups, stale keys) is left out. A key the catalogue does not
know is left out with a warning: classify it there first.
"""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / 'project-defaults-data.js'

SNAPSHOT_SCHEMA = 'sidescroll.project-snapshot.v1'
PACKAGE_SCHEMA = 'sidescroll.character-package.v1'
COLLECTION_SCHEMA = 'sidescroll.character-collection.v1'
DESIGN_DOC_KEY = 'sidescroll-design-doc-working-v2'
ATLAS_KEY = 'sidescroll.animlab.atlas-docs.v1'
LIBRARY_KEY = 'sidescroll.animlab.character-library.v1'
PUBLISHED_SCOPES = {'content', 'migration'}
CHARACTER_ID = re.compile(r'^(original|alternate|fox|user-[a-z0-9-]{5,40})$')
EMPTY = {
    LIBRARY_KEY: lambda: {'schema': 'animlab.character-library.v1', 'entries': []},
    ATLAS_KEY: lambda: {'schema': 'animlab.atlas-map.v1', 'characters': {}},
    'sidescroll.animlab.setup.v1': dict,
    'sidescroll.animlab.sparse.clips.v1': lambda: {'schema': 'animlab.sparse.v1', 'sampleCount': 16, 'families': {}},
    'sidescroll.animlab.static-reference.v1': lambda: {'schema': 'animlab.static-reference.v1', 'contexts': {}},
    'sidescroll.animlab.reference.settings.v1': lambda: {'schema': 'animlab.reference.settings.v1', 'contexts': {}},
    'sidescroll.characters.registry.v1': lambda: {'schema': 'sidescroll.character-registry.v1', 'characters': {}},
}


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def load_current():
    text = DATA_FILE.read_text(encoding='utf-8')
    data = json.loads(text[text.index('{'):text.rindex('}') + 1])
    return data.get('exportedAt'), dict(data.get('storage', {})), list(data.get('characters', []))


def bake_snapshot(snapshot, catalogue, report):
    storage = {}
    for entry in sorted(snapshot['storage']['localStorage'], key=lambda e: e['key']):
        key, value = entry['key'], entry['value']
        info = catalogue.get(key)
        if info is None:
            report['unknown'].append(key)
        elif key == DESIGN_DOC_KEY:
            report['skipped'].append((key, 'written to design-doc.json instead'))
            doc = json.loads(value) if isinstance(value, str) else value
            doc.pop('workingUpdated', None)
            (ROOT / 'design-doc.json').write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            report['design'] = True
        elif info['scope'] not in PUBLISHED_SCOPES:
            report['skipped'].append((key, info['scope']))
        else:
            storage[key] = value if isinstance(value, str) else json.dumps(value)
    return storage


# ---- character packages (same semantics as character-packages.js "Replace") ----
def read_json(storage, key):
    raw = storage.get(key)
    return json.loads(raw) if raw else EMPTY.get(key, dict)()


def apply_slice(storage, s, catalogue):
    key = s['key']
    if catalogue.get(key, {}).get('scope') != 'content':
        sys.exit(f'Character file touches {key}, which is not published content.')
    if 'entry' in s:
        root = read_json(storage, key)
        entries = [e for e in root.get('entries', []) if e.get('id') != s['entry']]
        index = next((i for i, e in enumerate(root.get('entries', [])) if e.get('id') == s['entry']), len(entries))
        if s.get('present'):
            entries.insert(min(index, len(entries)), s['value'])
        root['entries'] = entries
        storage[key] = compact(root)
    elif 'prefix' in s:
        root = read_json(storage, key)
        contexts = {k: v for k, v in root.get('contexts', {}).items() if not k.startswith(s['prefix'])}
        contexts.update(s.get('value') or {})
        root['contexts'] = contexts
        storage[key] = compact(root)
    elif s.get('path') is None:
        if s.get('present'):
            storage[key] = s['value']
        else:
            storage.pop(key, None)
    else:
        if not s.get('present') and key not in storage:
            return
        root = read_json(storage, key)
        node = root
        for part in s['path'][:-1]:
            node = node.setdefault(part, {})
        if s.get('present'):
            node[s['path'][-1]] = s['value']
        else:
            node.pop(s['path'][-1], None)
        storage[key] = compact(root)


def publish_artwork(storage, cid, artwork, report):
    """Move an IndexedDB atlas image into assets/ and point the atlas at it."""
    atlas_map = read_json(storage, ATLAS_KEY)
    doc = atlas_map.get('characters', {}).get(cid)
    atlas = (doc or {}).get('atlas') or {}
    if atlas.get('kind') != 'indexeddb':
        return
    art = (artwork or {}).get(atlas.get('id'))
    if not art:
        report['warnings'].append(f'{cid}: atlas image {atlas.get("id")} is not in this file; it stays phone-only.')
        return
    header, b64 = art['dataUrl'].split(',', 1)
    if header != 'data:image/png;base64':
        sys.exit(f'{cid}: artwork is not a PNG.')
    png = base64.b64decode(b64)
    name = f'char-{cid}-{hashlib.sha256(png).hexdigest()[:10]}.png'
    (ROOT / 'assets' / name).write_bytes(png)
    for old in (ROOT / 'assets').glob(f'char-{cid}-*.png'):
        if old.name != name:
            old.unlink()
            report['removed'].append(old.name)
    doc['atlas'] = {'kind': 'bundled', 'file': name, 'name': atlas.get('name', ''),
                    'width': atlas.get('width'), 'height': atlas.get('height'), 'bytes': len(png)}
    atlas_map['characters'][cid] = doc
    storage[ATLAS_KEY] = compact(atlas_map)
    report['art'].append(f'{name} ({len(png):,} bytes)')


def bake_characters(storage, packages, catalogue, report):
    published = []
    for pkg in packages:
        cid = pkg.get('character', {}).get('id', '')
        if not CHARACTER_ID.match(cid):
            sys.exit(f'Character file has an invalid character ID: {cid!r}')
        for s in pkg.get('slices', []):
            apply_slice(storage, s, catalogue)
        publish_artwork(storage, cid, pkg.get('artwork'), report)
        published.append({'id': cid, 'name': pkg['character'].get('name', cid), 'exportedAt': pkg.get('exportedAt')})
        report['characters'].append(pkg['character'].get('name', cid))
    return published


def warn_phone_only_art(storage, report):
    for cid, doc in read_json(storage, ATLAS_KEY).get('characters', {}).items():
        if (doc.get('atlas') or {}).get('kind') == 'indexeddb':
            report['warnings'].append(f'{cid}: artwork is still phone-only (IndexedDB). '
                                      'Export the character in Character Lab and bake that file too.')


def rename_keys(storage, renamed):
    for old, new in renamed.items():
        if old in storage:
            value = storage.pop(old)
            storage.setdefault(new, value)


def main(paths):
    catalogue_file = json.loads((ROOT / 'storage-catalogue.json').read_text(encoding='utf-8'))
    catalogue, renamed = catalogue_file['keys'], catalogue_file.get('renamed', {})
    report = {'skipped': [], 'unknown': [], 'warnings': [], 'art': [], 'removed': [], 'characters': [], 'design': False}
    snapshots, packages = [], []
    for path in paths:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
        schema = data.get('schema')
        if schema == SNAPSHOT_SCHEMA:
            for entry in data['storage']['localStorage']:
                entry['key'] = renamed.get(entry['key'], entry['key'])
            snapshots.append(data)
        elif schema == PACKAGE_SCHEMA:
            packages.append(data)
        elif schema == COLLECTION_SCHEMA:
            packages.extend(data.get('characters', []))
        else:
            sys.exit(f'{path}: not a Project Backup or character export ({schema!r}).')
    if len(snapshots) > 1:
        sys.exit('Give at most one Project Backup export.')

    if snapshots:
        exported_at = snapshots[0].get('exportedAt')
        storage = bake_snapshot(snapshots[0], catalogue, report)
        previous_characters = []
    else:
        exported_at, storage, previous_characters = load_current()
    rename_keys(storage, renamed)
    for pkg in packages:
        for s in pkg.get('slices', []):
            s['key'] = renamed.get(s['key'], s['key'])
    published = bake_characters(storage, packages, catalogue, report)
    characters = [c for c in previous_characters if c['id'] not in {p['id'] for p in published}] + published
    warn_phone_only_art(storage, report)

    data = {'schema': 'sidescroll.project-defaults.v1', 'exportedAt': exported_at,
            'characters': characters, 'renamedKeys': renamed, 'storage': dict(sorted(storage.items()))}
    DATA_FILE.write_text(
        '/* GENERATED by tools/bake_project.py from phone exports. Do not edit.\n'
        ' * Built-in content: project-defaults.js returns these values when a device has\n'
        ' * no saved value of its own for the key. */\n'
        'window.SIDESCROLL_PROJECT_DEFAULTS = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')

    print(f'Built in {len(storage)} keys ({sum(len(v) for v in storage.values()):,} chars)'
          + (f' from the {exported_at} backup' if snapshots else ' (starting from the current built-in content)'))
    if report['skipped']:
        print(f'Left out {len(report["skipped"])} keys:')
        for key, why in report['skipped']:
            print(f'  - {key}  ({why})')
    print('design-doc.json', 'updated' if report['design'] else 'not changed')
    if report['characters']:
        print('Published characters:', ', '.join(report['characters']))
    for line in report['art']:
        print('  + assets/' + line)
    for name in report['removed']:
        print('  - removed old assets/' + name)
    for line in report['warnings']:
        print('NOTE:', line)
    if report['unknown']:
        print(f'WARNING: {len(report["unknown"])} keys are not in storage-catalogue.json and were left out.')
        print('Classify them in the catalogue, then run this again:')
        for key in report['unknown']:
            print('  ?', key)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
