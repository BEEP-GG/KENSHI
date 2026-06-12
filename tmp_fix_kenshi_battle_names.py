from pathlib import Path
p = Path('src/KENSHI战斗栏/App.tsx')
s = p.read_text(encoding='utf-8')
s = s.replace("""  return {
    id: String(_.get(raw, ['id'], name) || name),
    name,
    gender: String(_.get(raw, ['性别'], '')),
""", """  const displayName = String(_.get(raw, ['名字'], _.get(raw, ['名称'], name)) || name);

  return {
    id: String(_.get(raw, ['id'], name) || name),
    name: displayName,
    gender: String(_.get(raw, ['性别'], '')),
""")
s = s.replace("""  pushUnit(normalizeCharacter(current, currentName, 'friendly', 'squad'));
""", """  pushUnit(normalizeCharacter(current, controllerName || currentName, 'friendly', 'squad'));
""")
s = s.replace("""    playerId: String(_.get(current, ['id'], currentName || '主控成员')),
""", """    playerId: String(_.get(current, ['id'], controllerName || currentName || '主控成员')),
""")
p.write_text(s, encoding='utf-8')
