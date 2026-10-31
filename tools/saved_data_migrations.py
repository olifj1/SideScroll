"""Python mirror of saved-data-migrations.js (value-level migrations).

The bake tool runs every value it builds in through migrate_raw(), and upgrades
old character export files with upgrade_package(), so built-in content is always
in the current format. Keep this file and saved-data-migrations.js identical in
behaviour; tools/test_migrations.js checks they agree. js_json() writes JSON
exactly as the browser's JSON.stringify does, so a value the game re-saves
matches the built-in text (project-defaults.js skips identical saves).
"""
import json
import math
import re

IDS = {'original': 'char-1', 'alternate': 'char-2', 'fox': 'char-3'}
FAMILY = {'human': 'biped', 'fox': 'quadruped'}
STARTER = {'original': 'biped', 'fox': 'quadruped'}
BUILT_IN_FAMILY = {'char-1': 'biped', 'char-2': 'biped', 'char-3': 'quadruped'}
STRINGS = {
    'sidescroll.fox.rest-rig.v3': 'sidescroll.quadruped.rest-rig.v3',
    'sidescroll.fox-authoring-baseline.v1': 'sidescroll.quadruped-baseline.v1',
    'fox-idle-static-v1': 'quadruped-idle-static-v1',
    'fox-walk-example-v3': 'quadruped-walk-example-v3',
    'fox-example-walk': 'quadruped-example-walk',
    'foxShape': 'quadruped-shape',
}
BASELINE = re.compile(r'^fox-authoring-baseline-')

LIBRARY_KEY = 'sidescroll.animlab.character-library.v1'
SETUP_KEY = 'sidescroll.animlab.setup.v1'
ATLAS_KEY = 'sidescroll.animlab.atlas-docs.v1'
SPARSE_KEY = 'sidescroll.animlab.sparse.clips.v1'
STATIC_KEY = 'sidescroll.animlab.static-reference.v1'
MOTION_KEY = 'sidescroll.animlab.reference.settings.v1'
REGISTRY_KEY = 'sidescroll.characters.registry.v1'


def mapped(table, value):
    return table[value] if isinstance(value, str) and value in table else value


def string(value):
    if value in STRINGS:
        return STRINGS[value]
    return BASELINE.sub('quadruped-baseline-', value)


def deep(value, parent_key=''):
    if isinstance(value, str):
        return string(value)
    if isinstance(value, list):
        return [deep(v) for v in value]
    if not isinstance(value, dict):
        return value
    out = {}
    for raw_key, item in value.items():
        key = ('quadrupedBaselineId' if raw_key == 'foxBaselineId'
               else mapped(FAMILY, raw_key) if parent_key == 'families' else raw_key)
        out[key] = (mapped(FAMILY, item) if key == 'family'
                    else mapped(STARTER, item) if key == 'starter' else deep(item, key))
    return out


def rename_keys(obj, rename):
    return {rename(k): v for k, v in obj.items()} if isinstance(obj, dict) else obj


def id_keys(obj):
    return rename_keys(obj, lambda k: mapped(IDS, k))


def _registry(v):
    v = dict(v)
    if 'characters' in v:
        v['characters'] = id_keys(v['characters'])
    if isinstance(v.get('roles'), list):
        v['roles'] = [dict(r, character=mapped(IDS, r['character'])) if isinstance(r, dict) and 'character' in r
                      else r for r in v['roles']]
    return v


def _static(v):
    v = dict(v)
    if isinstance(v.get('contexts'), dict):
        out = {}
        for k, c in v['contexts'].items():
            key = f'character:{mapped(IDS, k[10:])}' if k.startswith('character:') else mapped(FAMILY, k)
            out[key] = dict(c, source=mapped(IDS, c.get('source'))) if isinstance(c, dict) and 'source' in c else c
        v['contexts'] = out
    return v


def _motion_key(k):
    bar = k.find('|')
    return k if bar < 0 else f'{mapped(IDS, k[:bar])}{k[bar:]}'


def _motion(v):
    v = dict(v)
    if 'contexts' in v:
        v['contexts'] = rename_keys(v['contexts'], _motion_key)
    return v


def _atlas(v):
    v = dict(v)
    if 'characters' in v:
        v['characters'] = id_keys(v['characters'])
    return v


BY_KEY = {REGISTRY_KEY: _registry, SETUP_KEY: id_keys, ATLAS_KEY: _atlas, STATIC_KEY: _static, MOTION_KEY: _motion}
PLAIN = {
    'gamehub.walklab.character.v1': lambda v: mapped(IDS, v),
    'sidescroll.quadruped.rig.baseline-id': string,
    'sidescroll.quadruped.collider.baseline-id': string,
}
DEEP_ONLY = [SPARSE_KEY, 'sidescroll.animlab.quadruped.clips.v1', LIBRARY_KEY, 'sidescroll.quadruped.rig.v3',
             'sidescroll.quadruped.rig.v2', 'sidescroll.quadruped.collider.v1',
             'sidescroll.animlab.legacy.samples.backup.v1']
KEYS = list(BY_KEY) + list(PLAIN) + DEEP_ONLY


def migrate_value(key, value):
    if key in PLAIN:
        return PLAIN[key](value) if isinstance(value, str) else value
    if key not in KEYS or not isinstance(value, (dict, list)) or not value:
        return value
    out = deep(value)
    return BY_KEY[key](out) if key in BY_KEY and isinstance(out, dict) else out


def migrate_raw(key, raw):
    if raw is None or key not in KEYS:
        return raw
    if key in PLAIN:
        return migrate_value(key, raw)
    try:
        parsed = json.loads(raw)
    except ValueError:
        return raw
    nxt = js_json(migrate_value(key, parsed))
    return raw if nxt == js_json(parsed) else nxt


# ---- old character export files (mirrors upgradePackage in character-packages.js)
def _slice_path(key, path):
    if key == SETUP_KEY:
        return [mapped(IDS, path[0])]
    if key in (ATLAS_KEY, REGISTRY_KEY):
        return [path[0], mapped(IDS, path[1])]
    if key == SPARSE_KEY:
        if path[0] == 'families':
            return ['families', mapped(FAMILY, path[1])]
        return ['quadrupedBaselineId'] if path[0] == 'foxBaselineId' else path
    if key == STATIC_KEY:
        name = str(path[1])
        if name.startswith('character:'):
            return [path[0], f'character:{mapped(IDS, name[10:])}']
        # Older files also named a built-in character's own slot by its ID.
        return [path[0], BUILT_IN_FAMILY.get(mapped(IDS, name)) or mapped(FAMILY, name)]
    return None


def upgrade_slice(s):
    s = dict(s)
    if 'entry' in s:
        if s.get('present'):
            s['value'] = migrate_value(LIBRARY_KEY, s['value'])
        return s
    if 'prefix' in s:
        s['prefix'] = f'{mapped(IDS, s["prefix"][:-1])}|'
        s['value'] = migrate_value(MOTION_KEY, {'contexts': s.get('value') or {}})['contexts']
        return s
    if s.get('path') is None:
        if s.get('present'):
            s['value'] = migrate_raw(s['key'], s['value'])
        return s
    path = _slice_path(s['key'], s['path'])
    if path is None:
        return s
    if s.get('present'):
        doc = node = {}
        for i, part in enumerate(s['path']):
            node[part] = s['value'] if i == len(s['path']) - 1 else {}
            node = node[part]
        result = migrate_value(s['key'], doc)
        for part in path:
            result = result.get(part) if isinstance(result, dict) else None
        s['value'] = result
    s['path'] = path
    return s


def upgrade_package(pkg):
    c = dict(pkg.get('character') or {})
    c['id'] = mapped(IDS, c.get('id'))
    c['family'] = mapped(FAMILY, c.get('family'))
    if isinstance(c.get('sharedWith'), list):
        c['sharedWith'] = [mapped(IDS, x) for x in c['sharedWith']]
    pkg['character'] = c
    pkg['slices'] = [upgrade_slice(s) for s in pkg.get('slices', [])]
    if pkg.get('copy'):
        pkg['copy'] = migrate_value(LIBRARY_KEY, pkg['copy'])
    return pkg


# ---- JSON exactly as JavaScript's JSON.stringify writes it
def _js_number(x):
    if isinstance(x, bool):
        return 'true' if x else 'false'
    if isinstance(x, int):
        return str(x)
    if not math.isfinite(x):
        return 'null'
    if x == 0:
        return '0'
    sign = '-' if x < 0 else ''
    # Shortest round-trip digits and decimal exponent n (value = 0.d1d2.. x 10^n).
    mant = repr(abs(x))
    if 'e' in mant:
        m, e = mant.split('e')
        e = int(e)
    else:
        m, e = mant, 0
    if '.' in m:
        whole, frac = m.split('.')
    else:
        whole, frac = m, ''
    ds = (whole + frac).lstrip('0')
    n = len(whole.lstrip('0')) + e if whole.lstrip('0') else e - (len(frac) - len(frac.lstrip('0')))
    ds = ds.rstrip('0') or '0'
    k = len(ds)
    if k <= n <= 21:
        return sign + ds + '0' * (n - k)
    if 0 < n <= 21:
        return sign + ds[:n] + '.' + ds[n:]
    if -6 < n <= 0:
        return sign + '0.' + '0' * (-n) + ds
    e = n - 1
    return sign + ds[0] + ('.' + ds[1:] if k > 1 else '') + 'e' + ('+' if e > 0 else '-') + str(abs(e))


def js_json(value):
    if value is None:
        return 'null'
    if isinstance(value, (bool, int, float)):
        return _js_number(value)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        return '[' + ','.join(js_json(v) for v in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(str(k), ensure_ascii=False) + ':' + js_json(v) for k, v in value.items()) + '}'
    raise TypeError(f'cannot serialise {type(value)}')
