// Install one-liners for an artefact into an assistant's destination. Shared by the build and the browser.
const SHARED_FILES = /(^|\/)(CLAUDE\.md|AGENTS\.md|GEMINI\.md|CONVENTIONS\.md|copilot-instructions\.md)$/;
const JSON_FILES = /\.json$/;

function q(s) { return `'${String(s).replace(/'/g, `'\\''`)}'`; }
function pq(s) { return `'${String(s).replace(/'/g, "''")}'`; }
const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.');

// artifact: { id, isFolder, downloadName, downloadUrl, zipUrl }; target: { path, isFolder }; origin: absolute site origin (+ base already inside urls)
export function installCommands(artifact, target, origin = '') {
  const abs = (u) => (u && /^https?:/.test(u) ? u : `${origin.replace(/\/$/, '')}${u}`);
  const path = target.path;
  if (!/^[~.\w][\w./~-]*$/.test(path)) {
    return { kind: 'manual', bash: '', powershell: '', note: `Paste the text into ${path}.` };
  }
  if (artifact.isFolder) {
    if (!target.isFolder) return { kind: 'manual', bash: '', powershell: '', note: `This artefact is a folder; put its files under ${path}.` };
    const dest = path.replace(/\/$/, '');
    const zip = abs(artifact.zipUrl);
    return {
      kind: 'zip',
      bash: `mkdir -p ${q(dest)} && curl -fsSL ${q(zip)} -o /tmp/${artifact.id}.zip && unzip -oq /tmp/${artifact.id}.zip -d ${q(dest)} && rm /tmp/${artifact.id}.zip`,
      powershell: `New-Item -ItemType Directory -Force -Path ${pq(dest)} | Out-Null; Invoke-WebRequest ${pq(zip)} -OutFile "$env:TEMP\\${artifact.id}.zip"; Expand-Archive -Force "$env:TEMP\\${artifact.id}.zip" ${pq(dest)}`,
      note: `Unpacks the zip into ${dest}/.`
    };
  }
  const url = abs(artifact.downloadUrl);
  if (target.isFolder) {
    const dest = path.replace(/\/$/, '');
    const file = `${dest}/${artifact.downloadName}`;
    return {
      kind: 'file',
      bash: `mkdir -p ${q(dest)} && curl -fsSL ${q(url)} -o ${q(file)}`,
      powershell: `New-Item -ItemType Directory -Force -Path ${pq(dest)} | Out-Null; Invoke-WebRequest ${pq(url)} -OutFile ${pq(file)}`,
      note: `Saves ${artifact.downloadName} into ${dest}/.`
    };
  }
  if (SHARED_FILES.test(path)) {
    return {
      kind: 'append',
      bash: `{ printf '\\n\\n'; curl -fsSL ${q(url)}; } >> ${q(path)}`,
      powershell: `Add-Content -Path ${pq(path)} -Value ("\`n\`n" + (Invoke-WebRequest ${pq(url)}).Content)`,
      note: `Appends to ${path} (creates it if missing). Other rules in the file are kept.`
    };
  }
  if (JSON_FILES.test(path)) {
    const dir = dirOf(path);
    return {
      kind: 'merge',
      bash: `${dir !== '.' ? `mkdir -p ${q(dir)} && ` : ''}[ -f ${q(path)} ] || echo '{}' > ${q(path)}; curl -fsSL ${q(url)} -o /tmp/${artifact.id}.json && jq -s '.[0] * .[1]' ${q(path)} /tmp/${artifact.id}.json > ${q(path + '.tmp')} && mv ${q(path + '.tmp')} ${q(path)}`,
      powershell: `Invoke-WebRequest ${pq(url)} -OutFile "$env:TEMP\\${artifact.id}.json"; Write-Host "Merge the keys from $env:TEMP\\${artifact.id}.json into ${path}"`,
      note: `Deep-merges the JSON into ${path} with jq (arrays are replaced, not appended). Review the result before committing.`
    };
  }
  const dir = dirOf(path);
  return {
    kind: 'file',
    bash: `${dir !== '.' ? `mkdir -p ${q(dir)} && ` : ''}curl -fsSL ${q(url)} -o ${q(path)}`,
    powershell: `${dir !== '.' ? `New-Item -ItemType Directory -Force -Path ${pq(dir)} | Out-Null; ` : ''}Invoke-WebRequest ${pq(url)} -OutFile ${pq(path)}`,
    note: `Writes ${path}. Overwrites an existing file.`
  };
}
