# Dependency checklist

- Is there exactly one lock file per ecosystem, and is it committed?
- Are any dependencies fetched from a URL or git ref rather than a registry?
- Are there post-install scripts in direct dependencies? Which ones?
- Are any packages deprecated on the registry?
- Are there duplicate major versions of the same package?
- Does CI verify the lock file (`npm ci`, `pip install --require-hashes`, `go mod verify`)?
